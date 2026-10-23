/**
 * Client helpers for downloading selected journal JPEGs (camera-roll friendly).
 */

import { zipSync } from "fflate";

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
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

/** Fire all downloads immediately (desktop; browsers often only keep the first). */
export function downloadFilesLocally(files: File[]) {
  for (const file of files) triggerFileDownload(file);
}

/**
 * Sequential JPEG downloads with a short gap.
 * Kept for single-file cases; iOS Safari typically only honors one <a download> per gesture.
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

/** Unique entry names inside a zip when originals collide. */
export function uniqueZipEntryName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let n = 2;
  let candidate = `${base}-${n}${ext}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

/**
 * Pack JPEGs into one zip so the full batch (cards + photos) survives browsers
 * that only allow a single download per tap (notably iOS Safari).
 * level 0 = store; JPEGs are already compressed.
 */
export async function zipJpegFiles(files: File[], zipName: string): Promise<File> {
  const used = new Set<string>();
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    const name = uniqueZipEntryName(file.name || "foto.jpg", used);
    entries[name] = new Uint8Array(await file.arrayBuffer());
  }
  const zipped = zipSync(entries, { level: 0 });
  /* Copy into a fresh ArrayBuffer-backed view for File/Blob typings. */
  const copy = new Uint8Array(zipped.byteLength);
  copy.set(zipped);
  return new File([copy], zipName, { type: "application/zip" });
}

/** Download one file (zip or single JPEG). */
export function downloadFileLocally(file: File) {
  triggerFileDownload(file);
}

/**
 * Deliver the share batch: one zip when multiple files (iOS-safe full set),
 * otherwise a single JPEG download.
 */
export async function downloadShareBatch(files: File[], zipName: string): Promise<"zip" | "single"> {
  if (files.length === 0) return "single";
  if (files.length === 1) {
    downloadFileLocally(files[0]);
    return "single";
  }
  const zip = await zipJpegFiles(files, zipName);
  downloadFileLocally(zip);
  return "zip";
}

/** Success copy when Delen downloads JPEGs (incl. day cards) to the device. */
export function shareDownloadMessage(input: {
  photoCount: number;
  captionPresent: boolean;
  mode: "zip" | "single";
}): string {
  const n = input.photoCount;
  const photos = n === 1 ? "1 foto" : `${n} foto’s`;
  const base =
    input.mode === "zip"
      ? `${photos} + dagkaarten zitten in één zip (JPEG). Open in Bestanden en bewaar in Foto’s.`
      : `${photos} + dagkaarten (JPEG) gedownload. Op iPhone: bewaar in Foto’s (Safari).`;
  return input.captionPresent ? `${base} Caption staat op het klembord.` : base;
}

/** @deprecated Prefer shareDownloadMessage — download is now the primary path. */
export function shareUnsupportedMessage(captionPresent: boolean): string {
  return shareDownloadMessage({ photoCount: 0, captionPresent, mode: "zip" });
}
