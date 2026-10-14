import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

const kinds = new Set(["accommodation", "flight", "transport", "activity", "note"]);
const statuses = new Set(["option", "planned", "confirmed"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.tripId) || !validUuid(payload.tripDayId) || !kinds.has(payload.kind) || !statuses.has(payload.status) || !safeText(payload.title, 200)) return NextResponse.json({ error: "Vul een titel, type en dag in." }, { status: 400 });
    const { data: day } = await supabase.from("trip_days").select("id").eq("id", payload.tripDayId).eq("trip_id", payload.tripId).maybeSingle();
    if (!day) return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    const { data: item, error } = await supabase.from("planning_items").insert({ trip_id: payload.tripId, trip_day_id: payload.tripDayId, kind: payload.kind, status: payload.status, title: safeText(payload.title, 200), details: safeText(payload.details, 4_000), location: safeText(payload.location, 200), starts_at: safeText(payload.startsAt, 5) || null }).select("id,trip_day_id,kind,status,title,details,location,starts_at,sort_order").single();
    if (error || !item) return NextResponse.json({ error: "Planningonderdeel kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ item });
  } catch { return NextResponse.json({ error: "Planningonderdeel kon niet worden opgeslagen." }, { status: 500 }); }
}
