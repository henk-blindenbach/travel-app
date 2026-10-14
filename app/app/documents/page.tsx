import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { DocumentLibrary } from "../../../components/planner/DocumentLibrary";
import { getFeaturedTrip } from "../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../lib/supabase/server";

export default async function Documents() {
  const { trip, days } = await getFeaturedTrip();
  let documents: never[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("trip_documents").select("id,trip_day_id,document_type,title,original_filename,upload_status").eq("trip_id", trip.id).eq("upload_status", "ready").order("created_at", { ascending: false });
      documents = (data || []) as never[];
    } catch { /* The planner remains readable if production data is temporarily unavailable. */ }
  }
  return <AppShell active="trips"><div className="planner-page"><Link className="back-link" href="/app/trips">← Terug naar reisplanner</Link><p className="eyebrow blue">Privé documentkluis</p><h1>{trip.title}</h1><p className="journal-intro">Alle bevestigingen, tickets en reisdocumenten bij elkaar — ook als ze niet aan één reisdag horen.</p><DocumentLibrary tripId={trip.id} days={days} initialDocuments={documents} /></div></AppShell>;
}
