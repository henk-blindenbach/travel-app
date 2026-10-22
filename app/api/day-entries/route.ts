import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
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
    const { data, error } = await supabase.from("day_entries").upsert({
      trip_day_id: payload.tripDayId,
      trip_id: day.trip_id,
      day_number: day.day_number,
      day_date: day.day_date,
      title: safeText(payload.title, 160),
      actual_location: safeText(payload.actualLocation, 160),
      body: safeText(payload.body, 20_000),
    }, { onConflict: "trip_day_id" }).select("id,trip_day_id,title,actual_location,body,publication_status,updated_at").single();

    if (error) return NextResponse.json({ error: "Het verslag kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ entry: data });
  } catch {
    return NextResponse.json({ error: "Het verslag kon niet worden opgeslagen." }, { status: 500 });
  }
}
