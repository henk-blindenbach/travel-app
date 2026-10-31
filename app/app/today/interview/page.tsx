import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { InterviewChat } from "../../../../components/journal/InterviewChat";
import { pickOpeningQuestion } from "../../../../lib/interview-context";
import { validUuid } from "../../../../lib/journal";
import { createClient, hasSupabaseEnv } from "../../../../lib/supabase/server";
import { getPrivateTrip, getPrivateTrips } from "../../../../lib/travel-data";

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

async function resolveInterviewDay(dayId?: string) {
  if (dayId && validUuid(dayId) && hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("trip_days")
        .select("id,trip_id,day_number,day_date,title,planned_location,planned_route")
        .eq("id", dayId)
        .maybeSingle();
      if (data) return data;
    } catch { /* fall through */ }
  }

  const trips = await getPrivateTrips();
  const today = lisbonDate();
  const active = trips.find((trip) => trip.starts_on <= today && trip.ends_on >= today)
    || trips.filter((trip) => trip.starts_on > today).sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0]
    || trips[0];
  if (!active) return null;
  const journey = await getPrivateTrip(active.id);
  if (!journey?.days.length) return null;
  const todayDay = journey.days.find((day) => day.day_date === today);
  const day = todayDay || journey.days[0];
  return {
    id: day.id,
    trip_id: active.id,
    day_number: day.day_number,
    day_date: day.day_date,
    title: day.title,
    planned_location: day.planned_location,
    planned_route: day.planned_route ?? null,
  };
}

async function loadPlanningTitles(tripDayId: string) {
  if (!hasSupabaseEnv()) return [] as string[];
  try {
    const supabase = await createClient();
    const { data: items } = await supabase
      .from("planning_items")
      .select("title,sort_order")
      .eq("trip_day_id", tripDayId)
      .order("sort_order", { ascending: true })
      .limit(6);
    return (items || []).map((item) => String(item.title || "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function Interview({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day: dayId } = await searchParams;
  const day = await resolveInterviewDay(dayId);
  if (!day) notFound();
  const label = day.title || day.planned_location || "Reisdag";
  const planningTitles = await loadPlanningTitles(day.id);
  const initialQuestion = pickOpeningQuestion({
    dayTitle: day.title,
    plannedLocation: day.planned_location,
    plannedRoute: day.planned_route ?? null,
    planningTitles,
    dayNumber: day.day_number,
  });
  return (
    <AppShell active="today">
      <div className="interview-page">
        <Link className="back-link" href={`/app/journal/${day.id}`}>← Terug naar dagverslag</Link>
        <p className="eyebrow blue">Reisdag {day.day_number} · {label}</p>
        <h1>Vertel over vandaag.</h1>
        <p className="interview-intro">
          Zeg het gewoon zoals je het aan vrienden zou vertellen. Ik vraag alleen door waar het leuk of handig is — de rest maak ik er als conceptverslag van.
        </p>
        <InterviewChat tripDayId={day.id} initialQuestion={initialQuestion} />
      </div>
    </AppShell>
  );
}
