import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { getPrivateTrips } from "../../../lib/travel-data";

export default async function More() {
  const trips = await getPrivateTrips();
  return <AppShell active="more"><div className="planner-page more-page"><p className="eyebrow blue">Reisbeheer</p><h1>Alles wat jullie onderweg nodig hebben.</h1><p className="journal-intro">Kies een reis om documenten en planning snel terug te vinden, of start een nieuwe reis.</p><div className="more-actions"><Link className="primary-button blue-button" href="/app/trips/new">+ Nieuwe reis</Link><Link className="secondary-button" href="/app/trips">Alle reizen</Link></div>{trips.length ? <section className="planner-card more-trip-list"><h2>Snelle ingangen</h2>{trips.map((trip) => <article key={trip.id}><div><b>{trip.title}</b><small>{trip.days.length} {trip.days.length === 1 ? "reisdag" : "reisdagen"}</small></div><nav><Link href={`/app/trips/${trip.id}/documents`}>Documenten</Link><Link href={`/app/trips/${trip.id}/plan`}>Planning</Link><Link href={`/app/photos?trip=${trip.id}`}>Foto’s</Link><Link href={`/app/trips/${trip.id}/settings`}>Bewerken</Link></nav></article>)}</section> : null}</div></AppShell>;
}
