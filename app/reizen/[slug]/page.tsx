import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "../../../components/PublicHeader";
import { TripMapLoader } from "../../../components/map/TripMapLoader";
import { getDictionary, getLocale, t } from "../../../lib/i18n";
import { mapChromeLabels } from "../../../lib/i18n/map-labels";
import { getPublicTrip } from "../../../lib/travel-data";
import { getPublicTripMapPins } from "../../../lib/trip-map-data";

export default async function PublicTrip({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const result = await getPublicTrip(slug);
  if (!result) notFound();
  const { trip, days } = result;
  const pins = await getPublicTripMapPins(trip.id, trip.slug, locale);
  const mapLabels = mapChromeLabels(dict.map);

  return (
    <>
      <div className="public-trip-hero">
        <PublicHeader />
        <div>
          <p className="eyebrow">{dict.trip.ourTrip}</p>
          <h1>{trip.title}</h1>
          <p>{trip.summary}</p>
        </div>
      </div>
      <main className="public-trip">
        <Link className="back-link" href="/">
          {dict.trip.allTrips}
        </Link>
        {pins.length ? (
          <section className="trip-map-preview" aria-label={dict.trip.routeMapAria}>
            <div className="section-heading">
              <div>
                <p className="eyebrow blue">{dict.trip.route}</p>
                <h2>{dict.trip.onTheMap}</h2>
              </div>
              <Link href={`/reizen/${trip.slug}/route`}>{dict.trip.fullMap}</Link>
            </div>
            <TripMapLoader pins={pins} compact showRouteToggle={false} defaultShowRoute labels={mapLabels} />
          </section>
        ) : (
          <div className="section-heading">
            <div>
              <p className="eyebrow blue">{dict.trip.route}</p>
              <h2>{dict.trip.mapComing}</h2>
            </div>
            <Link href={`/reizen/${trip.slug}/route`}>{dict.trip.viewRoute}</Link>
          </div>
        )}
        <div className="section-heading">
          <div>
            <p className="eyebrow blue">{dict.trip.journal}</p>
            <h2>{days.length ? dict.trip.allStories : dict.trip.noStoriesYet}</h2>
          </div>
          <Link href={`/reizen/${trip.slug}/route`}>{dict.trip.viewRoute}</Link>
        </div>
        {days.length ? (
          <ol className="public-day-timeline">
            {days.map((day) => (
              <li key={day.id}>
                <span>{t(dict.trip.dayN, { n: day.day_number })}</span>
                <Link href={`/reizen/${trip.slug}/dagen/${day.day_number}`}>
                  <div>
                    <p>{day.day_date}</p>
                    <h3>{day.title || dict.trip.dayReport}</h3>
                    <small>{day.planned_location || dict.trip.onTheWay}</small>
                  </div>
                  <b>→</b>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="public-empty">{dict.trip.storiesEmpty}</p>
        )}
      </main>
    </>
  );
}
