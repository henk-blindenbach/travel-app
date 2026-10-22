import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

const documentTypes = new Set([
  "hotel_confirmation",
  "visa",
  "flight_ticket",
  "transport_ticket",
  "excursion_ticket",
  "insurance",
  "other",
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const payload = await request.json();
    const title = safeText(payload.title, 200);
    const planningItemIds = Array.isArray(payload.planningItemIds) ? [...new Set(payload.planningItemIds)] : null;
    const documentType = payload.documentType === undefined ? undefined : safeText(payload.documentType, 40);
    const tripDayId =
      payload.tripDayId === undefined
        ? undefined
        : payload.tripDayId === null || payload.tripDayId === ""
          ? null
          : payload.tripDayId;
    const isPinned = payload.isPinned === undefined ? undefined : payload.isPinned === true;

    if (!validUuid(documentId) || !title || !planningItemIds || planningItemIds.some((id) => !validUuid(id))) {
      return NextResponse.json({ error: "Controleer de documenttitel en gekoppelde onderdelen." }, { status: 400 });
    }
    if (documentType !== undefined && !documentTypes.has(documentType)) {
      return NextResponse.json({ error: "Ongeldig documenttype." }, { status: 400 });
    }
    if (tripDayId !== undefined && tripDayId !== null && !validUuid(tripDayId)) {
      return NextResponse.json({ error: "Ongeldige reisdag." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: document } = await supabase.from("trip_documents").select("id,trip_id").eq("id", documentId).maybeSingle();
    if (!document) return NextResponse.json({ error: "Document niet gevonden." }, { status: 404 });

    if (tripDayId) {
      const { data: day } = await supabase.from("trip_days").select("id").eq("id", tripDayId).eq("trip_id", document.trip_id).maybeSingle();
      if (!day) return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    }

    if (planningItemIds.length) {
      const { data: items } = await supabase.from("planning_items").select("id").eq("trip_id", document.trip_id).in("id", planningItemIds);
      if ((items || []).length !== planningItemIds.length) {
        return NextResponse.json({ error: "Een gekoppeld onderdeel hoort niet bij deze reis." }, { status: 400 });
      }
    }

    const patch: Record<string, unknown> = {
      title,
      planning_item_id: planningItemIds[0] || null,
    };
    if (documentType !== undefined) patch.document_type = documentType;
    if (tripDayId !== undefined) patch.trip_day_id = tripDayId;
    if (isPinned !== undefined) patch.is_pinned = isPinned;

    const { error: titleError } = await supabase.from("trip_documents").update(patch).eq("id", documentId);
    if (titleError) return NextResponse.json({ error: "Document kon niet worden bijgewerkt." }, { status: 400 });

    const { error: deleteError } = await supabase.from("trip_document_planning_items").delete().eq("document_id", documentId);
    if (deleteError) return NextResponse.json({ error: "Koppelingen konden niet worden bijgewerkt." }, { status: 400 });
    if (planningItemIds.length) {
      const { error: insertError } = await supabase
        .from("trip_document_planning_items")
        .insert(planningItemIds.map((planning_item_id) => ({ document_id: documentId, planning_item_id })));
      if (insertError) return NextResponse.json({ error: "Koppelingen konden niet worden opgeslagen." }, { status: 400 });
    }

    return NextResponse.json({
      title,
      planningItemIds,
      documentType: documentType,
      tripDayId: tripDayId,
      isPinned,
    });
  } catch {
    return NextResponse.json({ error: "Document kon niet worden bijgewerkt." }, { status: 500 });
  }
}
