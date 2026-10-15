import Link from "next/link";
import { PublicHeader } from "../../components/PublicHeader";
import { getPublicTripBySlug, listPublicTrips } from "../../lib/public-travel-data";

export const dynamic = "force-dynamic";

export default async function PublicTrips({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const { periode } = await searchParams;
  const trips = await listPublicTrips();
  const today = new Date().toISOString().slice(0, 10);
  const visibleTrips = periode === "verleden" ? trips.filter((trip) => trip.ends_on < today || trip.status === "completed" || trip.status === "archived") : trips;
  const cards = await Promise.all(visibleTrips.map(async (trip) => ({ trip, count: (await getPublicTripBySlug(trip.slug))?.days.length || 0 })));

  return <><PublicHeader/><main className="public-trip"><p className="eyebrow blue">{periode === "verleden" ? "Reisarchief" : "Onze reizen"}</p><h1>{periode === "verleden" ? "Reizen uit het verleden" : "Onze reizen"}</h1><p className="journal-intro">Verhalen en foto’s die we bewust hebben gedeeld.</p><div className="past-trip-grid">{cards.map(({ trip, count }) => <Link className="past-trip-card" key={trip.id} href={`/reizen/${trip.slug}`}><p>{trip.starts_on.slice(0, 4)}</p><h2>{trip.title}</h2><span>{count} {count === 1 ? "verhaal" : "verhalen"} →</span></Link>)}</div>{!cards.length ? <p className="public-empty">Er zijn nog geen openbare reizen in deze selectie.</p> : null}</main></>;
}
