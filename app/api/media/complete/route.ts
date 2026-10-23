import { NextResponse } from "next/server";
import exifr from "exifr";
import sharp from "sharp";
import { validUuid } from "../../../../lib/journal";
import { fetchOriginal, OriginalFetchError } from "../../../../lib/scaleway";
import { createServiceClient, hasServiceRoleEnv } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
/** Allow Sharp + Scaleway round-trip on large phone photos / HEIC. */
export const maxDuration = 60;

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

export async function POST(request: Request) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let assetId: string | null = null;
  try {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });
    assetId = payload.assetId;

    const { data: asset } = await supabase.from("media_assets")
      .select("id,original_object_key,web_object_path,upload_status")
      .eq("id", assetId)
      .single();
    if (!asset) return NextResponse.json({ error: "Geen toegang tot deze foto." }, { status: 404 });
    if (!asset.original_object_key || !asset.web_object_path) {
      await supabase.from("media_assets").update({
        upload_status: "failed",
        processing_error: "Foto-metadata is onvolledig. Upload de foto opnieuw.",
        updated_at: new Date().toISOString(),
      }).eq("id", asset.id);
      return NextResponse.json(
        { error: "Foto-metadata is onvolledig. Upload de foto opnieuw.", code: "incomplete_asset" },
        { status: 422 },
      );
    }

    // Idempotent: safe to re-run for ready/failed rows when the web object is missing.
    await supabase.from("media_assets").update({
      upload_status: "processing",
      processing_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", asset.id);

    const original = await fetchOriginal(asset.original_object_key);
    const metadata = await exifr.parse(original, ["DateTimeOriginal", "CreateDate", "latitude", "longitude"])
      .catch(() => null);
    const webImage = await sharp(original, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Service role bypasses storage RLS edge-cases on upsert of missing web objects.
    const storage = hasServiceRoleEnv() ? createServiceClient() : supabase;
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
    const { data: completeAsset, error } = await supabase.from("media_assets")
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
    if (error) throw error;
    return NextResponse.json({ asset: completeAsset });
  } catch (error) {
    const message = failureMessage(error);
    const code = error instanceof OriginalFetchError ? error.code : "processing_failed";
    if (supabase && assetId) {
      await supabase.from("media_assets").update({
        upload_status: "failed",
        processing_error: message,
        updated_at: new Date().toISOString(),
      }).eq("id", assetId);
    }
    console.error("media complete failed", { code, assetId: assetId ? "set" : null });
    return NextResponse.json({ error: message, code }, { status: failureStatus(error) });
  }
}
