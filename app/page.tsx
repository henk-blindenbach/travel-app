import Link from "next/link";
import { Icon } from "../components/Icons";
import { PublicHeader } from "../components/PublicHeader";
import { getPublicTravelOverview } from "../lib/travel-data";
import "./public-home.css";

export const dynamic = "force-dynamic";

const formatDate = (date: string) => new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));

/** Soft line break for multi-segment titles (e.g. "A · B · C · D"). */
function heroTitleParts(title: string) {
  const parts = title.split(" · ").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return [title];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(" · "), parts.slice(mid).join(" · ")];
}

function formatCountryList(countries: string[]) {
  if (countries.length <= 1) return countries[0] || "";
  if (countries.length === 2) return `${countries[0]} en ${countries[1]}`;
  return `${countries.slice(0, -1).join(", ")} en ${countries[countries.length - 1]}`;
}

function routeHeadline(countries: string[]) {
  if (countries.length >= 2) return { line1: `Van ${countries[0]}`, line2: `naar ${countries[countries.length - 1]}.` };
  if (countries.length === 1) return { line1: `Door ${countries[0]}.` };
  return { line1: "De route", line2: "op de kaart." };
}

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

function routeStops(countries: string[]) {
  const labels = countries.length ? countries.slice(0, 5) : ["Route"];
  const layout = ROUTE_LAYOUTS[labels.length - 1] || ROUTE_LAYOUTS[0];
  return labels.map((label, index) => ({ label, ...layout[index] }));
}

export default async function Home() {
  const { current, upcoming, past, isTravelling } = await getPublicTravelOverview();
  if (!current) return <><PublicHeader/><main className="public-empty-state"><p className="eyebrow blue">Op reis</p><h1>Nieuwe verhalen volgen binnenkort.</h1></main></>;

  const { trip, days, coverUrl } = current;
  const latestDays = [...days].reverse().slice(0, 3);
  const countries = (trip.countries || []).filter(Boolean);
  const headline = routeHeadline(countries);
  const stops = routeStops(countries);
  const countryStat = countries.length === 0 ? "Openbare reis" : countries.length === 1 ? "1 land" : `${countries.length} landen`;
  const routeBlurb = trip.summary?.trim()
    || (countries.length
      ? `Een openbare reis${countries.length > 1 ? ` door ${formatCountryList(countries)}` : ` in ${countries[0]}`} — verhalen, foto’s en de route op de kaart.`
      : "Verhalen, foto’s en de route op de kaart.");

  return <>
    <div className={`hero public-home-hero${coverUrl ? " has-public-cover" : ""}`} style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}>
      <PublicHeader/>
      <div className="hero-content">
        <p className="eyebrow hero-kicker"><Icon name="spark" size={14}/> {isTravelling ? "Nu onderweg" : "Binnenkort vertrekken"}</p>
        <h1>{heroTitleParts(trip.title).map((line, index) => <span key={line}>{index ? <br/> : null}{line}</span>)}</h1>
        <p className="hero-date">{formatDate(trip.starts_on)} — {formatDate(trip.ends_on)}</p>
        <p className="hero-intro">{trip.summary}</p>
        <div className="trip-stats"><span><Icon name="calendar"/> {isTravelling ? "Volg onze dagen" : "Onze volgende reis"}</span><span><Icon name="map"/> {countryStat}</span><span><Icon name="camera"/> Verhalen en foto’s</span></div>
        <Link href={`/reizen/${trip.slug}`} className="primary-button">{isTravelling ? "Volg deze reis" : "Bekijk deze reis"} <Icon name="arrow" size={18}/></Link>
      </div>
      <div className="hero-orbit" aria-hidden><i/><i/><i/></div>
    </div>

    <section className="story-section" id="verhalen">
      <div className="section-heading"><div><p className="eyebrow blue">{isTravelling ? "Onderweg" : "Reisverhalen"}</p><h2>{isTravelling ? "De laatste verhalen" : "Verhalen zodra we onderweg zijn"}</h2></div><Link href={`/reizen/${trip.slug}`}>Bekijk de reis <Icon name="arrow" size={17}/></Link></div>
      {latestDays.length ? <div className="day-grid">{latestDays.map((day, index) => <Link className={`day-card card-${index + 1}`} href={`/reizen/${trip.slug}/dagen/${day.day_number}`} key={day.id}><div className="day-card-image"><span>Dag {day.day_number}</span></div><div className="day-card-copy"><p>{day.planned_route || "Onderweg"}</p><h3>{day.title || "Dagverslag"}</h3><small>{day.planned_location}</small></div></Link>)}</div> : <p className="public-empty">Zodra we een dag publiceren, lees je hem hier.</p>}
    </section>

    {upcoming.length ? <section className="past-trip-section upcoming-trip-section"><p className="eyebrow blue">Daarna op reis</p><h2>Komende reizen</h2><div className="past-trip-grid">{upcoming.map(({ trip: upcomingTrip }) => <Link href={`/reizen/${upcomingTrip.slug}`} className="past-trip-card" key={upcomingTrip.id}><p>{formatDate(upcomingTrip.starts_on)}</p><h3>{upcomingTrip.title}</h3><span>Bekijk de reis <Icon name="arrow" size={15}/></span></Link>)}</div></section> : null}
    {past.length ? <section className="past-trip-section"><p className="eyebrow blue">Eerder op reis</p><h2>Onze eerdere reizen</h2><Link className="primary-button blue-button" href="/reizen?periode=verleden">Bekijk reizen uit het verleden <Icon name="arrow" size={15}/></Link></section> : null}

    <section className="route-section" id="route">
      <div>
        <p className="eyebrow blue">De reis</p>
        <h2>{headline.line1}{headline.line2 ? <><br/>{headline.line2}</> : null}</h2>
        <p>{routeBlurb}</p>
        <Link href={`/reizen/${trip.slug}/route`}>Bekijk de route <Icon name="arrow" size={17}/></Link>
      </div>
      <div className="route-map" aria-hidden>
        <i className="route-line"/>
        {stops.map((stop) => (
          <span key={stop.label} className="map-country" style={{ left: stop.labelLeft, top: stop.labelTop }}>{stop.label.toUpperCase()}</span>
        ))}
        {stops.map((stop) => (
          <b key={`pin-${stop.label}`} className="pin" style={{ left: stop.left, top: stop.top }}/>
        ))}
      </div>
    </section>
    <footer id="over-ons"><span className="wordmark">Op reis</span><p>Henk & Michel — plaatsen, verhalen en foto’s die bijblijven.</p></footer>
  </>;
}
