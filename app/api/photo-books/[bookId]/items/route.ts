import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { oneRelation } from "../../../../../lib/photo-book";
import { createClient } from "../../../../../lib/supabase/server";

export async function PUT(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: book } = await supabase.from("photo_books").select("id,trip_id,status").eq("id", bookId).maybeSingle();
    if (!book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });
    if (book.status === "submitted") {
      return NextResponse.json({ error: "Ingediende boeken kunnen niet meer worden gewijzigd." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const mediaAssetIds: string[] | null = Array.isArray(body.mediaAssetIds)
      ? body.mediaAssetIds.filter((id: unknown): id is string => validUuid(id))
      : null;
    if (!mediaAssetIds) return NextResponse.json({ error: "mediaAssetIds ontbreekt." }, { status: 400 });
    if (mediaAssetIds.length > 300) {
      return NextResponse.json({ error: "Maximaal 300 foto’s per boek in deze slice." }, { status: 400 });
    }

    if (mediaAssetIds.length) {
      const { data: assets, error: assetError } = await supabase
        .from("media_assets")
        .select("id,upload_status,day_entries!inner(trip_id)")
        .in("id", mediaAssetIds);
      if (assetError) return NextResponse.json({ error: "Foto’s konden niet worden gecontroleerd." }, { status: 400 });

      const byId = new Map((assets || []).map((asset) => [asset.id, asset]));
      for (const id of mediaAssetIds) {
        const asset = byId.get(id) as { id: string; upload_status: string; day_entries: { trip_id: string } | { trip_id: string }[] } | undefined;
        if (!asset || asset.upload_status !== "ready") {
          return NextResponse.json({ error: "Een of meer foto’s zijn niet beschikbaar." }, { status: 400 });
        }
        const entry = oneRelation(asset.day_entries);
        if (!entry || entry.trip_id !== book.trip_id) {
          return NextResponse.json({ error: "Foto hoort niet bij deze reis." }, { status: 400 });
        }
      }
    }

    const { error: deleteError } = await supabase.from("photo_book_items").delete().eq("photo_book_id", bookId);
    if (deleteError) return NextResponse.json({ error: "Selectie kon niet worden bijgewerkt." }, { status: 400 });

    if (mediaAssetIds.length) {
      const { error: insertError } = await supabase.from("photo_book_items").insert(
        mediaAssetIds.map((mediaAssetId, index) => ({
          photo_book_id: bookId,
          media_asset_id: mediaAssetId,
          sort_order: index,
        })),
      );
      if (insertError) return NextResponse.json({ error: "Selectie kon niet worden opgeslagen." }, { status: 400 });
    }

    await supabase
      .from("photo_books")
      .update({ status: "draft", updated_at: new Date().toISOString(), last_error: null })
      .eq("id", bookId);

    const { data: items } = await supabase
      .from("photo_book_items")
      .select("id,media_asset_id,sort_order,caption_override,media_assets(id,original_filename,caption,book_favorite,book_candidate,upload_status,day_entries(day_number,title,trip_id))")
      .eq("photo_book_id", bookId)
      .order("sort_order");

    return NextResponse.json({ items: items || [] });
  } catch {
    return NextResponse.json({ error: "Selectie kon niet worden opgeslagen." }, { status: 500 });
  }
}
