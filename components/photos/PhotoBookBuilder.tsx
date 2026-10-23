"use client";

import { useEffect, useMemo, useState } from "react";

export type CandidatePhoto = {
  id: string;
  original_filename: string;
  caption: string;
  day_number: number;
  day_title: string | null;
  book_candidate: boolean;
  book_favorite: boolean;
};

type BookSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  sku: string;
  copies: number;
  destination_country_code: string;
  shipping_method: string;
  recipient: Record<string, unknown>;
  prodigi_order_id: string | null;
  prodigi_status: string | null;
  last_error: string | null;
  intro_text?: string | null;
  studio_project_id?: string | null;
  studio_preview_url?: string | null;
  studio_status?: string | null;
  studio_template_id?: string | null;
  preview_acknowledged_at?: string | null;
  updated_at: string;
};

type BookItem = {
  id: string;
  media_asset_id: string;
  sort_order: number;
};

type RecipientForm = {
  name: string;
  email: string;
  phoneNumber: string;
  line1: string;
  line2: string;
  postalOrZipCode: string;
  townOrCity: string;
  countryCode: string;
  stateOrCounty: string;
};

type ProdigiStatus = {
  configured: boolean;
  env: string;
  baseUrl: string;
  defaultSku: string;
  studioTemplateId: string | null;
  studioConfigured: boolean;
  studioTemplateFromEnv?: boolean;
  studioBaseUrl: string;
};

const emptyRecipient: RecipientForm = {
  name: "",
  email: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  postalOrZipCode: "",
  townOrCity: "",
  countryCode: "PT",
  stateOrCounty: "",
};

function recipientFromBook(raw: Record<string, unknown> | null | undefined): RecipientForm {
  const address = raw?.address && typeof raw.address === "object" ? (raw.address as Record<string, unknown>) : {};
  return {
    name: typeof raw?.name === "string" ? raw.name : "",
    email: typeof raw?.email === "string" ? raw.email : "",
    phoneNumber: typeof raw?.phoneNumber === "string" ? raw.phoneNumber : "",
    line1: typeof address.line1 === "string" ? address.line1 : "",
    line2: typeof address.line2 === "string" ? address.line2 : "",
    postalOrZipCode: typeof address.postalOrZipCode === "string" ? address.postalOrZipCode : "",
    townOrCity: typeof address.townOrCity === "string" ? address.townOrCity : "",
    countryCode: typeof address.countryCode === "string" ? address.countryCode : "PT",
    stateOrCounty: typeof address.stateOrCounty === "string" ? address.stateOrCounty : "",
  };
}

function toRecipientPayload(form: RecipientForm) {
  return {
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    phoneNumber: form.phoneNumber.trim() || undefined,
    address: {
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      postalOrZipCode: form.postalOrZipCode.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      townOrCity: form.townOrCity.trim(),
      stateOrCounty: form.stateOrCounty.trim() || undefined,
    },
  };
}

