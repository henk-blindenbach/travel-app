import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTripBySlug } from "../../../../lib/public-travel-data";

export default async function PublicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicTripBySlug(slug);
  if (!result) notFound();
  return <main className="public-trip"><Link className="back-link" href={"/reizen/" + result.trip.slug}>← Terug naar reis</Link><p className="eyebrow blue">Route</p><h1>{result.trip.title}</h1><p className="journal-intro">De plaatsen uit de verhalen, in de volgorde waarin we ze beleefden.</p><ol className="public-day-timeline">{result.days.map((day) => <li key={day.id}><span>Dag {day.day_number}</span><Link href={"/reizen/" + result.trip.slug + "/dagen/" + day.day_number}><div><p>{new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(new Date(day.day_date + "T12:00:00"))}</p><h3>{day.actual_location || "Onderweg"}</h3><small>{day.title || "Reisverhaal"}</small></div><b>→</b></Link></li>)}</ol>{!result.days.length ? <p className="public-empty">De route verschijnt zodra we verhalen publiceren.</p> : null}</main>;
}
