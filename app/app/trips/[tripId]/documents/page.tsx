import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../../components/AppShell";
import { DocumentLibrary } from "../../../../../components/planner/DocumentLibrary";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

export default async function TripDocuments({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const journey = await getPrivateTrip(tripId); if (!journey) notFound(); let documents: never[] = [];
  if (hasSupabaseEnv()) try { const supabase = await createClient(); const { data } = await supabase.from("trip_documents").select("id,trip_day_id,document_type,title,original_filename,upload_status").eq("trip_id", tripId).eq("upload_status", "ready").order("created_at", { ascending: false }); documents = (data || []) as never[]; } catch {}
  return <AppShell active="trips"><div className="planner-page"><Link className="back-link" href={`/app/trips/${tripId}/plan`}>← Terug naar reisplanner</Link><p className="eyebrow blue">Privé documentkluis</p><h1>{journey.trip.title}</h1><p className="journal-intro">Alle bevestigingen, tickets en reisdocumenten bij elkaar.</p><DocumentLibrary tripId={tripId} days={journey.days} initialDocuments={documents} /></div></AppShell>;
}
