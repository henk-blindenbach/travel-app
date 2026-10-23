import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLocaleControls } from "../../../../components/PublicLocaleControls";
import { TripMapLoader } from "../../../../components/map/TripMapLoader";
import { getDictionary, getLocale, LOCALE_DATE, t } from "../../../../lib/i18n";
import { mapChromeLabels } from "../../../../lib/i18n/map-labels";
import { getPublicTripBySlug } from "../../../../lib/public-travel-data";
import { countPinsByKind, getPublicTripMapPins } from "../../../../lib/trip-map-data";

export default async function PublicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const result = await getPublicTripBySlug(slug);
  if (!result) notFound();
  const pins = await getPublicTripMapPins(result.trip.id, result.trip.slug, locale);
  const counts = countPinsByKind(pins);
  const mapLabels = mapChromeLabels(dict.map);
  const formatShort = (date: string) =>
    new Intl.DateTimeFormat(LOCALE_DATE[locale], { day: "numeric", month: "short" }).format(
      new Date(date + "T12:00:00"),
    );

  return (
    <main className="public-trip trip-map-public">
      <div className="public-page-top">
        <Link className="back-link" href={"/reizen/" + result.trip.slug}>
          {dict.route.backToTrip}
        </Link>
        <PublicLocaleControls />
      </div>
      <p className="eyebrow blue">{dict.route.route}</p>
      <h1>{result.trip.title}</h1>
      <p className="journal-intro">{dict.route.intro}</p>
      <div className="trip-map-legend" aria-label={dict.route.legendAria}>
        <span>
          <i className="trip-map-swatch planned" /> {t(dict.route.planned, { n: counts.planned })}
        </span>
        <span>
          <i className="trip-map-swatch item" /> {t(dict.route.planning, { n: counts.planning })}
        </span>
        <span>
          <i className="trip-map-swatch published" /> {t(dict.route.visitedPublished, { n: counts.published })}
        </span>
      </div>
      <TripMapLoader pins={pins} labels={mapLabels} />
      <h2 className="trip-map-list-heading">{dict.route.storiesInOrder}</h2>
      <ol className="public-day-timeline">
        {result.days.map((day) => (
          <li key={day.id}>
            <span>{t(dict.route.dayN, { n: day.day_number })}</span>
            <Link href={"/reizen/" + result.trip.slug + "/dagen/" + day.day_number}>
              <div>
                <p>{formatShort(day.day_date)}</p>
                <h3>{day.actual_location || dict.route.onTheWay}</h3>
                <small>{day.title || dict.route.travelStory}</small>
              </div>
              <b>→</b>
            </Link>
          </li>
        ))}
      </ol>
      {!result.days.length ? <p className="public-empty">{dict.route.listEmpty}</p> : null}
    </main>
  );
}
