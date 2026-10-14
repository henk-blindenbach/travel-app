import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../../components/AppShell";
import { TripPlanner } from "../../../../../components/planner/TripPlanner";
import { TripPlanOverview } from "../../../../../components/planner/TripPlanOverview";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

export default async function TripPlan({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const journey = await getPrivateTrip(tripId); if (!journey) notFound();
  let items: never[] = []; let documents: never[] = [];
  if (hasSupabaseEnv()) try { const supabase = await createClient(); const [itemResult, documentResult] = await Promise.all([supabase.from("planning_items").select("id,trip_day_id,kind,status,title,details,location,starts_at,sort_order").eq("trip_id", tripId).order("sort_order"), supabase.from("trip_documents").select("id,trip_day_id,document_type,title,original_filename,upload_status").eq("trip_id", tripId).eq("upload_status", "ready").order("created_at", { ascending: false })]); items = (itemResult.data || []) as never[]; documents = (documentResult.data || []) as never[]; } catch {}
  return <AppShell active="trips"><div className="planner-page"><Link className="back-link" href="/app/trips">← Alle reizen</Link><p className="eyebrow blue">Reisplanner</p><h1>{journey.trip.title}</h1><p className="journal-intro">Plan wat jullie doen en bewaar de documenten die jullie per dag nodig hebben.</p><TripPlanOverview tripId={tripId} initialDays={journey.days} items={items} /><TripPlanner tripId={tripId} days={journey.days} initialItems={items} initialDocuments={documents} /></div></AppShell>;
}
