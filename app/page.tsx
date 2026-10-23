import Link from "next/link";
import { Icon } from "../components/Icons";
import { PublicHeader } from "../components/PublicHeader";
import { getDictionary, getLocale, LOCALE_DATE, t } from "../lib/i18n";
import { getPublicTravelOverview } from "../lib/travel-data";
import "./public-home.css";

export const dynamic = "force-dynamic";

/** Soft line break for multi-segment titles (e.g. "A · B · C · D"). */
function heroTitleParts(title: string) {
  const parts = title.split(" · ").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return [title];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(" · "), parts.slice(mid).join(" · ")];
}

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(LOCALE_DATE[locale], { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(`${date}T12:00:00`),
    );

  const formatCountryList = (countries: string[]) => {
    if (countries.length <= 1) return countries[0] || "";
    if (countries.length === 2) return `${countries[0]}${dict.home.and}${countries[1]}`;
    return `${countries.slice(0, -1).join(", ")}${dict.home.and}${countries[countries.length - 1]}`;
  };

  const routeHeadline = (countries: string[]) => {
    if (countries.length >= 2) {
      return {
        line1: t(dict.home.fromCountry, { country: countries[0] }),
        line2: t(dict.home.toCountry, { country: countries[countries.length - 1] }),
      };
    }
    if (countries.length === 1) return { line1: t(dict.home.throughCountry, { country: countries[0] }) };
    return { line1: dict.home.routeLine1, line2: dict.home.routeLine2 };
  };

  /** Decorative stop positions along a loose arc — count-aware, not geography-aware. */
  const ROUTE_LAYOUTS: { left: string; top: string; labelLeft: string; labelTop: string }[][] = [
    [{ left: "48%", top: "46%", labelLeft: "42%", labelTop: "28%" }],
    [
      { left: "22%", top: "54%", labelLeft: "12%", labelTop: "36%" },
      { left: "72%", top: "38%", labelLeft: "64%", labelTop: "18%" },
    ],
    [
      { left: "16%", top: "56%", labelLeft: "8%", labelTop: "38%" },
      { left: "48%", top: "36%", labelLeft: "40%", labelTop: "16%" },
      { left: "80%", top: "50%", labelLeft: "72%", labelTop: "32%" },
    ],
    [
      { left: "14%", top: "58%", labelLeft: "6%", labelTop: "40%" },
      { left: "36%", top: "38%", labelLeft: "28%", labelTop: "18%" },
      { left: "60%", top: "48%", labelLeft: "52%", labelTop: "28%" },
      { left: "82%", top: "34%", labelLeft: "74%", labelTop: "14%" },
    ],
    [
      { left: "12%", top: "58%", labelLeft: "4%", labelTop: "40%" },
      { left: "30%", top: "40%", labelLeft: "22%", labelTop: "20%" },
      { left: "48%", top: "52%", labelLeft: "40%", labelTop: "32%" },
      { left: "66%", top: "36%", labelLeft: "58%", labelTop: "16%" },
      { left: "84%", top: "48%", labelLeft: "76%", labelTop: "28%" },
    ],
  ];

  const routeStops = (countries: string[]) => {
    const labels = countries.length ? countries.slice(0, 5) : [dict.home.routeFallback];
    const layout = ROUTE_LAYOUTS[labels.length - 1] || ROUTE_LAYOUTS[0];
    return labels.map((label, index) => ({ label, ...layout[index] }));
  };

  const { current, upcoming, past, isTravelling } = await getPublicTravelOverview();
  if (!current) {
    return (
      <>
        <PublicHeader />
        <main className="public-empty-state">
          <p className="eyebrow blue">{dict.home.emptyEyebrow}</p>
          <h1>{dict.home.emptyTitle}</h1>
        </main>
      </>
    );
  }

  const { trip, days, coverUrl } = current;
  const latestDays = [...days].reverse().slice(0, 3);
  const countries = (trip.countries || []).filter(Boolean);
  const headline = routeHeadline(countries);
  const stops = routeStops(countries);
  const countryStat =
    countries.length === 0
      ? dict.home.publicTrip
      : countries.length === 1
        ? dict.home.oneCountry
        : t(dict.home.nCountries, { n: countries.length });
  const routeBlurb =
    trip.summary?.trim() ||
    (countries.length
      ? `${
          countries.length > 1
            ? t(dict.home.routeBlurbThrough, { countries: formatCountryList(countries) })
            : t(dict.home.routeBlurbIn, { country: countries[0] })
        }${dict.home.routeBlurbSuffix}`
      : dict.home.routeBlurbDefault);

  return (
    <>
      <div
        className={`hero public-home-hero${coverUrl ? " has-public-cover" : ""}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        <PublicHeader />
        <div className="hero-content">
          <p className="eyebrow hero-kicker">
            <Icon name="spark" size={14} /> {isTravelling ? dict.home.travelling : dict.home.departingSoon}
          </p>
          <h1>
            {heroTitleParts(trip.title).map((line, index) => (
              <span key={line}>
                {index ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>
          <p className="hero-date">
            {formatDate(trip.starts_on)} — {formatDate(trip.ends_on)}
          </p>
          <p className="hero-intro">{trip.summary}</p>
          <div className="trip-stats">
            <span>
              <Icon name="calendar" /> {isTravelling ? dict.home.followDays : dict.home.nextTrip}
            </span>
            <span>
              <Icon name="map" /> {countryStat}
            </span>
            <span>
              <Icon name="camera" /> {dict.home.storiesAndPhotos}
            </span>
          </div>
          <Link href={`/reizen/${trip.slug}`} className="primary-button">
            {isTravelling ? dict.home.followTrip : dict.home.viewTrip} <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="hero-orbit" aria-hidden>
          <i />
          <i />
          <i />
        </div>
      </div>

      <section className="story-section" id="verhalen">
        <div className="section-heading">
          <div>
            <p className="eyebrow blue">{isTravelling ? dict.home.onTheRoad : dict.home.tripStories}</p>
            <h2>{isTravelling ? dict.home.latestStories : dict.home.storiesWhenTravelling}</h2>
          </div>
          <Link href={`/reizen/${trip.slug}`}>
            {dict.home.viewTheTrip} <Icon name="arrow" size={17} />
          </Link>
        </div>
        {latestDays.length ? (
          <div className="day-grid">
            {latestDays.map((day, index) => (
              <Link
                className={`day-card card-${index + 1}`}
                href={`/reizen/${trip.slug}/dagen/${day.day_number}`}
                key={day.id}
              >
                <div className="day-card-image">
                  <span>{t(dict.home.dayN, { n: day.day_number })}</span>
                </div>
                <div className="day-card-copy">
                  <p>{day.planned_route || dict.home.onTheWay}</p>
                  <h3>{day.title || dict.home.dayReport}</h3>
                  <small>{day.planned_location}</small>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="public-empty">{dict.home.storiesEmpty}</p>
        )}
      </section>

      {upcoming.length ? (
        <section className="past-trip-section upcoming-trip-section">
          <p className="eyebrow blue">{dict.home.thenTravelling}</p>
          <h2>{dict.home.upcomingTrips}</h2>
          <div className="past-trip-grid">
            {upcoming.map(({ trip: upcomingTrip }) => (
              <Link href={`/reizen/${upcomingTrip.slug}`} className="past-trip-card" key={upcomingTrip.id}>
                <p>{formatDate(upcomingTrip.starts_on)}</p>
                <h3>{upcomingTrip.title}</h3>
                <span>
                  {dict.home.viewTheTripCta} <Icon name="arrow" size={15} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {past.length ? (
        <section className="past-trip-section">
          <p className="eyebrow blue">{dict.home.earlierTravelling}</p>
          <h2>{dict.home.pastTripsTitle}</h2>
          <Link className="primary-button blue-button" href="/reizen?periode=verleden">
            {dict.home.viewPastTrips} <Icon name="arrow" size={15} />
          </Link>
        </section>
      ) : null}

      <section className="route-section" id="route">
        <div>
          <p className="eyebrow blue">{dict.home.theTrip}</p>
          <h2>
            {headline.line1}
            {headline.line2 ? (
              <>
                <br />
                {headline.line2}
              </>
            ) : null}
          </h2>
          <p>{routeBlurb}</p>
          <Link href={`/reizen/${trip.slug}/route`}>
            {dict.home.viewRoute} <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="route-map" aria-hidden>
          <i className="route-line" />
          {stops.map((stop) => (
            <span key={stop.label} className="map-country" style={{ left: stop.labelLeft, top: stop.labelTop }}>
              {stop.label.toUpperCase()}
            </span>
          ))}
          {stops.map((stop) => (
            <b key={`pin-${stop.label}`} className="pin" style={{ left: stop.left, top: stop.top }} />
          ))}
        </div>
      </section>
      <footer id="over-ons">
        <span className="wordmark">{dict.header.wordmark}</span>
        <p>{dict.home.footerTagline}</p>
      </footer>
    </>
  );
}
