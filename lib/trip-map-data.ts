import { createClient, hasSupabaseEnv } from "./supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { TripMapPin } from "./map-types";

type PlannedDayRow = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  planned_location: string | null;
  planned_latitude: number | null;
  planned_longitude: number | null;
};

type EntryMediaRow = {
  day_number: number;
  title: string | null;
  trip_day_id: string;
  media_assets: {
    id: string;
    latitude: number | null;
    longitude: number | null;
    caption: string | null;
    original_filename: string;
    upload_status: string;
  }[] | null;
};

type PublicMapPoint = {
  id: string;
  trip_id: string;
  day_number: number;
  day_date: string;
  label: string;
  latitude: number;
  longitude: number;
  day_published: boolean;
};

function publicClient() {
  return createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function signedThumbnails(assetIds: string[]) {
  if (!assetIds.length || !hasSupabaseEnv()) return new Map<string, string>();
  const supabase = await createClient();
  const { data: assets } = await supabase.from("media_assets").select("id,web_object_path").in("id", assetIds);
  const map = new Map<string, string>();
  await Promise.all((assets || []).map(async (asset) => {
    if (!asset.web_object_path) return;
    const { data } = await supabase.storage.from("trip-web-images").createSignedUrl(asset.web_object_path, 60 * 60);
    if (data?.signedUrl) map.set(asset.id, data.signedUrl);
  }));
  return map;
}

export async function getPrivateTripMapPins(tripId: string, tripSlug?: string): Promise<TripMapPin[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const [daysResult, entriesResult] = await Promise.all([
      supabase
        .from("trip_days")
        .select("id,day_number,day_date,title,planned_location,planned_latitude,planned_longitude")
        .eq("trip_id", tripId)
        .not("planned_latitude", "is", null)
        .not("planned_longitude", "is", null)
        .order("day_number"),
      supabase
        .from("day_entries")
        .select("day_number,title,trip_day_id,media_assets(id,latitude,longitude,caption,original_filename,upload_status)")
        .eq("trip_id", tripId)
        .order("day_number"),
    ]);

    const days = daysResult.error ? [] : daysResult.data;
    const entries = entriesResult.data;

    const planned: TripMapPin[] = ((days || []) as PlannedDayRow[])
      .filter((day) => day.planned_latitude !== null && day.planned_longitude !== null)
      .map((day) => ({
        id: `planned-${day.id}`,
        kind: "planned" as const,
        latitude: day.planned_latitude!,
        longitude: day.planned_longitude!,
        label: day.planned_location || day.title || `Dag ${day.day_number}`,
        subtitle: `Gepland · dag ${day.day_number}`,
        href: `/app/trips/${tripId}/plan#day-${day.id}`,
        dayNumber: day.day_number,
      }));

    const geoMedia = ((entries || []) as EntryMediaRow[]).flatMap((entry) =>
      (entry.media_assets || [])
        .filter((asset) => asset.upload_status === "ready" && asset.latitude !== null && asset.longitude !== null)
        .map((asset) => ({ asset, entry })),
    );
    const thumbs = await signedThumbnails(geoMedia.map(({ asset }) => asset.id));
    const visited: TripMapPin[] = geoMedia.map(({ asset, entry }) => ({
      id: `photo-${asset.id}`,
      kind: "visited" as const,
      latitude: asset.latitude!,
      longitude: asset.longitude!,
      label: asset.caption || asset.original_filename || "Foto",
      subtitle: `Bezocht · dag ${entry.day_number}`,
      href: `/app/journal/${entry.trip_day_id}`,
      thumbnailUrl: thumbs.get(asset.id),
      dayNumber: entry.day_number,
    }));

    void tripSlug;
    return [...planned, ...visited];
  } catch {
    return [];
  }
}

/** Privacy A: planned pins (+ published-day flag). No private EXIF GPS for anon. */
export async function getPublicTripMapPins(tripId: string, tripSlug: string): Promise<TripMapPin[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data } = await publicClient()
      .from("public_trip_map_points")
      .select("id,trip_id,day_number,day_date,label,latitude,longitude,day_published")
      .eq("trip_id", tripId)
      .order("day_number");
    return ((data || []) as PublicMapPoint[]).map((point) => ({
      id: `public-${point.id}`,
      kind: point.day_published ? "published" : "planned",
      latitude: point.latitude,
      longitude: point.longitude,
      label: point.label,
      subtitle: point.day_published ? `Gepubliceerd · dag ${point.day_number}` : `Gepland · dag ${point.day_number}`,
      href: point.day_published ? `/reizen/${tripSlug}/dagen/${point.day_number}` : undefined,
      dayNumber: point.day_number,
    }));
  } catch {
    return [];
  }
}
