import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const payload = await request.json();
    const title = safeText(payload.title, 200);
    const planningItemIds = Array.isArray(payload.planningItemIds) ? [...new Set(payload.planningItemIds)] : null;
    if (!validUuid(documentId) || !title || !planningItemIds || planningItemIds.some((id) => !validUuid(id))) {
      return NextResponse.json({ error: "Controleer de documenttitel en gekoppelde onderdelen." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: document } = await supabase.from("trip_documents").select("id,trip_id").eq("id", documentId).maybeSingle();
    if (!document) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });

    if (planningItemIds.length) {
      const { data: items } = await supabase.from("planning_items").select("id").eq("trip_id", document.trip_id).in("id", planningItemIds);
      if ((items || []).length !== planningItemIds.length) return NextResponse.json({ error: "Een gekoppeld onderdeel hoort niet bij deze reis." }, { status: 400 });
    }

    const { error: titleError } = await supabase.from("trip_documents").update({ title, planning_item_id: planningItemIds[0] || null }).eq("id", documentId);
    if (titleError) return NextResponse.json({ error: "Titel kon niet worden bijgewerkt." }, { status: 400 });
    const { error: deleteError } = await supabase.from("trip_document_planning_items").delete().eq("document_id", documentId);
    if (deleteError) return NextResponse.json({ error: "Koppelingen konden niet worden bijgewerkt." }, { status: 400 });
    if (planningItemIds.length) {
      const { error: insertError } = await supabase.from("trip_document_planning_items").insert(planningItemIds.map((planning_item_id) => ({ document_id: documentId, planning_item_id })));
      if (insertError) return NextResponse.json({ error: "Koppelingen konden niet worden opgeslagen." }, { status: 400 });
    }
    return NextResponse.json({ title, planningItemIds });
  } catch {
    return NextResponse.json({ error: "Document kon niet worden bijgewerkt." }, { status: 500 });
  }
}
