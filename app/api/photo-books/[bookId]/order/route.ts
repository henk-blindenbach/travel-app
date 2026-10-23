import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { loadPhotoBookAssets, loadRouteSummary, loadTripCountries, PHOTO_BOOK_SELECT } from "../../../../../lib/photo-book-assets";
import {
  buildPhotoBookExport,
  parseRecipient,
  studioOrderBlockers,
  type PhotoBookRow,
} from "../../../../../lib/photo-book";
import { hasProdigiConfig, prodigiConfigStatus, type ProdigiShippingMethod } from "../../../../../lib/prodigi";
import {
  createStudioOrder,
  submitStudioOrder,
  studioOrderIdFromResponse,
} from "../../../../../lib/prodigi-studio";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

/**
 * Submit a real Prodigi order via Studio (print-ready).
 * Refuses without PRODIGI_API_KEY, Studio project, and preview acknowledgement.
 * Defaults to sandbox; live requires PRODIGI_ENV=live AND confirmLive=true.
 * Never marks status=submitted without a successful API response.
 */
export async function POST(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });

    if (!hasProdigiConfig()) {
      return NextResponse.json({
        error: "Prodigi is nog niet geconfigureerd.",
        setup: {
          required: ["PRODIGI_API_KEY", "PRODIGI_STUDIO_TEMPLATE_ID"],
          optional: ["PRODIGI_ENV=sandbox|live", "PRODIGI_DEFAULT_SKU"],
          docs: "/docs/PHOTOBOOK_PRODIGI.md",
          status: prodigiConfigStatus(),
        },
      }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const confirmLive = body.confirmLive === true;
    const config = prodigiConfigStatus();
    if (config.env === "live" && !confirmLive) {
      return NextResponse.json({
        error: "Live-bestelling vereist confirmLive=true. Zonder die bevestiging wordt er niets naar Prodigi gestuurd.",
        env: config.env,
      }, { status: 400 });
    }

    const { data: book, error } = await supabase
      .from("photo_books")
      .select(PHOTO_BOOK_SELECT)
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });
    if (book.status === "submitted" && book.prodigi_order_id) {
      return NextResponse.json({
        error: "Dit boek is al ingediend bij Prodigi.",
        prodigiOrderId: book.prodigi_order_id,
      }, { status: 409 });
    }

    const orderGates = studioOrderBlockers(book as PhotoBookRow);
    if (orderGates.length) {
      return NextResponse.json({
        error: "Boek is nog niet klaar om te bestellen.",
        blockers: orderGates,
      }, { status: 400 });
    }

    const assets = await loadPhotoBookAssets(supabase, bookId, true);
    const routeSummary = await loadRouteSummary(supabase, book.trip_id);
    const countries = await loadTripCountries(supabase, book.trip_id);
    const exportPayload = buildPhotoBookExport({
      book: book as PhotoBookRow,
      assets,
      routeSummary,
      countries,
    });

    const recipient = parseRecipient(book.recipient);
    if (!recipient || !exportPayload.readyForOrder) {
      await supabase.from("photo_books").update({
        status: "failed",
        export_payload: exportPayload,
        last_error: exportPayload.blockers.join(" "),
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);
      return NextResponse.json({
        error: "Boek is nog niet klaar om te bestellen.",
        blockers: exportPayload.blockers,
        export: exportPayload,
      }, { status: 400 });
    }

    const studioProjectId = book.studio_project_id!;

    try {
      const orderIntent = await createStudioOrder(studioProjectId, {
        shippingMethod: book.shipping_method as ProdigiShippingMethod,
        copies: book.copies,
        recipient,
        merchantReference: `photo-book-${book.id}`,
        metadata: {
          tripId: book.trip_id,
          photoBookId: book.id,
          title: book.title,
          env: config.env,
          confirmLive: config.env === "live" ? confirmLive : false,
          source: "opreis-photo-book-studio-b1",
        },
      });

      const orderId = studioOrderIdFromResponse(orderIntent);
      if (!orderId) {
        throw new Error("Prodigi Studio gaf geen order-id terug na /orders.");
      }

      const submitted = await submitStudioOrder(orderId);
      const submittedId = studioOrderIdFromResponse(submitted) || orderId;
      const stage =
        (typeof submitted.status === "string" && submitted.status)
        || (submitted.order && typeof submitted.order === "object" && typeof (submitted.order as { status?: unknown }).status === "string"
          ? String((submitted.order as { status: string }).status)
          : null)
        || "submitted";

      const { data: updated } = await supabase
        .from("photo_books")
        .update({
          status: "submitted",
          export_payload: exportPayload,
          prodigi_order_id: submittedId,
          prodigi_status: String(stage),
          studio_status: "ordered",
          studio_payload: {
            ...(typeof book.studio_payload === "object" && book.studio_payload ? book.studio_payload as object : {}),
            orderIntent,
            submitted,
          },
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId)
        .select("id,status,prodigi_order_id,prodigi_status,studio_project_id,studio_preview_url,preview_acknowledged_at,updated_at")
        .single();

      return NextResponse.json({
        book: updated,
        prodigi: { orderIntent, submitted },
        env: config.env,
        message: config.env === "sandbox"
          ? "Sandbox-order aangemaakt via Prodigi Studio (geen echte productie/verzending)."
          : "Live-order aangemaakt via Prodigi Studio.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prodigi Studio-order mislukt.";
      const errBody = err && typeof err === "object" && "body" in err ? (err as { body: unknown }).body : null;
      await supabase.from("photo_books").update({
        status: "failed",
        export_payload: exportPayload,
        last_error: message,
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);
      return NextResponse.json({
        error: message,
        details: errBody,
        export: exportPayload,
        hint: "Controleer Studio-template, preflight, afleveradres en of de API-key bij sandbox/live hoort.",
      }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Bestelling mislukt." }, { status: 500 });
  }
}
