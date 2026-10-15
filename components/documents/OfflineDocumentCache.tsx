"use client";

import { useEffect, useState } from "react";

type Document = { id: string; title: string };

export function OfflineDocumentCache({ tripId, endsOn, documents }: { tripId: string; endsOn: string; documents: Document[] }) {
  const [status, setStatus] = useState("");
  const cacheName = "nos-private-documents-" + tripId;

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    if (new Date(endsOn + "T23:59:59").getTime() < Date.now()) {
      caches.delete(cacheName).then(() => localStorage.removeItem("nos-offline-trip"));
    }
  }, [cacheName, endsOn]);

  async function saveOffline() {
    if (!("caches" in window)) { setStatus("Offline opslag wordt niet ondersteund door deze browser."); return; }
    setStatus("Documenten worden veilig op dit apparaat gezet…");
    try {
      const cache = await caches.open(cacheName);
      let saved = 0;
      for (const document of documents) {
        const response = await fetch("/api/documents/" + document.id);
        if (response.status === 401) { window.location.assign("/login?next=" + encodeURIComponent(window.location.pathname)); return; }
        const data = await response.json();
        if (!data.signedUrl) continue;
        const file = await fetch(data.signedUrl);
        if (!file.ok) continue;
        await cache.put("/offline-documents/" + document.id, file.clone());
        saved += 1;
      }
      localStorage.setItem("nos-offline-trip", JSON.stringify({ tripId, savedAt: new Date().toISOString() }));
      setStatus(saved + " documenten zijn offline beschikbaar op dit apparaat.");
    } catch { setStatus("Offline opslaan lukte niet. Controleer je verbinding en probeer opnieuw."); }
  }

  async function clearOffline() {
    await caches.delete(cacheName);
    localStorage.removeItem("nos-offline-trip");
    setStatus("Offline kopieën van deze reis zijn verwijderd.");
  }

  return <section className="offline-documents planner-card"><p className="eyebrow blue">Onderweg zonder bereik</p><h2>Documenten offline meenemen</h2><p>Bewaar alle {documents.length} documenten van deze reis alleen op dit apparaat. Verwijder ze na de reis of wanneer iemand anders dit toestel gebruikt.</p><div><button className="primary-button blue-button" type="button" onClick={() => void saveOffline()}>Maak offline beschikbaar</button><button className="secondary-button" type="button" onClick={() => void clearOffline()}>Verwijder offline kopieën</button></div>{status ? <p className="form-message" role="status">{status}</p> : null}</section>;
}
