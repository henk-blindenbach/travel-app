/**
 * Thin Prodigi Print API v4 client.
 * Sandbox by default. Live only when PRODIGI_ENV=live.
 * Never invents order success without an API response.
 */

export type ProdigiShippingMethod = "Budget" | "Standard" | "StandardPlus" | "Express" | "Overnight";

export type ProdigiRecipient = {
  name: string;
  email?: string;
  phoneNumber?: string;
  address: {
    line1: string;
    line2?: string;
    postalOrZipCode: string;
    countryCode: string;
    townOrCity: string;
    stateOrCounty?: string;
  };
};

export type ProdigiOrderItem = {
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: "fillPrintArea" | "fitPrintArea" | "stretchToPrintArea";
  assets: Array<{
    printArea: string;
    url: string;
    pageCount?: number;
  }>;
};

export type ProdigiOrderDraft = {
  merchantReference: string;
  shippingMethod: ProdigiShippingMethod;
  recipient: ProdigiRecipient;
  items: ProdigiOrderItem[];
  metadata?: Record<string, unknown>;
};

export type ProdigiQuoteRequest = {
  shippingMethod: ProdigiShippingMethod;
  destinationCountryCode: string;
  currencyCode?: string;
  items: Array<{
    sku: string;
    copies: number;
    assets: Array<{ printArea: string; pageCount?: number }>;
  }>;
};

function envName(): "sandbox" | "live" {
  return process.env.PRODIGI_ENV === "live" ? "live" : "sandbox";
}

export function prodigiBaseUrl() {
  return envName() === "live" ? "https://api.prodigi.com" : "https://api.sandbox.prodigi.com";
}

export function getProdigiApiKey() {
  const key = process.env.PRODIGI_API_KEY?.trim();
  return key || null;
}

export function hasProdigiConfig() {
  return Boolean(getProdigiApiKey());
}

export function prodigiConfigStatus() {
  const studioTemplateId = process.env.PRODIGI_STUDIO_TEMPLATE_ID?.trim() || null;
  return {
    configured: hasProdigiConfig(),
    env: envName(),
    baseUrl: prodigiBaseUrl(),
    defaultSku: process.env.PRODIGI_DEFAULT_SKU?.trim() || "BOOK-FE-A4-P-HARD-G",
    studioTemplateId,
    studioConfigured: Boolean(studioTemplateId),
    studioBaseUrl: process.env.PRODIGI_STUDIO_BASE_URL?.trim() || "https://studio.prodigi.com",
  };
}

async function prodigiFetch(path: string, init?: RequestInit) {
  const apiKey = getProdigiApiKey();
  if (!apiKey) {
    throw new Error("PRODIGI_API_KEY ontbreekt. Maak een Prodigi-account en zet de key in Vercel.");
  }
  const response = await fetch(`${prodigiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body && typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Prodigi HTTP ${response.status}`;
    const error = new Error(message) as Error & { status: number; body: unknown };
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function createProdigiQuote(payload: ProdigiQuoteRequest) {
  return prodigiFetch("/v4.0/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createProdigiOrder(payload: ProdigiOrderDraft) {
  return prodigiFetch("/v4.0/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
