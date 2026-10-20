import { sendEmail, emailConfigured } from "./email";
import { createServiceClient } from "./supabase/admin";

/** Calendar + evening schedule for reminders (documented fixed TZ). */
export const REMINDER_TIME_ZONE = "Europe/Amsterdam";

/** Skip reminder when the day already has a published or reasonably filled draft. */
const SOLID_BODY_CHARS = 200;

export type ReminderTarget = {
  tripId: string;
  tripTitle: string;
  tripDayId: string;
  dayNumber: number;
  dayDate: string;
  dayTitle: string | null;
  plannedLocation: string | null;
  entryStatus: "missing" | "draft_thin" | "draft_solid" | "published";
};

export type ReminderRecipient = {
  userId: string;
  email: string;
};

export function calendarDateInTimeZone(date = new Date(), timeZone = REMINDER_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return [value("year"), value("month"), value("day")].join("-");
}

export function appBaseUrl() {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  return "https://opreis.blindenbach.nl";
}

function classifyEntry(entry: { publication_status: string | null; body: string | null } | null) {
  if (!entry) return "missing" as const;
  if (entry.publication_status === "published") return "published" as const;
  const body = (entry.body || "").trim();
  if (body.length >= SOLID_BODY_CHARS) return "draft_solid" as const;
  return "draft_thin" as const;
}

/** Find today's trip_day for any trip currently underway (date window). */
export async function findTodaysReminderTarget(today = calendarDateInTimeZone()): Promise<ReminderTarget | null> {
  const supabase = createServiceClient();
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id,title,starts_on,ends_on,status")
    .lte("starts_on", today)
    .gte("ends_on", today)
    .not("status", "in", '("archived","idea","completed")')
    .order("starts_on", { ascending: false })
    .limit(10);

  if (tripsError) throw new Error(tripsError.message);
  if (!trips?.length) return null;

  const tripIds = trips.map((trip) => trip.id);
  const { data: days, error: daysError } = await supabase
    .from("trip_days")
    .select("id,trip_id,day_number,day_date,title,planned_location")
    .eq("day_date", today)
    .in("trip_id", tripIds)
    .limit(5);

  if (daysError) throw new Error(daysError.message);
  const day = days?.[0];
  if (!day) return null;

  const trip = trips.find((row) => row.id === day.trip_id);
  if (!trip) return null;

  const { data: entry } = await supabase
    .from("day_entries")
    .select("publication_status,body")
    .eq("trip_day_id", day.id)
    .maybeSingle();

  return {
    tripId: trip.id,
    tripTitle: trip.title,
    tripDayId: day.id,
    dayNumber: day.day_number,
    dayDate: day.day_date,
    dayTitle: day.title,
    plannedLocation: day.planned_location,
    entryStatus: classifyEntry(entry),
  };
}

/**
 * Reminder recipients for a trip: membership role `owner` only (not editors/members).
 * If no owner membership row exists, fall back to `trips.created_by` (common for older trips).
 * Optional `REMINDER_EMAIL_ALLOWLIST` further restricts; `reminder_preferences` opt-outs apply.
 */
export async function listReminderRecipients(tripId: string): Promise<ReminderRecipient[]> {
  const supabase = createServiceClient();
  const allowlist = (process.env.REMINDER_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const { data: owners, error: ownersError } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId)
    .eq("role", "owner");

  if (ownersError) throw new Error(ownersError.message);

  let ownerIds = (owners || []).map((row) => row.user_id as string).filter(Boolean);

  if (!ownerIds.length) {
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("created_by")
      .eq("id", tripId)
      .maybeSingle();
    if (tripError) throw new Error(tripError.message);
    if (trip?.created_by) ownerIds = [trip.created_by as string];
  }

  if (!ownerIds.length) return [];

  const recipients: ReminderRecipient[] = [];
  for (const userId of ownerIds) {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw new Error(error.message);
    const email = data.user?.email?.trim();
    if (!email) continue;
    if (allowlist.length && !allowlist.includes(email.toLowerCase())) continue;
    recipients.push({ userId, email });
  }

  if (!recipients.length) return [];

  const { data: prefs } = await supabase
    .from("reminder_preferences")
    .select("user_id,email_enabled")
    .in(
      "user_id",
      recipients.map((recipient) => recipient.userId),
    );

  const disabled = new Set(
    (prefs || []).filter((row) => row.email_enabled === false).map((row) => row.user_id as string),
  );

  return recipients.filter((recipient) => !disabled.has(recipient.userId));
}

function journalUrl(tripDayId: string) {
  return `${appBaseUrl()}/app/journal/${tripDayId}`;
}

function todayUrl() {
  return `${appBaseUrl()}/app/today`;
}

