import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { acceptedImageTypes, maxImageBytes, originalExtension, safeText, validUuid } from "../../../../lib/journal";
import { createOriginalUploadUrl } from "../../../../lib/scaleway";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json();
    const contentType = safeText(payload.contentType, 80).toLowerCase();
    const byteSize = Number(payload.byteSize);
    if (!validUuid(payload.dayEntryId) || !acceptedImageTypes.has(contentType) || !Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > maxImageBytes) {
      return NextResponse.json({ error: "Kies een HEIC, JPEG, PNG of WebP-bestand tot 50 MB." }, { status: 400 });
    }

    const { data: entry } = await supabase
      .from("day_entries")
      .select("id,trip_day_id,trip_days!inner(trip_id)")
      .eq("id", payload.dayEntryId)
      .single();
    const tripDay = entry?.trip_days as unknown as { trip_id: string } | null;
    if (!entry || !tripDay?.trip_id) return NextResponse.json({ error: "Geen toegang tot dit verslag." }, { status: 404 });

    const id = randomUUID();
    const extension = originalExtension(contentType);
    const originalObjectKey = `originals/${tripDay.trip_id}/${entry.id}/${id}.${extension}`;
    const webObjectPath = `web/${tripDay.trip_id}/${entry.id}/${id}.webp`;
    const { data: lastAsset } = await supabase.from("media_assets").select("sort_order").eq("day_entry_id", entry.id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data: asset, error } = await supabase.from("media_assets").insert({
      id,
      day_entry_id: entry.id,
      original_object_key: originalObjectKey,
      web_object_path: webObjectPath,
      original_filename: safeText(payload.filename, 255) || `foto.${extension}`,
      mime_type: contentType,
      byte_size: byteSize,
      sort_order: (lastAsset?.sort_order ?? -1) + 1,
      upload_status: "uploading",
    }).select("id,upload_status").single();
    if (error || !asset) return NextResponse.json({ error: "De foto kon niet worden voorbereid." }, { status: 400 });

    const uploadUrl = await createOriginalUploadUrl(originalObjectKey, contentType);
    return NextResponse.json({ asset, uploadUrl });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("opslag") ? error.message : "De foto kon niet worden voorbereid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
