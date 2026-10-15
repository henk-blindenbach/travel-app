import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicDayByNumber } from "../../../../../lib/public-travel-data";

export default async function PublicDay({ params }: { params: Promise<{ slug: string; dayNumber: string }> }) {
  const { slug, dayNumber } = await params;
  const dayNumberValue = Number(dayNumber);
  if (!Number.isInteger(dayNumberValue)) notFound();
  const result = await getPublicDayByNumber(slug, dayNumberValue);
  if (!result) notFound();
  const { trip, days, entry, media } = result;
  const currentIndex = days.findIndex((day) => day.id === entry.id);
  const previous = currentIndex > 0 ? days[currentIndex - 1] : null;
  const next = currentIndex < days.length - 1 ? days[currentIndex + 1] : null;
  const date = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(entry.day_date + "T12:00:00"));
  return <main className="public-day"><Link className="back-link" href={"/reizen/" + trip.slug}>← Alle verhalen</Link><p className="eyebrow blue">Dag {entry.day_number} · {date}</p><h1>{entry.title || "Reisverhaal"}</h1><p className="journal-intro">{entry.actual_location}</p>{media.length ? <div className="public-photo-gallery">{media.map((asset, index) => <figure className={index === 0 ? "public-photo featured" : "public-photo"} key={asset.id}><img src={"/api/public/media/" + asset.id} alt={"Foto dag " + entry.day_number + " – " + (entry.actual_location || "onderweg")} /></figure>)}</div> : null}<article>{entry.body.split("\n\n").map((paragraph, index) => paragraph.startsWith("## ") ? <h2 key={index}>{paragraph.slice(3)}</h2> : <p key={index}>{paragraph}</p>)}</article><nav className="public-day-navigation">{previous ? <Link href={"/reizen/" + trip.slug + "/dagen/" + previous.day_number}>← Vorige dag</Link> : <span />}{next ? <Link href={"/reizen/" + trip.slug + "/dagen/" + next.day_number}>Volgende dag →</Link> : <span />}</nav></main>;
}
