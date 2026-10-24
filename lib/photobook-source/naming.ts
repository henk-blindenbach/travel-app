/** Filesystem-safe names for Photobook Source Package folders and ZIP. */

export function filesystemSlug(value: string, maxLength = 40): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/→|->/g, "-")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "dag";
}

export function padDaySequence(sequence: number): string {
  return String(Math.max(1, sequence)).padStart(2, "0");
}

export function dayFolderName(input: {
  sequence: number;
  date: string;
  locationOrTitle: string;
}): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : "0000-00-00";
  return `${padDaySequence(input.sequence)}_${date}_${filesystemSlug(input.locationOrTitle)}`;
}

export function photoExportFilename(sequence: number, extension: string, role: "hero" | "photo"): string {
  const ext = normalizeExtension(extension);
  const index = padDaySequence(sequence);
  return role === "hero" ? `${index}_HERO.${ext}` : `${index}.${ext}`;
}

export function normalizeExtension(extension: string): string {
  const cleaned = extension.replace(/^\./, "").trim().toLowerCase();
  if (!cleaned) return "jpg";
  if (cleaned === "jpeg") return "jpg";
  return cleaned.replace(/[^a-z0-9]/g, "") || "jpg";
}

export function extensionFromFilename(filename: string, mimeType?: string | null): string {
  const match = filename.trim().match(/\.([a-zA-Z0-9]+)$/);
  if (match?.[1]) return normalizeExtension(match[1]);
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("heic")) return "heic";
  if (mime.includes("heif")) return "heif";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

export function tripZipBasename(title: string, startsOn: string): string {
  const year = /^\d{4}/.test(startsOn) ? startsOn.slice(0, 4) : "";
  const base = filesystemSlug(title, 80);
  if (!year) return base;
  if (base.endsWith(`-${year}`) || base.endsWith(year)) return base;
  return `${base}-${year}`;
}
