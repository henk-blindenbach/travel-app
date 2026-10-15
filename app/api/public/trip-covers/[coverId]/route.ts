import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validUuid } from "../../../../../lib/journal";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ coverId: string }> }) {
  try {
    const { coverId } = await params;
    if (!validUuid(coverId)) return new NextResponse(null, { status: 404 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: cover } = await supabase.from("public_trip_covers").select("web_object_path").eq("id", coverId).maybeSingle();
    if (!cover) return new NextResponse(null, { status: 404 });
    const { data, error } = await supabase.storage.from("trip-web-images").download(cover.web_object_path);
    if (error || !data) return new NextResponse(null, { status: 404 });
    return new NextResponse(data.stream(), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
