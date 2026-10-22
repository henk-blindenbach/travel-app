"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { documentTypeLabel, filterDocumentsBySearch } from "../../lib/document-search";
import {
  listOfflineDocumentIds,
  offlineCacheName,
  offlineDocumentUrl,
  openDocumentOfflineFirst,
} from "../../lib/offline-document";

type Day = { id: string; day_number: number; day_date: string; title: string | null; planned_location: string | null };
type PlanningItem = {
  id: string;
  title: string;
  kind: string;
  trip_day_id: string;
  flight_number?: string | null;
  booking_reference?: string | null;
  carrier?: string | null;
  ticket_number?: string | null;
};
type Document = {
  id: string;
  trip_day_id: string | null;
  document_type: string;
  title: string;
  original_filename: string;
  upload_status: string;
  planningItemIds: string[];
  is_pinned?: boolean;
};
type Props = { tripId: string; days: Day[]; planningItems: PlanningItem[]; initialDocuments: Document[] };

const types = ["hotel_confirmation", "visa", "flight_ticket", "transport_ticket", "excursion_ticket", "insurance", "other"];
const kindLabels: Record<string, string> = { flight: "Vlucht", stay: "Verblijf", accommodation: "Verblijf", transport: "Vervoer", activity: "Activiteit" };

async function json(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.location.assign("/login?next=" + encodeURIComponent(window.location.pathname));
    throw new Error(data.error || "Er ging iets mis.");
  }
  return data;
}

