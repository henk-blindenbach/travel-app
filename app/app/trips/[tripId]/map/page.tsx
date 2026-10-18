import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { TripMapLoader } from "../../../../../components/map/TripMapLoader";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { getPrivateTripMapPins } from "../../../../../lib/trip-map-data";

export default async function TripMapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const journey = await getPrivateTrip(tripId);
  if (!journey) notFound();
  const pins = await getPrivateTripMapPins(tripId, journey.trip.slug);
  const planned = pins.filter((pin) => pin.kind === "planned").length;
  const visited = pins.filter((pin) => pin.kind === "visited").length;

  return (
    <AppShell active="trips">
      <div className="planner-page trip-map-page">
        <Link className="back-link" href={`/app/trips/${tripId}/plan`}>← Terug naar planning</Link>
        <p className="eyebrow blue">{journey.trip.title}</p>
        <h1>Kaart</h1>
        <p className="journal-intro">
          Geplande plekken uit de reisplanning en bezochte fotolocaties uit jullie verslagen.
          Gepland en bezocht blijven bewust van elkaar te onderscheiden.
        </p>
        <div className="trip-map-legend" aria-label="Legenda">
          <span><i className="trip-map-swatch planned" /> Gepland ({planned})</span>
          <span><i className="trip-map-swatch visited" /> Bezocht / foto ({visited})</span>
        </div>
        <TripMapLoader pins={pins} />
      </div>
    </AppShell>
  );
}
