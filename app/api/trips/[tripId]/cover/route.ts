import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { deleteOriginal } from "../../../../../lib/scaleway";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

async function coverForSignedInUser(tripId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, cover: null, unauthenticated: true };
  const { data: cover } = await supabase.from("trip_covers").select("id,original_object_key,web_object_path,upload_status,updated_at").eq("trip_id", tripId).maybeSingle();
  return { supabase, cover, unauthenticated: false };
}

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return new NextResponse(null, { status: 404 });
    const { supabase, cover, unauthenticated } = await coverForSignedInUser(tripId);
    if (unauthenticated) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    if (!cover || cover.upload_status !== "ready") return new NextResponse(null, { status: 404 });
    const { data, error } = await supabase.storage.from("trip-web-images").download(cover.web_object_path);
    if (error || !data) return new NextResponse(null, { status: 404 });
    return new NextResponse(data.stream(), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=60" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });
    const { supabase, cover, unauthenticated } = await coverForSignedInUser(tripId);
    if (unauthenticated) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    if (!cover) return NextResponse.json({ error: "Er is geen omslagfoto." }, { status: 404 });
    await Promise.all([supabase.storage.from("trip-web-images").remove([cover.web_object_path]), deleteOriginal(cover.original_object_key)]);
    const { error } = await supabase.from("trip_covers").delete().eq("id", cover.id);
    if (error) throw error;
    return NextResponse.json({ removed: true });
  } catch { return NextResponse.json({ error: "De omslagfoto kon niet worden verwijderd." }, { status: 500 }); }
}
