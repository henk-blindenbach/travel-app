import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../../components/AppShell";
import { DocumentLibrary } from "../../../../../components/planner/DocumentLibrary";
import { OfflineDocumentCache } from "../../../../../components/documents/OfflineDocumentCache";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

export default async function TripDocuments({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const journey = await getPrivateTrip(tripId);
  if (!journey) notFound();
  let documents: never[] = [];
  let planningItems: never[] = [];
  if (hasSupabaseEnv())
    try {
      const supabase = await createClient();
      const [documentResult, itemResult, linkResult] = await Promise.all([
        supabase
          .from("trip_documents")
          .select("id,trip_day_id,planning_item_id,document_type,title,original_filename,upload_status,is_pinned")
          .eq("trip_id", tripId)
          .eq("upload_status", "ready")
          .order("created_at", { ascending: false }),
        supabase
          .from("planning_items")
          .select("id,title,kind,trip_day_id,flight_number,booking_reference,carrier,ticket_number")
          .eq("trip_id", tripId)
          .order("sort_order"),
        supabase.from("trip_document_planning_items").select("document_id,planning_item_id"),
      ]);
      const links = linkResult.data || [];
      documents = (documentResult.data || []).map((document) => ({
        ...document,
        is_pinned: Boolean(document.is_pinned),
        planningItemIds: [
          ...new Set([
            ...links.filter((link) => link.document_id === document.id).map((link) => link.planning_item_id),
            ...(document.planning_item_id ? [document.planning_item_id] : []),
          ]),
        ],
      })) as never[];
      planningItems = (itemResult.data || []) as never[];
    } catch {}
  return (
    <AppShell active="trips">
      <div className="planner-page">
        <Link className="back-link" href={"/app/trips/" + tripId + "/plan"}>
          ← Terug naar reisplanner
        </Link>
        <p className="eyebrow blue">Privé documentkluis</p>
        <h1>{journey.trip.title}</h1>
        <p className="journal-intro">Alle bevestigingen, tickets en reisdocumenten bij elkaar.</p>
        <OfflineDocumentCache tripId={tripId} endsOn={journey.trip.ends_on} documents={documents} />
        <DocumentLibrary tripId={tripId} days={journey.days} planningItems={planningItems} initialDocuments={documents} />
      </div>
    </AppShell>
  );
}
