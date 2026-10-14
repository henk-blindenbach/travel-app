"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

type Day = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null };
type Document = { id: string; trip_day_id: string | null; document_type: string; title: string; original_filename: string; upload_status: string };
type Props = { tripId: string; days: Day[]; initialDocuments: Document[] };

const types = ["hotel_confirmation", "visa", "flight_ticket", "transport_ticket", "excursion_ticket", "insurance", "other"];
const labels: Record<string, string> = { hotel_confirmation: "Hotelbevestiging", visa: "Visum", flight_ticket: "Vliegticket", transport_ticket: "Vervoersticket", excursion_ticket: "Excursieticket", insurance: "Verzekering", other: "Ander document" };

async function json(response: Response) { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Er ging iets mis."); return data; }

export function DocumentLibrary({ tripId, days, initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentType, setDocumentType] = useState("other");
  const [tripDayId, setTripDayId] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDayId, setFilterDayId] = useState("all");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const filteredDocuments = useMemo(() => documents.filter((document) => (filterType === "all" || document.document_type === filterType) && (filterDayId === "all" || (filterDayId === "none" ? document.trip_day_id === null : document.trip_day_id === filterDayId))), [documents, filterDayId, filterType]);
  const dayLabel = (id: string | null) => { const day = days.find((entry) => entry.id === id); return day ? `Dag ${day.day_number} · ${day.title || day.planned_location || "Reisdag"}` : "Hele reis"; };

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setMessage("Documenten mogen maximaal 25 MB zijn."); return; }
    setSaving(true); setMessage("");
    try {
      const init = await json(await fetch("/api/documents/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, tripDayId: tripDayId || null, documentType, title: file.name.replace(/\.[^.]+$/, ""), filename: file.name, mimeType: file.type, byteSize: file.size }) }));
      const response = await fetch(init.uploadUrl, { method: "PUT", headers: { "Content-Type": init.mimeType }, body: file });
      if (!response.ok) throw new Error("Het bestand kon niet worden geüpload.");
      const complete = await json(await fetch("/api/documents/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: init.document.id }) }));
      setDocuments((current) => [complete.document, ...current]); setMessage("Document veilig opgeslagen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload mislukt."); } finally { setSaving(false); event.target.value = ""; }
  }

  async function openDocument(documentId: string) {
    try { const data = await json(await fetch(`/api/documents/${documentId}`)); window.open(data.signedUrl, "_blank", "noopener,noreferrer"); }
    catch { setMessage("Document kon niet worden geopend."); }
  }

  return <div className="document-library"><section className="planner-card"><div className="planner-card-heading"><div><h2>Documenten toevoegen</h2><p>Koppel ze aan een dag, of bewaar ze voor de hele reis.</p></div><button className="secondary-button" type="button" disabled={saving} onClick={() => fileRef.current?.click()}>Document uploaden</button></div><div className="document-library-controls"><label>Type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{types.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label><label>Reisdag<select value={tripDayId} onChange={(event) => setTripDayId(event.target.value)}><option value="">Hele reis (geen specifieke dag)</option>{days.map((day) => <option key={day.id} value={day.id}>{dayLabel(day.id)}</option>)}</select></label></div><input ref={fileRef} className="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.heic,.heif,.docx,.xlsx" onChange={(event) => void upload(event)} />{message ? <p className="form-message" role="status">{message}</p> : null}</section><section className="planner-card"><div className="planner-card-heading"><div><h2>Alle documenten</h2><p>{filteredDocuments.length} {filteredDocuments.length === 1 ? "document" : "documenten"} zichtbaar</p></div></div><div className="document-library-controls filter-controls"><label>Filter op type<select value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="all">Alle types</option>{types.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label><label>Filter op dag<select value={filterDayId} onChange={(event) => setFilterDayId(event.target.value)}><option value="all">Alle dagen en reisdocumenten</option><option value="none">Alleen hele reis</option>{days.map((day) => <option key={day.id} value={day.id}>{dayLabel(day.id)}</option>)}</select></label></div>{filteredDocuments.length ? <div className="document-list">{filteredDocuments.map((document) => <button type="button" key={document.id} onClick={() => void openDocument(document.id)}><span>{labels[document.document_type]}</span><b>{document.title}</b><small>{dayLabel(document.trip_day_id)} · {document.original_filename} · openen ↗</small></button>)}</div> : <p className="planner-empty">Geen documenten binnen deze selectie.</p>}</section></div>;
}
