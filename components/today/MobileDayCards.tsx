"use client";

import Link from "next/link";

type Item = { id: string; trip_day_id: string; kind: string; title: string; location: string | null; departure_time: string | null; arrival_time: string | null; booking_reference: string | null; address: string | null; contact_phone: string | null };
type Document = { id: string; title: string; planning_item_id: string | null; trip_day_id: string | null };
type Day = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null };
const labels: Record<string, string> = { flight: "Vlucht", stay: "Verblijf", transport: "Vervoer", activity: "Activiteit" };

export function MobileDayCards({ tripId, today, tomorrow, items, documents }: { tripId: string; today: Day; tomorrow: Day | null; items: Item[]; documents: Document[] }) {
  const open = async (id: string) => { try { const response = await fetch("/api/documents/" + id); if (response.status === 401) { window.location.assign("/login?next=" + encodeURIComponent(window.location.pathname)); return; } const data = await response.json().catch(() => ({})); if (!response.ok || !data.signedUrl) return; window.open(data.signedUrl, "_blank", "noopener,noreferrer"); } catch { const offline = await caches.match("/offline-documents/" + id).catch(() => undefined); if (offline) window.open(URL.createObjectURL(await offline.blob()), "_blank", "noopener,noreferrer"); } };
  const card = (day: Day, heading: string) => <section className="mobile-day-card"><p className="eyebrow blue">{heading} · reisdag {day.day_number}</p><h2>{day.title || day.planned_location || "Reisdag"}</h2>{items.filter((item) => item.trip_day_id === day.id).map((item) => <article key={item.id}><span>{labels[item.kind] || item.kind}</span><h3>{item.title}</h3><p>{[item.departure_time, item.arrival_time, item.location, item.booking_reference].filter(Boolean).join(" · ") || "Details in de planning"}</p>{item.address ? <a href={"https://maps.apple.com/?q=" + encodeURIComponent(item.address)}>Navigeer naar adres ↗</a> : null}{item.contact_phone ? <a href={"tel:" + item.contact_phone}>Bel accommodatie</a> : null}{documents.filter((document) => document.planning_item_id === item.id || (document.trip_day_id === day.id && !document.planning_item_id)).map((document) => <button type="button" key={document.id} onClick={() => void open(document.id)}>📄 {document.title} · openen</button>)}</article>)}<Link className="secondary-button" href={"/app/trips/" + tripId + "/plan#day-" + day.id}>Bekijk alle details</Link></section>;
  return <div className="mobile-day-cards">{card(today, "Vandaag")}{tomorrow ? card(tomorrow, "Morgen") : null}</div>;
}
