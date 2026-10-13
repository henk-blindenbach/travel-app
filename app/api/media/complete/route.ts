import { NextResponse } from "next/server";
import exifr from "exifr";
import sharp from "sharp";
import { validUuid } from "../../../../lib/journal";
import { fetchOriginal } from "../../../../lib/scaleway";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

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
      .select("id,original_object_key,web_object_path")
      .eq("id", assetId)
      .single();
    if (!asset) return NextResponse.json({ error: "Geen toegang tot deze foto." }, { status: 404 });

    await supabase.from("media_assets").update({ upload_status: "processing" }).eq("id", asset.id);
    const original = await fetchOriginal(asset.original_object_key);
    const metadata = await exifr.parse(original, ["DateTimeOriginal", "CreateDate", "latitude", "longitude"])
      .catch(() => null);
    const webImage = await sharp(original, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    const { error: uploadError } = await supabase.storage.from("trip-web-images")
      .upload(asset.web_object_path, webImage, { contentType: "image/webp", upsert: true });
    if (uploadError) throw uploadError;

    const capturedAt = metadata?.DateTimeOriginal || metadata?.CreateDate;
    const latitude = typeof metadata?.latitude === "number" ? metadata.latitude : null;
    const longitude = typeof metadata?.longitude === "number" ? metadata.longitude : null;
    const { data: completeAsset, error } = await supabase.from("media_assets")
      .update({
        upload_status: "ready",
        captured_at: capturedAt instanceof Date && !Number.isNaN(capturedAt.valueOf()) ? capturedAt.toISOString() : null,
        latitude,
        longitude,
        location_source: latitude !== null && longitude !== null ? "photo_exif" : null,
      })
      .eq("id", asset.id)
      .select("id,original_filename,caption,upload_status")
      .single();
    if (error) throw error;
    return NextResponse.json({ asset: completeAsset });
  } catch {
    if (supabase && assetId) await supabase.from("media_assets").update({ upload_status: "failed" }).eq("id", assetId);
    return NextResponse.json({ error: "De webversie kon niet worden gemaakt. Probeer deze foto opnieuw." }, { status: 500 });
  }
}
