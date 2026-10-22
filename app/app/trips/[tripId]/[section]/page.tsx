import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { TripCoverControl } from "../../../../../components/trips/TripCoverControl";
import { TripVisibilityControl } from "../../../../../components/trips/TripVisibilityControl";
import { TripVisibilityHeader } from "../../../../../components/trips/TripVisibilityHeader";
import { TripJournalOverview, type JournalDay } from "../../../../../components/journal/TripJournalOverview";
import { TripPublicationOverview } from "../../../../../components/journal/TripPublicationOverview";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

const copy: Record<string, { title: string; text: string }> = {
  journal: {
    title: "Reisverslag",
    text: "Alle reisdagen op volgorde. Schrijf of open een dagverslag; publiceren blijft een bewuste volgende stap.",
  },
  photos: {
    title: "Foto’s",
    text: "Foto’s blijven gekoppeld aan reisdag en verslag. Het reisbrede foto-overzicht volgt op deze structuur.",
  },
  publish: {
    title: "Publiceren",
    text: "Kies bewust wanneer jullie reis zichtbaar mag zijn voor vrienden en familie.",
  },
};

export default async function TripSection({ params }: { params: Promise<{ tripId: string; section: string }> }) {
  const { tripId, section } = await params;
  if (section === "photos") redirect("/app/photos?trip=" + tripId);
  const journey = await getPrivateTrip(tripId);
  const content = copy[section];
  if (!journey || !content) notFound();

  let cover: { id: string; upload_status: string; updated_at: string } | null = null;
  let publicationDays: never[] = [];
  let journalDays: JournalDay[] = journey.days.map((day) => ({
    id: day.id,
    day_number: day.day_number,
    day_date: day.day_date,
    title: day.title,
    planned_location: day.planned_location,
    day_entries: null,
  }));

  if (hasSupabaseEnv() && (section === "publish" || section === "journal")) {
    try {
      const supabase = await createClient();
      if (section === "publish") {
        const [result, dayResult] = await Promise.all([
          supabase.from("trip_covers").select("id,upload_status,updated_at").eq("trip_id", tripId).maybeSingle(),
          supabase
            .from("trip_days")
            .select("id,day_number,day_date,title,day_entries(id,title,publication_status,social_captions,media_assets(id,is_public,upload_status))")
            .eq("trip_id", tripId)
            .order("day_number"),
        ]);
        cover = result.data;
        publicationDays = (dayResult.data || []) as never[];
      } else {
        const { data } = await supabase
          .from("trip_days")
          .select("id,day_number,day_date,title,planned_location,day_entries(id,title,publication_status)")
          .eq("trip_id", tripId)
          .order("day_number");
        if (data) journalDays = data as JournalDay[];
      }
    } catch {
      /* Controls and overview remain available if a row cannot be read yet. */
    }
  }

  return (
    <AppShell active="trips">
      <div className="planner-page">
        <Link className="back-link" href={"/app/trips/" + tripId + "/plan"}>
          ← Terug naar {journey.trip.title}
        </Link>
        <div className="trip-section-header">
          <div>
            <p className="eyebrow blue">{journey.trip.title}</p>
            <h1>{content.title}</h1>
            <p className="journal-intro">{content.text}</p>
          </div>
          {(section === "journal" || section === "publish") && (
            <TripVisibilityHeader
              tripId={tripId}
              initialVisibility={journey.trip.visibility || "private"}
            />
          )}
        </div>
        {section === "publish" ? (
          <>
            <TripVisibilityControl
              tripId={tripId}
              slug={journey.trip.slug}
              initialVisibility={journey.trip.visibility || "private"}
            />
            <TripCoverControl tripId={tripId} initialCover={cover} />
            <TripPublicationOverview tripSlug={journey.trip.slug} days={publicationDays} />
          </>
        ) : section === "journal" ? (
          <TripJournalOverview tripId={tripId} days={journalDays} />
        ) : (
          <Link className="secondary-button" href={"/app/trips/" + tripId + "/plan"}>
            Open reisplanner
          </Link>
        )}
      </div>
    </AppShell>
  );
}
