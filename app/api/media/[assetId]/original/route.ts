import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { fetchOriginal } from "../../../../../lib/scaleway";
import { validUuid } from "../../../../../lib/journal";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: asset, error } = await supabase.from("media_assets").select("original_object_key,original_filename,mime_type").eq("id", assetId).single();
    if (error || !asset) return NextResponse.json({ error: "Foto niet gevonden." }, { status: 404 });
    const body = await fetchOriginal(asset.original_object_key);
    return new NextResponse(body, { headers: { "Content-Type": asset.mime_type, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.original_filename)}`, "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Foto kon niet worden opgehaald." }, { status: 500 }); }
}
