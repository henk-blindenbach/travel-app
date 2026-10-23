import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../../lib/journal";
import { defaultSku } from "../../../../../lib/photo-book";
import { createClient } from "../../../../../lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data, error } = await supabase
      .from("photo_books")
      .select("id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,prodigi_order_id,prodigi_status,last_error,studio_project_id,studio_preview_url,studio_status,preview_acknowledged_at,created_at,updated_at")
      .eq("trip_id", tripId)
      .order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Fotoboeken konden niet worden geladen." }, { status: 400 });
    return NextResponse.json({ books: data || [] });
  } catch {
    return NextResponse.json({ error: "Fotoboeken konden niet worden geladen." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    if (!validUuid(tripId)) return NextResponse.json({ error: "Ongeldige reis." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: trip } = await supabase.from("trips").select("id,title").eq("id", tripId).maybeSingle();
    if (!trip) return NextResponse.json({ error: "Reis niet gevonden." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const title = safeText(body.title, 120) || trip.title;
    const subtitle = safeText(body.subtitle, 200) || null;
    const seedFromCandidates = body.seedFromCandidates !== false;

    const { data: book, error } = await supabase
      .from("photo_books")
      .insert({
        trip_id: tripId,
        title,
        subtitle,
        sku: defaultSku(),
        created_by: user.id,
      })
      .select("id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,created_at,updated_at")
      .single();
    if (error || !book) return NextResponse.json({ error: "Fotoboek kon niet worden aangemaakt." }, { status: 400 });

    if (seedFromCandidates) {
      const { data: entries } = await supabase
        .from("day_entries")
        .select("day_number,media_assets(id,book_candidate,book_favorite,sort_order,upload_status)")
        .eq("trip_id", tripId)
        .order("day_number");
      type Asset = { id: string; book_candidate: boolean; book_favorite: boolean; sort_order: number; upload_status: string };
      const candidates = ((entries || []) as { day_number: number; media_assets: Asset[] | null }[])
        .flatMap((entry) => (entry.media_assets || [])
          .filter((asset) => asset.upload_status === "ready" && asset.book_candidate)
          .map((asset) => ({
            ...asset,
            day_number: entry.day_number,
          })))
        .sort((left, right) =>
          Number(right.book_favorite) - Number(left.book_favorite)
          || left.day_number - right.day_number
          || left.sort_order - right.sort_order);

      if (candidates.length) {
        await supabase.from("photo_book_items").insert(
          candidates.map((asset, index) => ({
            photo_book_id: book.id,
            media_asset_id: asset.id,
            sort_order: index,
          })),
        );
      }
    }

    return NextResponse.json({ book }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fotoboek kon niet worden aangemaakt." }, { status: 500 });
  }
}
