import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { isTripMember } from "../../../../lib/membership";
import { createServiceClient, hasServiceRoleEnv } from "../../../../lib/supabase/admin";
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

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    if (!validUuid(documentId)) return NextResponse.json({ error: "Ongeldig document." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: document } = await supabase
      .from("trip_documents")
      .select("id,trip_id,object_path")
      .eq("id", documentId)
      .maybeSingle();
    if (!document) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });
    if (!(await isTripMember(supabase, document.trip_id, user.id))) {
      return NextResponse.json({ error: "Alleen reisgenoten mogen dit document verwijderen." }, { status: 403 });
    }

    if (document.object_path) {
      const storage = hasServiceRoleEnv() ? createServiceClient() : supabase;
      const { error: storageError } = await storage.storage.from("trip-documents").remove([document.object_path]);
      if (storageError) console.error("Document storage delete failed", { documentId });
    }

    await supabase.from("trip_document_planning_items").delete().eq("document_id", documentId);
    const { error } = await supabase.from("trip_documents").delete().eq("id", documentId);
    if (error) return NextResponse.json({ error: "Document kon niet worden verwijderd." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Document kon niet worden verwijderd." }, { status: 500 });
  }
}
