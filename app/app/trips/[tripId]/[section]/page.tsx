import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { TripCoverControl } from "../../../../../components/trips/TripCoverControl";
import { TripVisibilityControl } from "../../../../../components/trips/TripVisibilityControl";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

const copy: Record<string, { title: string; text: string }> = { journal: { title: "Reisverslag", text: "De dagverslagen en interviews horen bij deze reis. De volgende verfijning brengt hier een chronologisch overzicht van alle dagen samen." }, photos: { title: "Foto’s", text: "Foto’s blijven gekoppeld aan reisdag en verslag. Het reisbrede foto-overzicht volgt op deze structuur." }, publish: { title: "Publiceren", text: "Kies bewust wanneer jullie reis zichtbaar mag zijn voor vrienden en familie." } };

export default async function TripSection({ params }: { params: Promise<{ tripId: string; section: string }> }) {
  const { tripId, section } = await params;
  if (section === "photos") redirect("/app/photos?trip=" + tripId);
  const journey = await getPrivateTrip(tripId);
  const content = copy[section];
  if (!journey || !content) notFound();
  let cover: { id: string; upload_status: string; updated_at: string } | null = null;
  if (section === "publish" && hasSupabaseEnv()) {
    try { const supabase = await createClient(); const result = await supabase.from("trip_covers").select("id,upload_status,updated_at").eq("trip_id", tripId).maybeSingle(); cover = result.data; } catch { /* Upload control remains available without a current cover. */ }
  }
  return <AppShell active="trips"><div className="planner-page"><Link className="back-link" href={"/app/trips/" + tripId + "/plan"}>← Terug naar {journey.trip.title}</Link><p className="eyebrow blue">{journey.trip.title}</p><h1>{content.title}</h1><p className="journal-intro">{content.text}</p>{section === "publish" ? <><TripVisibilityControl tripId={tripId} slug={journey.trip.slug} initialVisibility={journey.trip.visibility || "private"} /><TripCoverControl tripId={tripId} initialCover={cover}/></> : <Link className="secondary-button" href={"/app/trips/" + tripId + "/plan"}>Open reisplanner</Link>}</div></AppShell>;
}
