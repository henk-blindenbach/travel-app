import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

const tables = new Set(["travelers", "contacts", "budget"]);
const text = (value: unknown, maximum: number) => safeText(value, maximum);
const amount = (value: unknown) => value === "" || value === null || value === undefined ? null : (Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : undefined);

function values(entity: string, payload: Record<string, unknown>) {
  if (entity === "travelers") return { name: text(payload.name, 120), role: text(payload.role, 80) || "Reiziger", ticket_reference: text(payload.ticketReference, 120), seat_notes: text(payload.seatNotes, 200), loyalty_number: text(payload.loyaltyNumber, 120), notes: text(payload.notes, 2000) };
  if (entity === "contacts") return { name: text(payload.name, 160), role: text(payload.role, 120), phone: text(payload.phone, 80), email: text(payload.email, 254), address: text(payload.address, 500), notes: text(payload.notes, 2000) };
  const planned = amount(payload.plannedAmount); const actual = amount(payload.actualAmount); const currency = text(payload.currency, 3).toUpperCase();
  return { title: text(payload.title, 200), category: text(payload.category, 30) || "other", planned_amount: planned, actual_amount: actual, currency, payment_status: ["unknown", "unpaid", "paid"].includes(String(payload.paymentStatus)) ? payload.paymentStatus : "unknown", notes: text(payload.notes, 2000) };
}
function validEntry(entity: string, item: Record<string, unknown>) {
  if (entity === "travelers" || entity === "contacts") return Boolean(item.name);
  return Boolean(item.title) && item.planned_amount !== undefined && item.actual_amount !== undefined && /^[A-Z]{3}$/.test(String(item.currency));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = await request.json();
    if (!user) return NextResponse.json({ error: "Je sessie is verlopen. Log opnieuw in." }, { status: 401 });
    if (!validUuid(payload.tripId) || !tables.has(payload.entity)) return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 });
    const item = values(payload.entity, payload);
    if (!validEntry(payload.entity, item)) return NextResponse.json({ error: "Vul de verplichte velden correct in." }, { status: 400 });
    const table = payload.entity === "travelers" ? "trip_travelers" : payload.entity === "contacts" ? "trip_contacts" : "trip_budget_entries";
    const { data, error } = await supabase.from(table).insert({ trip_id: payload.tripId, ...item }).select().single();
    if (error || !data) throw error;
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Kon niet opslaan." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = await request.json();
    if (!user) return NextResponse.json({ error: "Je sessie is verlopen. Log opnieuw in." }, { status: 401 });
    if (!validUuid(payload.tripId) || !validUuid(payload.id) || !tables.has(payload.entity)) return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 });
    const item = values(payload.entity, payload);
    if (!validEntry(payload.entity, item)) return NextResponse.json({ error: "Vul de verplichte velden correct in." }, { status: 400 });
    const table = payload.entity === "travelers" ? "trip_travelers" : payload.entity === "contacts" ? "trip_contacts" : "trip_budget_entries";
    const { data, error } = await supabase.from(table).update(item).eq("id", payload.id).eq("trip_id", payload.tripId).select().single();
    if (error || !data) throw error;
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Kon niet bijwerken." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = await request.json();
    if (!user) return NextResponse.json({ error: "Je sessie is verlopen. Log opnieuw in." }, { status: 401 });
    if (!validUuid(payload.tripId) || !validUuid(payload.id) || !tables.has(payload.entity)) return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 });
    const table = payload.entity === "travelers" ? "trip_travelers" : payload.entity === "contacts" ? "trip_contacts" : "trip_budget_entries";
    const { error } = await supabase.from(table).delete().eq("id", payload.id).eq("trip_id", payload.tripId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kon niet verwijderen." }, { status: 400 });
  }
}
