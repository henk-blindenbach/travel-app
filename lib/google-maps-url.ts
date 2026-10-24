/** Parse Google Maps share / place URLs into lat/lng without a Maps API key. */

export type ParsedMapsUrl = {
  latitude: number;
  longitude: number;
  placeName?: string;
};

const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

const EXPAND_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.maps.google.com",
]);

const USER_AGENT = "OpReisTravelApp/1.0 (personal trip planner; maps link expand)";

function validPair(latitude: number, longitude: number): { latitude: number; longitude: number } | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function parseLatLngPair(raw: string): { latitude: number; longitude: number } | null {
  const cleaned = raw.trim().replace(/\s+/g, "");
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:[^\d.].*)?$/);
  if (!match) return null;
  return validPair(Number(match[1]), Number(match[2]));
}

function decodePlaceSegment(segment: string): string | undefined {
  try {
    const decoded = decodeURIComponent(segment.replace(/\+/g, " ")).trim();
    if (!decoded || decoded.length > 160) return undefined;
    // Skip opaque place ids / data blobs
    if (/^data[!/=]/i.test(decoded)) return undefined;
    if (/^[0-9a-f-]{10,}$/i.test(decoded) && !/[a-z]/i.test(decoded.replace(/[0-9a-f-]/gi, ""))) return undefined;
    return decoded;
  } catch {
    return undefined;
  }
}

function extractPlaceName(url: URL): string | undefined {
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/i);
  if (placeMatch?.[1]) {
    const name = decodePlaceSegment(placeMatch[1]);
    if (name) return name;
  }
  const q = url.searchParams.get("q") || url.searchParams.get("query");
  if (q && !parseLatLngPair(q)) {
    const name = decodePlaceSegment(q);
    if (name) return name;
  }
  return undefined;
}

function coordsFromDataParams(href: string): { latitude: number; longitude: number } | null {
  // Prefer marker coords (!3d lat !4d lng) over camera.
  const marker = href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (marker) return validPair(Number(marker[1]), Number(marker[2]));
  return null;
}

function coordsFromAt(pathname: string): { latitude: number; longitude: number } | null {
  const match = pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  return validPair(Number(match[1]), Number(match[2]));
}

function coordsFromQuery(url: URL): { latitude: number; longitude: number } | null {
  for (const key of ["q", "query", "ll", "center"]) {
    const value = url.searchParams.get(key);
    if (!value) continue;
    const pair = parseLatLngPair(value);
    if (pair) return pair;
  }
  const destination = url.searchParams.get("destination");
  if (destination) {
    const pair = parseLatLngPair(destination);
    if (pair) return pair;
  }
  return null;
}

function extractUrlCandidate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  if (match) return match[0].replace(/[),.;]+$/, "");
  if (/^(maps\.app\.goo\.gl|goo\.gl|www\.google\.com|google\.com|maps\.google\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed.includes("google.com/maps") || trimmed.includes("maps.app.goo.gl") || trimmed.includes("goo.gl/maps")
    ? trimmed
    : null;
}

export function isGoogleMapsShortLink(text: string): boolean {
  try {
    const candidate = extractUrlCandidate(text);
    if (!candidate) return false;
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    if (host === "maps.app.goo.gl") return true;
    if (host === "goo.gl" && url.pathname.toLowerCase().startsWith("/maps")) return true;
    return false;
  } catch {
    return false;
  }
}

export function isAllowedMapsExpandHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (EXPAND_HOSTS.has(host)) return true;
  // Regional google.* redirect targets, e.g. google.nl / www.google.co.uk
  if (/^(www\.)?google\.[a-z.]+$/i.test(host)) return true;
  return false;
}

/**
 * Parse a full (or already-expanded) Google Maps URL / pasted text.
 * Priority: !3d/!4d marker → @lat,lng → q=lat,lng.
 * Returns null when no coordinates can be extracted.
 */
export function parseGoogleMapsUrl(text: string): ParsedMapsUrl | null {
  const candidate = extractUrlCandidate(text);
  if (!candidate) return null;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const isGoogle =
    host.includes("google.") ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "maps.google.com";
  if (!isGoogle) return null;

  const placeName = extractPlaceName(url);
  const fromData = coordsFromDataParams(url.href);
  const fromAt = coordsFromAt(url.pathname);
  const fromQuery = coordsFromQuery(url);
  // Marker data beats @ viewport; @ beats q= (q can be a place string).
  const coords = fromData || fromAt || fromQuery;
  if (!coords) return null;

  return placeName ? { ...coords, placeName } : coords;
}

/** Follow short-link redirects; only Google Maps hosts. Returns final URL string. */
export async function expandGoogleMapsShortUrl(text: string): Promise<string> {
  const candidate = extractUrlCandidate(text);
  if (!candidate) throw new Error("Geen geldige Google Maps-link.");

  let current = candidate;
  for (let hop = 0; hop < 8; hop += 1) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      throw new Error("Ongeldige Maps-link.");
    }

    if (!isAllowedMapsExpandHost(url.hostname)) {
      throw new Error("Alleen Google Maps-links zijn toegestaan.");
    }

    const host = url.hostname.toLowerCase();
    const isShort = SHORT_HOSTS.has(host);
    if (!isShort) return current;

    const response = await fetch(url.href, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(8_000),
    });

    const location = response.headers.get("location");
    if (!location) {
      // Some environments resolve redirects; fall back to response URL.
      if (response.url && response.url !== url.href) return response.url;
      throw new Error("Deze korte Maps-link kon niet worden gevolgd.");
    }

    current = new URL(location, url).href;
  }

  throw new Error("Te veel redirects in deze Maps-link.");
}

/** Expand short links when needed, then parse. */
export async function resolveGoogleMapsUrl(text: string): Promise<ParsedMapsUrl> {
  let source = text.trim();
  if (isGoogleMapsShortLink(source)) {
    source = await expandGoogleMapsShortUrl(source);
  }
  const parsed = parseGoogleMapsUrl(source);
  if (!parsed) {
    throw new Error("Geen coördinaten in deze link — open de pin in Maps en kies ‘Link delen’.");
  }
  return parsed;
}
