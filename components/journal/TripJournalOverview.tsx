import Link from "next/link";

type DayEntry = { id: string; title: string | null; publication_status: "draft" | "published" };

export type JournalDay = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  planned_location: string | null;
  day_entries: DayEntry[] | null;
};

function statusMeta(entry: DayEntry | undefined) {
  if (!entry) return { key: "empty" as const, label: "Geen verslag", action: "Schrijf verslag" };
  if (entry.publication_status === "published") return { key: "published" as const, label: "Gepubliceerd", action: "Open verslag" };
  return { key: "draft" as const, label: "Concept", action: "Open concept" };
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

  const published = days.filter((day) => day.day_entries?.[0]?.publication_status === "published").length;
  const drafts = days.filter((day) => day.day_entries?.[0]?.publication_status === "draft").length;
  const empty = days.length - published - drafts;

  return (
    <section className="planner-card trip-journal-overview">
      <p className="eyebrow blue">Chronologisch overzicht</p>
      <h2>
        {days.length} {days.length === 1 ? "reisdag" : "reisdagen"}
      </h2>
      <p>
        {published} gepubliceerd · {drafts} {drafts === 1 ? "concept" : "concepten"} · {empty} zonder verslag. Open een
        dag om te schrijven, bewerken of verder te publiceren.
      </p>
      <div className="publication-day-list journal-day-list">
        {days.map((day) => {
          const entry = day.day_entries?.[0];
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
