"use client";

import Link from "next/link";
import { openDocumentOfflineFirst } from "../../lib/offline-document";
import { planningItemSummaryLine } from "../../lib/planning-item-summary";
import { isSessionExpiredError, redirectAfterSessionExpired } from "../../lib/session-expired";

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
};
type Document = { id: string; title: string; planning_item_id: string | null; trip_day_id: string | null };
type Props = { tripId: string; today: Day; tomorrow: Day | null; items: Item[]; documents: Document[]; headings?: { first: string; second: string } };
type Day = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null };
const labels: Record<string, string> = { flight: "Vlucht", stay: "Verblijf", accommodation: "Verblijf", transport: "Vervoer", activity: "Activiteit", permit: "Visum / permit" };

export function MobileDayCards({ tripId, today, tomorrow, items, documents, headings = { first: "Vandaag", second: "Morgen" } }: Props) {
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
  const card = (day: Day, heading: string) => (
    <section className="mobile-day-card">
      <p className="eyebrow blue">
        {heading} · reisdag {day.day_number}
      </p>
      <h2>{day.title || day.planned_location || "Reisdag"}</h2>
      {items
        .filter((item) => item.trip_day_id === day.id)
        .map((item) => (
          <article key={item.id}>
            <span>{labels[item.kind] || item.kind}</span>
            <h3>{item.title}</h3>
            <p>{planningItemSummaryLine(item)}</p>
            {item.address ? <a href={"https://maps.apple.com/?q=" + encodeURIComponent(item.address)}>Navigeer naar adres ↗</a> : null}
            {item.external_url ? (
              <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                Open link ↗
              </a>
            ) : null}
            {item.contact_phone ? <a href={"tel:" + item.contact_phone}>Bel accommodatie</a> : null}
            {documents
              .filter((document) => document.planning_item_id === item.id || (document.trip_day_id === day.id && !document.planning_item_id))
              .map((document) => (
                <button type="button" key={document.id} onClick={() => void open(document.id)}>
                  📄 {document.title} · openen
                </button>
              ))}
          </article>
        ))}
      <Link className="secondary-button" href={"/app/trips/" + tripId + "/plan#day-" + day.id}>
        Bekijk alle details
      </Link>
    </section>
  );
  return (
    <div className="mobile-day-cards">
      {card(today, headings.first)}
      {tomorrow ? card(tomorrow, headings.second) : null}
    </div>
  );
}
