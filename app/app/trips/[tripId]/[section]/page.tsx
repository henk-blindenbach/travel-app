import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { TripCoverControl } from "../../../../../components/trips/TripCoverControl";
import { TripVisibilityControl } from "../../../../../components/trips/TripVisibilityControl";
import { TripPublicationOverview } from "../../../../../components/journal/TripPublicationOverview";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

const copy: Record<string, { title: string; text: string }> = { journal: { title: "Reisverslag", text: "De dagverslagen en interviews horen bij deze reis. De volgende verfijning brengt hier een chronologisch overzicht van alle dagen samen." }, photos: { title: "Foto’s", text: "Foto’s blijven gekoppeld aan reisdag en verslag. Het reisbrede foto-overzicht volgt op deze structuur." }, publish: { title: "Publiceren", text: "Kies bewust wanneer jullie reis zichtbaar mag zijn voor vrienden en familie." } };

export default async function TripSection({ params }: { params: Promise<{ tripId: string; section: string }> }) {
  const { tripId, section } = await params;
  if (section === "photos") redirect("/app/photos?trip=" + tripId);
  const journey = await getPrivateTrip(tripId);
  const content = copy[section];
  if (!journey || !content) notFound();
  let cover: { id: string; upload_status: string; updated_at: string } | null = null; let publicationDays: never[] = [];
  if (section === "publish" && hasSupabaseEnv()) {
    try { const supabase = await createClient(); const [result, dayResult] = await Promise.all([supabase.from("trip_covers").select("id,upload_status,updated_at").eq("trip_id", tripId).maybeSingle(), supabase.from("trip_days").select("id,day_number,day_date,title,day_entries(id,title,publication_status,social_captions,media_assets(id,is_public,upload_status))").eq("trip_id", tripId).order("day_number")]); cover = result.data; publicationDays = (dayResult.data || []) as never[]; } catch { /* Controls remain available if a row cannot be read yet. */ }
  }
  return <AppShell active="trips"><div className="planner-page"><Link className="back-link" href={"/app/trips/" + tripId + "/plan"}>← Terug naar {journey.trip.title}</Link><p className="eyebrow blue">{journey.trip.title}</p><h1>{content.title}</h1><p className="journal-intro">{content.text}</p>{section === "publish" ? <><TripVisibilityControl tripId={tripId} slug={journey.trip.slug} initialVisibility={journey.trip.visibility || "private"} /><TripCoverControl tripId={tripId} initialCover={cover}/><TripPublicationOverview tripSlug={journey.trip.slug} days={publicationDays}/></> : <Link className="secondary-button" href={"/app/trips/" + tripId + "/plan"}>Open reisplanner</Link>}</div></AppShell>;
}
