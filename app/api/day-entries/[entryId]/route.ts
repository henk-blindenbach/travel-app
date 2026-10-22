import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { isTripMember } from "../../../../lib/membership";
import { deleteOriginal } from "../../../../lib/scaleway";
import { createServiceClient, hasServiceRoleEnv } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: entry } = await supabase
      .from("day_entries")
      .select("id,trip_id,trip_day_id,media_assets(id,original_object_key,web_object_path)")
      .eq("id", entryId)
      .maybeSingle();
    if (!entry) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });
    if (!(await isTripMember(supabase, entry.trip_id, user.id))) {
      return NextResponse.json({ error: "Alleen reisgenoten mogen dit verslag verwijderen." }, { status: 403 });
    }

    const assets = Array.isArray(entry.media_assets) ? entry.media_assets : [];
    const webPaths = assets.map((asset) => asset.web_object_path).filter(Boolean) as string[];
    if (webPaths.length) {
      const storage = hasServiceRoleEnv() ? createServiceClient() : supabase;
      const { error: storageError } = await storage.storage.from("trip-web-images").remove(webPaths);
      if (storageError) console.error("Day entry web image delete failed", { entryId });
    }
    await Promise.all(assets.map(async (asset) => {
      if (!asset.original_object_key) return;
      try { await deleteOriginal(asset.original_object_key); }
      catch { console.error("Day entry original delete failed", { entryId, assetId: asset.id }); }
    }));

    const { error } = await supabase.from("day_entries").delete().eq("id", entryId);
    if (error) return NextResponse.json({ error: "Het verslag kon niet worden verwijderd." }, { status: 400 });
    return NextResponse.json({ ok: true, tripDayId: entry.trip_day_id });
  } catch {
    return NextResponse.json({ error: "Het verslag kon niet worden verwijderd." }, { status: 500 });
  }
}
