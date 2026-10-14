import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { validUuid } from "../../../../../lib/journal";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return NextResponse.json({ error: "Ongeldige foto." }, { status: 400 });

    // RLS permits this lookup only when both the photo and its parent day were explicitly published.
    const supabase = await createClient();
    const { data: asset } = await supabase
      .from("media_assets")
      .select("web_object_path,original_filename")
      .eq("id", assetId)
      .eq("upload_status", "ready")
      .single();
    if (!asset) return NextResponse.json({ error: "Foto niet gevonden." }, { status: 404 });

    const { data, error } = await supabase.storage.from("trip-web-images").download(asset.web_object_path);
    if (error || !data) return NextResponse.json({ error: "Foto kon niet worden geladen." }, { status: 404 });
    return new NextResponse(data.stream(), {
      headers: {
        "Content-Type": data.type || "image/webp",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.original_filename)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Foto kon niet worden geladen." }, { status: 500 });
  }
}
