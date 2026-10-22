/** Shared offline-first document open helpers for client components. */

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

/** Prefer cache/SW copy; fall back to signed URL from the API. */
export async function openDocumentOfflineFirst(documentId: string) {
  const offline = await matchOfflineDocument(documentId);
  if (offline) {
    const url = URL.createObjectURL(await offline.blob());
    window.open(url, "_blank", "noopener,noreferrer");
    return { source: "offline" as const };
  }

  const response = await fetch("/api/documents/" + documentId);
  if (response.status === 401) {
    window.location.assign("/login?next=" + encodeURIComponent(window.location.pathname));
    return { source: "login" as const };
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.signedUrl) {
    throw new Error(data.error || "Document kon niet worden geopend.");
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  return { source: "network" as const };
}
