import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { buildPhotoBookExport, oneRelation, type ExportAsset, type PhotoBookRow } from "../../../../../lib/photo-book";
import { createProdigiQuote, hasProdigiConfig } from "../../../../../lib/prodigi";
import { createOriginalDownloadUrl } from "../../../../../lib/scaleway";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

type MediaEmbed = {
  id: string;
  original_filename: string;
  caption: string;
  book_favorite: boolean;
  upload_status: string;
  original_object_key: string;
  day_entries: { day_number: number; title: string | null } | { day_number: number; title: string | null }[] | null;
};

export async function POST(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const includeSignedUrls = body.includeSignedUrls !== false;
    const requestQuote = body.requestQuote === true;

    const { data: book, error } = await supabase
      .from("photo_books")
      .select("id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,export_payload,prodigi_quote,prodigi_order_id,prodigi_status,last_error,created_at,updated_at")
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });

    const { data: items } = await supabase
      .from("photo_book_items")
      .select("id,media_asset_id,sort_order,caption_override,media_assets(id,original_filename,caption,book_favorite,upload_status,original_object_key,day_entries(day_number,title))")
      .eq("photo_book_id", bookId)
      .order("sort_order");

    const assets: ExportAsset[] = [];
    for (const item of items || []) {
      const media = oneRelation(item.media_assets as unknown as MediaEmbed | MediaEmbed[] | null);
      if (!media || media.upload_status !== "ready") continue;
      const entry = oneRelation(media.day_entries);
      let downloadUrl: string | null = null;
      if (includeSignedUrls) {
        try {
          downloadUrl = await createOriginalDownloadUrl(media.original_object_key, 60 * 60);
        } catch {
          downloadUrl = null;
        }
      }
      assets.push({
        mediaAssetId: media.id,
        sortOrder: item.sort_order,
        filename: media.original_filename,
        caption: (item.caption_override || media.caption || "").trim(),
        dayNumber: entry?.day_number ?? null,
        dayTitle: entry?.title ?? null,
        favorite: Boolean(media.book_favorite),
        downloadUrl,
      });
    }

    const exportPayload = buildPhotoBookExport({
      book: book as PhotoBookRow,
      assets,
    });

    let quote: unknown = null;
    let lastError: string | null = null;
    if (requestQuote) {
      if (!hasProdigiConfig()) {
        lastError = "Geen PRODIGI_API_KEY — quote overgeslagen. Export is wel opgeslagen.";
      } else {
        try {
          quote = await createProdigiQuote(exportPayload.prodigi.quoteRequest);
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Prodigi quote mislukt.";
        }
      }
    }

    const nextStatus = assets.length ? "ready_for_prodigi" : "draft";
    const { data: updated, error: updateError } = await supabase
      .from("photo_books")
      .update({
        status: nextStatus,
        export_payload: exportPayload,
        prodigi_quote: quote,
        last_error: lastError,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)
      .select("id,status,export_payload,prodigi_quote,last_error,updated_at")
      .single();
    if (updateError || !updated) {
      return NextResponse.json({ error: "Export kon niet worden opgeslagen." }, { status: 400 });
    }

    return NextResponse.json({
      book: updated,
      export: exportPayload,
      quote,
      message: exportPayload.readyForOrder
        ? "Export klaar voor Prodigi-order (sandbox/live afhankelijk van PRODIGI_ENV)."
        : `Export opgeslagen. Nog open: ${exportPayload.blockers.join(" ")}`,
    });
  } catch {
    return NextResponse.json({ error: "Export mislukt." }, { status: 500 });
  }
}
