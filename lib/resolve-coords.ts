import { geocodePlace, readExplicitCoords, type GeocodeResult } from "./geocode";

export type CoordinateStatus = "geocoded" | "manual" | "unchanged" | "failed" | "cleared" | "skipped";

const USELESS = /^(tba|tbd|n\/?a|onderweg|unknown|nog onbekend|\.+|-)$/i;

/** True when text is worth sending to Nominatim. */
export function isUsefulPlaceQuery(query: string) {
  const q = query.trim();
  if (q.length < 2 || q.length > 200) return false;
  if (USELESS.test(q)) return false;
  if (!/[a-zA-ZÀ-ÿ0-9]/.test(q)) return false;
  return true;
}

/** Prefer location; fall back to address; combine when both add signal. */
export function placeQueryFromFields(location: string | null | undefined, address: string | null | undefined) {
  const loc = (location || "").trim();
  const addr = (address || "").trim().replace(/\s+/g, " ");
  if (loc && addr) {
    if (addr.toLowerCase().includes(loc.toLowerCase())) return addr.slice(0, 200);
    return `${loc}, ${addr}`.slice(0, 200);
  }
  return (loc || addr).slice(0, 200);
}

type ResolveInput = {
  placeText: string | null;
  existingPlaceText?: string | null;
  existingLatitude?: number | null;
  existingLongitude?: number | null;
  payload: Record<string, unknown>;
  /** When false, skip geocode and return skipped (column not ready). */
  coordsReady?: boolean;
};

export async function resolveStoredCoords(input: ResolveInput): Promise<{
  latitude: number | null;
  longitude: number | null;
  status: CoordinateStatus;
}> {
  if (input.coordsReady === false) {
    return { latitude: null, longitude: null, status: "skipped" };
  }

  let latitude = input.existingLatitude ?? null;
  let longitude = input.existingLongitude ?? null;
  const explicit = readExplicitCoords(input.payload);
  const clearCoords = input.payload.clearCoordinates === true;
  const place = (input.placeText || "").trim() || null;

  if (!place || clearCoords) {
    return { latitude: null, longitude: null, status: "cleared" };
  }
  if (explicit) {
    return { latitude: explicit.latitude, longitude: explicit.longitude, status: "manual" };
  }

  const placeChanged = place !== (input.existingPlaceText || null);
  const missing = latitude === null || longitude === null;
  if (!placeChanged && !missing) {
    return { latitude, longitude, status: "unchanged" };
  }

  if (!isUsefulPlaceQuery(place)) {
    return { latitude: null, longitude: null, status: "failed" };
  }

  const geocoded: GeocodeResult = await geocodePlace(place);
  if (!geocoded) {
    return { latitude: null, longitude: null, status: "failed" };
  }
  return { latitude: geocoded.latitude, longitude: geocoded.longitude, status: "geocoded" };
}
