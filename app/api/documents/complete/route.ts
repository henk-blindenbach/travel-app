import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { documentId } = await request.json();
    if (!validUuid(documentId)) return NextResponse.json({ error: "Ongeldig document." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: document, error } = await supabase.from("trip_documents").update({ upload_status: "ready" }).eq("id", documentId).select("id,trip_day_id,planning_item_id,document_type,title,original_filename,upload_status").single();
    if (error || !document) return NextResponse.json({ error: "Document kon niet worden voltooid." }, { status: 400 });
    return NextResponse.json({ document });
  } catch { return NextResponse.json({ error: "Document kon niet worden voltooid." }, { status: 500 }); }
}
