/** Shared offline-first document open helpers for client components. */

import {
  closeDocumentPreviewWindow,
  documentFilePath,
  navigateDocumentPreview,
  openDocumentPreviewWindow,
  showBlobInPreviewWindow,
} from "./document-open";
import {
  SESSION_EXPIRED_DOCUMENT_MESSAGE,
  SessionExpiredError,
  isSessionExpiredError,
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
 * Prefer cache/SW copy; fall back to same-origin file route.
 * Opens a blank tab synchronously first so iOS Safari does not block the tab
 * after the async cache/network work.
 */
export async function openDocumentOfflineFirst(documentId: string): Promise<OpenDocumentResult> {
  const preview = openDocumentPreviewWindow();

  try {
    const offline = await matchOfflineDocument(documentId);
    if (offline) {
      const blob = await offline.blob();
      if (preview && !preview.closed) {
        showBlobInPreviewWindow(preview, blob);
      } else {
        navigateDocumentPreview(null, URL.createObjectURL(blob));
      }
      return { source: "offline" };
    }

    const meta = await fetch("/api/documents/" + documentId);
    if (meta.status === 401) {
      closeDocumentPreviewWindow(preview);
      const loginPath = sessionExpiredLoginPath();
      throw new SessionExpiredError(SESSION_EXPIRED_DOCUMENT_MESSAGE, loginPath);
    }
    const data = await meta.json().catch(() => ({}));
    if (!meta.ok) {
      closeDocumentPreviewWindow(preview);
      throw new Error(data.error || "Document kon niet worden geopend.");
    }

    // Same-origin /file keeps the session cookie and sets inline disposition.
    navigateDocumentPreview(preview, documentFilePath(documentId));
    return { source: "network" };
  } catch (error) {
    if (!isSessionExpiredError(error)) {
      closeDocumentPreviewWindow(preview);
    }
    throw error;
  }
}
