import Link from "next/link";
import { Icon } from "../components/Icons";
import { PublicHeader } from "../components/PublicHeader";

const days = [
  ["Dag 5", "Annapurna trekking", "Ghorepani → Poon Hill", "12 km · 3.210 m"],
  ["Dag 4", "Naar de bergen", "Pokhara → Ghorepani", "42 km · 2.874 m"],
  ["Dag 3", "Kathmandu, in beweging", "Kathmandu", "23 foto’s"]
];

export default function Home() {
  return <><div className="hero"><PublicHeader/><div className="hero-content"><p className="eyebrow">Een reis door de Himalaya</p><h1>Nepal · Tibet<br/>Bhutan · India</h1><p className="hero-date">1 november — 7 december 2026</p><p className="hero-intro">Bergen, kloosters, levendige steden en ontmoetingen die bijblijven.</p><div className="trip-stats"><span><Icon name="calendar"/> 32 dagen</span><span><Icon name="map"/> 4 landen</span><span><Icon name="camera"/> 1.248 foto’s</span></div><Link href="/app/today" className="primary-button">Volg onze reis <Icon name="arrow" size={18}/></Link></div><div className="mountain-label">Himalaya</div></div><section className="story-section" id="verhalen"><div className="section-heading"><div><p className="eyebrow blue">Onderweg</p><h2>De laatste verhalen</h2></div><a href="#">Alle dagen bekijken <Icon name="arrow" size={17}/></a></div><div className="day-grid">{days.map(([day,title,route,details], index) => <article className={`day-card card-${index + 1}`} key={day}><div className="day-card-image"><span>{day}</span></div><div className="day-card-copy"><p>{route}</p><h3>{title}</h3><small>{details}</small></div></article>)}</div></section><section className="route-section" id="route"><div><p className="eyebrow blue">De reis</p><h2>Van Kathmandu<br/>naar de Himalaya.</h2><p>Een route door vier landen — van drukke straten en stille tempels naar hoge passen en verre valleien.</p><a href="#">Bekijk de route <Icon name="arrow" size={17}/></a></div><div className="route-map"><span className="map-country nepal">NEPAL</span><span className="map-country tibet">TIBET</span><span className="map-country bhutan">BHUTAN</span><i className="route-line"/><b className="pin p1"/><b className="pin p2"/><b className="pin p3"/><b className="pin p4"/></div></section><footer id="over-ons"><span className="wordmark">Op reis</span><p>Henk & Michel — plaatsen, verhalen en foto’s die bijblijven.</p></footer></>;
}
