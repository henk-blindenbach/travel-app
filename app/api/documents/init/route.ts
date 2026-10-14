import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../../lib/journal";
import { createClient } from "../../../../lib/supabase/server";

const types = new Set(["hotel_confirmation", "visa", "flight_ticket", "transport_ticket", "excursion_ticket", "insurance", "other"]);
const mimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    const byteSize = Number(payload.byteSize);
    const mimeType = safeText(payload.mimeType, 180).toLowerCase();
    if (!validUuid(payload.tripId) || !validUuid(payload.tripDayId) || !types.has(payload.documentType) || !mimeTypes.has(mimeType) || !Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > 25 * 1024 * 1024) return NextResponse.json({ error: "Kies een ondersteund bestand tot 25 MB." }, { status: 400 });
    const { data: day } = await supabase.from("trip_days").select("id").eq("id", payload.tripDayId).eq("trip_id", payload.tripId).maybeSingle();
    if (!day) return NextResponse.json({ error: "Deze reisdag hoort niet bij de reis." }, { status: 400 });
    const id = randomUUID();
    const filename = safeText(payload.filename, 255) || "document";
    const objectPath = `${payload.tripId}/${payload.tripDayId}/${id}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: document, error } = await supabase.from("trip_documents").insert({ id, trip_id: payload.tripId, trip_day_id: payload.tripDayId, document_type: payload.documentType, title: safeText(payload.title, 200) || filename, object_path: objectPath, original_filename: filename, mime_type: mimeType, byte_size: byteSize }).select("id,original_filename,upload_status").single();
    if (error || !document) return NextResponse.json({ error: "Document kon niet worden voorbereid." }, { status: 400 });
    const { data: signed, error: signedError } = await supabase.storage.from("trip-documents").createSignedUploadUrl(objectPath);
    if (signedError || !signed) return NextResponse.json({ error: "Upload kon niet worden voorbereid." }, { status: 500 });
    return NextResponse.json({ document, uploadUrl: signed.signedUrl, token: signed.token });
  } catch { return NextResponse.json({ error: "Document kon niet worden voorbereid." }, { status: 500 }); }
}
