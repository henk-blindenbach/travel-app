/** Day-entry publication labels and counters for the private journal UI. */

export type PublicationStatus = "draft" | "ready" | "published";

export type JournalEntryLike = {
  id?: string;
  title?: string | null;
  publication_status?: string | null;
};

export type JournalDayLike = {
  id: string;
  day_number: number;
  day_entries?: JournalEntryLike | JournalEntryLike[] | null;
};

/** Supabase to-one embeds may arrive as object or single-element array. */
export function oneDayEntry<T extends JournalEntryLike>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function normalizePublicationStatus(value: string | null | undefined): PublicationStatus | null {
  if (value === "draft" || value === "ready" || value === "published") return value;
  return null;
}

export function statusMeta(entry: JournalEntryLike | null | undefined) {
  const status = normalizePublicationStatus(entry?.publication_status ?? null);
  if (!entry || !status) {
    return { key: "empty" as const, label: "Geen verslag", action: "Schrijf verslag" };
  }
  if (status === "published") {
    return { key: "published" as const, label: "Gepubliceerd", action: "Open verslag" };
  }
  if (status === "ready") {
    return { key: "ready" as const, label: "Klaar", action: "Open verslag" };
  }
  return { key: "draft" as const, label: "Concept", action: "Open concept" };
}

export function countJournalStatuses(days: JournalDayLike[]) {
  let published = 0;
  let ready = 0;
  let drafts = 0;
  for (const day of days) {
    const entry = oneDayEntry(day.day_entries);
    const status = normalizePublicationStatus(entry?.publication_status ?? null);
    if (status === "published") published += 1;
    else if (status === "ready") ready += 1;
    else if (status === "draft") drafts += 1;
  }
  const empty = days.length - published - ready - drafts;
  return { published, ready, drafts, empty, total: days.length };
}

/** Next chronological day with no saved day_entries row (from after `fromDayNumber`). */
export function findNextDayWithoutEntry(
  days: JournalDayLike[],
  fromDayNumber = 0,
): JournalDayLike | null {
  const ordered = [...days].sort((a, b) => a.day_number - b.day_number);
  return ordered.find((day) => day.day_number > fromDayNumber && !oneDayEntry(day.day_entries)) ?? null;
}

export function formatSavedAt(date = new Date()) {
  return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export function savedConfirmation(date = new Date()) {
  return `Opgeslagen ✓ ${formatSavedAt(date)}`;
}
