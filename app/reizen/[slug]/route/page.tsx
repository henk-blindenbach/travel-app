import Link from "next/link";
import { notFound } from "next/navigation";
import { TripMapLoader } from "../../../../components/map/TripMapLoader";
import { getPublicTripBySlug } from "../../../../lib/public-travel-data";
import { getPublicTripMapPins } from "../../../../lib/trip-map-data";

export default async function PublicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicTripBySlug(slug);
  if (!result) notFound();
  const pins = await getPublicTripMapPins(result.trip.id, result.trip.slug);
  const planned = pins.filter((pin) => pin.kind === "planned").length;
  const published = pins.filter((pin) => pin.kind === "published").length;

  return (
    <main className="public-trip trip-map-public">
      <Link className="back-link" href={"/reizen/" + result.trip.slug}>← Terug naar reis</Link>
      <p className="eyebrow blue">Route</p>
      <h1>{result.trip.title}</h1>
      <p className="journal-intro">
        Geplande plekken uit de reisplanning. Gepubliceerde dagen krijgen een eigen markering.
        Precieze fotolocaties blijven privé.
      </p>
      <div className="trip-map-legend" aria-label="Legenda">
        <span><i className="trip-map-swatch planned" /> Gepland ({planned})</span>
        <span><i className="trip-map-swatch published" /> Gepubliceerde dag ({published})</span>
      </div>
      <TripMapLoader pins={pins} />
      <h2 className="trip-map-list-heading">Verhalen in volgorde</h2>
      <ol className="public-day-timeline">
        {result.days.map((day) => (
          <li key={day.id}>
            <span>Dag {day.day_number}</span>
            <Link href={"/reizen/" + result.trip.slug + "/dagen/" + day.day_number}>
              <div>
                <p>{new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(new Date(day.day_date + "T12:00:00"))}</p>
                <h3>{day.actual_location || "Onderweg"}</h3>
                <small>{day.title || "Reisverhaal"}</small>
              </div>
              <b>→</b>
            </Link>
          </li>
        ))}
      </ol>
      {!result.days.length ? <p className="public-empty">De verhalenlijst verschijnt zodra we dagen publiceren.</p> : null}
    </main>
  );
}
