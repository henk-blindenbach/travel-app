import Link from "next/link";
import { AppShell } from "../../../../components/AppShell";
import { NewTripForm } from "../../../../components/trips/NewTripForm";
export default function NewTrip() { return <AppShell active="trips"><div className="planner-page"><Link className="back-link" href="/app/trips">← Terug naar alle reizen</Link><p className="eyebrow blue">Nieuwe reis</p><h1>Waar gaan jullie heen?</h1><p className="journal-intro">De reis start privé. We maken meteen de reisdagen klaar, zodat jullie kunnen plannen en later documenten en verhalen aan de juiste dag koppelen.</p><NewTripForm /></div></AppShell>; }
