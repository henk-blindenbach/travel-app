import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { DayEntryEditor } from "../../../../components/journal/DayEntryEditor";
import { getFeaturedTrip, getPrivateTrip } from "../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../lib/supabase/server";

export default async function JournalDay({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  let fallback = await getFeaturedTrip();
  let trip = fallback.trip; let day = fallback.days.find((item) => item.id === dayId);
  if (hasSupabaseEnv()) try {
    const supabase = await createClient();
    const result = await supabase.from("trip_days").select("id,trip_id,day_number,day_date,title,planned_location,planned_route").eq("id", dayId).maybeSingle();
    if (result.data) { const journey = await getPrivateTrip(result.data.trip_id); if (journey) { trip = journey.trip; day = result.data; } }
  } catch { /* The fallback remains useful during local mock work. */ }
  if (!day) notFound();

  let entry = null;
  let assets: { id: string; original_filename: string; caption: string; sort_order: number; upload_status: "uploading" | "processing" | "ready" | "failed"; is_public?: boolean; book_candidate?: boolean; book_favorite?: boolean }[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const result = await supabase.from("day_entries").select("id,title,actual_location,body,social_captions,publication_status,media_assets(id,original_filename,caption,sort_order,upload_status,is_public,book_candidate,book_favorite)").eq("trip_day_id", day.id).maybeSingle();
      entry = result.data;
      assets = (result.data?.media_assets || []).sort((a, b) => a.sort_order - b.sort_order);
    } catch {
      // The page remains useful while the journal migration is being deployed.
    }
  }

  const formattedDate = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day.day_date}T12:00:00`));
  const journalHub = `/app/trips/${trip.id}/journal`;
  return <AppShell active="trips"><div className="journal-page"><Link className="back-link" href={journalHub}>← Terug naar reisverslag</Link><p className="eyebrow blue">Reisdag {day.day_number} · {formattedDate}</p><h1>{day.title || "Dagverslag"}</h1><p className="journal-intro">Leg de dag vast wanneer het uitkomt. Het verslag en de foto’s zijn alleen zichtbaar voor jullie reisgenoten.</p><DayEntryEditor tripDayId={day.id} tripSlug={trip.slug} dayNumber={day.day_number} dayTitle={day.title || ""} plannedLocation={day.planned_location} initialEntry={entry} initialAssets={assets} /></div></AppShell>;
}
