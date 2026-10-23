export type MapPinKind =
  | "planned"
  | "visited"
  | "published"
  | "accommodation"
  | "activity"
  | "transport"
  | "flight"
  | "permit";

export type TripMapPin = {
  id: string;
  kind: MapPinKind;
  latitude: number;
  longitude: number;
  label: string;
  subtitle?: string;
  href?: string;
  /** Private web image URL or public media stream path. */
  thumbnailUrl?: string;
  dayNumber?: number;
};

export const PLANNING_KIND_LABELS: Record<
  Extract<MapPinKind, "accommodation" | "activity" | "transport" | "flight" | "permit">,
  string
> = {
  accommodation: "Verblijf",
  activity: "Activiteit",
  transport: "Vervoer",
  flight: "Vlucht",
  permit: "Visum / permit",
};

export function isPlanningMapKind(kind: MapPinKind): kind is keyof typeof PLANNING_KIND_LABELS {
  return kind in PLANNING_KIND_LABELS;
}

/** Day pins for the chronological route line: planned + published/actual (not photos or planning items). */
export function dayRoutePins(pins: TripMapPin[]): TripMapPin[] {
  const byDay = new Map<number, TripMapPin>();
  for (const pin of pins) {
    if (typeof pin.dayNumber !== "number") continue;
    if (pin.kind !== "planned" && pin.kind !== "published") continue;
    const existing = byDay.get(pin.dayNumber);
    // Prefer published/actual over planned for the same day.
    if (!existing || (pin.kind === "published" && existing.kind === "planned")) {
      byDay.set(pin.dayNumber, pin);
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, pin]) => pin);
}

/** Pin popup title: map_label → location → title. */
export function planningPinLabel(
  mapLabel: string | null | undefined,
  location: string | null | undefined,
  title: string,
): string {
  const label = (mapLabel || "").trim();
  if (label) return label;
  const loc = (location || "").trim();
  if (loc) return loc;
  return title;
}
