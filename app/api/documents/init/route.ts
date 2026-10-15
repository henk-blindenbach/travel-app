import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../lib/journal";
import { createClient } from "../../../../lib/supabase/server";

const types = new Set(["hotel_confirmation", "visa", "flight_ticket", "transport_ticket", "excursion_ticket", "insurance", "other"]);
const mimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function normalizedMimeType(filename: unknown, mimeType: unknown) {
  const safeFilename = safeText(filename, 255);
  const extension = safeFilename.split(".").pop()?.toLowerCase() || "";
  const fromExtension = mimeByExtension[extension];
  const supplied = safeText(mimeType, 180).toLowerCase();
  return fromExtension && (!supplied || supplied === "application/octet-stream" || supplied === fromExtension) ? fromExtension : supplied;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    const byteSize = Number(payload.byteSize);
    const mimeType = normalizedMimeType(payload.filename, payload.mimeType);
    const tripDayId = payload.tripDayId === null || payload.tripDayId === "" ? null : payload.tripDayId;
    const planningItemIds = Array.isArray(payload.planningItemIds) ? [...new Set(payload.planningItemIds)] : (payload.planningItemId ? [payload.planningItemId] : []);
    if (!validUuid(payload.tripId) || (tripDayId !== null && !validUuid(tripDayId)) || planningItemIds.some((id) => !validUuid(id)) || !types.has(payload.documentType) || !mimeTypes.has(mimeType) || !Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > 25 * 1024 * 1024) return NextResponse.json({ error: "Kies een PDF, afbeelding, Word- of Excel-bestand tot 25 MB." }, { status: 400 });
    if (tripDayId) {
      const { data: day } = await supabase.from("trip_days").select("id").eq("id", tripDayId).eq("trip_id", payload.tripId).maybeSingle();
      if (!day) return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    }
    if (planningItemIds.length) {
      const { data: items } = await supabase.from("planning_items").select("id").eq("trip_id", payload.tripId).in("id", planningItemIds);
      if ((items || []).length !== planningItemIds.length) return NextResponse.json({ error: "Een gekoppeld onderdeel hoort niet bij deze reis." }, { status: 400 });
    }
    const id = randomUUID();
    const filename = safeText(payload.filename, 255) || "document";
    const objectPath = `${payload.tripId}/${tripDayId || "general"}/${id}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: document, error } = await supabase.from("trip_documents").insert({ id, trip_id: payload.tripId, trip_day_id: tripDayId, planning_item_id: planningItemIds[0] || null, document_type: payload.documentType, title: safeText(payload.title, 200) || filename, object_path: objectPath, original_filename: filename, mime_type: mimeType, byte_size: byteSize }).select("id,trip_day_id,planning_item_id,document_type,title,original_filename,upload_status").single();
    if (error || !document) return NextResponse.json({ error: "Document kon niet worden voorbereid." }, { status: 400 });
    if (planningItemIds.length) {
      const { error: linkError } = await supabase.from("trip_document_planning_items").insert(planningItemIds.map((planning_item_id) => ({ document_id: id, planning_item_id })));
      if (linkError) return NextResponse.json({ error: "Documentkoppeling kon niet worden voorbereid." }, { status: 400 });
    }
    const { data: signed, error: signedError } = await supabase.storage.from("trip-documents").createSignedUploadUrl(objectPath);
    if (signedError || !signed) return NextResponse.json({ error: "Upload kon niet worden voorbereid." }, { status: 500 });
    return NextResponse.json({ document, uploadUrl: signed.signedUrl, token: signed.token, mimeType });
  } catch { return NextResponse.json({ error: "Document kon niet worden voorbereid." }, { status: 500 }); }
}
