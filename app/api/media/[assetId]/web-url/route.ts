import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: asset } = await supabase.from("media_assets").select("web_object_path,upload_status").eq("id", assetId).single();
    if (!asset || asset.upload_status !== "ready") return NextResponse.json({ error: "Foto nog niet beschikbaar." }, { status: 404 });
    const { data, error } = await supabase.storage.from("trip-web-images").createSignedUrl(asset.web_object_path, 60 * 60);
    if (error || !data) return NextResponse.json({ error: "De foto kon niet worden geopend." }, { status: 500 });
    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch {
    return NextResponse.json({ error: "De foto kon niet worden geopend." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json();
    const caption = safeText(payload.caption, 500);
    const { data: asset, error } = await supabase
      .from("media_assets")
      .update({ caption })
      .eq("id", assetId)
      .select("id,caption")
      .single();
    if (error || !asset) return NextResponse.json({ error: "Het bijschrift kon niet worden opgeslagen." }, { status: 404 });
    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: "Het bijschrift kon niet worden opgeslagen." }, { status: 500 });
  }
}
