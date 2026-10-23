import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { TripMapLoader } from "../../../../../components/map/TripMapLoader";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { countPinsByKind, getPrivateTripMapPins } from "../../../../../lib/trip-map-data";

export default async function TripMapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const journey = await getPrivateTrip(tripId);
  if (!journey) notFound();
  const pins = await getPrivateTripMapPins(tripId, journey.trip.slug);
  const counts = countPinsByKind(pins);

  return (
    <AppShell active="trips">
      <div className="planner-page trip-map-page">
        <Link className="back-link" href={`/app/trips/${tripId}/plan`}>← Terug naar planning</Link>
        <p className="eyebrow blue">{journey.trip.title}</p>
        <h1>Kaart</h1>
        <p className="journal-intro">
          Geplande dagen, planningonderdelen (hotels, activiteiten, …) en bezochte fotolocaties.
          Gepland en bezocht blijven bewust van elkaar te onderscheiden.
        </p>
        <div className="trip-map-legend" aria-label="Legenda">
          <span><i className="trip-map-swatch planned" /> Gepland ({counts.planned})</span>
          <span><i className="trip-map-swatch item" /> Planning ({counts.planning})</span>
          <span><i className="trip-map-swatch visited" /> Bezocht / foto ({counts.visited})</span>
        </div>
        <TripMapLoader pins={pins} />
      </div>
    </AppShell>
  );
}
