import Link from "next/link";
import { PublicHeader } from "../../components/PublicHeader";
import { listPublicTrips, getPublicTripBySlug } from "../../lib/public-travel-data";

export default async function PublicTrips() {
  const trips = await listPublicTrips();
  const cards = await Promise.all(trips.map(async (trip) => ({ trip, count: (await getPublicTripBySlug(trip.slug))?.days.length || 0 })));
  return <><PublicHeader/><main className="public-trip"><p className="eyebrow blue">Reisarchief</p><h1>Onze reizen</h1><p className="journal-intro">Verhalen en foto’s die we bewust hebben gedeeld.</p><div className="past-trip-grid">{cards.map(({ trip, count }) => <Link className="past-trip-card" key={trip.id} href={"/reizen/" + trip.slug}><p>{trip.starts_on.slice(0, 4)}</p><h2>{trip.title}</h2><span>{count} {count === 1 ? "verhaal" : "verhalen"} →</span></Link>)}</div>{!cards.length ? <p className="public-empty">Er zijn nog geen openbare reizen.</p> : null}</main></>;
}
