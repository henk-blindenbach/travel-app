import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../lib/journal";
import { normalizePolarstepsUrl } from "../../../../lib/polarsteps-url";
import { deleteOriginal } from "../../../../lib/scaleway";
import { createClient } from "../../../../lib/supabase/server";
import { isoDate, syncTripDaysForDateChange } from "../../../../lib/sync-trip-days";

const statuses = new Set(["idea", "planning", "booked", "travelling", "completed", "archived"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json();
    const title = safeText(payload.title, 140);
    const startsOn = isoDate(payload.startsOn);
    const endsOn = isoDate(payload.endsOn);
    const travelers = safeText(payload.travelers, 300) || null;
    const departureLocation = safeText(payload.departureLocation, 200) || null;
    const countries = Array.isArray(payload.countries)
      ? payload.countries.map((country: unknown) => safeText(country, 60)).filter(Boolean).slice(0, 12)
      : typeof payload.countries === "string"
        ? String(payload.countries).split(",").map((country) => safeText(country, 60)).filter(Boolean).slice(0, 12)
        : [];
    const status = statuses.has(payload.status) ? payload.status : "";
    const summary = safeText(payload.summary, 1000) || null;
    const aiBasis = safeText(payload.aiBasis, 2000) || null;
    let polarstepsUrl: string | null = null;
    try {
      polarstepsUrl = normalizePolarstepsUrl(payload.polarstepsUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Ongeldige Polarsteps-URL." },
        { status: 400 },
      );
    }

    if (!title) return NextResponse.json({ error: "Geef de reis een naam." }, { status: 400 });
    if (!startsOn) return NextResponse.json({ error: "Kies een geldige vertrekdatum." }, { status: 400 });
    if (!endsOn) return NextResponse.json({ error: "Kies een geldige terugreisdatum." }, { status: 400 });
    if (endsOn < startsOn) return NextResponse.json({ error: "De terugreis kan niet vóór het vertrek liggen." }, { status: 400 });
    if (!status) return NextResponse.json({ error: "Kies een geldige fase." }, { status: 400 });

    const { data: current, error: currentError } = await supabase
      .from("trips")
      .select("id,starts_on,ends_on")
      .eq("id", tripId)
      .maybeSingle();
    if (currentError || !current) return NextResponse.json({ error: "Reis niet gevonden." }, { status: 404 });

    const datesChanged = current.starts_on !== startsOn || current.ends_on !== endsOn;
    if (datesChanged) {
      const synced = await syncTripDaysForDateChange(supabase, tripId, startsOn, endsOn);
      if (!synced.ok) return NextResponse.json({ error: synced.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("trips")
      .update({
        title,
        starts_on: startsOn,
        ends_on: endsOn,
        countries,
        travelers,
        departure_location: departureLocation,
        summary,
        ai_basis: aiBasis,
        polarsteps_url: polarstepsUrl,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId)
      .select("id,title,starts_on,ends_on,countries,travelers,departure_location,summary,ai_basis,polarsteps_url,status,slug")
      .single();
    if (error || !data) return NextResponse.json({ error: "De reis kon niet worden opgeslagen." }, { status: 400 });

    return NextResponse.json({ trip: data, datesChanged });
  } catch {
    return NextResponse.json({ error: "De reis kon niet worden bijgewerkt." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: trip, error: tripError } = await supabase.from("trips").select("id,title").eq("id", tripId).maybeSingle();
    if (tripError || !trip) return NextResponse.json({ error: "Reis niet gevonden." }, { status: 404 });

    const { data: cover } = await supabase
      .from("trip_covers")
      .select("id,original_object_key,web_object_path")
      .eq("trip_id", tripId)
      .maybeSingle();
    if (cover) {
      await Promise.all([
        cover.web_object_path ? supabase.storage.from("trip-web-images").remove([cover.web_object_path]) : Promise.resolve(),
        cover.original_object_key ? deleteOriginal(cover.original_object_key) : Promise.resolve(),
      ]);
    }

    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) return NextResponse.json({ error: "De reis kon niet worden verwijderd." }, { status: 400 });

    return NextResponse.json({ ok: true, title: trip.title });
  } catch {
    return NextResponse.json({ error: "De reis kon niet worden verwijderd." }, { status: 500 });
  }
}
