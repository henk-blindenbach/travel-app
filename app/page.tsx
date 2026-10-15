import Link from "next/link";
import { Icon } from "../components/Icons";
import { PublicHeader } from "../components/PublicHeader";
import { getPublicTravelOverview } from "../lib/travel-data";
import "./public-home.css";

export const dynamic = "force-dynamic";

const formatDate = (date: string) => new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));

export default async function Home() {
  const { current, upcoming, past, isTravelling } = await getPublicTravelOverview();
  if (!current) return <><PublicHeader/><main className="public-empty-state"><p className="eyebrow blue">Op reis</p><h1>Nieuwe verhalen volgen binnenkort.</h1></main></>;

  const { trip, days, coverUrl } = current;
  const latestDays = [...days].reverse().slice(0, 3);

  return <>
    <div className={`hero public-home-hero${coverUrl ? " has-public-cover" : ""}`} style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}>
      <PublicHeader/>
      <div className="hero-content">
        <p className="eyebrow hero-kicker"><Icon name="spark" size={14}/> {isTravelling ? "Nu onderweg" : "Binnenkort vertrekken"}</p>
        <h1>{trip.title.replace(" · Bhutan", "\nBhutan")}</h1>
        <p className="hero-date">{formatDate(trip.starts_on)} — {formatDate(trip.ends_on)}</p>
        <p className="hero-intro">{trip.summary}</p>
        <div className="trip-stats"><span><Icon name="calendar"/> {isTravelling ? "Volg onze dagen" : "Onze volgende reis"}</span><span><Icon name="map"/> {trip.countries.length} landen</span><span><Icon name="camera"/> Verhalen en foto’s</span></div>
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

    <section className="route-section" id="route"><div><p className="eyebrow blue">De reis</p><h2>Van Kathmandu<br/>naar de Himalaya.</h2><p>Een route door vier landen — van drukke straten en stille tempels naar hoge passen en verre valleien.</p></div><div className="route-map"><span className="map-country nepal">NEPAL</span><span className="map-country tibet">TIBET</span><span className="map-country bhutan">BHUTAN</span><i className="route-line"/><b className="pin p1"/><b className="pin p2"/><b className="pin p3"/><b className="pin p4"/></div></section>
    <footer id="over-ons"><span className="wordmark">Op reis</span><p>Henk & Michel — plaatsen, verhalen en foto’s die bijblijven.</p></footer>
  </>;
}
