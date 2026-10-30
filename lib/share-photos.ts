/**
 * Client helpers for sharing journal JPEGs via the system share sheet
 * (iOS: Opslaan → all files in Photos).
 */

export type SharePhotoFile = {
  file: File;
  name: string;
};

/**
 * Build ShareData variants. Prefer pure files-only first: Chromium often
 * rejects title/text together with files, while iOS multi-save works best
 * without caption text in the share payload (caption goes to clipboard).
 */
export function shareDataCandidates(input: {
  files: File[];
  title: string;
  text?: string;
}): ShareData[] {
  const { files, title, text } = input;
  const filesOnly: ShareData = { files };
  const withTitle: ShareData = { files, title };
  const trimmed = text?.trim();
  if (!trimmed) return [filesOnly, withTitle];
  const withText: ShareData = { files, title, text: trimmed };
  return [filesOnly, withTitle, withText];
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isShareGestureError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

/**
 * Try navigator.share with the first shareable candidate.
 * Returns "shared" | "aborted" | "gesture" | "unsupported".
 * "gesture" = prep took too long / UA blocked share outside a fresh user tap —
 * caller should keep the files and offer a second tap.
 * Some mobile browsers lie about canShare for files — after candidates fail the
 * check we still attempt share() once with a pure files-only payload.
 */
export async function tryNavigatorShare(
  candidates: ShareData[],
): Promise<"shared" | "aborted" | "gesture" | "unsupported"> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  let lastFiles: File[] | null = null;
  let sawGestureBlock = false;
  for (const payload of candidates) {
    if (payload.files?.length) lastFiles = [...payload.files];
    if (!canSharePayload(payload)) continue;
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "aborted";
      if (isShareGestureError(error)) {
        sawGestureBlock = true;
        continue;
      }
      /* Try next candidate. */
    }
  }
  /* Always retry with pure files — title/text often make canShare lie. */
  if (lastFiles?.length) {
    try {
      await navigator.share({ files: lastFiles });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "aborted";
      if (isShareGestureError(error)) return "gesture";
    }
  }
  return sawGestureBlock ? "gesture" : "unsupported";
}

/** Success copy after the system share sheet accepted the JPEG batch. */
export function shareSuccessMessage(input: {
  photoCount: number;
  fileCount: number;
  captionPresent: boolean;
}): string {
  const photos = input.photoCount === 1 ? "1 foto" : `${input.photoCount} foto’s`;
  const base =
    `${photos} + dagkaarten (${input.fileCount} JPEG) naar het deelmenu. Op iPhone: kies Opslaan om alles in Foto’s te zetten.`;
  return input.captionPresent ? `${base} Caption staat op het klembord.` : base;
}

/**
 * Clear fallback when Web Share cannot open — no silent single-file download
 * and no zip (both wrong UX for camera-roll multi-save).
 */
export function shareUnsupportedMessage(input: {
  fileCount: number;
  captionPresent: boolean;
}): string {
  const n = input.fileCount;
  const files = n === 1 ? "1 JPEG" : `${n} JPEG’s`;
  const base =
    `Het systeemdeelmenu opende niet — ${files} (dagkaarten + foto’s) konden niet samen worden gedeeld. Op iPhone: open deze pagina in Safari en tik opnieuw op Delen.`;
  return input.captionPresent ? `${base} Caption staat wel op het klembord.` : base;
}

/** Shown when files are ready but the browser needs a fresh tap to open the sheet. */
export function shareGestureRetryMessage(input: { fileCount: number }): string {
  const n = input.fileCount;
  const files = n === 1 ? "1 JPEG" : `${n} JPEG’s`;
  return `${files} staan klaar. Tik op «Open deelmenu» om het systeemdeelmenu te openen.`;
}
