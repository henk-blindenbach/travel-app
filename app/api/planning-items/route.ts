import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

const kinds = new Set(["accommodation", "flight", "transport", "activity", "permit", "note"]);
const statuses = new Set(["option", "planned", "confirmed"]);
const paymentStatuses = new Set(["unknown", "unpaid", "paid"]);
function isoDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null; }
function time(value: unknown) { return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null; }
function price(value: unknown) { if (value === "" || value === null || value === undefined) return null; const amount = Number(value); return Number.isFinite(amount) && amount >= 0 && amount <= 9_999_999_999.99 ? amount : undefined; }
function wholeNumber(value: unknown, minimum: number, maximum: number) { if (value === "" || value === null || value === undefined) return null; const number = Number(value); return Number.isInteger(number) && number >= minimum && number <= maximum ? number : undefined; }
function externalUrl(value: unknown) { const url = safeText(value, 500); if (!url) return null; try { const parsed = new URL(url); return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined; } catch { return undefined; } }
function bookingFields(payload: Record<string, unknown>) {
  const priceAmount = price(payload.priceAmount);
  const durationMinutes = wholeNumber(payload.durationMinutes, 1, 10080);
  const altitudeM = wholeNumber(payload.altitudeM, -500, 10000);
  const currency = safeText(payload.currency, 3).toUpperCase() || null;
  const paymentStatus = typeof payload.paymentStatus === "string" && paymentStatuses.has(payload.paymentStatus) ? payload.paymentStatus : "unknown";
  return { booking_reference: safeText(payload.bookingReference, 120) || null, ticket_number: safeText(payload.ticketNumber, 120) || null, departure_time: time(payload.departureTime), arrival_time: time(payload.arrivalTime), arrives_on: payload.arrivesOn ? isoDate(payload.arrivesOn) : null, carrier: safeText(payload.carrier, 120) || null, flight_number: safeText(payload.flightNumber, 40) || null, departure_terminal: safeText(payload.departureTerminal, 80) || null, arrival_terminal: safeText(payload.arrivalTerminal, 80) || null, seat_number: safeText(payload.seatNumber, 40) || null, external_url: externalUrl(payload.externalUrl), address: safeText(payload.address, 500) || null, contact_phone: safeText(payload.contactPhone, 80) || null, price_amount: priceAmount, currency: /^[A-Z]{3}$/.test(currency || "") ? currency : null, payment_status: paymentStatus, is_optional: payload.isOptional === true || payload.isOptional === "true", duration_minutes: durationMinutes, altitude_m: altitudeM };
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
    if (fields.price_amount === undefined || fields.duration_minutes === undefined || fields.altitude_m === undefined || fields.external_url === undefined || (payload.arrivesOn && !fields.arrives_on)) return NextResponse.json({ error: "Vul een geldige datum, link, bedrag, duur of hoogte in." }, { status: 400 });
    if (fields.arrives_on && fields.arrives_on < day.day_date) return NextResponse.json({ error: "De aankomstdatum kan niet vóór de vertrekdag liggen." }, { status: 400 });
    const { data: item, error } = await supabase.from("planning_items").insert({ trip_id: payload.tripId, trip_day_id: payload.tripDayId, kind: payload.kind, status: payload.status, title: safeText(payload.title, 200), details: safeText(payload.details, 4_000), location: safeText(payload.location, 200), starts_at: safeText(payload.startsAt, 5) || null, ends_on: endsOn, ...fields }).select("id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,arrives_on,booking_reference,ticket_number,departure_time,arrival_time,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,address,contact_phone,price_amount,currency,payment_status,is_optional,duration_minutes,altitude_m,sort_order").single();
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
    if (fields.price_amount === undefined || fields.duration_minutes === undefined || fields.altitude_m === undefined || fields.external_url === undefined || (payload.arrivesOn && !fields.arrives_on)) return NextResponse.json({ error: "Vul een geldige datum, link, bedrag, duur of hoogte in." }, { status: 400 });
    if (fields.arrives_on && fields.arrives_on < day.day_date) return NextResponse.json({ error: "De aankomstdatum kan niet vóór de vertrekdag liggen." }, { status: 400 });
    const { data: item, error } = await supabase.from("planning_items").update({ kind: payload.kind, status: payload.status, title: safeText(payload.title, 200), details: safeText(payload.details, 4_000), location: safeText(payload.location, 200), ends_on: endsOn, ...fields }).eq("id", payload.itemId).eq("trip_id", payload.tripId).eq("trip_day_id", payload.tripDayId).select("id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,arrives_on,booking_reference,ticket_number,departure_time,arrival_time,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,address,contact_phone,price_amount,currency,payment_status,is_optional,duration_minutes,altitude_m,sort_order").single();
    if (error || !item) return NextResponse.json({ error: "Planningonderdeel kon niet worden bijgewerkt." }, { status: 400 });
    return NextResponse.json({ item });
  } catch { return NextResponse.json({ error: "Planningonderdeel kon niet worden bijgewerkt." }, { status: 500 }); }
}
