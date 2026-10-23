/**
 * Client helpers for sharing journal JPEGs via the system share sheet
 * (iOS: Opslaan → all files in Photos).
 */

export type SharePhotoFile = {
  file: File;
  name: string;
};

/**
 * Build ShareData variants. Prefer files-only first: iOS often rejects
 * text+files for multi-image "Opslaan", while files-only works.
 * Caption still goes to the clipboard separately.
 */
export function shareDataCandidates(input: {
  files: File[];
  title: string;
  text?: string;
}): ShareData[] {
  const { files, title, text } = input;
  const filesOnly: ShareData = { files, title };
  const trimmed = text?.trim();
  if (!trimmed) return [filesOnly];
  const withText: ShareData = { files, title, text: trimmed };
  /* files-only first so multi-file save succeeds on iOS. */
  return [filesOnly, withText];
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
      /* Try next candidate. */
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
