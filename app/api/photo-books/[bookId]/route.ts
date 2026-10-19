import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../lib/journal";
import type { PhotoBookStatus } from "../../../../lib/photo-book";
import { PHOTO_BOOK_STATUSES } from "../../../../lib/photo-book";
import type { ProdigiShippingMethod } from "../../../../lib/prodigi";
import { createClient } from "../../../../lib/supabase/server";

const shippingMethods = new Set<ProdigiShippingMethod>(["Budget", "Standard", "StandardPlus", "Express", "Overnight"]);

export async function GET(_: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: book, error } = await supabase
      .from("photo_books")
      .select("id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,export_payload,prodigi_quote,prodigi_order_id,prodigi_status,last_error,created_at,updated_at")
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });

    const { data: items } = await supabase
      .from("photo_book_items")
      .select("id,media_asset_id,sort_order,caption_override,media_assets(id,original_filename,caption,book_favorite,book_candidate,upload_status,day_entries(day_number,title,trip_id))")
      .eq("photo_book_id", bookId)
      .order("sort_order");

    return NextResponse.json({ book, items: items || [] });
  } catch {
    return NextResponse.json({ error: "Fotoboek kon niet worden geladen." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.title === "string") {
      const title = safeText(body.title, 120);
      if (!title) return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
      updates.title = title;
    }
    if (typeof body.subtitle === "string") updates.subtitle = safeText(body.subtitle, 200) || null;
    if (typeof body.sku === "string") updates.sku = safeText(body.sku, 80) || undefined;
    if (typeof body.copies === "number" && Number.isInteger(body.copies) && body.copies >= 1 && body.copies <= 20) {
      updates.copies = body.copies;
    }
    if (typeof body.destinationCountryCode === "string") {
      const code = body.destinationCountryCode.trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) return NextResponse.json({ error: "Ongeldige landcode." }, { status: 400 });
      updates.destination_country_code = code;
    }
    if (typeof body.shippingMethod === "string" && shippingMethods.has(body.shippingMethod as ProdigiShippingMethod)) {
      updates.shipping_method = body.shippingMethod;
    }
    if (body.recipient && typeof body.recipient === "object") {
      updates.recipient = body.recipient;
    }
    if (typeof body.status === "string" && PHOTO_BOOK_STATUSES.includes(body.status as PhotoBookStatus)) {
      // Manual status only for draft / ready; submitted/failed set by order route.
      if (body.status === "draft" || body.status === "ready_for_prodigi") updates.status = body.status;
    }

    const { data, error } = await supabase
      .from("photo_books")
      .update(updates)
      .eq("id", bookId)
      .select("id,trip_id,title,subtitle,status,sku,copies,destination_country_code,shipping_method,recipient,prodigi_order_id,prodigi_status,last_error,updated_at")
      .single();
    if (error || !data) return NextResponse.json({ error: "Fotoboek kon niet worden opgeslagen." }, { status: 400 });
    return NextResponse.json({ book: data });
  } catch {
    return NextResponse.json({ error: "Fotoboek kon niet worden opgeslagen." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: book } = await supabase.from("photo_books").select("status").eq("id", bookId).maybeSingle();
    if (!book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });
    if (book.status === "submitted") {
      return NextResponse.json({ error: "Een ingediende bestelling kan niet worden verwijderd." }, { status: 400 });
    }

    const { error } = await supabase.from("photo_books").delete().eq("id", bookId);
    if (error) return NextResponse.json({ error: "Fotoboek kon niet worden verwijderd." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fotoboek kon niet worden verwijderd." }, { status: 500 });
  }
}
