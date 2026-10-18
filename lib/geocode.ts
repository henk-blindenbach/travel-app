/** Nominatim geocoding for personal/low-volume planner use. Respect usage policy. */

export type GeocodeResult = { latitude: number; longitude: number } | null;

const MIN_INTERVAL_MS = 1100;
let lastRequestAt = 0;
let chain: Promise<unknown> = Promise.resolve();

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/** Accept explicit coords from the client when provided. */
export function readExplicitCoords(payload: { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown }): GeocodeResult {
  const latitude = parseCoordinate(payload.latitude ?? payload.lat);
  const longitude = parseCoordinate(payload.longitude ?? payload.lng);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

async function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  chain = run.then(() => undefined, () => undefined);
  return run;
}

export async function geocodePlace(query: string): Promise<GeocodeResult> {
  const q = query.trim();
  if (!q || q.length > 200) return null;
  return throttle(async () => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "OpReisTravelApp/1.0 (personal trip planner; contact via project maintainers)",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { lat?: string; lon?: string }[];
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) return null;
    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  });
}
