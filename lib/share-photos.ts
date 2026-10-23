/**
 * Client helpers for downloading selected journal JPEGs (camera-roll friendly).
 */

export type SharePhotoFile = {
  file: File;
  name: string;
};

/** Build ShareData variants: files+text first, then files-only (kept for optional Web Share). */
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
 * Kept for optional use; primary journal path is sequential JPEG download.
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

function triggerFileDownload(file: File) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

/** Fire all downloads immediately (desktop; browsers often only keep the first). */
export function downloadFilesLocally(files: File[]) {
  for (const file of files) triggerFileDownload(file);
}

/**
 * Sequential JPEG downloads with a short gap so iOS Safari can hand each file
 * to Photos / Files instead of collapsing a multi-file burst into one save.
 */
export async function downloadFilesSequentially(
  files: File[],
  gapMs = 450,
): Promise<void> {
  for (let i = 0; i < files.length; i += 1) {
    triggerFileDownload(files[i]);
    if (i < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, gapMs));
    }
  }
}

/** Success copy when Delen downloads JPEGs (incl. day cards) to the device. */
export function shareDownloadMessage(input: {
  photoCount: number;
  captionPresent: boolean;
}): string {
  const n = input.photoCount;
  const photos =
    n === 1
      ? "1 foto"
      : `${n} foto’s`;
  const base =
    `${photos} + dagkaarten (JPEG) worden gedownload. Op iPhone: bewaar ze in Foto’s (Safari werkt het best).`;
  return input.captionPresent ? `${base} Caption staat op het klembord.` : base;
}

/** @deprecated Prefer shareDownloadMessage — download is now the primary path. */
export function shareUnsupportedMessage(captionPresent: boolean): string {
  return shareDownloadMessage({ photoCount: 0, captionPresent });
}
