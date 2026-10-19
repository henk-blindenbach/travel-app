import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { buildPhotoBookExport, oneRelation, type ExportAsset, type PhotoBookRow } from "../../../../../lib/photo-book";
import { createProdigiOrder, hasProdigiConfig, prodigiConfigStatus } from "../../../../../lib/prodigi";
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

/**
 * Submit a real Prodigi order. Refuses without PRODIGI_API_KEY.
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
          required: ["PRODIGI_API_KEY"],
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
      .select("id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,export_payload,prodigi_quote,prodigi_order_id,prodigi_status,last_error,created_at,updated_at")
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });
    if (book.status === "submitted" && book.prodigi_order_id) {
      return NextResponse.json({
        error: "Dit boek is al ingediend bij Prodigi.",
        prodigiOrderId: book.prodigi_order_id,
      }, { status: 409 });
    }

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
      try {
        downloadUrl = await createOriginalDownloadUrl(media.original_object_key, 60 * 60);
      } catch {
        downloadUrl = null;
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

    const exportPayload = buildPhotoBookExport({ book: book as PhotoBookRow, assets });
    if (!exportPayload.prodigi.orderDraft || !exportPayload.readyForOrder) {
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

    try {
      const orderResponse = await createProdigiOrder(exportPayload.prodigi.orderDraft) as {
        order?: { id?: string; status?: { stage?: string } };
        outcome?: string;
      };
      const orderId = orderResponse?.order?.id || null;
      const stage = orderResponse?.order?.status?.stage || orderResponse?.outcome || "submitted";
      if (!orderId) {
        throw new Error("Prodigi gaf geen order-id terug.");
      }

      const { data: updated } = await supabase
        .from("photo_books")
        .update({
          status: "submitted",
          export_payload: exportPayload,
          prodigi_order_id: orderId,
          prodigi_status: String(stage),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId)
        .select("id,status,prodigi_order_id,prodigi_status,updated_at")
        .single();

      return NextResponse.json({
        book: updated,
        prodigi: orderResponse,
        env: config.env,
        message: config.env === "sandbox"
          ? "Sandbox-order aangemaakt bij Prodigi (geen echte productie/verzending)."
          : "Live-order aangemaakt bij Prodigi.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prodigi-order mislukt.";
      await supabase.from("photo_books").update({
        status: "failed",
        export_payload: exportPayload,
        last_error: message,
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);
      return NextResponse.json({ error: message, export: exportPayload }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Bestelling mislukt." }, { status: 500 });
  }
}
