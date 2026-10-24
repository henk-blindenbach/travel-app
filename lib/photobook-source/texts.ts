import type { PhotobookSourceDay, PhotobookSourcePackage } from "./types";

const NL_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** e.g. "2 november 2026" */
export function formatNlLongDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  return `${parts.day} ${NL_MONTHS[parts.month - 1]} ${parts.year}`;
}

/** e.g. "27 October 2026" — used in book.md range style from the spec examples. */
export function formatEnLongDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  return `${parts.day} ${EN_MONTHS[parts.month - 1]} ${parts.year}`;
}

export function formatDateRangeNl(start: string, end: string): string {
  if (!start && !end) return "";
  if (start === end || !end) return formatNlLongDate(start);
  if (!start) return formatNlLongDate(end);
  return `${formatNlLongDate(start)} – ${formatNlLongDate(end)}`;
}

export function buildStoryTxt(day: PhotobookSourceDay): string {
  const lines: string[] = [];
  const title = day.title.trim() || `Dag ${day.dayNumber}`;
  lines.push(`Dag ${day.dayNumber} — ${title}`);
  if (day.date) lines.push(formatNlLongDate(day.date));
  if (day.locationName.trim()) lines.push(day.locationName.trim());
  lines.push("");
  const story = day.story.trim();
  if (story) lines.push(story);
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export function buildBookMarkdown(pkg: PhotobookSourcePackage): string {
  const lines: string[] = [];
  lines.push(pkg.trip.title);
  lines.push("");
  const range = formatDateRangeNl(pkg.trip.startDate, pkg.trip.endDate);
  if (range) {
    lines.push(range);
    lines.push("");
  }

  for (const day of pkg.days) {
    const title = day.title.trim() || `Dag ${day.dayNumber}`;
    lines.push(`Dag ${day.dayNumber} — ${title}`);
    lines.push("");
    if (day.date) lines.push(`Datum: ${formatNlLongDate(day.date)}`);
    if (day.locationName.trim()) lines.push(`Locatie: ${day.locationName.trim()}`);
    if (day.date || day.locationName.trim()) lines.push("");
    const story = day.story.trim();
    if (story) {
      lines.push(story);
      lines.push("");
    }
    lines.push("Foto's:");
    lines.push("");
    for (const photo of day.photos) {
      lines.push(`* ${photo.filename}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}
