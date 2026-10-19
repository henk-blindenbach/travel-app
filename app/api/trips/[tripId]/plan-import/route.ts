import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import {
  buildPlanImportPreview,
  parsePlanImportCsv,
  type PlanImportItemRow,
  type PlanImportRow,
} from "../../../../../lib/plan-import";
import { createClient } from "../../../../../lib/supabase/server";

const MAX_CSV_CHARS = 1_500_000;

type DayRow = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  planned_location: string | null;
  planned_route: string | null;
  private_notes: string | null;
  status: string | null;
  planned_latitude: number | null;
  planned_longitude: number | null;
};

type ItemRow = {
  id: string;
  trip_day_id: string;
  kind: string;
  title: string;
  sort_order: number | null;
};

async function loadTripContext(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string) {
  const { data: membership } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("trip_id", tripId)
    .maybeSingle();
  if (!membership) return null;

  const [daysResult, itemsResult] = await Promise.all([
    supabase
      .from("trip_days")
      .select("id,day_number,day_date,title,planned_location,planned_route,private_notes,status,planned_latitude,planned_longitude")
      .eq("trip_id", tripId)
      .order("day_number"),
    supabase
      .from("planning_items")
      .select("id,trip_day_id,kind,title,sort_order")
      .eq("trip_id", tripId)
      .order("sort_order"),
  ]);

  return {
    days: (daysResult.data || []) as DayRow[],
    items: (itemsResult.data || []) as ItemRow[],
  };
}

