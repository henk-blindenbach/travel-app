import { NextResponse } from "next/server";
import { safeText } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

const statuses = new Set(["idea", "planning", "booked", "travelling", "completed", "archived"]);
function isoDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }
function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    const title = safeText(payload.title, 140); const startsOn = isoDate(payload.startsOn); const endsOn = isoDate(payload.endsOn);
    const travelers = safeText(payload.travelers, 300) || null;
    const departureLocation = safeText(payload.departureLocation, 200) || null;
    const countries = Array.isArray(payload.countries) ? payload.countries.map((country: unknown) => safeText(country, 60)).filter(Boolean).slice(0, 12) : [];
    const status = statuses.has(payload.status) ? payload.status : "planning";
    if (!title) return NextResponse.json({ error: "Geef de reis een naam." }, { status: 400 });
    if (!startsOn) return NextResponse.json({ error: "Kies een geldige vertrekdatum." }, { status: 400 });
    if (!endsOn) return NextResponse.json({ error: "Kies een geldige terugreisdatum." }, { status: 400 });
    if (endsOn < startsOn) return NextResponse.json({ error: "De terugreis kan niet vóór het vertrek liggen." }, { status: 400 });
    const baseSlug = slugify(title) || "reis";
    const slug = `${baseSlug}-${startsOn.slice(0, 4)}-${crypto.randomUUID().slice(0, 6)}`;
    const tripId = crypto.randomUUID();
    const { error: tripError } = await supabase.from("trips").insert({ id: tripId, title, slug, starts_on: startsOn, ends_on: endsOn, countries, travelers, departure_location: departureLocation, summary: safeText(payload.summary, 1000) || null, status, visibility: "private", created_by: user.id });
    if (tripError) return NextResponse.json({ error: "De reis kon niet worden opgeslagen. Probeer een andere naam of neem contact op als dit blijft gebeuren." }, { status: 400 });
    const { error: membershipError } = await supabase.from("trip_members").insert({ trip_id: tripId, user_id: user.id, role: "owner" });
    if (membershipError) {
      await supabase.from("trips").delete().eq("id", tripId);
      return NextResponse.json({ error: "De reis kon niet aan jouw account worden gekoppeld. Er is niets opgeslagen." }, { status: 500 });
    }
    const start = new Date(`${startsOn}T12:00:00Z`); const end = new Date(`${endsOn}T12:00:00Z`); const days = [];
    for (let date = new Date(start), number = 1; date <= end; date.setUTCDate(date.getUTCDate() + 1), number += 1) days.push({ trip_id: tripId, day_number: number, day_date: date.toISOString().slice(0, 10) });
    const { error: daysError } = await supabase.from("trip_days").insert(days);
    if (daysError) {
      await supabase.from("trips").delete().eq("id", tripId);
      return NextResponse.json({ error: "De reisdagen konden niet worden voorbereid. Er is niets opgeslagen." }, { status: 500 });
    }
    return NextResponse.json({ trip: { id: tripId, title } });
  } catch { return NextResponse.json({ error: "Reis kon niet worden aangemaakt." }, { status: 500 }); }
}
