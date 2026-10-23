import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { validUuid } from "../../../../../lib/journal";

export async function POST(_: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: existing } = await supabase
      .from("day_entries")
      .select("id,trip_id,day_number,body")
      .eq("id", entryId)
      .maybeSingle();
    if (!existing || !existing.body?.trim()) {
      return NextResponse.json({ error: "Vul eerst het verslag in voordat je publiceert." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("day_entries")
      .update({ publication_status: "published", published_at: new Date().toISOString() })
      .eq("id", entryId)
      .neq("body", "")
      .select("id,publication_status,published_at,trip_id,day_number")
      .single();
    if (error || !data) return NextResponse.json({ error: "Vul eerst het verslag in voordat je publiceert." }, { status: 400 });

    // Private trips are not reachable on /reizen/[slug]/… — promote to unlisted so
    // “Bekijk publieke dag” works immediately without a separate visibility step.
    let tripVisibility: "private" | "unlisted" | "public" = "private";
    let tripSlug: string | null = null;
    const { data: trip } = await supabase
      .from("trips")
      .select("id,slug,visibility")
      .eq("id", data.trip_id)
      .maybeSingle();
    if (trip) {
      tripSlug = trip.slug;
      tripVisibility = (trip.visibility as typeof tripVisibility) || "private";
      if (trip.visibility === "private") {
        const { data: updated } = await supabase
          .from("trips")
          .update({ visibility: "unlisted" })
          .eq("id", trip.id)
          .select("visibility,slug")
          .single();
        if (updated) {
          tripVisibility = "unlisted";
          tripSlug = updated.slug;
        }
      }
    }

    return NextResponse.json({
      entry: data,
      trip: { slug: tripSlug, visibility: tripVisibility },
    });
  } catch {
    return NextResponse.json({ error: "Publiceren lukte niet." }, { status: 500 });
  }
}
