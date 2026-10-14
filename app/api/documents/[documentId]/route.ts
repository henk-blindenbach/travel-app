import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    if (!validUuid(documentId)) return NextResponse.json({ error: "Ongeldig document." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: document } = await supabase.from("trip_documents").select("object_path").eq("id", documentId).eq("upload_status", "ready").maybeSingle();
    if (!document) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
    const { data, error } = await supabase.storage.from("trip-documents").createSignedUrl(document.object_path, 60 * 10);
    if (error || !data) return NextResponse.json({ error: "Document kon niet worden geopend." }, { status: 500 });
    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch { return NextResponse.json({ error: "Document kon niet worden geopend." }, { status: 500 }); }
}
