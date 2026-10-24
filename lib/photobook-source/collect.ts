import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dayFolderName,
  extensionFromFilename,
  photoExportFilename,
  tripZipBasename,
} from "./naming";
import type { PhotobookSourceDay, PhotobookSourcePackage, PhotobookSourcePhoto, PhotobookSourceWarning } from "./types";

type MediaRow = {
  id: string;
  original_filename: string;
  mime_type: string | null;
  sort_order: number;
  upload_status: string;
  book_candidate: boolean;
  book_favorite: boolean;
  original_object_key: string;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

type EntryRow = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  body: string | null;
  actual_location: string | null;
  actual_latitude: number | null;
  actual_longitude: number | null;
  media_assets: MediaRow[] | null;
};

function rankCandidates(assets: MediaRow[]): MediaRow[] {
  return [...assets]
    .filter((asset) => asset.upload_status === "ready" && asset.book_candidate && asset.original_object_key)
    .sort((left, right) =>
      Number(right.book_favorite) - Number(left.book_favorite)
      || left.sort_order - right.sort_order);
}

function locationLabel(entry: EntryRow): string {
  return (entry.actual_location || entry.title || `Dag-${entry.day_number}`).trim();
}

function buildDayPhotos(assets: MediaRow[]): PhotobookSourcePhoto[] {
  return assets.map((asset, index) => {
    const sequence = index + 1;
    const role = sequence === 1 ? "hero" : "photo";
    const extension = extensionFromFilename(asset.original_filename, asset.mime_type);
    return {
      id: asset.id,
      sequence,
      role,
      filename: photoExportFilename(sequence, extension, role),
      originalFilename: asset.original_filename,
      originalObjectKey: asset.original_object_key,
      mimeType: asset.mime_type || "application/octet-stream",
      favorite: Boolean(asset.book_favorite),
      capturedAt: asset.captured_at,
      latitude: asset.latitude,
      longitude: asset.longitude,
    };
  });
}

export type CollectResult = {
  package: PhotobookSourcePackage;
  warnings: PhotobookSourceWarning[];
};

/**
 * Collect vendor-neutral photobook source data from final book_candidate flags.
 * Only days with at least one ready candidate become export folders.
 */
export async function collectPhotobookSource(
  supabase: SupabaseClient,
  tripId: string,
): Promise<CollectResult | null> {
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id,title,slug,starts_on,ends_on")
    .eq("id", tripId)
    .maybeSingle();
  if (tripError || !trip) return null;

  const { data: entries, error: entriesError } = await supabase
    .from("day_entries")
    .select(
      "id,day_number,day_date,title,body,actual_location,actual_latitude,actual_longitude,media_assets(id,original_filename,mime_type,sort_order,upload_status,book_candidate,book_favorite,original_object_key,captured_at,latitude,longitude)",
    )
    .eq("trip_id", tripId)
    .order("day_number");
  if (entriesError) throw new Error("Reisdagen konden niet worden geladen.");

  const warnings: PhotobookSourceWarning[] = [];
  const days: PhotobookSourceDay[] = [];
  let sequence = 0;

  for (const entry of (entries || []) as EntryRow[]) {
    const ranked = rankCandidates(entry.media_assets || []);
    const story = (entry.body || "").trim();
    const title = (entry.title || "").trim();

    if (!ranked.length) {
      if (story) {
        warnings.push({
          code: "story_without_photos",
          message: `Dag ${entry.day_number} heeft een verhaal maar geen fotoboek-kandidaten.`,
          dayId: entry.id,
          dayNumber: entry.day_number,
        });
      }
      continue;
    }

    if (!story) {
      warnings.push({
        code: "photos_without_story",
        message: `Dag ${entry.day_number} heeft geselecteerde foto’s maar geen verhaaltekst.`,
        dayId: entry.id,
        dayNumber: entry.day_number,
      });
    }

    sequence += 1;
    const locationName = (entry.actual_location || "").trim();
    const folderLabel = locationLabel(entry);
    days.push({
      id: entry.id,
      sequence,
      dayNumber: entry.day_number,
      date: entry.day_date,
      title: title || `Dag ${entry.day_number}`,
      locationName,
      latitude: entry.actual_latitude,
      longitude: entry.actual_longitude,
      story,
      folderName: dayFolderName({
        sequence,
        date: entry.day_date,
        locationOrTitle: folderLabel,
      }),
      photos: buildDayPhotos(ranked),
    });
  }

  if (!days.length) {
    warnings.push({
      code: "no_candidates",
      message: "Geen fotoboek-kandidaten gevonden. Markeer foto’s als fotoboek-kandidaat en probeer opnieuw.",
    });
  }

  return {
    package: {
      version: 1,
      generatedAt: new Date().toISOString(),
      zipBasename: tripZipBasename(trip.title, trip.starts_on),
      trip: {
        id: trip.id,
        title: trip.title,
        slug: trip.slug,
        startDate: trip.starts_on,
        endDate: trip.ends_on,
      },
      days,
    },
    warnings,
  };
}
