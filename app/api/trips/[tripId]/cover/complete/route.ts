import { NextResponse } from "next/server";
import sharp from "sharp";
import { validUuid } from "../../../../../../lib/journal";
import { fetchOriginal } from "../../../../../../lib/scaleway";
import { createClient } from "../../../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  let coverId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    const { tripId } = await params;
    const payload = await request.json();
    if (!validUuid(tripId) || !validUuid(payload.coverId)) return NextResponse.json({ error: "Ongeldige omslagfoto." }, { status: 400 });
    coverId = payload.coverId;
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: cover } = await supabase.from("trip_covers").select("id,original_object_key,web_object_path").eq("id", coverId).eq("trip_id", tripId).maybeSingle();
    if (!cover) return NextResponse.json({ error: "Geen toegang tot deze omslagfoto." }, { status: 404 });
    await supabase.from("trip_covers").update({ upload_status: "processing" }).eq("id", cover.id);
    const original = await fetchOriginal(cover.original_object_key);
    const webImage = await sharp(original, { limitInputPixels: 80_000_000 }).rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    const { error: uploadError } = await supabase.storage.from("trip-web-images").upload(cover.web_object_path, webImage, { contentType: "image/webp", upsert: true });
    if (uploadError) throw uploadError;
    const { data: completed, error } = await supabase.from("trip_covers").update({ upload_status: "ready" }).eq("id", cover.id).select("id,upload_status,updated_at").single();
    if (error || !completed) throw error || new Error("Geen omslagfoto.");
    return NextResponse.json({ cover: completed });
  } catch {
    if (supabase && coverId) await supabase.from("trip_covers").update({ upload_status: "failed" }).eq("id", coverId);
    return NextResponse.json({ error: "De webversie kon niet worden gemaakt. Probeer de omslagfoto opnieuw." }, { status: 500 });
  }
}
