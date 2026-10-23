import exifr from "exifr";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOriginal, OriginalFetchError } from "./scaleway";

export type MediaProcessAsset = {
  id: string;
  original_object_key: string;
  web_object_path: string;
};

export type MediaProcessResult =
  | {
      ok: true;
      asset: {
        id: string;
        original_filename: string;
        caption: string;
        upload_status: string;
        processing_error: string | null;
      };
    }
  | { ok: false; code: string; error: string; status: number };

function failureStatus(error: unknown) {
  if (error instanceof OriginalFetchError) {
    if (error.code === "missing" || error.code === "access_denied") return 422;
    if (error.code === "not_configured") return 503;
  }
  return 500;
}

function failureMessage(error: unknown) {
  if (error instanceof OriginalFetchError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "De webversie kon niet worden gemaakt. Probeer opnieuw te verwerken of upload de foto opnieuw.";
}

/** Fetch Scaleway original → WebP → trip-web-images → mark ready. Does not delete originals. */
export async function processMediaWebVersion(
  db: SupabaseClient,
  storage: SupabaseClient,
  asset: MediaProcessAsset,
): Promise<MediaProcessResult> {
  if (!asset.original_object_key || !asset.web_object_path) {
    const error = "Foto-metadata is onvolledig. Upload de foto opnieuw.";
    await db.from("media_assets").update({
      upload_status: "failed",
      processing_error: error,
      updated_at: new Date().toISOString(),
    }).eq("id", asset.id);
    return { ok: false, code: "incomplete_asset", error, status: 422 };
  }

  await db.from("media_assets").update({
    upload_status: "processing",
    processing_error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", asset.id);

  try {
    const original = await fetchOriginal(asset.original_object_key);
    const metadata = await exifr.parse(original, ["DateTimeOriginal", "CreateDate", "latitude", "longitude"])
      .catch(() => null);
    const webImage = await sharp(original, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const { error: uploadError } = await storage.storage.from("trip-web-images")
      .upload(asset.web_object_path, webImage, { contentType: "image/webp", upsert: true });
    if (uploadError) throw uploadError;

    const { data: verified, error: verifyError } = await storage.storage
      .from("trip-web-images")
      .download(asset.web_object_path);
    if (verifyError || !verified) {
      throw new Error("Webversie is geüpload maar kon niet worden teruggelezen. Probeer opnieuw te verwerken.");
    }

    const capturedAt = metadata?.DateTimeOriginal || metadata?.CreateDate;
    const latitude = typeof metadata?.latitude === "number" ? metadata.latitude : null;
    const longitude = typeof metadata?.longitude === "number" ? metadata.longitude : null;
    const { data: completeAsset, error } = await db.from("media_assets")
      .update({
        upload_status: "ready",
        processing_error: null,
        captured_at: capturedAt instanceof Date && !Number.isNaN(capturedAt.valueOf()) ? capturedAt.toISOString() : null,
        latitude,
        longitude,
        location_source: latitude !== null && longitude !== null ? "photo_exif" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", asset.id)
      .select("id,original_filename,caption,upload_status,processing_error")
      .single();
    if (error || !completeAsset) throw error || new Error("Status kon niet worden bijgewerkt.");
    return { ok: true, asset: completeAsset };
  } catch (error) {
    const message = failureMessage(error);
    const code = error instanceof OriginalFetchError ? error.code : "processing_failed";
    await db.from("media_assets").update({
      upload_status: "failed",
      processing_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", asset.id);
    console.error("media web process failed", { code, assetId: asset.id ? "set" : null });
    return { ok: false, code, error: message, status: failureStatus(error) };
  }
}
