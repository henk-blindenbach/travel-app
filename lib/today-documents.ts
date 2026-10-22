/** Which trip documents belong on the Vandaag “Documenten van vandaag” strip. */

export type TodayDoc = {
  id: string;
  title: string;
  document_type?: string | null;
  trip_day_id: string | null;
  planning_item_id?: string | null;
  planningItemIds?: string[];
};

/**
 * Today + tomorrow day docs, plus trip-wide (trip_day_id null) such as visas.
 * Before the trip starts, pass the first travel day as `focusDayId` (and optionally day 2 as tomorrow).
 */
export function selectRoadDocuments<T extends TodayDoc>(
  documents: T[],
  focusDayId: string | null | undefined,
  nextDayId?: string | null,
) {
  const dayIds = new Set([focusDayId, nextDayId].filter(Boolean) as string[]);
  return documents.filter((document) => document.trip_day_id === null || dayIds.has(document.trip_day_id));
}

/** Stable order: pinned first (if present), then focus day, next day, hele reis; title A–Z within group. */
export function sortRoadDocuments<T extends TodayDoc & { is_pinned?: boolean | null }>(
  documents: T[],
  focusDayId: string | null | undefined,
  nextDayId?: string | null,
) {
  const rank = (doc: T) => {
    if (doc.is_pinned) return 0;
    if (focusDayId && doc.trip_day_id === focusDayId) return 1;
    if (nextDayId && doc.trip_day_id === nextDayId) return 2;
    if (doc.trip_day_id === null) return 3;
    return 4;
  };
  return [...documents].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, "nl");
  });
}
