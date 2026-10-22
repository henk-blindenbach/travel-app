import Link from "next/link";
import {
  countJournalStatuses,
  findNextDayWithoutEntry,
  oneDayEntry,
  statusMeta,
  type JournalDayLike,
} from "../../lib/journal-status";

type DayEntry = { id: string; title: string | null; publication_status: "draft" | "ready" | "published" };

export type JournalDay = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  planned_location: string | null;
  day_entries: DayEntry | DayEntry[] | null;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export function TripJournalOverview({ tripId, days }: { tripId: string; days: JournalDay[] }) {
  if (!days.length) {
    return (
      <section className="planner-card trip-journal-overview">
        <p className="eyebrow blue">Reisverslag</p>
        <h2>Nog geen reisdagen</h2>
        <p>Zodra deze reis dagen heeft, verschijnen ze hier chronologisch — met status of er al een verslag is.</p>
        <Link className="primary-button blue-button" href={`/app/trips/${tripId}/plan`}>
          Open reisplanner
        </Link>
      </section>
    );
  }

  const { published, ready, drafts, empty } = countJournalStatuses(days as JournalDayLike[]);
  const nextEmpty = findNextDayWithoutEntry(days as JournalDayLike[], 0);

  return (
    <section className="planner-card trip-journal-overview">
      <p className="eyebrow blue">Chronologisch overzicht</p>
      <h2>
        {days.length} {days.length === 1 ? "reisdag" : "reisdagen"}
      </h2>
      <p>
        {plural(published, "gepubliceerd", "gepubliceerd")} · {plural(ready, "klaar", "klaar")} ·{" "}
        {plural(drafts, "concept", "concepten")} · {plural(empty, "zonder verslag", "zonder verslag")}. Open een dag
        om te schrijven, bewerken of verder te publiceren.
      </p>
      {nextEmpty ? (
        <Link className="primary-button blue-button journal-next-empty" href={`/app/journal/${nextEmpty.id}`}>
          Volgende dag zonder verslag →
        </Link>
      ) : null}
      <div className="publication-day-list journal-day-list">
        {days.map((day) => {
          const entry = oneDayEntry(day.day_entries);
          const status = statusMeta(entry);
          const dateLabel = new Intl.DateTimeFormat("nl-NL", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(new Date(`${day.day_date}T12:00:00`));
          return (
            <article key={day.id} className={`journal-day-row status-${status.key}`}>
              <div>
                <span>
                  Dag {day.day_number} · {dateLabel}
                </span>
                <h3>{entry?.title || day.title || day.planned_location || "Nog geen titel"}</h3>
                <small>
                  <span className={`journal-status journal-status-${status.key}`}>{status.label}</span>
                  {day.planned_location && !entry?.title ? ` · ${day.planned_location}` : null}
                </small>
              </div>
              <Link className="secondary-button" href={`/app/journal/${day.id}`}>
                {status.action}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
