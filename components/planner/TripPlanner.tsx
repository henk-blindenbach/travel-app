"use client";

import { ChangeEvent, useRef, useState } from "react";

type Day = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null };
type Item = { id: string; trip_day_id: string; kind: string; status: string; title: string; details: string; location: string; starts_at: string | null };
type Document = { id: string; trip_day_id: string; document_type: string; title: string; original_filename: string; upload_status: string };
type Props = { tripId: string; days: Day[]; initialItems: Item[]; initialDocuments: Document[] };

const labels: Record<string, string> = { accommodation: "Verblijf", flight: "Vlucht", transport: "Vervoer", activity: "Activiteit", note: "Notitie", hotel_confirmation: "Hotelbevestiging", visa: "Visum", flight_ticket: "Vliegticket", transport_ticket: "Vervoersticket", excursion_ticket: "Excursieticket", insurance: "Verzekering", other: "Ander document" };

async function json(response: Response) { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Er ging iets mis."); return data; }

export function TripPlanner({ tripId, days, initialItems, initialDocuments }: Props) {
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id || "");
  const [items, setItems] = useState(initialItems);
  const [documents, setDocuments] = useState(initialDocuments);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState("activity");
  const [status, setStatus] = useState("planned");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [documentType, setDocumentType] = useState("other");
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedDay = days.find((day) => day.id === selectedDayId);
  const dayItems = items.filter((item) => item.trip_day_id === selectedDayId);
  const dayDocuments = documents.filter((document) => document.trip_day_id === selectedDayId);

  async function addItem() {
    if (!selectedDayId || !title.trim()) { setMessage("Kies een dag en geef het onderdeel een titel."); return; }
    setSaving(true); setMessage("");
    try {
      const data = await json(await fetch("/api/planning-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, tripDayId: selectedDayId, kind, status, title, location, details }) }));
      setItems((current) => [...current, data.item]); setTitle(""); setLocation(""); setDetails(""); setMessage("Planningonderdeel opgeslagen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt."); } finally { setSaving(false); }
  }

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedDayId) return;
    if (file.size > 25 * 1024 * 1024) { setMessage("Documenten mogen maximaal 25 MB zijn."); return; }
    setSaving(true); setMessage("");
    try {
      const init = await json(await fetch("/api/documents/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, tripDayId: selectedDayId, documentType, title: file.name.replace(/\.[^.]+$/, ""), filename: file.name, mimeType: file.type || "application/pdf", byteSize: file.size }) }));
      const upload = await fetch(init.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/pdf" }, body: file });
      if (!upload.ok) throw new Error("Het bestand kon niet worden geüpload.");
      const complete = await json(await fetch("/api/documents/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: init.document.id }) }));
      setDocuments((current) => [...current, complete.document]); setMessage("Document veilig opgeslagen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload mislukt."); } finally { setSaving(false); event.target.value = ""; }
  }

  async function openDocument(documentId: string) {
    try { const data = await json(await fetch(`/api/documents/${documentId}`)); window.open(data.signedUrl, "_blank", "noopener,noreferrer"); }
    catch { setMessage("Document kon niet worden geopend."); }
  }

  return <div className="planner-layout"><aside className="planner-days"><p className="eyebrow blue">Reisdagen</p>{days.map((day) => <button key={day.id} type="button" className={day.id === selectedDayId ? "planner-day active" : "planner-day"} onClick={() => setSelectedDayId(day.id)}><span>Dag {day.day_number}</span><b>{day.title || day.planned_location || "Reisdag"}</b><small>{new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(new Date(`${day.day_date}T12:00:00`))}</small></button>)}</aside><div className="planner-detail"><p className="eyebrow blue">{selectedDay ? `Dag ${selectedDay.day_number}` : "Planning"}</p><h2>{selectedDay?.title || selectedDay?.planned_location || "Kies een reisdag"}</h2><p className="planner-subtitle">Plan wat jullie doen en bewaar de documenten die je die dag nodig hebt.</p>{message ? <p className="form-message" role="status">{message}</p> : null}<section className="planner-card"><h3>Planning</h3>{dayItems.length ? <div className="planning-list">{dayItems.map((item) => <article key={item.id}><span className={`planning-status ${item.status}`}>{item.status === "confirmed" ? "Bevestigd" : item.status === "planned" ? "Gepland" : "Optie"}</span><b>{labels[item.kind]} · {item.title}</b>{item.location ? <small>{item.location}</small> : null}{item.details ? <p>{item.details}</p> : null}</article>)}</div> : <p className="planner-empty">Nog niets gepland voor deze dag.</p>}<div className="planner-form"><select value={kind} onChange={(event) => setKind(event.target.value)}>{["accommodation", "flight", "transport", "activity", "note"].map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="option">Optie</option><option value="planned">Gepland</option><option value="confirmed">Bevestigd</option></select><input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Bijvoorbeeld: Hotel Nomad" /><input value={location} maxLength={200} onChange={(event) => setLocation(event.target.value)} placeholder="Plaats of vertrekpunt" /><textarea value={details} maxLength={4000} onChange={(event) => setDetails(event.target.value)} placeholder="Praktische notitie, tijd of afspraak" rows={3} /><button className="primary-button blue-button" type="button" disabled={saving} onClick={() => void addItem()}>Onderdeel toevoegen</button></div></section><section className="planner-card"><div className="planner-card-heading"><div><h3>Documenten</h3><p>Privé en snel terug te vinden.</p></div><div><select aria-label="Documenttype" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{["hotel_confirmation", "visa", "flight_ticket", "transport_ticket", "excursion_ticket", "insurance", "other"].map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select><button className="secondary-button" type="button" disabled={saving} onClick={() => fileRef.current?.click()}>Document uploaden</button></div></div><input ref={fileRef} className="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.heic,.heif,.docx,.xlsx" onChange={(event) => void uploadDocument(event)} />{dayDocuments.length ? <div className="document-list">{dayDocuments.map((document) => <button type="button" key={document.id} onClick={() => void openDocument(document.id)}><span>{labels[document.document_type]}</span><b>{document.title}</b><small>{document.original_filename} · openen ↗</small></button>)}</div> : <p className="planner-empty">Nog geen documenten voor deze dag.</p>}</section></div></div>;
}
