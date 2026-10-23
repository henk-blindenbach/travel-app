import { NextResponse } from "next/server";
import {
  BODY_MAX,
  LOCATION_MAX,
  TITLE_MAX,
  normalizeEntryI18nMap,
  syncDutchIntoI18n,
} from "../../../lib/entry-i18n";
import { safeText, validUuid } from "../../../lib/journal";
import { resolveStoredCoords } from "../../../lib/resolve-coords";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json();
    if (!validUuid(payload.tripDayId)) return NextResponse.json({ error: "Ongeldige reisdag." }, { status: 400 });

    const { data: day } = await supabase.from("trip_days").select("trip_id,day_number,day_date").eq("id", payload.tripDayId).maybeSingle();
    if (!day) return NextResponse.json({ error: "Deze reisdag is niet toegankelijk." }, { status: 404 });

    const title = safeText(payload.title, TITLE_MAX);
    const actualLocation = safeText(payload.actualLocation, LOCATION_MAX);
    const body = safeText(payload.body, BODY_MAX);

    const { data: existing } = await supabase
      .from("day_entries")
      .select("id,actual_location,actual_latitude,actual_longitude,title_i18n,body_i18n,actual_location_i18n")
      .eq("trip_day_id", payload.tripDayId)
      .maybeSingle();

    const coordsReady = existing === null || existing === undefined || "actual_latitude" in (existing as object);
    const coords = await resolveStoredCoords({
      placeText: actualLocation || null,
      existingPlaceText: existing?.actual_location ?? null,
      existingLatitude: existing && "actual_latitude" in existing ? (existing.actual_latitude as number | null) : null,
      existingLongitude: existing && "actual_longitude" in existing ? (existing.actual_longitude as number | null) : null,
      payload,
      coordsReady,
    });

    const titleI18n = syncDutchIntoI18n(
      normalizeEntryI18nMap(existing?.title_i18n, TITLE_MAX),
      title,
      TITLE_MAX,
    );
    const bodyI18n = syncDutchIntoI18n(
      normalizeEntryI18nMap(existing?.body_i18n, BODY_MAX),
      body,
      BODY_MAX,
    );
    const locationI18n = syncDutchIntoI18n(
      normalizeEntryI18nMap(existing?.actual_location_i18n, LOCATION_MAX),
      actualLocation,
      LOCATION_MAX,
    );

    const upsertRow: Record<string, unknown> = {
      trip_day_id: payload.tripDayId,
      trip_id: day.trip_id,
      day_number: day.day_number,
      day_date: day.day_date,
      title,
      actual_location: actualLocation,
      body,
      title_i18n: titleI18n,
      body_i18n: bodyI18n,
      actual_location_i18n: locationI18n,
    };
    if (coordsReady) {
      upsertRow.actual_latitude = coords.latitude;
      upsertRow.actual_longitude = coords.longitude;
    }

    const selectCols = coordsReady
      ? "id,trip_day_id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n,publication_status,updated_at,actual_latitude,actual_longitude"
      : "id,trip_day_id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n,publication_status,updated_at";

    const { data, error } = await supabase.from("day_entries").upsert(upsertRow, { onConflict: "trip_day_id" }).select(selectCols).single();

    if (error) return NextResponse.json({ error: "Het verslag kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ entry: data, coordinateStatus: coords.status });
  } catch {
    return NextResponse.json({ error: "Het verslag kon niet worden opgeslagen." }, { status: 500 });
  }
}
