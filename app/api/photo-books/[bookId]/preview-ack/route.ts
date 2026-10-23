import { NextResponse } from "next/server";
import { validUuid } from "../../../../../lib/journal";
import { PHOTO_BOOK_SELECT } from "../../../../../lib/photo-book-assets";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

/**
 * Record that the user reviewed the Studio preview.
 * Required before sandbox/live order. Cleared automatically on Studio re-sync.
 */
export async function POST(request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    if (!validUuid(bookId)) return NextResponse.json({ error: "Ongeldig fotoboek." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const acknowledged = body.acknowledged !== false;

    const { data: book, error } = await supabase
      .from("photo_books")
      .select("id,studio_project_id,studio_preview_url,status")
      .eq("id", bookId)
      .maybeSingle();
    if (error || !book) return NextResponse.json({ error: "Fotoboek niet gevonden." }, { status: 404 });
    if (book.status === "submitted") {
      return NextResponse.json({ error: "Dit boek is al besteld." }, { status: 409 });
    }
    if (!book.studio_project_id) {
      return NextResponse.json({
        error: "Nog geen Studio-project. Doe eerst “Sync naar Prodigi Studio”.",
      }, { status: 400 });
    }
    if (!acknowledged) {
      const { data: cleared } = await supabase
        .from("photo_books")
        .update({ preview_acknowledged_at: null, updated_at: new Date().toISOString() })
        .eq("id", bookId)
        .select(PHOTO_BOOK_SELECT)
        .single();
      return NextResponse.json({ book: cleared, message: "Preview-bevestiging gewist." });
    }

    const { data: updated, error: updateError } = await supabase
      .from("photo_books")
      .update({
        preview_acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", bookId)
      .select(PHOTO_BOOK_SELECT)
      .single();
    if (updateError || !updated) {
      return NextResponse.json({ error: "Preview-bevestiging kon niet worden opgeslagen." }, { status: 400 });
    }

    return NextResponse.json({
      book: updated,
      message: "Preview bevestigd. Je kunt nu een sandbox-order plaatsen (live alleen met confirmLive).",
    });
  } catch {
    return NextResponse.json({ error: "Preview-bevestiging mislukt." }, { status: 500 });
  }
}
