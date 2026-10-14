import Link from "next/link";
import { AppShell } from "../../../../components/AppShell";
import { InterviewChat } from "../../../../components/journal/InterviewChat";
import { getFeaturedTrip } from "../../../../lib/travel-data";

export default async function Interview({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { days } = await getFeaturedTrip();
  const { day: dayId } = await searchParams;
  const day = days.find((candidate) => candidate.id === dayId) || days[0];
  return <AppShell active="today"><div className="interview-page"><Link className="back-link" href={`/app/journal/${day.id}`}>← Terug naar dagverslag</Link><p className="eyebrow blue">Reisdag {day.day_number} · {day.title}</p><h1>Vertel over vandaag.</h1><p className="interview-intro">Zeg het gewoon zoals je het aan vrienden zou vertellen. Ik vraag alleen door waar het leuk of handig is — de rest maak ik er als conceptverslag van.</p><InterviewChat tripDayId={day.id} initialQuestion="Wat was het eerste moment vandaag waarvan je dacht: dit wil ik onthouden?" /></div></AppShell>;
}
