/**
 * Helpers for opening private trip documents in a new tab.
 * iOS Safari blocks window.open() after an async gap and is unreliable with
 * bare blob: URLs for PDFs — open a blank tab on the user gesture, then navigate.
 */

export function documentFilePath(documentId: string) {
  return "/api/documents/" + documentId + "/file";
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

/** Open a blank tab synchronously so later navigation keeps the user gesture on iOS. */
export function openDocumentPreviewWindow(): Window | null {
  if (typeof window === "undefined") return null;
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

export function closeDocumentPreviewWindow(preview: Window | null) {
  if (!preview || preview.closed) return;
  try {
    preview.close();
  } catch {
    /* ignore */
  }
}

function escapeHtmlAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Show a blob in an already-opened preview window.
 * Images get an HTML wrapper; PDF/other navigate to the object URL.
 */
export function showBlobInPreviewWindow(preview: Window, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const type = (blob.type || "").toLowerCase();
  try {
    preview.opener = null;
  } catch {
    /* ignore */
  }

  if (type.startsWith("image/")) {
    const safeUrl = escapeHtmlAttr(url);
    preview.document.open();
    preview.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document</title></head><body style="margin:0;background:#111;min-height:100vh;display:flex;justify-content:center;align-items:flex-start"><img src="${safeUrl}" alt="Document" style="max-width:100%;height:auto"/></body></html>`,
    );
    preview.document.close();
    return url;
  }

  if (type === "application/pdf") {
    const safeUrl = escapeHtmlAttr(url);
    preview.document.open();
    preview.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document</title><style>html,body{margin:0;height:100%;background:#111}embed,iframe{border:0;width:100%;height:100%}</style></head><body><embed src="${safeUrl}" type="application/pdf"/></body></html>`,
    );
    preview.document.close();
    return url;
  }

  preview.location.replace(url);
  return url;
}

/** Navigate a gesture-preserved window, or fall back to a synthetic anchor click. */
export function navigateDocumentPreview(preview: Window | null, url: string) {
  if (preview && !preview.closed) {
    try {
      preview.opener = null;
    } catch {
      /* ignore */
    }
    preview.location.replace(url);
    return;
  }

  if (typeof document === "undefined") return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
