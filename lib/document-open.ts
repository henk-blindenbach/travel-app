/**
 * Helpers for opening private trip documents in the in-app viewer.
 * Never navigate the app tab to the raw /file response — that traps users
 * (especially on iPhone) without chrome or a reliable Back.
 */

export function documentFilePath(documentId: string) {
  return "/api/documents/" + documentId + "/file";
}

/** In-app viewer URL; optional back path must stay inside /app. */
export function documentViewerPath(documentId: string, backPath?: string | null) {
  const base = "/app/documents/" + documentId;
  const safe = safeAppBackPath(backPath);
  return safe ? base + "?back=" + encodeURIComponent(safe) : base;
}

/** Only allow same-app relative paths (open-redirect safe). */
export function safeAppBackPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/app")) return null;
  if (trimmed.startsWith("//") || trimmed.includes("://")) return null;
  if (trimmed.includes("\\") || /\s/.test(trimmed)) return null;
  return trimmed;
}

export function documentBackLabel(backHref: string) {
  if (backHref.includes("/today")) return "← Terug naar vandaag";
  if (backHref.includes("/plan")) return "← Terug naar planning";
  if (backHref.includes("/documents")) return "← Terug naar documenten";
  return "← Terug";
}

/** PDF and images can be shown inline; office docs download. */
export function isInlineDocumentMime(mime: string | null | undefined) {
  const type = (mime || "").toLowerCase();
  return type === "application/pdf" || type.startsWith("image/");
}

export function contentDispositionInline(filename: string): string {
  return `inline; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function contentDispositionForDocument(mime: string | null | undefined, filename: string): string {
  const disposition = isInlineDocumentMime(mime) ? "inline" : "attachment";
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
