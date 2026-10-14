import { AppShell } from "../../../components/AppShell";
import { TripPlanner } from "../../../components/planner/TripPlanner";
import { getFeaturedTrip } from "../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../lib/supabase/server";

export default async function Trips() {
  const { trip, days } = await getFeaturedTrip();
  let items: never[] = [];
  let documents: never[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const [itemResult, documentResult] = await Promise.all([
        supabase.from("planning_items").select("id,trip_day_id,kind,status,title,details,location,starts_at,sort_order").eq("trip_id", trip.id).order("sort_order"),
        supabase.from("trip_documents").select("id,trip_day_id,document_type,title,original_filename,upload_status").eq("trip_id", trip.id).eq("upload_status", "ready").order("created_at", { ascending: false }),
      ]);
      items = (itemResult.data || []) as never[]; documents = (documentResult.data || []) as never[];
    } catch { /* First deploy stays readable until the migration is live. */ }
  }
  return <AppShell active="trips"><div className="planner-page"><p className="eyebrow blue">Reisplanner</p><h1>{trip.title}</h1><p className="journal-intro">Michel plant hier de reis. Jullie vinden onderweg per dag de praktische informatie en documenten terug.</p><TripPlanner tripId={trip.id} days={days} initialItems={items} initialDocuments={documents} /></div></AppShell>;
}
