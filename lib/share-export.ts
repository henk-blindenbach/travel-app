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

/**
 * Web Share / canShare often rejects a batch when two Files share the same name
 * (common after duplicate camera uploads). Keep the first name; suffix later ones.
 */
export function uniqueShareFilenames(filenames: string[]): string[] {
  const seen = new Map<string, number>();
  return filenames.map((name) => {
    const trimmed = name.trim() || "foto.jpg";
    const count = (seen.get(trimmed) || 0) + 1;
    seen.set(trimmed, count);
    if (count === 1) return trimmed;
    const match = trimmed.match(/^(.*?)(\.[^.]+)$/);
    if (!match) return `${trimmed}-${count}`;
    return `${match[1]}-${count}${match[2]}`;
  });
}

export function contentDispositionAttachment(filename: string): string {
  return `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
