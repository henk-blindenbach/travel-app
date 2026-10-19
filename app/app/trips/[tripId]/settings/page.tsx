import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { EditTripForm } from "../../../../../components/trips/EditTripForm";
import { getPrivateTrip } from "../../../../../lib/travel-data";

export default async function TripSettings({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const journey = await getPrivateTrip(tripId);
  if (!journey) notFound();

  return (
    <AppShell active="trips">
      <div className="planner-page">
        <Link className="back-link" href={`/app/trips/${tripId}/plan`}>
          ← Terug naar {journey.trip.title}
        </Link>
        <p className="eyebrow blue">{journey.trip.title}</p>
        <h1>Reis bewerken</h1>
        <p className="journal-intro">
          Pas naam, data, fase en reizigers aan. Zichtbaarheid en omslagfoto blijven op de publiceren-pagina.
        </p>
        <EditTripForm trip={journey.trip} />
      </div>
    </AppShell>
  );
}
