import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { loadPhotoBookAssets, loadRouteSummary, loadTripCountries, PHOTO_BOOK_SELECT } from "../../../../../lib/photo-book-assets";
import { buildPhotoBookExport, type PhotoBookRow } from "../../../../../lib/photo-book";
import { createProdigiQuote, hasProdigiConfig } from "../../../../../lib/prodigi";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

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
      .select(PHOTO_BOOK_SELECT)
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });

    const assets = await loadPhotoBookAssets(supabase, bookId, includeSignedUrls);
    const routeSummary = await loadRouteSummary(supabase, book.trip_id);
    const countries = await loadTripCountries(supabase, book.trip_id);
    const exportPayload = buildPhotoBookExport({
      book: book as PhotoBookRow,
      assets,
      routeSummary,
      countries,
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

    const nextStatus = book.status === "submitted" ? "submitted" : (assets.length ? "ready_for_prodigi" : "draft");
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
      .select("id,status,export_payload,prodigi_quote,last_error,studio_project_id,studio_preview_url,preview_acknowledged_at,updated_at")
      .single();
    if (updateError || !updated) {
      return NextResponse.json({ error: "Export kon niet worden opgeslagen." }, { status: 400 });
    }

    return NextResponse.json({
      book: updated,
      export: exportPayload,
      quote,
      message: exportPayload.readyForOrder
        ? "Export klaar voor Prodigi Studio-order (sandbox/live afhankelijk van PRODIGI_ENV)."
        : `Export opgeslagen. Nog open: ${exportPayload.blockers.join(" ")}`,
    });
  } catch {
    return NextResponse.json({ error: "Export mislukt." }, { status: 500 });
  }
}
