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
