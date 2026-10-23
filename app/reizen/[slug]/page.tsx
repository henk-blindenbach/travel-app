import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "../../../components/PublicHeader";
import { TripMapLoader } from "../../../components/map/TripMapLoader";
import { getPublicTrip } from "../../../lib/travel-data";
import { getPublicTripMapPins } from "../../../lib/trip-map-data";

export default async function PublicTrip({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicTrip(slug);
  if (!result) notFound();
  const { trip, days } = result;
  const pins = await getPublicTripMapPins(trip.id, trip.slug);

  return (
    <>
      <div className="public-trip-hero">
        <PublicHeader />
        <div>
          <p className="eyebrow">Onze reis</p>
          <h1>{trip.title}</h1>
          <p>{trip.summary}</p>
        </div>
      </div>
      <main className="public-trip">
        <Link className="back-link" href="/">← Alle reizen</Link>
        {pins.length ? (
          <section className="trip-map-preview" aria-label="Routekaart">
            <div className="section-heading">
              <div>
                <p className="eyebrow blue">Route</p>
                <h2>Op de kaart</h2>
              </div>
              <Link href={`/reizen/${trip.slug}/route`}>Volledige kaart</Link>
            </div>
            <TripMapLoader pins={pins} compact showRouteToggle={false} defaultShowRoute />
          </section>
        ) : (
          <div className="section-heading">
            <div>
              <p className="eyebrow blue">Route</p>
              <h2>Kaart volgt</h2>
            </div>
            <Link href={`/reizen/${trip.slug}/route`}>Bekijk de route</Link>
          </div>
        )}
        <div className="section-heading">
          <div>
            <p className="eyebrow blue">Reisdagboek</p>
            <h2>{days.length ? "Alle verhalen" : "Nog geen verhalen"}</h2>
          </div>
          <Link href={`/reizen/${trip.slug}/route`}>Bekijk de route</Link>
        </div>
        {days.length ? (
          <ol className="public-day-timeline">
            {days.map((day) => (
              <li key={day.id}>
                <span>Dag {day.day_number}</span>
                <Link href={`/reizen/${trip.slug}/dagen/${day.day_number}`}>
                  <div>
                    <p>{day.day_date}</p>
                    <h3>{day.title || "Dagverslag"}</h3>
                    <small>{day.planned_location || "Onderweg"}</small>
                  </div>
                  <b>→</b>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="public-empty">Zodra we een dag publiceren, verschijnt het verhaal hier.</p>
        )}
      </main>
    </>
  );
}