export function DocumentLibrary({ tripId, days, planningItems, initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentType, setDocumentType] = useState("other");
  const [tripDayId, setTripDayId] = useState("");
  const [planningItemIds, setPlanningItemIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [filterDayId, setFilterDayId] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editType, setEditType] = useState("other");
  const [editDayId, setEditDayId] = useState("");
  const [editItemIds, setEditItemIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const itemsById = useMemo(() => Object.fromEntries(planningItems.map((item) => [item.id, item])), [planningItems]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      listOfflineDocumentIds(tripId).then((ids) => {
        if (!cancelled) setOfflineIds(ids);
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("nos-offline-documents-updated", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("nos-offline-documents-updated", refresh);
    };
  }, [tripId]);

  const filteredDocuments = useMemo(() => {
    const byFilter = documents.filter(
      (document) =>
        (filterType === "all" || document.document_type === filterType) &&
        (filterDayId === "all" || (filterDayId === "none" ? document.trip_day_id === null : document.trip_day_id === filterDayId)),
    );
    return filterDocumentsBySearch(byFilter, search, itemsById);
  }, [documents, filterDayId, filterType, itemsById, search]);

  const pinnedDocuments = useMemo(
    () => filteredDocuments.filter((document) => document.is_pinned).sort((a, b) => a.title.localeCompare(b.title, "nl")),
    [filteredDocuments],
  );
  const unpinnedDocuments = useMemo(
    () => filteredDocuments.filter((document) => !document.is_pinned),
    [filteredDocuments],
  );

  const dayLabel = (id: string | null) => {
    const day = days.find((entry) => entry.id === id);
    return day ? "Dag " + day.day_number + " · " + (day.title || day.planned_location || "Reisdag") : "Hele reis";
  };
  const itemLabel = (id: string) => {
    const item = planningItems.find((entry) => entry.id === id);
    return item ? (kindLabels[item.kind] || item.kind) + " · " + item.title : "Planningonderdeel";
  };
  const selectableItems = tripDayId ? planningItems.filter((item) => item.trip_day_id === tripDayId) : planningItems;
  const toggle = (id: string, setter: (next: string[]) => void, values: string[]) =>
    setter(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);

  async function uploadFiles(files: FileList | File[]) {
    const list = [...files];
    if (!list.length) return;
    for (const file of list) {
      if (file.size > 25 * 1024 * 1024) {
        setMessage("Documenten mogen maximaal 25 MB zijn.");
        return;
      }
    }
    setSaving(true);
    setMessage("");
    let uploaded = 0;
    try {
      for (const file of list) {
        const init = await json(
          await fetch("/api/documents/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId,
              tripDayId: tripDayId || null,
              planningItemIds,
              documentType,
              title: file.name.replace(/\.[^.]+$/, ""),
              filename: file.name,
              mimeType: file.type,
              byteSize: file.size,
            }),
          }),
        );
        const response = await fetch(init.uploadUrl, { method: "PUT", headers: { "Content-Type": init.mimeType }, body: file });
        if (!response.ok) throw new Error("Het bestand kon niet worden geüpload.");
        const complete = await json(
          await fetch("/api/documents/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: init.document.id }),
          }),
        );
        setDocuments((current) => [{ ...complete.document, planningItemIds, is_pinned: false }, ...current]);
        uploaded += 1;
      }
      setMessage(uploaded === 1 ? "Document veilig opgeslagen." : uploaded + " documenten veilig opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    await uploadFiles(files);
    event.target.value = "";
  }

  async function openDocument(documentId: string) {
    try {
      const result = await openDocumentOfflineFirst(documentId);
      if (result.source === "offline") setMessage("Offline kopie geopend.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document kon niet worden geopend.");
    }
  }

  function startEditing(document: Document) {
    setEditingId(document.id);
    setTitle(document.title);
    setEditType(document.document_type);
    setEditDayId(document.trip_day_id || "");
    setEditItemIds(document.planningItemIds);
  }

  async function saveDocument(documentId: string) {
    setSaving(true);
    setMessage("");
    try {
      const data = await json(
        await fetch("/api/documents/" + documentId + "/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            planningItemIds: editItemIds,
            documentType: editType,
            tripDayId: editDayId || null,
          }),
        }),
      );
      setDocuments((current) =>
        current.map((document) =>
          document.id === documentId
            ? {
                ...document,
                title: data.title,
                planningItemIds: data.planningItemIds,
                document_type: data.documentType ?? document.document_type,
                trip_day_id: data.tripDayId !== undefined ? data.tripDayId : document.trip_day_id,
              }
            : document,
        ),
      );
      setEditingId(null);
      setMessage("Document bijgewerkt.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document kon niet worden bijgewerkt.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(document: Document) {
    const next = !document.is_pinned;
    setSaving(true);
    setMessage("");
    try {
      await json(
        await fetch("/api/documents/" + document.id + "/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: document.title,
            planningItemIds: document.planningItemIds,
            isPinned: next,
          }),
        }),
      );
      setDocuments((current) => current.map((entry) => (entry.id === document.id ? { ...entry, is_pinned: next } : entry)));
      setMessage(next ? "Document vastgezet bij Snel bij de hand." : "Document niet langer vastgezet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vastzetten mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDocument(documentId: string, documentTitle: string) {
    if (!window.confirm(`Document “${documentTitle}” definitief verwijderen? Het bestand, de koppelingen en de offline kopie gaan weg.`)) return;
    setSaving(true);
    setMessage("");
    try {
      await json(await fetch("/api/documents/" + documentId, { method: "DELETE" }));
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setEditingId(null);
      try {
        const cache = await caches.open(offlineCacheName(tripId));
        await cache.delete(offlineDocumentUrl(documentId));
      } catch {
        /* offline cache optional */
      }
      setOfflineIds((current) => {
        const next = new Set(current);
        next.delete(documentId);
        return next;
      });
      setMessage("Document verwijderd.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document kon niet worden verwijderd.");
    } finally {
      setSaving(false);
    }
  }

  function renderCard(document: Document) {
    return (
      <article className={"document-card" + (document.is_pinned ? " document-card-pinned" : "")} key={document.id}>
        <button className="document-open" type="button" onClick={() => void openDocument(document.id)}>
          <span>{documentTypeLabel(document.document_type)}</span>
          <b>{document.title}</b>
          <small>
            {dayLabel(document.trip_day_id)} · {document.original_filename}
          </small>
          {document.planningItemIds.length ? (
            <em>Gekoppeld aan: {document.planningItemIds.map(itemLabel).join(" · ")}</em>
          ) : (
            <em>Niet aan een onderdeel gekoppeld</em>
          )}
          {offlineIds.has(document.id) ? <em className="offline-badge">offline beschikbaar ✓</em> : null}
          <strong>Open document ↗</strong>
        </button>
        <div className="document-card-actions">
          <button className="document-edit" type="button" onClick={() => startEditing(document)}>
            Bewerken
          </button>
          <button className="document-pin" type="button" disabled={saving} onClick={() => void togglePin(document)}>
            {document.is_pinned ? "Losmaken" : "Vastzetten"}
          </button>
        </div>
        {editingId === document.id ? (
          <div className="document-editor">
            <label>
              Titel
              <input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Type
              <select value={editType} onChange={(event) => setEditType(event.target.value)}>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {documentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reisdag
              <select value={editDayId} onChange={(event) => setEditDayId(event.target.value)}>
                <option value="">Hele reis (geen specifieke dag)</option>
                {days.map((day) => (
                  <option key={day.id} value={day.id}>
                    {dayLabel(day.id)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Koppel aan onderdelen</legend>
              {planningItems.map((item) => (
                <label key={item.id}>
                  <input type="checkbox" checked={editItemIds.includes(item.id)} onChange={() => toggle(item.id, setEditItemIds, editItemIds)} />{" "}
                  {dayLabel(item.trip_day_id)} · {itemLabel(item.id)}
                </label>
              ))}
            </fieldset>
            <div>
              <button className="primary-button blue-button" disabled={saving || !title.trim()} type="button" onClick={() => void saveDocument(document.id)}>
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
              <button className="secondary-button" type="button" onClick={() => setEditingId(null)}>
                Annuleren
              </button>
              <button className="secondary-button" type="button" disabled={saving} onClick={() => void deleteDocument(document.id, document.title)}>
                Verwijderen
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="document-library">
      <section className="planner-card">
        <div className="planner-card-heading">
          <div>
            <h2>Alle documenten</h2>
            <p>
              {filteredDocuments.length} {filteredDocuments.length === 1 ? "document" : "documenten"} zichtbaar
            </p>
          </div>
          <button className="secondary-button" type="button" onClick={() => fileRef.current?.click()}>
            + Document uploaden
          </button>
        </div>
        <div className="document-library-controls filter-controls">
          <label className="document-search">
            Zoeken
            <input
              type="search"
              value={search}
              placeholder="Bijv. KL0871, Henk, visum, ZCJINK…"
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
            />
          </label>
          <label>
            Filter op type
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="all">Alle types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {documentTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filter op dag
            <select value={filterDayId} onChange={(event) => setFilterDayId(event.target.value)}>
              <option value="all">Alle dagen en reisdocumenten</option>
              <option value="none">Alleen hele reis</option>
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  {dayLabel(day.id)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {pinnedDocuments.length ? (
          <div className="document-pinned-section">
            <h3>Snel bij de hand</h3>
            <p>Paspoorten, visa, verzekering en boardingpasses die je vastzet.</p>
            <div className="document-list">{pinnedDocuments.map(renderCard)}</div>
          </div>
        ) : null}

        {unpinnedDocuments.length ? (
          <div className="document-list">{unpinnedDocuments.map(renderCard)}</div>
        ) : filteredDocuments.length === 0 ? (
          <p className="planner-empty">Geen documenten binnen deze selectie.</p>
        ) : null}
      </section>

      <section className="planner-card document-upload-card">
        <div className="planner-card-heading">
          <div>
            <h2>Document toevoegen</h2>
            <p>Kies één of meerdere bestanden. Type en reisdag kun je daarna in Bewerken aanpassen.</p>
          </div>
        </div>
        <div className="document-library-controls">
          <label>
            Type
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {documentTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reisdag
            <select
              value={tripDayId}
              onChange={(event) => {
                setTripDayId(event.target.value);
                setPlanningItemIds([]);
              }}
            >
              <option value="">Hele reis (geen specifieke dag)</option>
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  {dayLabel(day.id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectableItems.length ? (
          <fieldset className="document-item-picker">
            <legend>Gekoppelde onderdelen (optioneel)</legend>
            {selectableItems.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={planningItemIds.includes(item.id)}
                  onChange={() => toggle(item.id, setPlanningItemIds, planningItemIds)}
                />{" "}
                {dayLabel(item.trip_day_id)} · {itemLabel(item.id)}
              </label>
            ))}
          </fieldset>
        ) : null}
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.heic,.heif,.docx,.xlsx"
          onChange={(event) => void onFileChange(event)}
        />
        <button className="primary-button blue-button" type="button" disabled={saving} onClick={() => fileRef.current?.click()}>
          {saving ? "Uploaden…" : "Bestanden kiezen en uploaden"}
        </button>
        {message ? (
          <p className="form-message" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