export function PhotoBookBuilder({
  tripId,
  tripTitle,
  candidates,
  prodigi,
}: {
  tripId: string;
  tripTitle: string;
  candidates: CandidatePhoto[];
  prodigi: ProdigiStatus;
}) {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [bookId, setBookId] = useState<string | null>(null);
  const [title, setTitle] = useState(tripTitle);
  const [subtitle, setSubtitle] = useState("");
  const [introText, setIntroText] = useState("");
  const [sku, setSku] = useState(prodigi.defaultSku);
  const [copies, setCopies] = useState(1);
  const [destinationCountryCode, setDestinationCountryCode] = useState("PT");
  const [shippingMethod, setShippingMethod] = useState("Standard");
  const [recipient, setRecipient] = useState<RecipientForm>(emptyRecipient);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState("draft");
  const [lastError, setLastError] = useState<string | null>(null);
  const [studioProjectId, setStudioProjectId] = useState<string | null>(null);
  const [studioPreviewUrl, setStudioPreviewUrl] = useState<string | null>(null);
  const [studioStatus, setStudioStatus] = useState<string | null>(null);
  const [previewAckedAt, setPreviewAckedAt] = useState<string | null>(null);
  const [previewAckChecked, setPreviewAckChecked] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const [exportJson, setExportJson] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const candidateMap = useMemo(() => new Map(candidates.map((photo) => [photo.id, photo])), [candidates]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}/photo-books`);
        const data = await response.json();
        if (!response.ok || cancelled) return;
        const list = (data.books || []) as BookSummary[];
        setBooks(list);
        if (list[0]) {
          const detail = await fetch(`/api/photo-books/${list[0].id}`);
          const detailData = await detail.json();
          if (!detail.ok || cancelled) return;
          const book = detailData.book as BookSummary;
          const items = (detailData.items || []) as BookItem[];
          applyBook(book, items);
        }
      } catch {
        if (!cancelled) setMessage("Fotoboeken konden niet worden geladen.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  function applyBook(book: BookSummary, items: BookItem[]) {
    setBookId(book.id);
    setTitle(book.title);
    setSubtitle(book.subtitle || "");
    setIntroText(book.intro_text || "");
    setSku(book.sku);
    setCopies(book.copies);
    setDestinationCountryCode(book.destination_country_code);
    setShippingMethod(book.shipping_method);
    setRecipient(recipientFromBook(book.recipient));
    setSelectedIds(items.map((item) => item.media_asset_id));
    setStatus(book.status);
    setLastError(book.last_error);
    setStudioProjectId(book.studio_project_id || null);
    setStudioPreviewUrl(book.studio_preview_url || null);
    setStudioStatus(book.studio_status || null);
    setPreviewAckedAt(book.preview_acknowledged_at || null);
    setPreviewAckChecked(Boolean(book.preview_acknowledged_at));
    setConfirmLive(false);
  }

  useEffect(() => {
    let active = true;
    const ids = selectedIds.length ? selectedIds : candidates.map((photo) => photo.id);
    void Promise.all(ids.slice(0, 60).map(async (id) => {
      const response = await fetch(`/api/media/${id}/web-url`);
      const data = await response.json().catch(() => ({}));
      return response.ok ? [id, data.signedUrl] as const : null;
    })).then((results) => {
      if (!active) return;
      setUrls((current) => ({
        ...current,
        ...Object.fromEntries(results.filter((item): item is readonly [string, string] => Boolean(item))),
      }));
    });
    return () => {
      active = false;
    };
  }, [selectedIds, candidates]);

  async function loadBook(id: string, cancelled = false) {
    const response = await fetch(`/api/photo-books/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Laden mislukt.");
    if (cancelled) return;
    applyBook(data.book as BookSummary, (data.items || []) as BookItem[]);
    setExportJson("");
  }

  async function createBook() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/trips/${tripId}/photo-books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || tripTitle, subtitle, seedFromCandidates: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Aanmaken mislukt.");
      setBooks((current) => [data.book, ...current]);
      await loadBook(data.book.id);
      setMessage("Concept aangemaakt (gevuld met book_candidate-foto’s indien aanwezig).");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aanmaken mislukt.");
    } finally {
      setBusy(false);
    }
  }

  function toggleCandidate(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function moveSelected(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      if (index < 0) return current;
      const next = index + direction;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item!);
      return copy;
    });
  }

  async function saveMetaAndItems() {
    if (!bookId) {
      setMessage("Maak eerst een conceptboek.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const metaResponse = await fetch(`/api/photo-books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          introText,
          sku,
          copies,
          destinationCountryCode,
          shippingMethod,
          recipient: toRecipientPayload(recipient),
        }),
      });
      const metaData = await metaResponse.json();
      if (!metaResponse.ok) throw new Error(metaData.error || "Metadata opslaan mislukt.");

      const itemsResponse = await fetch(`/api/photo-books/${bookId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaAssetIds: selectedIds }),
      });
      const itemsData = await itemsResponse.json();
      if (!itemsResponse.ok) throw new Error(itemsData.error || "Selectie opslaan mislukt.");

      setStatus(metaData.book.status);
      setIntroText(metaData.book.intro_text || "");
      setBooks((current) => current.map((book) => (book.id === bookId ? { ...book, ...metaData.book } : book)));
      setMessage(`Opgeslagen: ${selectedIds.length} foto’s in volgorde.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function runExport(requestQuote: boolean) {
    if (!bookId) {
      setMessage("Maak eerst een conceptboek.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await saveMetaAndItemsQuiet();
      const response = await fetch(`/api/photo-books/${bookId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeSignedUrls: true, requestQuote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Export mislukt.");
      setStatus(data.book.status);
      setLastError(data.book.last_error);
      setStudioProjectId(data.book.studio_project_id || studioProjectId);
      setStudioPreviewUrl(data.book.studio_preview_url || studioPreviewUrl);
      setPreviewAckedAt(data.book.preview_acknowledged_at || previewAckedAt);
      setExportJson(JSON.stringify(data.export, null, 2));
      setMessage(data.message || "Export klaar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function saveMetaAndItemsQuiet() {
    if (!bookId) return;
    await fetch(`/api/photo-books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subtitle,
        introText,
        sku,
        copies,
        destinationCountryCode,
        shippingMethod,
        recipient: toRecipientPayload(recipient),
      }),
    });
    await fetch(`/api/photo-books/${bookId}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaAssetIds: selectedIds }),
    });
  }

  async function syncStudio() {
    if (!bookId) return;
    if (!prodigi.configured) {
      setMessage("PRODIGI_API_KEY ontbreekt — Studio-sync niet mogelijk.");
      return;
    }
    if (!prodigi.studioConfigured) {
      setMessage("PRODIGI_STUDIO_TEMPLATE_ID ontbreekt. Sla een template op in Studio en zet de id in Vercel/Cursor env (embed niet nodig).");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await saveMetaAndItemsQuiet();
      const response = await fetch(`/api/photo-books/${bookId}/studio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Studio-sync mislukt.");
      const book = data.book as BookSummary;
      setStatus(book.status);
      setLastError(book.last_error);
      setSku(book.sku || sku);
      setStudioProjectId(book.studio_project_id || null);
      setStudioPreviewUrl(book.studio_preview_url || null);
      setStudioStatus(book.studio_status || null);
      setPreviewAckedAt(null);
      setPreviewAckChecked(false);
      setBooks((current) => current.map((item) => (item.id === bookId ? { ...item, ...book } : item)));
      setMessage(data.message || "Studio-project bijgewerkt.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Studio-sync mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function acknowledgePreview(acknowledged: boolean) {
    if (!bookId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/photo-books/${bookId}/preview-ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Preview-bevestiging mislukt.");
      setPreviewAckedAt(data.book.preview_acknowledged_at || null);
      setPreviewAckChecked(Boolean(data.book.preview_acknowledged_at));
      setMessage(data.message || (acknowledged ? "Preview bevestigd." : "Bevestiging gewist."));
    } catch (error) {
      setPreviewAckChecked(Boolean(previewAckedAt));
      setMessage(error instanceof Error ? error.message : "Preview-bevestiging mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOrder() {
    if (!bookId) return;
    if (!prodigi.configured) {
      setMessage("PRODIGI_API_KEY ontbreekt. Export wel mogelijk; echte order pas na Henk’s Prodigi-setup.");
      return;
    }
    if (!studioProjectId || !previewAckedAt) {
      setMessage("Eerst Studio-sync + preview bekijken en bevestigen vóór bestellen.");
      return;
    }
    if (prodigi.env === "live" && !confirmLive) {
      setMessage("Live-omgeving: vink “Bevestig live-order” aan. Zonder confirmLive wordt niets verstuurd.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await saveMetaAndItemsQuiet();
      const response = await fetch(`/api/photo-books/${bookId}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmLive: prodigi.env === "live" ? confirmLive : false }),
      });
      const data = await response.json();
      if (!response.ok) {
        setExportJson(data.export ? JSON.stringify(data.export, null, 2) : exportJson);
        throw new Error(data.error || "Order mislukt.");
      }
      setStatus(data.book.status);
      setLastError(null);
      setMessage(data.message || "Order bij Prodigi aangemaakt.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const unselectedCandidates = candidates.filter((photo) => !selectedIds.includes(photo.id));
  const canOrder = Boolean(
    prodigi.configured
    && studioProjectId
    && previewAckedAt
    && status !== "submitted"
    && (prodigi.env !== "live" || confirmLive),
  );

  return (
    <div className="photo-book-builder">
      <section className="planner-card">
        <div className="planner-card-heading">
          <div>
            <p className="eyebrow blue">Status</p>
            <h2>{bookId ? `Concept · ${status}` : "Nog geen concept"}</h2>
            <p>
              Prodigi: {prodigi.configured ? `geconfigureerd (${prodigi.env})` : "nog niet geconfigureerd — export werkt wel"}.
              Favorieten wegen zwaarder bij het vullen van een nieuw concept.
            </p>
          </div>
          <div className="photo-book-actions">
            {!bookId ? (
              <button className="primary-button blue-button" type="button" disabled={busy} onClick={() => void createBook()}>
                Start fotoboek uit kandidaten
              </button>
            ) : (
              <button className="secondary-button" type="button" disabled={busy} onClick={() => void createBook()}>
                Nieuw concept
              </button>
            )}
          </div>
        </div>
        {books.length > 1 ? (
          <nav className="photo-book-filter" aria-label="Conceptboeken">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                className={book.id === bookId ? "active" : ""}
                disabled={busy}
                onClick={() => void loadBook(book.id)}
              >
                {book.title} · {book.status}
              </button>
            ))}
          </nav>
        ) : null}
        {lastError ? <p className="form-message" role="status">{lastError}</p> : null}
        {message ? <p className="form-message" role="status">{message}</p> : null}
      </section>

      {bookId ? (
        <>
          <section className="planner-card">
            <p className="eyebrow blue">Boekgegevens</p>
            <h2>Titel en printopties</h2>
            <div className="photo-book-meta-grid">
              <label>
                Titel
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
              </label>
              <label>
                Ondertitel
                <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} maxLength={200} />
              </label>
              <label className="photo-book-intro-field">
                Intro (optioneel)
                <textarea
                  value={introText}
                  onChange={(event) => setIntroText(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Korte intro voor het boek (Studio-slot story-text)"
                />
              </label>
              <label>
                Prodigi SKU
                <input value={sku} onChange={(event) => setSku(event.target.value)} maxLength={80} />
              </label>
              <label>
                Exemplaren
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={copies}
                  onChange={(event) => setCopies(Number(event.target.value) || 1)}
                />
              </label>
              <label>
                Land (ISO)
                <input
                  value={destinationCountryCode}
                  onChange={(event) => setDestinationCountryCode(event.target.value.toUpperCase())}
                  maxLength={2}
                />
              </label>
              <label>
                Verzending
                <select value={shippingMethod} onChange={(event) => setShippingMethod(event.target.value)}>
                  <option value="Budget">Budget</option>
                  <option value="Standard">Standard</option>
                  <option value="StandardPlus">StandardPlus</option>
                  <option value="Express">Express</option>
                  <option value="Overnight">Overnight</option>
                </select>
              </label>
            </div>
          </section>

          <section className="planner-card">
            <p className="eyebrow blue">Afleveradres</p>
            <h2>Nodig vóór een echte Prodigi-order</h2>
            <div className="photo-book-meta-grid">
              <label>
                Naam
                <input value={recipient.name} onChange={(event) => setRecipient({ ...recipient, name: event.target.value })} />
              </label>
              <label>
                E-mail
                <input value={recipient.email} onChange={(event) => setRecipient({ ...recipient, email: event.target.value })} />
              </label>
              <label>
                Telefoon
                <input value={recipient.phoneNumber} onChange={(event) => setRecipient({ ...recipient, phoneNumber: event.target.value })} />
              </label>
              <label>
                Adresregel 1
                <input value={recipient.line1} onChange={(event) => setRecipient({ ...recipient, line1: event.target.value })} />
              </label>
              <label>
                Adresregel 2
                <input value={recipient.line2} onChange={(event) => setRecipient({ ...recipient, line2: event.target.value })} />
              </label>
              <label>
                Postcode
                <input value={recipient.postalOrZipCode} onChange={(event) => setRecipient({ ...recipient, postalOrZipCode: event.target.value })} />
              </label>
              <label>
                Plaats
                <input value={recipient.townOrCity} onChange={(event) => setRecipient({ ...recipient, townOrCity: event.target.value })} />
              </label>
              <label>
                Landcode
                <input value={recipient.countryCode} onChange={(event) => setRecipient({ ...recipient, countryCode: event.target.value.toUpperCase() })} maxLength={2} />
              </label>
              <label>
                Provincie / staat
                <input value={recipient.stateOrCounty} onChange={(event) => setRecipient({ ...recipient, stateOrCounty: event.target.value })} />
              </label>
            </div>
          </section>

          <section className="planner-card">
            <div className="planner-card-heading">
              <div>
                <p className="eyebrow blue">Selectie</p>
                <h2>{selectedIds.length} foto’s in het boek</h2>
                <p>Volgorde = boekvolgorde. Favorieten zijn gemarkeerd. Haal kandidaten uit de fotobibliotheek als de lijst leeg is.</p>
              </div>
              <button className="secondary-button" type="button" disabled={busy} onClick={() => void saveMetaAndItems()}>
                Selectie opslaan
              </button>
            </div>
            {!selectedIds.length ? (
              <p className="form-message">Nog geen foto’s in dit concept. Voeg kandidaten hieronder toe.</p>
            ) : (
              <ol className="photo-book-order-list">
                {selectedIds.map((id, index) => {
                  const photo = candidateMap.get(id);
                  return (
                    <li key={id}>
                      <div className="photo-book-order-thumb">
                        {urls[id] ? <img src={urls[id]} alt={photo?.caption || photo?.original_filename || id} /> : <span />}
                      </div>
                      <div>
                        <b>
                          {index + 1}. Dag {photo?.day_number ?? "?"}
                          {photo?.day_title ? ` · ${photo.day_title}` : ""}
                          {photo?.book_favorite ? " · favoriet" : ""}
                        </b>
                        <small>{photo?.caption || photo?.original_filename || id}</small>
                      </div>
                      <div className="photo-book-order-controls">
                        <button type="button" className="secondary-button" disabled={busy || index === 0} onClick={() => moveSelected(id, -1)}>
                          Omhoog
                        </button>
                        <button type="button" className="secondary-button" disabled={busy || index === selectedIds.length - 1} onClick={() => moveSelected(id, 1)}>
                          Omlaag
                        </button>
                        <button type="button" className="secondary-button" disabled={busy} onClick={() => toggleCandidate(id)}>
                          Verwijder
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="planner-card">
            <p className="eyebrow blue">Kandidatenpool</p>
            <h2>Foto’s met book_candidate</h2>
            {!candidates.length ? (
              <p className="form-message">
                Nog geen fotoboek-kandidaten. Markeer ze bij Foto’s of in het dagverslag.
              </p>
            ) : (
              <div className="private-photo-grid">
                {candidates.map((photo) => {
                  const selected = selectedIds.includes(photo.id);
                  return (
                    <figure key={photo.id} className={`private-photo${selected ? " photo-book-selected" : ""}`}>
                      {urls[photo.id] ? <img src={urls[photo.id]} alt={photo.caption || photo.original_filename} /> : <div className="photo-processing">Foto…</div>}
                      <figcaption>
                        <b>
                          Dag {photo.day_number}
                          {photo.book_favorite ? " · favoriet" : ""}
                        </b>
                        <span>{photo.caption || photo.original_filename}</span>
                        <button type="button" className="secondary-button" disabled={busy} onClick={() => toggleCandidate(photo.id)}>
                          {selected ? "Uit boek" : "In boek"}
                        </button>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
            {unselectedCandidates.length === 0 && candidates.length ? (
              <p className="form-message">Alle kandidaten zitten al in het boek.</p>
            ) : null}
          </section>

          <section className="planner-card">
            <p className="eyebrow blue">Studio-preview</p>
            <h2>Prodigi Studio (B1)</h2>
            <p>
              Sync vult de opgeslagen Studio-template via slot-namen (dag foto+verhaal, 3 foto’s, land-hoofdstuk, story).
              Embed/merchant snippet niet nodig. Preview is verplicht vóór bestellen. Live-order nooit zonder{" "}
              <code>confirmLive</code>.
            </p>
            <p className="photo-book-studio-meta">
              Template:{" "}
              {prodigi.studioTemplateFromEnv
                ? "gezet via env"
                : prodigi.studioConfigured
                  ? "app-fallback (zet PRODIGI_STUDIO_TEMPLATE_ID)"
                  : "ontbreekt"}
              {" · "}
              Project: {studioProjectId || "nog niet gesynchroniseerd"}
              {" · "}
              Status: {studioStatus || "—"}
            </p>
            <div className="photo-book-actions">
              <button
                className="primary-button blue-button"
                type="button"
                disabled={busy || !prodigi.configured || !prodigi.studioConfigured || status === "submitted"}
                onClick={() => void syncStudio()}
              >
                Sync naar Prodigi Studio
              </button>
              {studioPreviewUrl ? (
                <a className="secondary-button" href={studioPreviewUrl} target="_blank" rel="noreferrer">
                  Open Studio-preview
                </a>
              ) : null}
            </div>
            {studioPreviewUrl ? (
              <div className="photo-book-preview-frame">
                <iframe title="Prodigi Studio preview" src={studioPreviewUrl} loading="lazy" />
              </div>
            ) : (
              <p className="form-message">Nog geen preview. Sync eerst naar Studio (na selectie + adres). Embed kan door Studio worden geblokkeerd — gebruik dan de open-link.</p>
            )}
            <label className="photo-book-ack">
              <input
                type="checkbox"
                checked={previewAckChecked}
                disabled={busy || !studioProjectId || status === "submitted"}
                onChange={(event) => {
                  const next = event.target.checked;
                  setPreviewAckChecked(next);
                  void acknowledgePreview(next);
                }}
              />
              Ik heb de Studio-preview bekeken en ga akkoord met deze layout vóór bestellen
              {previewAckedAt ? ` (bevestigd ${new Date(previewAckedAt).toLocaleString("nl-NL")})` : ""}
            </label>
            {!prodigi.studioTemplateFromEnv ? (
              <p className="form-message">
                Tip: zet <code>PRODIGI_STUDIO_TEMPLATE_ID</code> expliciet (nu app-fallback). Template{" "}
                <strong>opslaan</strong> in Studio is genoeg — geen embed-publish. Slots: <code>day-photo</code>,{" "}
                <code>day-title</code>, <code>day-meta</code>, <code>day-summary</code>, <code>day-photo-1..3</code>,{" "}
                <code>chapter-*</code>, <code>story-text</code>. SKU-fallback: Layflat A4 via{" "}
                <code>PRODIGI_DEFAULT_SKU</code>. Zie <code>docs/PHOTOBOOK_PRODIGI.md</code>.
              </p>
            ) : null}
          </section>

          <section className="planner-card">
            <p className="eyebrow blue">Export / order</p>
            <h2>Klaar voor Prodigi</h2>
            <p>
              Export bouwt structuur + quote-draft. Bestellen gaat via Studio (print-ready) en alleen na preview-ack.
              Status <code>submitted</code> alleen na echte API-response — nooit gesimuleerd.
            </p>
            <div className="photo-book-actions">
              <button className="primary-button blue-button" type="button" disabled={busy} onClick={() => void runExport(false)}>
                Export opslaan
              </button>
              <button className="secondary-button" type="button" disabled={busy || !prodigi.configured} onClick={() => void runExport(true)}>
                Export + Prodigi-quote
              </button>
              <button className="secondary-button" type="button" disabled={busy || !canOrder} onClick={() => void submitOrder()}>
                {prodigi.configured ? `Bestel via Studio (${prodigi.env})` : "Bestellen (wacht op PRODIGI_API_KEY)"}
              </button>
            </div>
            {prodigi.env === "live" ? (
              <label className="photo-book-ack">
                <input
                  type="checkbox"
                  checked={confirmLive}
                  disabled={busy || status === "submitted"}
                  onChange={(event) => setConfirmLive(event.target.checked)}
                />
                Bevestig live-order (écht drukwerk / verzending — nooit automatisch)
              </label>
            ) : null}
            {!prodigi.configured ? (
              <p className="form-message">
                Henk: zet <code>PRODIGI_API_KEY</code> (sandbox) in Vercel. Optioneel <code>PRODIGI_ENV</code>,{" "}
                <code>PRODIGI_DEFAULT_SKU</code>, verplicht voor B1: <code>PRODIGI_STUDIO_TEMPLATE_ID</code>. Zie{" "}
                <code>docs/PHOTOBOOK_PRODIGI.md</code>.
              </p>
            ) : null}
            {exportJson ? (
              <label className="photo-book-export">
                Laatste export-JSON
                <textarea readOnly rows={16} value={exportJson} />
              </label>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
