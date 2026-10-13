import { createClient, hasSupabaseEnv } from "./supabase/server";

export type Trip = { id: string; title: string; slug: string; starts_on: string; ends_on: string; countries: string[]; summary: string | null };
export type TripDay = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null; planned_route: string | null };

const fallbackTrip: Trip = {
  id: "2047b6fd-4f2b-4796-a462-72bc3b8f9265", title: "Nepal · Tibet · Bhutan · India", slug: "nepal-tibet-bhutan-india-2026",
  starts_on: "2026-11-01", ends_on: "2026-12-07", countries: ["Nepal", "Tibet", "Bhutan", "India"],
  summary: "Bergen, kloosters, levendige steden en ontmoetingen die bijblijven."
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
