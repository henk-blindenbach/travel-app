import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { TodayDocuments } from "../../../../components/documents/TodayDocuments";
import { selectTodayDocuments, sortRoadDocuments } from "../../../../lib/today-documents";
import { getPrivateTrip, getPrivateTrips } from "../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../lib/supabase/server";

function lisbonDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return [value("year"), value("month"), value("day")].join("-");
}

type DocRow = {
  id: string;
  title: string;
  document_type: string | null;
  planning_item_id: string | null;
  trip_day_id: string | null;
  is_pinned: boolean | null;
};

async function loadDocuments(tripId: string) {
  if (!hasSupabaseEnv()) return [] as DocRow[];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("trip_documents")
      .select("id,title,document_type,planning_item_id,trip_day_id,is_pinned")
      .eq("trip_id", tripId)
      .eq("upload_status", "ready");
    return (data || []) as DocRow[];
  } catch {
    return [];
  }
}

export default async function TodayDocumentsPage() {
  const trips = await getPrivateTrips();
  if (!trips.length) redirect("/app/today");

  const today = lisbonDate();
  const activeTrip = trips.find((trip) => trip.starts_on <= today && trip.ends_on >= today);
  if (!activeTrip) redirect("/app/today");

  const journey = await getPrivateTrip(activeTrip.id);
  const day = journey?.days.find((entry) => entry.day_date === today);
  if (!day) redirect("/app/today");

  const allDocs = await loadDocuments(activeTrip.id);
  const documents = sortRoadDocuments(selectTodayDocuments(allDocs, day.id), day.id, null);
  const formattedDate = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(day.day_date + "T12:00:00"));

  return (
    <AppShell active="today">
      <div className="planner-page today-documents-page">
        <Link className="back-link" href="/app/today">
          ← Terug naar Vandaag
        </Link>
        <p className="eyebrow blue">Documenten</p>
        <h1>{day.title || day.planned_location || "Reisdag"}</h1>
        <p className="journal-intro">
          {formattedDate} · Reisdag {day.day_number}. Alleen documenten voor deze dag en hele-reis.
        </p>
        <TodayDocuments tripId={activeTrip.id} documents={documents} />
        <Link className="secondary-button today-docs-all-link" href={"/app/trips/" + activeTrip.id + "/documents"}>
          Alle reisdocumenten
        </Link>
      </div>
    </AppShell>
  );
}
