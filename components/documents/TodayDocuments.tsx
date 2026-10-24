"use client";

import { useEffect, useState } from "react";
import { documentTypeLabel } from "../../lib/document-search";
import { openDocumentOfflineFirst, listOfflineDocumentIds } from "../../lib/offline-document";
import { isSessionExpiredError, redirectAfterSessionExpired } from "../../lib/session-expired";

export type TodayDocumentRow = {
  id: string;
  title: string;
  document_type?: string | null;
  trip_day_id: string | null;
  is_pinned?: boolean | null;
};

type Props = {
  tripId: string;
  documents: TodayDocumentRow[];
  focusLabel?: string;
  intro?: string;
  emptyMessage?: string;
};

export function TodayDocuments({
  tripId,
  documents,
  focusLabel = "Documenten van vandaag",
  intro = "Documenten van deze reisdag plus hele-reis (visa e.d.). Eén tik om te openen.",
  emptyMessage = "Geen documenten gekoppeld aan vandaag.",
}: Props) {
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    listOfflineDocumentIds(tripId).then((ids) => {
      if (!cancelled) setOfflineIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [tripId, documents]);

  async function open(id: string) {
    setMessage("");
    try {
      const result = await openDocumentOfflineFirst(id);
      if (result.source === "offline") setMessage("Offline kopie geopend.");
    } catch (error) {
      if (isSessionExpiredError(error)) {
        setMessage(error.message);
        redirectAfterSessionExpired(error.loginPath);
        return;
      }
      setMessage(error instanceof Error ? error.message : "Document kon niet worden geopend.");
    }
  }

  return (
    <section className="today-documents planner-card">
      <p className="eyebrow blue">Snel openen</p>
      <h2>{focusLabel}</h2>
      <p>{intro}</p>
      {documents.length ? (
        <ul className="today-document-list">
          {documents.map((document) => (
            <li key={document.id}>
              <button type="button" className="today-document-open" onClick={() => void open(document.id)}>
                <span>{documentTypeLabel(document.document_type || "other")}</span>
                <b>{document.title}</b>
                <small>
                  {document.trip_day_id === null ? "Hele reis" : document.is_pinned ? "Vastgezet" : "Reisdag"}
                  {offlineIds.has(document.id) ? " · offline beschikbaar ✓" : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="today-documents-empty">{emptyMessage}</p>
      )}
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
