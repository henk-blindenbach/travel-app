import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "../../../components/PublicHeader";
import { TripMapLoader } from "../../../components/map/TripMapLoader";
import { getDictionary, getLocale, LOCALE_DATE, t } from "../../../lib/i18n";
import { mapChromeLabels } from "../../../lib/i18n/map-labels";
import { getPublicTrip } from "../../../lib/travel-data";
import { getPublicTripMapPins } from "../../../lib/trip-map-data";
import "../../public-trip-journal.css";

export default async function PublicTrip({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const result = await getPublicTrip(slug, locale);
  if (!result) notFound();
  const { trip, days, coverUrl } = result;
  const pins = await getPublicTripMapPins(trip.id, trip.slug, locale);
  const mapLabels = mapChromeLabels(dict.map);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(LOCALE_DATE[locale], { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(`${date}T12:00:00`),
    );
  const formatDayDate = (date: string) =>
    new Intl.DateTimeFormat(LOCALE_DATE[locale], { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(`${date}T12:00:00`),
    );

  return (
    <>
      <div
        className={`public-trip-hero-shell${coverUrl ? " has-cover" : ""}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        <PublicHeader />
        <div className="public-trip-hero-copy">
          <p className="eyebrow">{dict.trip.ourTrip}</p>
          <h1>{trip.title}</h1>
          <p className="public-trip-hero-meta">
            {formatDate(trip.starts_on)} — {formatDate(trip.ends_on)}
          </p>
          {trip.summary ? <p>{trip.summary}</p> : null}
        </div>
        <div className="public-trip-hero-orbit" aria-hidden>
          <i />
          <i />
          <i />
        </div>
      </div>
      <main className="public-trip public-trip-wide">
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
                    <p>{formatDayDate(day.day_date)}</p>
                    <h3>{day.title || dict.trip.dayReport}</h3>
                    <small>{day.planned_location || dict.trip.onTheWay}</small>
                  </div>
                  <b aria-hidden>→</b>
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
