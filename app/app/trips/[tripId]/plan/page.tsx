import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../../components/AppShell";
import { TripPlanOverview } from "../../../../../components/planner/TripPlanOverview";
import { OpenItems } from "../../../../../components/planner/OpenItems";
import { TripDossier } from "../../../../../components/planner/TripDossier";
import { PlanImport } from "../../../../../components/planner/PlanImport";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

export default async function TripPlan({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const journey = await getPrivateTrip(tripId); if (!journey) notFound();
  let items: never[] = []; let documents: never[] = []; let openItems: never[] = []; let travelers: never[] = []; let contacts: never[] = []; let budget: never[] = [];
  if (hasSupabaseEnv()) try { const supabase = await createClient(); const [itemResult, documentResult] = await Promise.all([supabase.from("planning_items").select("id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,arrives_on,booking_reference,ticket_number,departure_time,arrival_time,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,address,contact_phone,price_amount,currency,payment_status,is_optional,duration_minutes,altitude_m,sort_order").eq("trip_id", tripId).order("sort_order"), supabase.from("trip_documents").select("id,trip_day_id,planning_item_id,document_type,title,original_filename,upload_status").eq("trip_id", tripId).eq("upload_status", "ready").order("created_at", { ascending: false })]); items = (itemResult.data || []) as never[]; documents = (documentResult.data || []) as never[]; } catch {}
  if (hasSupabaseEnv()) try { const supabase = await createClient(); const [openResult, travelerResult, contactResult, budgetResult] = await Promise.all([supabase.from("trip_open_items").select("id,trip_day_id,title,details,status,assigned_to,due_on,planning_item_id").eq("trip_id", tripId).order("created_at"), supabase.from("trip_travelers").select("id,name,role,ticket_reference,seat_notes,loyalty_number,notes").eq("trip_id", tripId).order("name"), supabase.from("trip_contacts").select("id,name,role,phone,email,address,notes").eq("trip_id", tripId).order("name"), supabase.from("trip_budget_entries").select("id,title,category,planned_amount,actual_amount,currency,payment_status,notes").eq("trip_id", tripId).order("created_at")]); openItems = (openResult.data || []) as never[]; travelers = (travelerResult.data || []) as never[]; contacts = (contactResult.data || []) as never[]; budget = (budgetResult.data || []) as never[]; } catch {}
  return (
    <AppShell active="trips">
      <div className="planner-page">
        <Link className="back-link" href="/app/trips">
          ← Alle reizen
        </Link>
        <p className="eyebrow blue">Reisplanner</p>
        <h1>{journey.trip.title}</h1>
        <p className="journal-intro">
          Plan, boek en controleer alles vanuit één overzicht. Snel naar{" "}
          <a href="#dossier">reizigers, contacten en budget</a> of de CSV-import onderaan.
        </p>
        <TripPlanOverview tripId={tripId} initialDays={journey.days} initialItems={items} documents={documents} />
        <PlanImport tripId={tripId} />
        <TripDossier tripId={tripId} travelers={travelers} contacts={contacts} budget={budget} />
        <OpenItems tripId={tripId} initialItems={openItems} days={journey.days} planningItems={items} />
      </div>
    </AppShell>
  );
}