function buildReminderEmail(target: ReminderTarget) {
  const when = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: REMINDER_TIME_ZONE,
  }).format(new Date(`${target.dayDate}T12:00:00`));
  const place = target.plannedLocation || target.dayTitle || `reisdag ${target.dayNumber}`;
  const openJournal = journalUrl(target.tripDayId);
  const openToday = todayUrl();
  const subject = `Rond reisdag ${target.dayNumber} af — ${target.tripTitle}`;
  const text = [
    `Hoi,`,
    ``,
    `Tijd om ${target.tripTitle} van vandaag af te ronden (${when}, ${place}).`,
    `Er wordt niets automatisch gepubliceerd — open de dag in de app wanneer het uitkomt.`,
    ``,
    `Open vandaag: ${openToday}`,
    `Open dagverslag: ${openJournal}`,
    ``,
    `Dagelijkse e-mailherinneringen kun je uitzetten onder Meer → Herinneringen in de app.`,
  ].join("\n");
  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a;max-width:560px">
      <p style="margin:0 0 12px;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#2f5d8c">Op reis</p>
      <h1 style="font-size:24px;margin:0 0 12px">Rond reisdag ${target.dayNumber} af</h1>
      <p style="margin:0 0 16px">${when} · ${escapeHtml(place)} · ${escapeHtml(target.tripTitle)}</p>
      <p style="margin:0 0 20px">Geen automatische publicatie. Open de dag in de app, kies foto’s en schrijf of vertel verder wanneer het uitkomt.</p>
      <p style="margin:0 0 10px">
        <a href="${openJournal}" style="display:inline-block;background:#2f5d8c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:4px">Open dagverslag</a>
      </p>
      <p style="margin:0 0 24px;font-size:14px"><a href="${openToday}" style="color:#2f5d8c">Of ga naar Vandaag</a></p>
      <p style="margin:0;font-size:13px;color:#666">Uitzetten: Meer → Herinneringen in de app.</p>
    </div>
  `;
  return { subject, html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type ReminderRunResult = {
  today: string;
  timeZone: string;
  emailConfigured: boolean;
  target: ReminderTarget | null;
  skippedReason: string | null;
  dryRun: boolean;
  sent: { userId: string; email: string; id: string }[];
  skipped: { userId: string; email: string; reason: string }[];
  errors: { userId?: string; email?: string; error: string }[];
};

export async function runDailyReminders(options: { dryRun?: boolean; force?: boolean } = {}): Promise<ReminderRunResult> {
  const today = calendarDateInTimeZone();
  const dryRun = Boolean(options.dryRun);
  const result: ReminderRunResult = {
    today,
    timeZone: REMINDER_TIME_ZONE,
    emailConfigured: emailConfigured(),
    target: null,
    skippedReason: null,
    dryRun,
    sent: [],
    skipped: [],
    errors: [],
  };

  const target = await findTodaysReminderTarget(today);
  result.target = target;
  if (!target) {
    result.skippedReason = "Geen actieve reisdag voor vandaag.";
    return result;
  }

  if (!options.force && (target.entryStatus === "published" || target.entryStatus === "draft_solid")) {
    result.skippedReason =
      target.entryStatus === "published"
        ? "Dag is al gepubliceerd — geen reminder."
        : "Dag heeft al een stevig concept — geen reminder.";
    return result;
  }

  const recipients = await listReminderRecipients(target.tripId);
  if (!recipients.length) {
    result.skippedReason = "Geen ontvangers (geen trip-owner, allowlist leeg, of allemaal afgemeld).";
    return result;
  }

  const supabase = createServiceClient();
  const mail = buildReminderEmail(target);

  for (const recipient of recipients) {
    const { data: existing } = await supabase
      .from("reminder_sends")
      .select("id")
      .eq("user_id", recipient.userId)
      .eq("trip_day_id", target.tripDayId)
      .eq("sent_on", today)
      .eq("channel", "email")
      .maybeSingle();

    if (existing && !options.force) {
      result.skipped.push({ ...recipient, reason: "Al verzonden vandaag." });
      continue;
    }

    if (dryRun) {
      result.skipped.push({ ...recipient, reason: "dry-run — niet verzonden." });
      continue;
    }

    if (!result.emailConfigured) {
      result.errors.push({
        ...recipient,
        error: "RESEND_API_KEY ontbreekt — e-mail niet verzonden.",
      });
      continue;
    }

    const sendResult = await sendEmail({
      to: recipient.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    if (!sendResult.ok) {
      result.errors.push({ ...recipient, error: sendResult.error });
      continue;
    }

    const { error: logError } = await supabase.from("reminder_sends").upsert(
      {
        user_id: recipient.userId,
        trip_day_id: target.tripDayId,
        sent_on: today,
        channel: "email",
      },
      { onConflict: "user_id,trip_day_id,sent_on,channel" },
    );
    if (logError) {
      result.errors.push({ ...recipient, error: `Verzonden, maar log faalde: ${logError.message}` });
    }

    result.sent.push({ ...recipient, id: sendResult.id });
  }

  return result;
}

export function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false as const, status: 503, error: "CRON_SECRET is niet geconfigureerd." };

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const alt = request.headers.get("x-cron-secret") || "";
  const url = new URL(request.url);
  const query = url.searchParams.get("secret") || "";

  if (bearer === secret || alt === secret || query === secret) {
    return { ok: true as const };
  }
  return { ok: false as const, status: 401, error: "Ongeldige cron-authenticatie." };
}
