import { AppShell } from "../../../components/AppShell";

export default async function Placeholder({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const labels: Record<string, [string, string]> = { trips: ["Reis", "De reisplanner komt hier samen."], photos: ["Foto’s", "Jouw geselecteerde reisfoto’s verschijnen hier."], more: ["Meer", "Instellingen en documenten. Fotoboek zit per reis onder Reis → Fotoboek."] };
  const [title, description] = labels[section] ?? ["Op reis", "Deze pagina is in voorbereiding."];
  return <AppShell active={section}><div className="placeholder-page"><p className="eyebrow blue">Binnenkort</p><h1>{title}</h1><p>{description}</p></div></AppShell>;
}
