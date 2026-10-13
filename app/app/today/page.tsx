import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { Icon } from "../../../components/Icons";
import { getFeaturedTrip } from "../../../lib/travel-data";

export default async function Today() {
  const { days } = await getFeaturedTrip();
  const day = days[0];
  return <AppShell active="today"><header className="app-header"><div><p className="eyebrow blue">Vandaag</p><h1>Goedemorgen, Henk.</h1><p>Maandag 6 november · Reisdag {day.day_number}</p></div><button className="round-button">⌁</button></header><section className="today-hero"><div><p className="eyebrow">Reisdag {day.day_number}</p><h2>{day.title}</h2><p>{day.planned_route}</p><div className="today-stats"><span>↗ 12 km</span><span>△ 3.210 m</span><span>☀ 18°</span></div></div><div className="today-hero-image"/></section><section className="today-grid"><div className="journal-card"><div className="journal-icon"><Icon name="spark"/></div><p className="eyebrow blue">Jouw dagboek</p><h2>Vertel hoe jullie dag was.</h2><p>De planning en je geselecteerde foto’s helpen het gesprek op weg. Jij bepaalt wat er in het verhaal komt.</p><Link className="primary-button blue-button" href="/app/today/interview">Start AI-interview <Icon name="arrow" size={18}/></Link></div><div className="info-card"><p className="eyebrow blue">In de planning</p><h3>Vanochtend</h3><p>{day.planned_route}</p><hr/><h3>Vanavond</h3><p>Overnachting in {day.planned_location}</p><Link href="/app/trips">Bekijk reisdag <Icon name="arrow" size={16}/></Link></div></section><section className="photo-strip"><div className="section-heading"><div><p className="eyebrow blue">Foto’s</p><h2>Leg vandaag vast</h2></div><Link href="/app/photos">Alles bekijken <Icon name="arrow" size={17}/></Link></div><div className="photo-placeholders"><div/><div/><div/><button><b>+</b><span>Foto’s kiezen</span></button></div></section></AppShell>;
}
