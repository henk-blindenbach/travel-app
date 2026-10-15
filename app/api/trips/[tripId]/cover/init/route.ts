import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { acceptedImageTypes, maxImageBytes, originalExtension, safeText, validUuid } from "../../../../../../lib/journal";
import { createOriginalUploadUrl } from "../../../../../../lib/scaleway";
import { createClient } from "../../../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    const contentType = safeText(payload.contentType, 80).toLowerCase();
    const byteSize = Number(payload.byteSize);
    if (!acceptedImageTypes.has(contentType) || !Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > maxImageBytes) return NextResponse.json({ error: "Kies een HEIC, JPEG, PNG of WebP-bestand tot 50 MB." }, { status: 400 });
    const { data: trip } = await supabase.from("trips").select("id").eq("id", tripId).maybeSingle();
    if (!trip) return NextResponse.json({ error: "Reis niet gevonden." }, { status: 404 });
    const { data: existing } = await supabase.from("trip_covers").select("id").eq("trip_id", tripId).maybeSingle();
    const id = existing?.id || randomUUID();
    const extension = originalExtension(contentType);
    const originalObjectKey = `covers/${tripId}/${id}.${extension}`;
    const webObjectPath = `covers/${tripId}/${id}.webp`;
    const { data: cover, error } = await supabase.from("trip_covers").upsert({ id, trip_id: tripId, original_object_key: originalObjectKey, web_object_path: webObjectPath, original_filename: safeText(payload.filename, 255) || `omslag.${extension}`, mime_type: contentType, byte_size: byteSize, upload_status: "uploading" }, { onConflict: "trip_id" }).select("id,upload_status").single();
    if (error || !cover) return NextResponse.json({ error: "De omslagfoto kon niet worden voorbereid." }, { status: 400 });
    const uploadUrl = await createOriginalUploadUrl(originalObjectKey, contentType);
    return NextResponse.json({ cover, uploadUrl });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("opslag") ? error.message : "De omslagfoto kon niet worden voorbereid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
