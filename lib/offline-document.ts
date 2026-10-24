/** Shared offline-first document open helpers for client components. */

import { documentViewerPath } from "./document-open";
import {
  SESSION_EXPIRED_DOCUMENT_MESSAGE,
  SessionExpiredError,
  sessionExpiredLoginPath,
} from "./session-expired";

export function offlineDocumentUrl(documentId: string) {
  return "/offline-documents/" + documentId;
}

export function offlineCacheName(tripId: string) {
  return "nos-private-documents-" + tripId;
}

export async function matchOfflineDocument(documentId: string) {
  if (!("caches" in globalThis)) return undefined;
  return caches.match(offlineDocumentUrl(documentId)).catch(() => undefined);
}

export async function listOfflineDocumentIds(tripId: string) {
  if (!("caches" in globalThis)) return new Set<string>();
  try {
    const cache = await caches.open(offlineCacheName(tripId));
    const keys = await cache.keys();
    const ids = new Set<string>();
    for (const request of keys) {
      const path = new URL(request.url).pathname;
      const prefix = "/offline-documents/";
      if (path.startsWith(prefix)) ids.add(path.slice(prefix.length));
    }
    return ids;
  } catch {
    return new Set<string>();
  }
}

export type OpenDocumentResult =
  | { source: "offline" }
  | { source: "network" }
  | { source: "session-expired"; message: string; loginPath: string };

/**
 * Open the in-app document viewer (same tab) so there is always a Terug link.
 * Never points the main tab at the raw /file stream.
 */
export async function openDocumentOfflineFirst(documentId: string): Promise<OpenDocumentResult> {
  const offline = await matchOfflineDocument(documentId);
  const backPath =
    typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined;

  // Soft session probe when online so we can redirect to login before leaving.
  if (!offline && typeof fetch === "function") {
    try {
      const meta = await fetch("/api/documents/" + documentId);
      if (meta.status === 401) {
        const loginPath = sessionExpiredLoginPath();
        throw new SessionExpiredError(SESSION_EXPIRED_DOCUMENT_MESSAGE, loginPath);
      }
      if (!meta.ok) {
        const data = await meta.json().catch(() => ({}));
        throw new Error(data.error || "Document kon niet worden geopend.");
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      if (error instanceof TypeError) {
        /* Network down — viewer can still use the offline cache. */
      } else {
        throw error;
      }
    }
  }

  window.location.assign(documentViewerPath(documentId, backPath));
  return { source: offline ? "offline" : "network" };
}
