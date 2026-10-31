/** Concurrent journal photo uploads (init → Scaleway PUT → complete). */

export const MEDIA_UPLOAD_CONCURRENCY = 4;

export const MEDIA_ACCEPTED_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type MediaUploadPhase = "idle" | "uploading" | "done";

export type MediaUploadProgress = {
  phase: MediaUploadPhase;
  total: number;
  /** Files that finished (success or failure). */
  settled: number;
  succeeded: number;
  failed: number;
};

export const IDLE_MEDIA_UPLOAD_PROGRESS: MediaUploadProgress = {
  phase: "idle",
  total: 0,
  settled: 0,
  succeeded: 0,
  failed: 0,
};

export function resolveMediaContentType(file: File) {
  if (MEDIA_ACCEPTED_TYPES.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "heic" ? "image/heic" : extension === "heif" ? "image/heif" : "";
}

/**
 * Run async work over items with a fixed concurrency cap.
 * Order of completion is not guaranteed; each worker receives the original index.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (!items.length) return;
  const limit = Math.max(1, Math.min(Math.floor(concurrency) || 1, items.length));
  let nextIndex = 0;

  async function pump() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => pump()));
}

export function mediaUploadProgressLabel(progress: MediaUploadProgress) {
  if (progress.phase === "idle" || progress.total < 1) return "";
  if (progress.phase === "uploading") {
    return `Uploaden… ${progress.settled} van ${progress.total}`;
  }
  if (progress.failed === 0) {
    return progress.succeeded === 1
      ? "Klaar: 1 foto opgeslagen."
      : `Klaar: ${progress.succeeded} foto’s opgeslagen.`;
  }
  if (progress.succeeded === 0) {
    return progress.failed === 1
      ? "Klaar: upload mislukt (1 foto)."
      : `Klaar: upload mislukt (${progress.failed} foto’s).`;
  }
  return `Klaar: ${progress.succeeded} van ${progress.total} foto’s opgeslagen (${progress.failed} mislukt).`;
}

export function mediaUploadPercent(progress: MediaUploadProgress) {
  if (progress.total < 1) return 0;
  return Math.round((100 * progress.settled) / progress.total);
}
