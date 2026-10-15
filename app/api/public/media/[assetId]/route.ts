import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validUuid } from "../../../../../lib/journal";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    if (!validUuid(assetId)) return new NextResponse(null, { status: 404 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: asset } = await supabase.from("media_assets").select("web_object_path,updated_at").eq("id", assetId).maybeSingle();
    if (!asset) return new NextResponse(null, { status: 404 });
    const { data, error } = await supabase.storage.from("trip-web-images").download(asset.web_object_path);
    if (error || !data) return new NextResponse(null, { status: 404 });
    return new NextResponse(data.stream(), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
