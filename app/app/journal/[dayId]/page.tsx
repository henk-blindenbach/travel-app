import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { DayEntryEditor } from "../../../../components/journal/DayEntryEditor";
import { findNextDayWithoutEntry, oneDayEntry, statusMeta } from "../../../../lib/journal-status";
import { getFeaturedTrip, getPrivateTrip } from "../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../lib/supabase/server";

export default async function JournalDay({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  let fallback = await getFeaturedTrip();
  let trip = fallback.trip;
  let day = fallback.days.find((item) => item.id === dayId);
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const result = await supabase
        .from("trip_days")
        .select("id,trip_id,day_number,day_date,title,planned_location,planned_route")
        .eq("id", dayId)
        .maybeSingle();
      if (result.data) {
        const journey = await getPrivateTrip(result.data.trip_id);
        if (journey) {
          trip = journey.trip;
          day = result.data;
        }
      }
    } catch {
      /* The fallback remains useful during local mock work. */
    }
  }
  if (!day) notFound();

  let entry = null;
  let assets: {
    id: string;
    original_filename: string;
    caption: string;
    sort_order: number;
    upload_status: "uploading" | "processing" | "ready" | "failed";
    is_public?: boolean;
    book_candidate?: boolean;
    book_favorite?: boolean;
  }[] = [];
  let nextEmptyDayId: string | null = null;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const [entryResult, daysResult] = await Promise.all([
        supabase
          .from("day_entries")
          .select(
            "id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n,actual_latitude,actual_longitude,social_captions,publication_status,media_assets(id,original_filename,caption,sort_order,upload_status,is_public,book_candidate,book_favorite)",
          )
          .eq("trip_day_id", day.id)
          .maybeSingle(),
        supabase
          .from("trip_days")
          .select("id,day_number,day_entries(id,publication_status)")
          .eq("trip_id", trip.id)
          .order("day_number"),
      ]);
      entry = entryResult.data;
      assets = (entryResult.data?.media_assets || []).sort((a, b) => a.sort_order - b.sort_order);
      const days = (daysResult.data || []).map((item) => ({
        id: item.id,
        day_number: item.day_number,
        day_entries: oneDayEntry(item.day_entries as { id: string; publication_status: string } | { id: string; publication_status: string }[] | null),
      }));
      nextEmptyDayId = findNextDayWithoutEntry(days, day.day_number)?.id ?? null;
    } catch {
      // The page remains useful while the journal migration is being deployed.
    }
  }

  const formattedDate = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${day.day_date}T12:00:00`));
  const journalHub = `/app/trips/${trip.id}/journal`;
  const chip = statusMeta(entry);

  return (
    <AppShell active="trips">
      <div className="journal-page">
        <p className="eyebrow blue">
          Reisdag {day.day_number} · {formattedDate}
        </p>
        <h1>{day.title || "Dagverslag"}</h1>
        <p className="journal-intro">
          Leg de dag vast wanneer het uitkomt. Het verslag en de foto’s zijn alleen zichtbaar voor jullie reisgenoten.
        </p>
        <p className="journal-day-status">
          Status: <span className={`journal-status journal-status-${chip.key}`}>{chip.label}</span>
        </p>
        <DayEntryEditor
          tripDayId={day.id}
          tripSlug={trip.slug}
          tripVisibility={trip.visibility || "private"}
          dayNumber={day.day_number}
          dayTitle={day.title || ""}
          plannedLocation={day.planned_location}
          journalHub={journalHub}
          initialEntry={entry}
          initialAssets={assets}
          nextEmptyDayId={nextEmptyDayId}
        />
      </div>
    </AppShell>
  );
}
