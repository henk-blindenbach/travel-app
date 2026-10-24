import { NextResponse } from "next/server";
import { resolveGoogleMapsUrl } from "../../../../lib/google-maps-url";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const payload = await request.json().catch(() => ({}));
    const url = typeof payload.url === "string" ? payload.url.trim() : "";
    if (!url || url.length > 2_000) {
      return NextResponse.json({ error: "Plak een Google Maps-link." }, { status: 400 });
    }

    const parsed = await resolveGoogleMapsUrl(url);
    return NextResponse.json({
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      placeName: parsed.placeName || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deze Maps-link kon niet worden gelezen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
