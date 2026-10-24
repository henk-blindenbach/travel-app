/** Chronological order for today’s planning strip on Vandaag. */

export type ChronoPlanningItem = {
  departure_time?: string | null;
  sort_order?: number | null;
};

function timeKey(value: string | null | undefined) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

/** Items with a departure/start time first (ascending), then sort_order, then original index. */
export function sortPlanningChronologically<T extends ChronoPlanningItem>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const timeA = timeKey(a.item.departure_time);
      const timeB = timeKey(b.item.departure_time);
      if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      const sortA = a.item.sort_order ?? 0;
      const sortB = b.item.sort_order ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
