import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { PrivatePhoto, PrivatePhotoLibrary } from "../../../components/photos/PrivatePhotoLibrary";
import { getPrivateTrips } from "../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../lib/supabase/server";

type EntryWithPhotos = {
  day_number: number;
  title: string | null;
  media_assets: {
    id: string;
    original_filename: string;
    caption: string;
    sort_order: number;
    upload_status: string;
    book_candidate: boolean;
    book_favorite: boolean;
  }[] | null;
};

type PhotoFilter = "all" | "book" | "favorites";

function parseFilter(value?: string): PhotoFilter {
  if (value === "book" || value === "favorites") return value;
  return "all";
}

export default async function Photos({ searchParams }: { searchParams: Promise<{ trip?: string; filter?: string }> }) {
  const { trip: requestedTripId, filter: rawFilter } = await searchParams;
  const filter = parseFilter(rawFilter);
  const trips = await getPrivateTrips();
  const trip = trips.find((item) => item.id === requestedTripId) || trips[0];
  let photos: PrivatePhoto[] = [];

  if (trip && hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("day_entries")
        .select("day_number,title,media_assets(id,original_filename,caption,sort_order,upload_status,book_candidate,book_favorite)")
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

  const filtered = filter === "book"
    ? photos.filter((photo) => photo.book_candidate)
    : filter === "favorites"
      ? photos.filter((photo) => photo.book_favorite)
      : photos;

  const filterHref = (next: PhotoFilter) => {
    const params = new URLSearchParams();
    if (trip) params.set("trip", trip.id);
    if (next !== "all") params.set("filter", next);
    return `/app/photos?${params.toString()}`;
  };

  const countLabel = filter === "book"
    ? (filtered.length === 1 ? "fotoboek-kandidaat" : "fotoboek-kandidaten")
    : filter === "favorites"
      ? (filtered.length === 1 ? "favoriet" : "favorieten")
      : (filtered.length === 1 ? "foto" : "foto’s");

  return <AppShell active="photos"><div className="planner-page photo-library-page">
    <p className="eyebrow blue">Privé fotobibliotheek</p><h1>Jullie foto’s, per reis.</h1>
    <p className="journal-intro">Alleen reisgenoten kunnen deze webversies bekijken. Markeer kandidaten en favorieten voor het latere fotoboek — die keuzes blijven privé.</p>
    {trips.length ? <nav className="trip-photo-switcher" aria-label="Kies een reis">{trips.map((item) => <Link className={item.id === trip?.id ? "active" : ""} href={`/app/photos?trip=${item.id}${filter !== "all" ? `&filter=${filter}` : ""}`} key={item.id}>{item.title}</Link>)}</nav> : null}
    {trip ? <>
      <div className="photo-library-heading">
        <div>
          <p className="eyebrow blue">{trip.title}</p>
          <h2>{filtered.length} {countLabel}</h2>
        </div>
        <div className="photo-library-heading-actions">
          <Link className="secondary-button" href={`/app/trips/${trip.id}/fotoboek`}>Open fotoboek</Link>
          <Link className="secondary-button" href={`/app/trips/${trip.id}/journal`}>Open reisverslag</Link>
        </div>
      </div>
      <nav className="photo-book-filter" aria-label="Filter foto’s">
        <Link className={filter === "all" ? "active" : ""} href={filterHref("all")}>Alle foto’s</Link>
        <Link className={filter === "book" ? "active" : ""} href={filterHref("book")}>Alleen book candidates</Link>
        <Link className={filter === "favorites" ? "active" : ""} href={filterHref("favorites")}>Alleen favorieten</Link>
      </nav>
      {!filtered.length && filter !== "all" && photos.length
        ? <section className="planner-card photo-library-empty"><h2>Geen treffers</h2><p>{filter === "book" ? "Nog geen fotoboek-kandidaten gemarkeerd." : "Nog geen favorieten gemarkeerd."} Zet een vinkje bij een foto om hem hier te zien.</p></section>
        : <PrivatePhotoLibrary photos={filtered} />}
    </> : <section className="planner-card photo-library-empty"><h2>Nog geen reizen</h2><p>Maak eerst een privéreis aan; daarna komen hier alle foto’s samen.</p><Link className="primary-button blue-button" href="/app/trips/new">Nieuwe reis aanmaken</Link></section>}
  </div></AppShell>;
}
