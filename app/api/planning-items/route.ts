import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

const kinds = new Set(["accommodation", "flight", "transport", "activity", "note"]);
const statuses = new Set(["option", "planned", "confirmed"]);
const paymentStatuses = new Set(["unknown", "unpaid", "paid"]);
function isoDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null; }
function time(value: unknown) { return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null; }
function price(value: unknown) { if (value === "" || value === null || value === undefined) return null; const amount = Number(value); return Number.isFinite(amount) && amount >= 0 && amount <= 9_999_999_999.99 ? amount : undefined; }
function bookingFields(payload: Record<string, unknown>) {
  const priceAmount = price(payload.priceAmount);
  const currency = safeText(payload.currency, 3).toUpperCase() || null;
  const paymentStatus = typeof payload.paymentStatus === "string" && paymentStatuses.has(payload.paymentStatus) ? payload.paymentStatus : "unknown";
  return { booking_reference: safeText(payload.bookingReference, 120) || null, ticket_number: safeText(payload.ticketNumber, 120) || null, departure_time: time(payload.departureTime), arrival_time: time(payload.arrivalTime), address: safeText(payload.address, 500) || null, contact_phone: safeText(payload.contactPhone, 80) || null, price_amount: priceAmount, currency: /^[A-Z]{3}$/.test(currency || "") ? currency : null, payment_status: paymentStatus };
}

async function requireMember(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, tripDayId: string) {
  const { data: day } = await supabase.from("trip_days").select("id,day_date").eq("id", tripDayId).eq("trip_id", tripId).maybeSingle();
  return day;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.tripId) || !validUuid(payload.tripDayId) || !kinds.has(payload.kind) || !statuses.has(payload.status) || !safeText(payload.title, 200)) return NextResponse.json({ error: "Vul een titel, type en dag in." }, { status: 400 });
    const day = await requireMember(supabase, payload.tripId, payload.tripDayId);
    if (!day) return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    const endsOn = payload.kind === "accommodation" && payload.endsOn ? isoDate(payload.endsOn) : null;
    if (payload.kind === "accommodation" && payload.endsOn && (!endsOn || endsOn <= day.day_date)) return NextResponse.json({ error: "De uitcheckdatum moet na de incheckdag liggen." }, { status: 400 });
    const fields = bookingFields(payload);
    if (fields.price_amount === undefined) return NextResponse.json({ error: "Vul een geldig bedrag in." }, { status: 400 });
    const { data: item, error } = await supabase.from("planning_items").insert({ trip_id: payload.tripId, trip_day_id: payload.tripDayId, kind: payload.kind, status: payload.status, title: safeText(payload.title, 200), details: safeText(payload.details, 4_000), location: safeText(payload.location, 200), starts_at: safeText(payload.startsAt, 5) || null, ends_on: endsOn, ...fields }).select("id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,booking_reference,ticket_number,departure_time,arrival_time,address,contact_phone,price_amount,currency,payment_status,sort_order").single();
    if (error || !item) return NextResponse.json({ error: "Planningonderdeel kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ item });
  } catch { return NextResponse.json({ error: "Planningonderdeel kon niet worden opgeslagen." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.tripId) || !validUuid(payload.itemId) || !validUuid(payload.tripDayId) || !kinds.has(payload.kind) || !statuses.has(payload.status) || !safeText(payload.title, 200)) return NextResponse.json({ error: "Vul een titel, type en dag in." }, { status: 400 });
    const day = await requireMember(supabase, payload.tripId, payload.tripDayId);
    if (!day) return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    const endsOn = payload.kind === "accommodation" && payload.endsOn ? isoDate(payload.endsOn) : null;
    if (payload.kind === "accommodation" && payload.endsOn && (!endsOn || endsOn <= day.day_date)) return NextResponse.json({ error: "De uitcheckdatum moet na de incheckdag liggen." }, { status: 400 });
    const fields = bookingFields(payload);
    if (fields.price_amount === undefined) return NextResponse.json({ error: "Vul een geldig bedrag in." }, { status: 400 });
    const { data: item, error } = await supabase.from("planning_items").update({ kind: payload.kind, status: payload.status, title: safeText(payload.title, 200), details: safeText(payload.details, 4_000), location: safeText(payload.location, 200), ends_on: endsOn, ...fields }).eq("id", payload.itemId).eq("trip_id", payload.tripId).eq("trip_day_id", payload.tripDayId).select("id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,booking_reference,ticket_number,departure_time,arrival_time,address,contact_phone,price_amount,currency,payment_status,sort_order").single();
    if (error || !item) return NextResponse.json({ error: "Planningonderdeel kon niet worden bijgewerkt." }, { status: 400 });
    return NextResponse.json({ item });
  } catch { return NextResponse.json({ error: "Planningonderdeel kon niet worden bijgewerkt." }, { status: 500 }); }
}
