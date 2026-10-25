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
  /** Photo EXIF capture time (ISO); used to order the visited trail. */
  capturedAt?: string | null;
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

function comparePhotoTrail(a: TripMapPin, b: TripMapPin) {
  const aTime = a.capturedAt ? Date.parse(a.capturedAt) : Number.NaN;
  const bTime = b.capturedAt ? Date.parse(b.capturedAt) : Number.NaN;
  const aHas = Number.isFinite(aTime);
  const bHas = Number.isFinite(bTime);
  if (aHas && bHas && aTime !== bTime) return aTime - bTime;
  if (aHas !== bHas) return aHas ? -1 : 1;
  const aDay = typeof a.dayNumber === "number" ? a.dayNumber : Number.POSITIVE_INFINITY;
  const bDay = typeof b.dayNumber === "number" ? b.dayNumber : Number.POSITIVE_INFINITY;
  if (aDay !== bDay) return aDay - bDay;
  return a.id.localeCompare(b.id);
}

/** Visited photo-EXIF pins in capture order (fallback: day number). */
export function photoTrailPins(pins: TripMapPin[]): TripMapPin[] {
  return pins.filter((pin) => pin.kind === "visited").sort(comparePhotoTrail);
}

/** Planned / published day pins, one per day (published preferred). Fallback when no photo trail. */
export function plannedDayRoutePins(pins: TripMapPin[]): TripMapPin[] {
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

/**
 * Chronological route line for the map.
 * Prefer the visited photo-EXIF trail when ≥2 GPS photos exist; otherwise planned/published day pins.
 * Planning-item pins are never part of the line.
 */
export function dayRoutePins(pins: TripMapPin[]): TripMapPin[] {
  const trail = photoTrailPins(pins);
  if (trail.length >= 2) return trail;
  return plannedDayRoutePins(pins);
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
