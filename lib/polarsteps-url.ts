/** Normalize and validate a public Polarsteps trip URL. Strips tracking query params. */
const MAX_LEN = 500;

export function normalizePolarstepsUrl(raw: unknown): string | null {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error("Ongeldige Polarsteps-URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Polarsteps-URL moet met https:// beginnen.");
  }

  const host = url.hostname.toLowerCase();
  if (host !== "polarsteps.com" && !host.endsWith(".polarsteps.com")) {
    throw new Error("Alleen URLs van polarsteps.com zijn toegestaan.");
  }

  // Drop referral/tracking params; keep a clean public trip link.
  url.searchParams.delete("referral");
  if (![...url.searchParams.keys()].length) {
    url.search = "";
  }
  url.hash = "";

  const normalized = url.toString().replace(/\/$/, "") || url.origin;
  if (normalized.length > MAX_LEN) {
    throw new Error("Polarsteps-URL is te lang.");
  }
  return normalized;
}
