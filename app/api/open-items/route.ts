import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const payload = await request.json(); if (!validUuid(payload.tripId) || !safeText(payload.title, 200)) return NextResponse.json({ error: "Geef een open punt een titel." }, { status: 400 });
  const dueOn = typeof payload.dueOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(payload.dueOn) ? payload.dueOn : null;
  const { data, error } = await supabase.from("trip_open_items").insert({ trip_id: payload.tripId, trip_day_id: validUuid(payload.tripDayId) ? payload.tripDayId : null, planning_item_id: validUuid(payload.planningItemId) ? payload.planningItemId : null, assigned_to: safeText(payload.assignedTo, 120), due_on: dueOn, title: safeText(payload.title, 200), details: safeText(payload.details, 4000) }).select("id,trip_day_id,title,details,status,assigned_to,due_on,planning_item_id").single();
  if (error || !data) return NextResponse.json({ error: "Open punt kon niet worden opgeslagen." }, { status: 400 }); return NextResponse.json({ item: data });
}
export async function PATCH(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const payload = await request.json(); if (!validUuid(payload.id) || !validUuid(payload.tripId) || !["open", "done"].includes(payload.status)) return NextResponse.json({ error: "Ongeldig open punt." }, { status: 400 });
  const { data, error } = await supabase.from("trip_open_items").update({ status: payload.status }).eq("id", payload.id).eq("trip_id", payload.tripId).select("id,trip_day_id,title,details,status,assigned_to,due_on,planning_item_id").single();
  if (error || !data) return NextResponse.json({ error: "Open punt kon niet worden bijgewerkt." }, { status: 400 }); return NextResponse.json({ item: data });
}
