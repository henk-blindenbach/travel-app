"use client";

import { useEffect, useState } from "react";

type Document = { id: string; title: string };

export function OfflineDocumentCache({ tripId, endsOn, documents }: { tripId: string; endsOn: string; documents: Document[] }) {
  const [status, setStatus] = useState(""); const [workerError, setWorkerError] = useState(""); const [saving, setSaving] = useState(false); const [savedCount, setSavedCount] = useState(0);
  const cacheName = "nos-private-documents-" + tripId;

  useEffect(() => {
    let cancelled = false;
    if (!("serviceWorker" in navigator)) setWorkerError("Deze browser ondersteunt geen offline appnavigatie. Documentkopieën kunnen mogelijk wel lokaal worden bewaard.");
    else navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(async () => { await navigator.serviceWorker.ready; if (!cancelled) setWorkerError(""); }).catch(() => { if (!cancelled) setWorkerError("De offline appvoorbereiding kon niet starten. Documentkopieën kun je wel opnieuw proberen op te slaan."); });
    if (new Date(endsOn + "T23:59:59").getTime() < Date.now()) {
      caches.delete(cacheName).then(() => { localStorage.removeItem("nos-offline-trip"); setSavedCount(0); });
    } else {
      caches.open(cacheName).then(async (cache) => { const keys = await cache.keys(); if (!cancelled) setSavedCount(keys.length); });
    }
    return () => { cancelled = true; };
  }, [cacheName, endsOn]);

  async function saveOffline() {
    if (!("caches" in window)) { setStatus("Offline opslag wordt niet ondersteund door deze browser."); return; }
    setSaving(true); setSavedCount(0); setStatus("Documenten worden veilig op dit apparaat gezet…");
    try {
      const cache = await caches.open(cacheName);
      let saved = 0;
      for (const [index, document] of documents.entries()) {
        setStatus(`Document ${index + 1} van ${documents.length} wordt bewaard…`);
        const response = await fetch("/api/documents/" + document.id);
        if (response.status === 401) { window.location.assign("/login?next=" + encodeURIComponent(window.location.pathname)); return; }
        const data = await response.json();
        if (!data.signedUrl) continue;
        const file = await fetch(data.signedUrl);
        if (!file.ok) continue;
        await cache.put("/offline-documents/" + document.id, file.clone());
        saved += 1;
        setSavedCount(saved);
      }
      localStorage.setItem("nos-offline-trip", JSON.stringify({ tripId, savedAt: new Date().toISOString() }));
      setStatus(saved + " documenten zijn offline beschikbaar op dit apparaat.");
    } catch { setStatus("Offline opslaan lukte niet. Controleer je verbinding en probeer opnieuw."); } finally { setSaving(false); }
  }

  async function clearOffline() {
    await caches.delete(cacheName);
    localStorage.removeItem("nos-offline-trip");
    setSavedCount(0); setStatus("Offline kopieën van deze reis zijn verwijderd.");
  }

  return <section className="offline-documents planner-card"><p className="eyebrow blue">Onderweg zonder bereik</p><h2>Documenten offline meenemen</h2><p>Bewaar alle {documents.length} documenten van deze reis alleen op dit apparaat. {savedCount ? `${savedCount} ${savedCount === 1 ? "document staat" : "documenten staan"} nu lokaal klaar.` : "Verwijder de kopieën na de reis of wanneer iemand anders dit toestel gebruikt."}</p><div><button className="primary-button blue-button" type="button" disabled={saving || !documents.length} onClick={() => void saveOffline()}>{saving ? "Offline bewaren…" : "Maak offline beschikbaar"}</button><button className="secondary-button" type="button" disabled={saving || !savedCount} onClick={() => void clearOffline()}>Verwijder offline kopieën</button></div>{workerError ? <p className="form-message offline-warning" role="alert">{workerError}</p> : null}{status ? <p className="form-message" role="status">{status}</p> : null}</section>;
}
