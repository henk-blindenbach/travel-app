import { NextResponse } from "next/server";
import { contentDispositionForDocument } from "../../../../../lib/document-open";
import { validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

/**
 * Same-origin document view URL. Auth via session cookie, then stream with
 * Content-Disposition: inline for PDF/images so iOS Safari/WebView can open them.
 */
export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    if (!validUuid(documentId)) {
      return NextResponse.json({ error: "Ongeldig document." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Je sessie is verlopen. Log opnieuw in om dit document te openen." },
        { status: 401 },
      );
    }

    const { data: document } = await supabase
      .from("trip_documents")
      .select("object_path,mime_type,original_filename")
      .eq("id", documentId)
      .eq("upload_status", "ready")
      .maybeSingle();
    if (!document) {
      return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
    }

    const { data, error } = await supabase.storage.from("trip-documents").download(document.object_path);
    if (error || !data) {
      return NextResponse.json({ error: "Document kon niet worden geopend." }, { status: 500 });
    }

    const filename = document.original_filename || "document";
    const mimeType = document.mime_type || data.type || "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": contentDispositionForDocument(mimeType, filename),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Document kon niet worden geopend." }, { status: 500 });
  }
}
