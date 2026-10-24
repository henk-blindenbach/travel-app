"use client";

import Link from "next/link";
import { openDocumentOfflineFirst } from "../../lib/offline-document";
import { planningItemSummaryLine } from "../../lib/planning-item-summary";
import { isSessionExpiredError, redirectAfterSessionExpired } from "../../lib/session-expired";
import { sortPlanningChronologically } from "../../lib/today-planning";

type Item = {
  id: string;
  trip_day_id: string;
  kind: string;
  title: string;
  location: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  arrives_on?: string | null;
  booking_reference: string | null;
  address: string | null;
  contact_phone: string | null;
  carrier?: string | null;
  flight_number?: string | null;
  departure_terminal?: string | null;
  arrival_terminal?: string | null;
  seat_number?: string | null;
  external_url?: string | null;
  duration_minutes?: number | null;
  sort_order?: number | null;
};

type Document = { id: string; title: string; planning_item_id: string | null; trip_day_id: string | null };

type Day = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null };

type Props = {
  tripId: string;
  day: Day;
  items: Item[];
  documents: Document[];
};

const labels: Record<string, string> = {
  flight: "Vlucht",
  stay: "Verblijf",
  accommodation: "Verblijf",
  transport: "Vervoer",
  activity: "Activiteit",
  permit: "Visum / permit",
};

function formatClock(value: string | null | undefined) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

export function TodayPlanning({ tripId, day, items, documents }: Props) {
  const open = async (id: string) => {
    try {
      await openDocumentOfflineFirst(id);
    } catch (error) {
      if (isSessionExpiredError(error)) {
        window.alert(error.message);
        redirectAfterSessionExpired(error.loginPath, 400);
      }
    }
  };

  const dayItems = sortPlanningChronologically(items.filter((item) => item.trip_day_id === day.id));

  return (
    <section className="today-planning">
      <p className="eyebrow blue">Planning · reisdag {day.day_number}</p>
      <h2>Vandaag op volgorde</h2>
      {dayItems.length ? (
        <div className="today-planning-list">
          {dayItems.map((item) => {
            const clock = formatClock(item.departure_time);
            return (
              <article key={item.id} className="today-planning-item">
                <div className="today-planning-meta">
                  <span>{labels[item.kind] || item.kind}</span>
                  {clock ? <time dateTime={clock}>{clock}</time> : <span className="today-planning-notime">—</span>}
                </div>
                <h3>{item.title}</h3>
                <p>{planningItemSummaryLine(item)}</p>
                {item.address ? (
                  <a href={"https://maps.apple.com/?q=" + encodeURIComponent(item.address)}>Navigeer naar adres ↗</a>
                ) : null}
                {item.external_url ? (
                  <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                    Open link ↗
                  </a>
                ) : null}
                {item.contact_phone ? <a href={"tel:" + item.contact_phone}>Bel accommodatie</a> : null}
                {documents
                  .filter((document) => document.planning_item_id === item.id)
                  .map((document) => (
                    <button type="button" key={document.id} onClick={() => void open(document.id)}>
                      {document.title} · openen
                    </button>
                  ))}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="today-planning-empty">Nog geen planningsitems voor vandaag.</p>
      )}
      <Link className="secondary-button" href={"/app/trips/" + tripId + "/plan#day-" + day.id}>
        Bekijk alle details
      </Link>
    </section>
  );
}
