import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { PrivatePhoto, PrivatePhotoLibrary } from "../../../components/photos/PrivatePhotoLibrary";
import { getPrivateTrips } from "../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../lib/supabase/server";

type EntryWithPhotos = { day_number: number; title: string | null; media_assets: { id: string; original_filename: string; caption: string; sort_order: number; upload_status: string }[] | null };

export default async function Photos({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const { trip: requestedTripId } = await searchParams;
  const trips = await getPrivateTrips();
  const trip = trips.find((item) => item.id === requestedTripId) || trips[0];
  let photos: PrivatePhoto[] = [];

  if (trip && hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("day_entries")
        .select("day_number,title,media_assets(id,original_filename,caption,sort_order,upload_status)")
        .eq("trip_id", trip.id)
        .order("day_number");
      photos = ((data || []) as EntryWithPhotos[]).flatMap((entry) => (entry.media_assets || [])
        .filter((asset) => asset.upload_status === "ready")
        .map((asset) => ({ ...asset, day_number: entry.day_number, day_title: entry.title })))
        .sort((left, right) => left.day_number - right.day_number || left.sort_order - right.sort_order);
    } catch {
      photos = [];
    }
  }

  return <AppShell active="photos"><div className="planner-page photo-library-page">
    <p className="eyebrow blue">Privé fotobibliotheek</p><h1>Jullie foto’s, per reis.</h1>
    <p className="journal-intro">Alleen reisgenoten kunnen deze webversies bekijken. Originelen blijven in de private opslag.</p>
    {trips.length ? <nav className="trip-photo-switcher" aria-label="Kies een reis">{trips.map((item) => <Link className={item.id === trip?.id ? "active" : ""} href={`/app/photos?trip=${item.id}`} key={item.id}>{item.title}</Link>)}</nav> : null}
    {trip ? <><div className="photo-library-heading"><div><p className="eyebrow blue">{trip.title}</p><h2>{photos.length} {photos.length === 1 ? "foto" : "foto’s"}</h2></div><Link className="secondary-button" href={`/app/trips/${trip.id}/journal`}>Open reisverslag</Link></div><PrivatePhotoLibrary photos={photos} /></> : <section className="planner-card photo-library-empty"><h2>Nog geen reizen</h2><p>Maak eerst een privéreis aan; daarna komen hier alle foto’s samen.</p><Link className="primary-button blue-button" href="/app/trips/new">Nieuwe reis aanmaken</Link></section>}
  </div></AppShell>;
}
