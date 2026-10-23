import { createClient } from "@supabase/supabase-js";
import { localizeEntryFields, type EntryI18nMap } from "./entry-i18n";
import type { Locale } from "./i18n/config";

const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const publicClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

export type PublicTrip = { id: string; title: string; slug: string; starts_on: string; ends_on: string; countries: string[]; summary: string | null; status: string };
export type PublicDay = {
  id: string;
  trip_id: string;
  day_number: number;
  day_date: string;
  title: string;
  actual_location: string;
  body: string;
  published_at: string | null;
  title_i18n?: EntryI18nMap | null;
  body_i18n?: EntryI18nMap | null;
  actual_location_i18n?: EntryI18nMap | null;
};
export type PublicMedia = { id: string; day_entry_id: string; web_object_path: string; sort_order: number; updated_at: string };

const DAY_SELECT =
  "id,trip_id,day_number,day_date,title,actual_location,body,published_at,title_i18n,body_i18n,actual_location_i18n";

/** Resolve title/body/location for the active public locale (fallback NL / primary). */
export function localizePublicDay(day: PublicDay, locale: Locale): PublicDay {
  const localized = localizeEntryFields(day, locale);
  return { ...day, ...localized };
}

export async function listPublicTrips() {
  if (!configured()) return [];
  // Anon RLS on trips is public-only — unlisted trips never appear in /reizen lists.
  const { data } = await publicClient()
    .from("trips")
    .select("id,title,slug,starts_on,ends_on,countries,summary,status")
    .order("starts_on", { ascending: false });
  return (data || []) as PublicTrip[];
}

export async function getPublicTripBySlug(slug: string) {
  if (!configured()) return null;
  try {
    const db = publicClient();
    const { data, error } = await db.rpc("get_shareable_trip_by_slug", { p_slug: slug });
    if (error) return null;
    const trip = Array.isArray(data) ? data[0] : data;
    if (!trip) return null;
    const { data: days } = await db.from("day_entries").select(DAY_SELECT).eq("trip_id", trip.id).order("day_number");
    return { trip: trip as PublicTrip, days: (days || []) as PublicDay[] };
  } catch {
    return null;
  }
}

export async function getPublicDayByNumber(slug: string, dayNumber: number) {
  const result = await getPublicTripBySlug(slug);
  if (!result) return null;
  const entry = result.days.find((day) => day.day_number === dayNumber);
  if (!entry) return null;
  const { data: media } = await publicClient().from("media_assets").select("id,day_entry_id,web_object_path,sort_order,updated_at").eq("day_entry_id", entry.id).order("sort_order");
  return { ...result, entry, media: (media || []) as PublicMedia[] };
}
