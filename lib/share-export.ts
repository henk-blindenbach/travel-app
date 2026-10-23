/** Helpers for exporting journal photos in a Web Share–friendly format (JPEG). */

export function isHeicLike(mime: string | null | undefined, filename: string): boolean {
  const type = (mime || "").toLowerCase();
  const name = filename.toLowerCase();
  return (
    type.includes("heic")
    || type.includes("heif")
    || name.endsWith(".heic")
    || name.endsWith(".heif")
  );
}

/** Instagram / Android Web Share often reject HEIC; JPEG is the portable export. */
export function shareJpegFilename(originalFilename: string): string {
  const trimmed = originalFilename.trim() || "foto";
  const base = trimmed.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.jpg`;
}

export function contentDispositionAttachment(filename: string): string {
  return `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
