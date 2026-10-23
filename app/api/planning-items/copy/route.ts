import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { buildCopiedPlanningItem, COPY_SELECT, type CopyablePlanningItem } from "../../../../lib/planning-item-copy";
import { createClient } from "../../../../lib/supabase/server";

const ITEM_RETURN =
  "id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,arrives_on,booking_reference,ticket_number,departure_time,arrival_time,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,address,contact_phone,price_amount,currency,payment_status,is_optional,duration_minutes,altitude_m,sort_order,latitude,longitude";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Je sessie is verlopen. Log opnieuw in." }, { status: 401 });

    const payload = await request.json();
    if (!validUuid(payload.tripId) || !validUuid(payload.itemId) || !validUuid(payload.targetTripDayId)) {
      return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 });
    }
    if (payload.itemId === payload.targetTripDayId) {
      return NextResponse.json({ error: "Kies een andere reisdag." }, { status: 400 });
    }

    const { data: source, error: sourceError } = await supabase
      .from("planning_items")
      .select(COPY_SELECT)
      .eq("id", payload.itemId)
      .eq("trip_id", payload.tripId)
      .maybeSingle();
    if (sourceError || !source) return NextResponse.json({ error: "Planningonderdeel niet gevonden." }, { status: 404 });

    if (source.trip_day_id === payload.targetTripDayId) {
      return NextResponse.json({ error: "Dit onderdeel staat al op die reisdag." }, { status: 400 });
    }

    const { data: targetDay, error: dayError } = await supabase
      .from("trip_days")
      .select("id,day_date,day_number")
      .eq("id", payload.targetTripDayId)
      .eq("trip_id", payload.tripId)
      .maybeSingle();
    if (dayError || !targetDay) {
      return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    }

    const { data: sortRows } = await supabase
      .from("planning_items")
      .select("sort_order")
      .eq("trip_id", payload.tripId)
      .eq("trip_day_id", targetDay.id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextSort = Number(sortRows?.[0]?.sort_order ?? 0) + 1;
    const insert = buildCopiedPlanningItem(source as CopyablePlanningItem, targetDay, nextSort);

    const { data: item, error } = await supabase.from("planning_items").insert(insert).select(ITEM_RETURN).single();
    if (error || !item) return NextResponse.json({ error: "Kopiëren mislukt." }, { status: 400 });

    return NextResponse.json({
      item,
      targetDayNumber: targetDay.day_number,
    });
  } catch {
    return NextResponse.json({ error: "Kopiëren mislukt." }, { status: 500 });
  }
}
