import { createClient, hasSupabaseEnv } from "./supabase/server";

export type Trip = { id: string; title: string; slug: string; starts_on: string; ends_on: string; countries: string[]; summary: string | null; status?: "idea" | "planning" | "booked" | "travelling" | "completed" | "archived" };
export type TripDay = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null; planned_route: string | null; private_notes?: string; status?: "planned" | "in_progress" | "completed" | "skipped" };
export type PrivateTripMenu = Trip & { days: Pick<TripDay, "id" | "day_number" | "day_date" | "title" | "planned_location">[] };

const fallbackTrip: Trip = {
  id: "2047b6fd-4f2b-4796-a462-72bc3b8f9265", title: "Nepal · Tibet · Bhutan · India", slug: "nepal-tibet-bhutan-india-2026",
  starts_on: "2026-11-01", ends_on: "2026-12-07", countries: ["Nepal", "Tibet", "Bhutan", "India"],
  summary: "Bergen, kloosters, levendige steden en ontmoetingen die bijblijven.", status: "planning"
};
const fallbackDays: TripDay[] = [
  { id: "1", day_number: 5, day_date: "2026-11-06", title: "Annapurna trekking", planned_location: "Ghorepani", planned_route: "Ghorepani → Poon Hill" },
  { id: "2", day_number: 4, day_date: "2026-11-04", title: "Ghorepani", planned_location: "Ghorepani", planned_route: "Pokhara → Ghorepani" },
  { id: "3", day_number: 3, day_date: "2026-11-03", title: "Naar de bergen", planned_location: "Pokhara", planned_route: "Kathmandu → Pokhara" }
];

export async function getFeaturedTrip() {
  if (!hasSupabaseEnv()) return { trip: fallbackTrip, days: fallbackDays, source: "fallback" as const };
  try {
    const supabase = await createClient();
    const { data: trip } = await supabase.from("trips").select("id,title,slug,starts_on,ends_on,countries,summary").eq("slug", fallbackTrip.slug).single();
    if (!trip) return { trip: fallbackTrip, days: fallbackDays, source: "fallback" as const };
    const { data: days } = await supabase.from("trip_days").select("id,day_number,day_date,title,planned_location,planned_route").eq("trip_id", trip.id).order("day_number", { ascending: false }).limit(5);
    return { trip: trip as Trip, days: (days?.length ? days : fallbackDays) as TripDay[], source: "supabase" as const };
  } catch {
    return { trip: fallbackTrip, days: fallbackDays, source: "fallback" as const };
  }
}

export async function getPrivateTrips() {
  if (!hasSupabaseEnv()) return [{ ...fallbackTrip, days: fallbackDays }];
  try {
    const supabase = await createClient();
    const { data: trips, error } = await supabase.from("trips").select("id,title,slug,starts_on,ends_on,countries,summary,status").order("starts_on", { ascending: false });
    if (error || !trips?.length) return [];
    const { data: days } = await supabase.from("trip_days").select("id,trip_id,day_number,day_date,title,planned_location").in("trip_id", trips.map((trip) => trip.id)).order("day_number");
    return trips.map((trip) => ({ ...trip, days: (days || []).filter((day) => day.trip_id === trip.id).map((day) => ({ id: day.id, day_number: day.day_number, day_date: day.day_date, title: day.title, planned_location: day.planned_location })) })) as PrivateTripMenu[];
  } catch { return []; }
}

export async function getPrivateTrip(tripId: string) {
  if (!hasSupabaseEnv()) return tripId === fallbackTrip.id ? { trip: fallbackTrip, days: fallbackDays } : null;
  try {
    const supabase = await createClient();
    const { data: trip } = await supabase.from("trips").select("id,title,slug,starts_on,ends_on,countries,summary,status").eq("id", tripId).maybeSingle();
    if (!trip) return null;
    const { data: days } = await supabase.from("trip_days").select("id,day_number,day_date,title,planned_location,planned_route,private_notes,status").eq("trip_id", tripId).order("day_number");
    return { trip: trip as Trip, days: (days || []) as TripDay[] };
  } catch { return null; }
}

/** Public data never falls back to planned days: only rows admitted by publication RLS are returned. */
async function getPublishedDays(tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("day_entries").select("id,day_number,day_date,title,actual_location").eq("trip_id", tripId).eq("publication_status", "published").order("day_number", { ascending: true });
  return (data || []).map((entry) => ({ id: entry.id, day_number: entry.day_number, day_date: entry.day_date, title: entry.title || null, planned_location: entry.actual_location || null, planned_route: null })) as TripDay[];
}

export async function getPublicFeaturedTrip() {
  if (!hasSupabaseEnv()) return { trip: fallbackTrip, days: [] as TripDay[] };
  try {
    const supabase = await createClient();
    const { data: trip } = await supabase
      .from("trips")
      .select("id,title,slug,starts_on,ends_on,countries,summary")
      .eq("slug", fallbackTrip.slug)
      .maybeSingle();
    if (!trip) return { trip: fallbackTrip, days: [] as TripDay[] };
    const days = await getPublishedDays(trip.id);
    return { trip: trip as Trip, days: days.slice(-6).reverse() };
  } catch {
    return { trip: fallbackTrip, days: [] as TripDay[] };
  }
}

export type PublicTripOverview = { trip: Trip; days: TripDay[] };

export async function getPublicTravelOverview() {
  if (!hasSupabaseEnv()) return { current: { trip: fallbackTrip, days: [] } as PublicTripOverview, past: [] as PublicTripOverview[], isTravelling: false };
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("trips")
      .select("id,title,slug,starts_on,ends_on,countries,summary,status")
      .order("starts_on", { ascending: false });
    const trips = (data || []) as Trip[];
    const today = new Date().toISOString().slice(0, 10);
    const travelling = trips.find((trip) => trip.status === "travelling" || (trip.starts_on <= today && trip.ends_on >= today));
    const currentTrip = travelling || trips.find((trip) => trip.status !== "completed" && trip.status !== "archived") || trips[0];
    if (!currentTrip) return { current: null, past: [] as PublicTripOverview[], isTravelling: false };
    const tripsWithDays = await Promise.all(trips.map(async (trip) => ({ trip, days: await getPublishedDays(trip.id) })));
    return {
      current: tripsWithDays.find((item) => item.trip.id === currentTrip.id) || { trip: currentTrip, days: [] },
      past: tripsWithDays.filter((item) => item.trip.id !== currentTrip.id && (item.trip.status === "completed" || item.trip.status === "archived" || item.trip.ends_on < today)),
      isTravelling: Boolean(travelling),
    };
  } catch {
    return { current: { trip: fallbackTrip, days: [] } as PublicTripOverview, past: [] as PublicTripOverview[], isTravelling: false };
  }
}

export async function getPublicTrip(slug: string) {
  if (!hasSupabaseEnv()) return slug === fallbackTrip.slug ? { trip: fallbackTrip, days: [] as TripDay[] } : null;
  try {
    const supabase = await createClient();
    const { data: trip } = await supabase.from("trips").select("id,title,slug,starts_on,ends_on,countries,summary,status").eq("slug", slug).maybeSingle();
    if (!trip) return null;
    return { trip: trip as Trip, days: await getPublishedDays(trip.id) };
  } catch {
    return null;
  }
}
