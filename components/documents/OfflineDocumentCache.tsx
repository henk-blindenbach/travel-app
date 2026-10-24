"use client";

import { useEffect, useState } from "react";
import {
  dispatchOfflineDocumentsUpdated,
  offlineDocumentsIntro,
  OFFLINE_DOCUMENTS_UPDATED,
  TRIP_DOCUMENTS_CHANGED,
  type TripDocumentsChangedDetail,
} from "../../lib/offline-document-copy";
import {
  SESSION_EXPIRED_DOCUMENT_MESSAGE,
  redirectAfterSessionExpired,
  sessionExpiredLoginPath,
} from "../../lib/session-expired";

type Document = { id: string; title: string };

export function OfflineDocumentCache({ tripId, endsOn, documents: initialDocuments }: { tripId: string; endsOn: string; documents: Document[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [status, setStatus] = useState("");
  const [workerError, setWorkerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const cacheName = "nos-private-documents-" + tripId;

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  useEffect(() => {
    let cancelled = false;
    const refreshSavedCount = async () => {
      if (!("caches" in window)) {
        if (!cancelled) setSavedCount(0);
        return;
      }
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (!cancelled) setSavedCount(keys.length);
      } catch {
        if (!cancelled) setSavedCount(0);
      }
    };

    if (!("serviceWorker" in navigator)) {
      setWorkerError("Deze browser ondersteunt geen offline appnavigatie. Documentkopieën kunnen mogelijk wel lokaal worden bewaard.");
    } else {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(async () => {
          await navigator.serviceWorker.ready;
          if (!cancelled) setWorkerError("");
        })
        .catch(() => {
          if (!cancelled) {
            setWorkerError("De offline appvoorbereiding kon niet starten. Documentkopieën kun je wel opnieuw proberen op te slaan.");
          }
        });
    }

    if (new Date(endsOn + "T23:59:59").getTime() < Date.now()) {
      caches.delete(cacheName).then(() => {
        localStorage.removeItem("nos-offline-trip");
        if (!cancelled) setSavedCount(0);
      });
    } else {
      void refreshSavedCount();
    }

    const onDocumentsChanged = (event: Event) => {
      const detail = (event as CustomEvent<TripDocumentsChangedDetail>).detail;
      if (!detail || detail.tripId !== tripId) return;
      setDocuments(detail.documents);
    };
    const onOfflineUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ tripId: string; saved?: number }>).detail;
      if (!detail || detail.tripId !== tripId) return;
      if (typeof detail.saved === "number") setSavedCount(detail.saved);
      else void refreshSavedCount();
    };

    window.addEventListener(TRIP_DOCUMENTS_CHANGED, onDocumentsChanged);
    window.addEventListener(OFFLINE_DOCUMENTS_UPDATED, onOfflineUpdated);
    window.addEventListener("focus", refreshSavedCount);
    return () => {
      cancelled = true;
      window.removeEventListener(TRIP_DOCUMENTS_CHANGED, onDocumentsChanged);
      window.removeEventListener(OFFLINE_DOCUMENTS_UPDATED, onOfflineUpdated);
      window.removeEventListener("focus", refreshSavedCount);
    };
  }, [cacheName, endsOn, tripId]);

  async function saveOffline() {
    if (!("caches" in window)) {
      setStatus("Offline opslag wordt niet ondersteund door deze browser.");
      return;
    }
    setSaving(true);
    setSavedCount(0);
    setStatus("Documenten worden veilig op dit apparaat gezet…");
    try {
      const cache = await caches.open(cacheName);
      let saved = 0;
      for (const [index, document] of documents.entries()) {
        setStatus(`Document ${index + 1} van ${documents.length} wordt bewaard…`);
        const file = await fetch("/api/documents/" + document.id + "/file");
        if (file.status === 401) {
          setStatus(SESSION_EXPIRED_DOCUMENT_MESSAGE);
          redirectAfterSessionExpired(sessionExpiredLoginPath());
          return;
        }
        if (!file.ok) continue;
        await cache.put("/offline-documents/" + document.id, file.clone());
        saved += 1;
        setSavedCount(saved);
      }
      localStorage.setItem("nos-offline-trip", JSON.stringify({ tripId, savedAt: new Date().toISOString() }));
      setStatus(saved + " documenten zijn offline beschikbaar op dit apparaat.");
      dispatchOfflineDocumentsUpdated(tripId, saved);
    } catch {
      setStatus("Offline opslaan lukte niet. Controleer je verbinding en probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  async function clearOffline() {
    await caches.delete(cacheName);
    localStorage.removeItem("nos-offline-trip");
    setSavedCount(0);
    setStatus("Offline kopieën van deze reis zijn verwijderd.");
    dispatchOfflineDocumentsUpdated(tripId, 0);
  }

  return (
    <section className="offline-documents planner-card">
      <p className="eyebrow blue">Onderweg zonder bereik</p>
      <h2>Documenten offline meenemen</h2>
      <p data-testid="offline-documents-intro">{offlineDocumentsIntro(documents.length, savedCount)}</p>
      <div>
        <button className="primary-button blue-button" type="button" disabled={saving || !documents.length} onClick={() => void saveOffline()}>
          {saving ? "Offline bewaren…" : "Maak offline beschikbaar"}
        </button>
        <button className="secondary-button" type="button" disabled={saving || !savedCount} onClick={() => void clearOffline()}>
          Verwijder offline kopieën
        </button>
      </div>
      {workerError ? (
        <p className="form-message offline-warning" role="alert">
          {workerError}
        </p>
      ) : null}
      {status ? (
        <p className="form-message" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
