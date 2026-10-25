/** Build compact JSON context for the travel-journal interview AI. */

export const EARLIER_JOURNAL_MAX_DAYS = 5;
export const EARLIER_BODY_MAX_CHARS = 600;
export const AI_BASIS_MAX_CHARS = 2000;
export const PLANNING_DETAILS_MAX_CHARS = 400;

export type InterviewDayHeader = {
  title: string | null;
  planned_location: string | null;
  planned_route: string | null;
  day_date: string;
  day_number: number;
};

export type InterviewDraftEntry = {
  title: string | null;
  actual_location: string | null;
  body: string | null;
  media_assets?: Array<{
    original_filename: string | null;
    caption: string | null;
    captured_at: string | null;
  }> | null;
};

export type InterviewPlanningItem = {
  kind: string | null;
  status: string | null;
  title: string | null;
  details: string | null;
  location: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  arrives_on: string | null;
  ends_on: string | null;
  carrier: string | null;
  flight_number: string | null;
  address: string | null;
  duration_minutes: number | null;
  sort_order: number | null;
};

export type EarlierJournalRow = {
  day_number: number;
  day_date: string;
  title: string | null;
  actual_location: string | null;
  body: string | null;
};

function clip(value: string | null | undefined, max: number) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function shortTime(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : text;
}

/** Strip booking secrets / PII before sending planning rows to the model. */
export function sanitizePlanningItemForAi(item: InterviewPlanningItem) {
  const details = clip(item.details, PLANNING_DETAILS_MAX_CHARS);
  return {
    kind: item.kind || "",
    status: item.status || "",
    title: clip(item.title, 200),
    location: clip(item.location, 200),
    details: details || undefined,
    departureTime: shortTime(item.departure_time) || undefined,
    arrivalTime: shortTime(item.arrival_time) || undefined,
    arrivesOn: item.arrives_on || undefined,
    endsOn: item.ends_on || undefined,
    carrier: clip(item.carrier, 120) || undefined,
    flightNumber: clip(item.flight_number, 40) || undefined,
    address: clip(item.address, 300) || undefined,
    durationMinutes: item.duration_minutes ?? undefined,
  };
}

export function summarizeEarlierJournal(rows: EarlierJournalRow[]) {
  return rows
    .filter((row) => String(row.body || "").trim())
    .sort((a, b) => b.day_number - a.day_number)
    .slice(0, EARLIER_JOURNAL_MAX_DAYS)
    .map((row) => ({
      dayNumber: row.day_number,
      date: row.day_date,
      title: clip(row.title, 160) || undefined,
      location: clip(row.actual_location, 160) || undefined,
      body: clip(row.body, EARLIER_BODY_MAX_CHARS),
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

export function buildInterviewContext(input: {
  aiBasis?: string | null;
  day: InterviewDayHeader;
  entry?: InterviewDraftEntry | null;
  planningItems?: InterviewPlanningItem[] | null;
  earlierJournal?: EarlierJournalRow[] | null;
}) {
  const photos = (input.entry?.media_assets || []).map((asset) => ({
    filename: asset.original_filename,
    caption: asset.caption,
    capturedAt: asset.captured_at,
  }));

  const planning = [...(input.planningItems || [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(sanitizePlanningItemForAi);

  const earlier = summarizeEarlierJournal(input.earlierJournal || []);
  const aiBasis = clip(input.aiBasis, AI_BASIS_MAX_CHARS);

  return {
    tripAiBasis: aiBasis || null,
    planned: {
      title: input.day.title,
      location: input.day.planned_location,
      route: input.day.planned_route,
      date: input.day.day_date,
      number: input.day.day_number,
    },
    planningItems: planning,
    earlierJournal: earlier,
    currentDraft: input.entry
      ? {
          title: input.entry.title,
          location: input.entry.actual_location,
          body: input.entry.body,
        }
      : null,
    photos,
  };
}

export const INTERVIEW_STORY_STYLE =
  "Als complete=true, maak dan een aantrekkelijk, direct publiceerbaar reisverhaal in natuurlijk gesproken of geschreven Nederlands. Schrijf het volledige body-veld consequent in de wij-vorm (wij, ons, onze) en nooit over 'jullie'. Gebruik doorlopende alinea's met lege regels ertussen; geen Markdown-kopjes (geen #, ## of ###) en geen andere heading-chrome in de body. Warm, feitelijk en leesbaar als reisproza — geen opsommingen-als-rapport tenzij het gesprek dat vraagt.";
