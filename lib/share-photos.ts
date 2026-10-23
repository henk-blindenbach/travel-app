/**
 * Client helpers for sharing selected journal originals via Web Share or download.
 */

export type SharePhotoFile = {
  file: File;
  name: string;
};

/** Build ShareData variants: files+text first, then files-only (iOS often rejects text+files). */
export function shareDataCandidates(input: {
  files: File[];
  title: string;
  text?: string;
}): ShareData[] {
  const { files, title, text } = input;
  const withText: ShareData = { files, title };
  if (text?.trim()) withText.text = text.trim();
  const filesOnly: ShareData = { files, title };
  if (withText.text) return [withText, filesOnly];
  return [filesOnly];
}

export function canSharePayload(payload: ShareData): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare(payload);
  } catch {
    return false;
  }
}

/**
 * Try navigator.share with the first shareable candidate.
 * Returns "shared" | "aborted" | "unsupported".
 * Some mobile browsers lie about canShare for files — after candidates fail the
 * check we still attempt share() once with the last files-only payload.
 */
export async function tryNavigatorShare(candidates: ShareData[]): Promise<"shared" | "aborted" | "unsupported"> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  let lastFilesOnly: ShareData | null = null;
  for (const payload of candidates) {
    if (payload.files?.length && !payload.text) lastFilesOnly = payload;
    if (!canSharePayload(payload)) continue;
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "aborted";
      /* Try next candidate (e.g. files-only after files+text fails). */
    }
  }
  if (lastFilesOnly) {
    try {
      await navigator.share(lastFilesOnly);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "aborted";
    }
  }
  return "unsupported";
}

/** Trigger a local download for each file (desktop fallback when Web Share is unavailable). */
export function downloadFilesLocally(files: File[]) {
  for (const file of files) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(file);
    link.href = url;
    link.download = file.name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}

export function shareUnsupportedMessage(captionPresent: boolean): string {
  const base =
    "Het systeemdeelmenu opende niet (vaak bij HEIC of deze browser). Er is een JPEG-download gestart — op iPhone werkt delen betrouwbaarder in Safari.";
  return captionPresent
    ? `${base} Caption staat op het klembord.`
    : base;
}
