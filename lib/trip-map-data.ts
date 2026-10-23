import { createClient, hasSupabaseEnv } from "./supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { TripMapPin } from "./map-types";
import { PLANNING_KIND_LABELS, isPlanningMapKind, planningPinLabel } from "./map-types";

type PlannedDayRow = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  planned_location: string | null;
  planned_latitude: number | null;
  planned_longitude: number | null;
};

type PlanningItemRow = {
  id: string;
  trip_day_id: string;
  kind: string;
  title: string;
  map_label: string | null;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
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

type PublicPlanningPoint = {
  id: string;
  trip_id: string;
  kind: string;
  title: string;
  map_label: string | null;
  place: string;
  label: string;
  latitude: number;
  longitude: number;
};

type PublicVisitedPoint = {
  id: string;
  trip_id: string;
  day_number: number;
  day_date: string;
  label: string;
  latitude: number;
  longitude: number;
};

function publicClient() {
  return createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function placeLabel(location: string | null | undefined, address: string | null | undefined) {
  const loc = (location || "").trim();
  if (loc) return loc;
  const addr = (address || "").trim().split("\n")[0]?.trim() || "";
  return addr;
}

type PlanningMapKind = keyof typeof PLANNING_KIND_LABELS;

function asPlanningKind(kind: string): PlanningMapKind | null {
  if (kind === "accommodation" || kind === "activity" || kind === "transport" || kind === "flight" || kind === "permit") {
    return kind;
  }
  return null;
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
    const [daysResult, itemsResult, entriesResult] = await Promise.all([
      supabase
        .from("trip_days")
        .select("id,day_number,day_date,title,planned_location,planned_latitude,planned_longitude")
        .eq("trip_id", tripId)
        .not("planned_latitude", "is", null)
        .not("planned_longitude", "is", null)
        .order("day_number"),
      supabase
        .from("planning_items")
        .select("id,trip_day_id,kind,title,map_label,location,address,latitude,longitude")
        .eq("trip_id", tripId)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .in("kind", ["accommodation", "activity", "transport", "flight", "permit"]),
      supabase
        .from("day_entries")
        .select("day_number,title,trip_day_id,media_assets(id,latitude,longitude,caption,original_filename,upload_status)")
        .eq("trip_id", tripId)
        .order("day_number"),
    ]);

    const days = daysResult.error ? [] : daysResult.data;
    const items = itemsResult.error ? [] : itemsResult.data;
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

    const planning: TripMapPin[] = [];
    for (const item of (items || []) as PlanningItemRow[]) {
      const kind = asPlanningKind(item.kind);
      if (!kind || item.latitude === null || item.longitude === null) continue;
      const place = placeLabel(item.location, item.address);
      const kindLabel = PLANNING_KIND_LABELS[kind];
      planning.push({
        id: `item-${item.id}`,
        kind,
        latitude: item.latitude,
        longitude: item.longitude,
        label: planningPinLabel(item.map_label, item.location, item.title),
        subtitle: place ? `${kindLabel} · ${place}` : kindLabel,
        href: `/app/trips/${tripId}/plan`,
      });
    }

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
    return [...planned, ...planning, ...visited];
  } catch {
    return [];
  }
}

/** Privacy A: planned + public planning pins + published actual_location. No EXIF GPS for anon. */
export async function getPublicTripMapPins(tripId: string, tripSlug: string): Promise<TripMapPin[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const client = publicClient();
    const [plannedResult, planningResult, visitedResult] = await Promise.all([
      client
        .from("public_trip_map_points")
        .select("id,trip_id,day_number,day_date,label,latitude,longitude,day_published")
        .eq("trip_id", tripId)
        .order("day_number"),
      client
        .from("public_trip_planning_map_points")
        .select("id,trip_id,kind,title,map_label,place,label,latitude,longitude")
        .eq("trip_id", tripId),
      client
        .from("public_trip_visited_map_points")
        .select("id,trip_id,day_number,day_date,label,latitude,longitude")
        .eq("trip_id", tripId)
        .order("day_number"),
    ]);

    const visitedDays = new Set(
      ((visitedResult.data || []) as PublicVisitedPoint[]).map((point) => point.day_number),
    );

    const planned: TripMapPin[] = ((plannedResult.data || []) as PublicMapPoint[]).map((point) => {
      const hasActual = visitedDays.has(point.day_number);
      const showPublished = point.day_published && !hasActual;
      return {
        id: `public-${point.id}`,
        kind: showPublished ? ("published" as const) : ("planned" as const),
        latitude: point.latitude,
        longitude: point.longitude,
        label: point.label,
        subtitle: showPublished
          ? `Gepubliceerd · dag ${point.day_number}`
          : `Gepland · dag ${point.day_number}`,
        href: point.day_published ? `/reizen/${tripSlug}/dagen/${point.day_number}` : undefined,
        dayNumber: point.day_number,
      };
    });

    const planning: TripMapPin[] = [];
    for (const point of (planningResult.data || []) as PublicPlanningPoint[]) {
      const kind = asPlanningKind(point.kind);
      if (!kind) continue;
      const pinLabel = (point.label || "").trim()
        || planningPinLabel(point.map_label, point.place, point.title);
      planning.push({
        id: `public-item-${point.id}`,
        kind,
        latitude: point.latitude,
        longitude: point.longitude,
        label: pinLabel,
        subtitle: point.place && point.place !== pinLabel ? point.place : PLANNING_KIND_LABELS[kind],
      });
    }

    const visited: TripMapPin[] = ((visitedResult.data || []) as PublicVisitedPoint[]).map((point) => ({
      id: `public-visited-${point.id}`,
      kind: "published" as const,
      latitude: point.latitude,
      longitude: point.longitude,
      label: point.label,
      subtitle: `Bezocht · dag ${point.day_number}`,
      href: `/reizen/${tripSlug}/dagen/${point.day_number}`,
      dayNumber: point.day_number,
    }));

    return [...planned, ...planning, ...visited];
  } catch {
    return [];
  }
}

export function countPinsByKind(pins: TripMapPin[]) {
  const counts = {
    planned: 0,
    visited: 0,
    published: 0,
    planning: 0,
  };
  for (const pin of pins) {
    if (pin.kind === "planned") counts.planned += 1;
    else if (pin.kind === "visited") counts.visited += 1;
    else if (pin.kind === "published") counts.published += 1;
    else if (isPlanningMapKind(pin.kind)) counts.planning += 1;
  }
  return counts;
}
