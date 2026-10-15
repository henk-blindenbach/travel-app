import { createClient } from "@supabase/supabase-js";

const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const publicClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

export type PublicTrip = { id: string; title: string; slug: string; starts_on: string; ends_on: string; countries: string[]; summary: string | null; status: string };
export type PublicDay = { id: string; trip_id: string; day_number: number; day_date: string; title: string; actual_location: string; body: string; published_at: string | null };
export type PublicMedia = { id: string; day_entry_id: string; web_object_path: string; sort_order: number; updated_at: string };

export async function listPublicTrips() {
  if (!configured()) return [];
  const { data } = await publicClient().from("trips").select("id,title,slug,starts_on,ends_on,countries,summary,status").order("starts_on", { ascending: false });
  return (data || []) as PublicTrip[];
}

export async function getPublicTripBySlug(slug: string) {
  if (!configured()) return null;
  const db = publicClient();
  const { data: trip } = await db.from("trips").select("id,title,slug,starts_on,ends_on,countries,summary,status").eq("slug", slug).maybeSingle();
  if (!trip) return null;
  const { data: days } = await db.from("day_entries").select("id,trip_id,day_number,day_date,title,actual_location,body,published_at").eq("trip_id", trip.id).order("day_number");
  return { trip: trip as PublicTrip, days: (days || []) as PublicDay[] };
}

export async function getPublicDayByNumber(slug: string, dayNumber: number) {
  const result = await getPublicTripBySlug(slug);
  if (!result) return null;
  const entry = result.days.find((day) => day.day_number === dayNumber);
  if (!entry) return null;
  const { data: media } = await publicClient().from("media_assets").select("id,day_entry_id,web_object_path,sort_order,updated_at").eq("day_entry_id", entry.id).order("sort_order");
  return { ...result, entry, media: (media || []) as PublicMedia[] };
}
