export type MapPinKind = "planned" | "visited" | "published";

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