function itemPayload(row: PlanImportItemRow, tripId: string, tripDayId: string, sortOrder: number) {
  return {
    trip_id: tripId,
    trip_day_id: tripDayId,
    kind: row.kind,
    status: row.status,
    title: row.title,
    details: row.details || "",
    location: row.location || "",
    ends_on: row.kind === "accommodation" ? row.endsOn || null : null,
    arrives_on: row.arrivesOn || null,
    booking_reference: row.bookingReference || null,
    ticket_number: row.ticketNumber || null,
    departure_time: row.departureTime || null,
    arrival_time: row.arrivalTime || null,
    carrier: row.carrier || null,
    flight_number: row.flightNumber || null,
    departure_terminal: row.departureTerminal || null,
    arrival_terminal: row.arrivalTerminal || null,
    seat_number: row.seatNumber || null,
    external_url: row.externalUrl || null,
    address: row.address || null,
    contact_phone: row.contactPhone || null,
    price_amount: row.priceAmount ?? null,
    currency: row.currency || null,
    payment_status: row.paymentStatus || "unknown",
    is_optional: row.isOptional === true,
    duration_minutes: row.durationMinutes ?? null,
    altitude_m: row.altitudeM ?? null,
    sort_order: sortOrder,
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
    }

    const action = body.action === "confirm" ? "confirm" : "preview";
    let rows: PlanImportRow[] = [];
    let parseErrors = [] as ReturnType<typeof parsePlanImportCsv>["errors"];

    if (typeof body.csv === "string") {
      if (body.csv.length > MAX_CSV_CHARS) {
        return NextResponse.json({ error: "CSV is te groot (max ~1,5 MB tekst)." }, { status: 400 });
      }
      const parsed = parsePlanImportCsv(body.csv);
      rows = parsed.rows;
      parseErrors = parsed.errors;
    } else if (action === "confirm" && Array.isArray(body.rows)) {
      rows = body.rows as PlanImportRow[];
    } else {
      return NextResponse.json({ error: "Upload een CSV of stuur de preview-rijen mee." }, { status: 400 });
    }

    const context = await loadTripContext(supabase, tripId);
    if (!context) return NextResponse.json({ error: "Reis niet gevonden of geen toegang." }, { status: 404 });

    const preview = buildPlanImportPreview({
      rows,
      errors: parseErrors,
      days: context.days,
      items: context.items,
    });

    if (action === "preview") {
      return NextResponse.json({
        preview: {
          summary: preview.summary,
          errors: preview.errors,
          actions: preview.actions,
        },
        rows: preview.rows,
      });
    }

    if (preview.errors.length) {
      return NextResponse.json(
        {
          error: "Import geblokkeerd: los eerst de fouten in de preview op.",
          preview: { summary: preview.summary, errors: preview.errors, actions: preview.actions },
        },
        { status: 400 },
      );
    }

    if (!preview.actions.length) {
      return NextResponse.json({ error: "Geen geldige rijen om te importeren." }, { status: 400 });
    }

    const dayById = new Map(context.days.map((day) => [day.id, day]));
    const dayByNumber = new Map(context.days.map((day) => [day.day_number, day]));
    const itemsByDayTitle = new Map(
      context.items.map((item) => [`${item.trip_day_id}::${item.kind}::${item.title.trim().toLowerCase()}`, item]),
    );
    const nextSort = new Map<string, number>();
    for (const item of context.items) {
      const current = nextSort.get(item.trip_day_id) ?? 0;
      nextSort.set(item.trip_day_id, Math.max(current, (item.sort_order ?? 0) + 1));
    }

    let dayUpdates = 0;
    let itemUpdates = 0;
    let itemInserts = 0;
    const applyErrors: { line: number; message: string }[] = [];

    for (const row of rows) {
      const day = dayByNumber.get(row.dayNumber);
      if (!day) {
        applyErrors.push({ line: row.line, message: `Dag ${row.dayNumber} niet gevonden tijdens import.` });
        continue;
      }

      if (row.rowType === "day") {
        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (row.title !== undefined) update.title = row.title;
        if (row.plannedLocation !== undefined) update.planned_location = row.plannedLocation;
        if (row.plannedRoute !== undefined) update.planned_route = row.plannedRoute;
        if (row.privateNotes !== undefined) update.private_notes = row.privateNotes;
        if (row.dayStatus !== undefined) update.status = row.dayStatus;

        if (row.clearCoordinates) {
          update.planned_latitude = null;
          update.planned_longitude = null;
        } else if (row.latitude !== undefined && row.longitude !== undefined) {
          update.planned_latitude = row.latitude;
          update.planned_longitude = row.longitude;
        } else if (row.plannedLocation !== undefined && row.plannedLocation !== day.planned_location) {
          // Location text changed without coords: clear pin rather than wipe unrelated fields or call Nominatim in bulk.
          update.planned_latitude = null;
          update.planned_longitude = null;
        }

        const { error } = await supabase.from("trip_days").update(update).eq("id", day.id).eq("trip_id", tripId);
        if (error) {
          applyErrors.push({ line: row.line, message: `Dag ${row.dayNumber} kon niet worden bijgewerkt.` });
          continue;
        }
        dayById.set(day.id, { ...day, ...update } as DayRow);
        dayUpdates += 1;
        continue;
      }

      if (row.endsOn && row.endsOn <= day.day_date) {
        applyErrors.push({ line: row.line, message: "ends_on moet na de incheckdag liggen." });
        continue;
      }
      if (row.arrivesOn && row.arrivesOn < day.day_date) {
        applyErrors.push({ line: row.line, message: "arrives_on kan niet vóór de vertrekdag liggen." });
        continue;
      }

      const matchKey = `${day.id}::${row.kind}::${row.title.trim().toLowerCase()}`;
      const existing = itemsByDayTitle.get(matchKey);
      if (existing) {
        const payload = itemPayload(row, tripId, day.id, existing.sort_order ?? 0);
        const updateFields = {
          kind: payload.kind,
          status: payload.status,
          title: payload.title,
          details: payload.details,
          location: payload.location,
          ends_on: payload.ends_on,
          arrives_on: payload.arrives_on,
          booking_reference: payload.booking_reference,
          ticket_number: payload.ticket_number,
          departure_time: payload.departure_time,
          arrival_time: payload.arrival_time,
          carrier: payload.carrier,
          flight_number: payload.flight_number,
          departure_terminal: payload.departure_terminal,
          arrival_terminal: payload.arrival_terminal,
          seat_number: payload.seat_number,
          external_url: payload.external_url,
          address: payload.address,
          contact_phone: payload.contact_phone,
          price_amount: payload.price_amount,
          currency: payload.currency,
          payment_status: payload.payment_status,
          is_optional: payload.is_optional,
          duration_minutes: payload.duration_minutes,
          altitude_m: payload.altitude_m,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from("planning_items")
          .update(updateFields)
          .eq("id", existing.id)
          .eq("trip_id", tripId);
        if (error) {
          applyErrors.push({ line: row.line, message: `Onderdeel “${row.title}” kon niet worden bijgewerkt.` });
          continue;
        }
        itemUpdates += 1;
      } else {
        const sortOrder = nextSort.get(day.id) ?? 0;
        const { data: inserted, error } = await supabase
          .from("planning_items")
          .insert(itemPayload(row, tripId, day.id, sortOrder))
          .select("id,trip_day_id,kind,title,sort_order")
          .single();
        if (error || !inserted) {
          applyErrors.push({ line: row.line, message: `Onderdeel “${row.title}” kon niet worden toegevoegd.` });
          continue;
        }
        itemsByDayTitle.set(matchKey, inserted as ItemRow);
        nextSort.set(day.id, sortOrder + 1);
        itemInserts += 1;
      }
    }

    if (applyErrors.length) {
      return NextResponse.json(
        {
          error: "Import deels mislukt. Controleer de fouten; eerdere rijen kunnen al zijn opgeslagen.",
          applied: { dayUpdates, itemUpdates, itemInserts },
          errors: applyErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      applied: { dayUpdates, itemUpdates, itemInserts },
    });
  } catch {
    return NextResponse.json({ error: "Import mislukt." }, { status: 500 });
  }
}
