import { NextResponse } from "next/server";
import { geocodePlace, readExplicitCoords } from "../../../../lib/geocode";
import { safeText, validUuid } from "../../../../lib/journal";
import { createClient } from "../../../../lib/supabase/server";

const statuses = new Set(["planned", "in_progress", "completed", "skipped"]);
function isoDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }

export type CoordinateStatus = "geocoded" | "manual" | "unchanged" | "failed" | "cleared" | "skipped";

export async function PATCH(request: Request, { params }: { params: Promise<{ dayId: string }> }) {
  try {
    const { dayId } = await params; if (!validUuid(dayId)) return NextResponse.json({ error: "Ongeldige reisdag." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json(); const dayDate = isoDate(payload.dayDate); const status = statuses.has(payload.status) ? payload.status : "planned";
    if (!validUuid(payload.tripId) || !dayDate) return NextResponse.json({ error: "Vul een geldige datum in." }, { status: 400 });
    const { data: trip } = await supabase.from("trips").select("starts_on,ends_on").eq("id", payload.tripId).maybeSingle();
    if (!trip || dayDate < trip.starts_on || dayDate > trip.ends_on) return NextResponse.json({ error: "De datum moet binnen deze reis vallen." }, { status: 400 });
    const dayNumber = Math.floor((Date.parse(`${dayDate}T12:00:00Z`) - Date.parse(`${trip.starts_on}T12:00:00Z`)) / 86400000) + 1;

    const plannedLocation = safeText(payload.location, 200) || null;
    const baseUpdate = {
      day_date: dayDate,
      day_number: dayNumber,
      title: safeText(payload.title, 200) || null,
      planned_location: plannedLocation,
      planned_route: safeText(payload.route, 400) || null,
      private_notes: safeText(payload.privateNotes, 4_000),
      status,
    };

    const { data: existing, error: existingError } = await supabase
      .from("trip_days")
      .select("planned_location,planned_latitude,planned_longitude")
      .eq("id", dayId)
      .eq("trip_id", payload.tripId)
      .maybeSingle();

    const coordsReady = !existingError && existing !== null && existing !== undefined && "planned_latitude" in (existing as object);

    let updatePayload: Record<string, unknown> = baseUpdate;
    let selectCols = "id,day_number,day_date,title,planned_location,planned_route,private_notes,status";
    let coordinateStatus: CoordinateStatus = "skipped";

    if (coordsReady) {
      let plannedLatitude: number | null = (existing as { planned_latitude: number | null }).planned_latitude ?? null;
      let plannedLongitude: number | null = (existing as { planned_longitude: number | null }).planned_longitude ?? null;
      const explicit = readExplicitCoords(payload);
      const clearCoords = payload.clearCoordinates === true;
      if (!plannedLocation || clearCoords) {
        plannedLatitude = null;
        plannedLongitude = null;
        coordinateStatus = "cleared";
      } else if (explicit) {
        plannedLatitude = explicit.latitude;
        plannedLongitude = explicit.longitude;
        coordinateStatus = "manual";
      } else if (plannedLocation !== existing?.planned_location || plannedLatitude === null || plannedLongitude === null) {
        const geocoded = await geocodePlace(plannedLocation);
        plannedLatitude = geocoded?.latitude ?? null;
        plannedLongitude = geocoded?.longitude ?? null;
        coordinateStatus = geocoded ? "geocoded" : "failed";
      } else {
        coordinateStatus = "unchanged";
      }
      updatePayload = { ...baseUpdate, planned_latitude: plannedLatitude, planned_longitude: plannedLongitude };
      selectCols += ",planned_latitude,planned_longitude";
    }

    const { data: day, error } = await supabase.from("trip_days").update(updatePayload).eq("id", dayId).eq("trip_id", payload.tripId).select(selectCols).single();
    if (error || !day) return NextResponse.json({ error: "Reisdag kon niet worden opgeslagen. Kies eventueel een andere datum." }, { status: 400 });
    return NextResponse.json({ day, coordinateStatus });
  } catch { return NextResponse.json({ error: "Reisdag kon niet worden opgeslagen." }, { status: 500 }); }
}
