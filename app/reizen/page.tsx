import Link from "next/link";
import { PublicHeader } from "../../components/PublicHeader";
import { getDictionary, getLocale } from "../../lib/i18n";
import { getPublicTripBySlug, listPublicTrips } from "../../lib/public-travel-data";

export const dynamic = "force-dynamic";

export default async function PublicTrips({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const { periode } = await searchParams;
  const locale = await getLocale();
  const dict = getDictionary(locale).trips;
  const trips = await listPublicTrips();
  const today = new Date().toISOString().slice(0, 10);
  const visibleTrips =
    periode === "verleden"
      ? trips.filter((trip) => trip.ends_on < today || trip.status === "completed" || trip.status === "archived")
      : trips;
  const cards = await Promise.all(
    visibleTrips.map(async (trip) => ({ trip, count: (await getPublicTripBySlug(trip.slug))?.days.length || 0 })),
  );

  return (
    <>
      <PublicHeader />
      <main className="public-trip">
        <p className="eyebrow blue">{periode === "verleden" ? dict.archiveEyebrow : dict.listEyebrow}</p>
        <h1>{periode === "verleden" ? dict.archiveTitle : dict.listTitle}</h1>
        <p className="journal-intro">{dict.intro}</p>
        <div className="past-trip-grid">
          {cards.map(({ trip, count }) => (
            <Link className="past-trip-card" key={trip.id} href={`/reizen/${trip.slug}`}>
              <p>{trip.starts_on.slice(0, 4)}</p>
              <h2>{trip.title}</h2>
              <span>
                {count} {count === 1 ? dict.story : dict.stories} →
              </span>
            </Link>
          ))}
        </div>
        {!cards.length ? <p className="public-empty">{dict.empty}</p> : null}
      </main>
    </>
  );
}
