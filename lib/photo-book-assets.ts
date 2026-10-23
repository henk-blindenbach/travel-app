import { oneRelation, type ExportAsset } from "./photo-book";
import { createOriginalDownloadUrl } from "./scaleway";
import type { SupabaseClient } from "@supabase/supabase-js";

type MediaEmbed = {
  id: string;
  original_filename: string;
  caption: string;
  book_favorite: boolean;
  upload_status: string;
  original_object_key: string;
  day_entries: { day_number: number; title: string | null } | { day_number: number; title: string | null }[] | null;
};

export const PHOTO_BOOK_SELECT =
  "id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,export_payload,prodigi_quote,prodigi_order_id,prodigi_status,last_error,intro_text,studio_template_id,studio_project_id,studio_preview_url,studio_status,studio_payload,studio_preflight,preview_acknowledged_at,created_at,updated_at";

export async function loadPhotoBookAssets(
  supabase: SupabaseClient,
  bookId: string,
  includeSignedUrls: boolean,
): Promise<ExportAsset[]> {
  const { data: items } = await supabase
    .from("photo_book_items")
    .select("id,media_asset_id,sort_order,caption_override,media_assets(id,original_filename,caption,book_favorite,upload_status,original_object_key,day_entries(day_number,title))")
    .eq("photo_book_id", bookId)
    .order("sort_order");

  const assets: ExportAsset[] = [];
  for (const item of items || []) {
    const media = oneRelation(item.media_assets as unknown as MediaEmbed | MediaEmbed[] | null);
    if (!media || media.upload_status !== "ready") continue;
    const entry = oneRelation(media.day_entries);
    let downloadUrl: string | null = null;
    if (includeSignedUrls) {
      try {
        downloadUrl = await createOriginalDownloadUrl(media.original_object_key, 60 * 60);
      } catch {
        downloadUrl = null;
      }
    }
    assets.push({
      mediaAssetId: media.id,
      sortOrder: item.sort_order,
      filename: media.original_filename,
      caption: (item.caption_override || media.caption || "").trim(),
      dayNumber: entry?.day_number ?? null,
      dayTitle: entry?.title ?? null,
      favorite: Boolean(media.book_favorite),
      downloadUrl,
    });
  }
  return assets;
}

/** Nice-to-have route blurb from planned day pins — not a print map image. */
export async function loadRouteSummary(supabase: SupabaseClient, tripId: string): Promise<string | null> {
  const { data: days } = await supabase
    .from("trip_days")
    .select("day_number,title,planned_location,planned_latitude,planned_longitude")
    .eq("trip_id", tripId)
    .not("planned_latitude", "is", null)
    .not("planned_longitude", "is", null)
    .order("day_number");

  if (!days?.length) return null;
  const parts = days.map((day) => {
    const place = (day.planned_location || day.title || `Dag ${day.day_number}`).trim();
    return `Dag ${day.day_number}: ${place}`;
  });
  return parts.join(" · ");
}
