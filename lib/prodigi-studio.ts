/**
 * Prodigi Studio Photobook API client (B1).
 * Base: https://studio.prodigi.com — auth via same X-API-Key as Print API.
 * Docs (merchant): GET/POST /v1/templates/{id}, /v1/books, preflight, render, artifacts, orders.
 * Never invents success without an API response.
 */

import { DEFAULT_PHOTO_BOOK_SKU, DEFAULT_STUDIO_TEMPLATE_ID } from "./prodigi-defaults";
import { getProdigiApiKey, type ProdigiRecipient, type ProdigiShippingMethod } from "./prodigi";

export { DEFAULT_PHOTO_BOOK_SKU, DEFAULT_STUDIO_TEMPLATE_ID };

export function studioBaseUrl() {
  return process.env.PRODIGI_STUDIO_BASE_URL?.trim() || "https://studio.prodigi.com";
}

/**
 * Prefer PRODIGI_STUDIO_TEMPLATE_ID. Falls back to Henk’s saved Travel-app template id.
 * Studio has no separate “publish for API” step — a saved template + env is enough.
 * Storefront embed / merchant snippet is NOT required.
 */
export function getStudioTemplateId() {
  return process.env.PRODIGI_STUDIO_TEMPLATE_ID?.trim() || DEFAULT_STUDIO_TEMPLATE_ID;
}

export function hasStudioTemplateConfig() {
  return Boolean(getStudioTemplateId());
}

export type StudioImageInput = {
  clientId: string;
  sourceUrl: string;
};

export type StudioCreateBookRequest = {
  templateId: string;
  images: StudioImageInput[];
  text?: Record<string, string>;
  placements?: Array<Record<string, unknown>>;
  merchantReference?: string;
};

export type StudioBookResponse = {
  id?: string;
  bookId?: string;
  status?: string;
  previewUrl?: string;
  preview_url?: string;
  editorUrl?: string;
  editor_url?: string;
  pdfUrl?: string;
  pdf_url?: string;
  sku?: string;
  productSku?: string;
  [key: string]: unknown;
};

export type StudioPreflightResponse = {
  ok?: boolean;
  blockingIssues?: unknown[];
  warnings?: unknown[];
  issues?: unknown[];
  [key: string]: unknown;
};

function studioFetch(path: string, init?: RequestInit) {
  const apiKey = getProdigiApiKey();
  if (!apiKey) {
    throw new Error("PRODIGI_API_KEY ontbreekt. Zonder key geen Studio-sync of order.");
  }
  return fetch(`${studioBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": apiKey,
      ...(init?.headers || {}),
    },
  }).then(async (response) => {
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
          : `Prodigi Studio HTTP ${response.status}`;
      const error = new Error(message) as Error & { status: number; body: unknown };
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  });
}

export function studioProjectIdFromResponse(body: StudioBookResponse | null | undefined) {
  if (!body || typeof body !== "object") return null;
  const nested = body.book && typeof body.book === "object" ? (body.book as Record<string, unknown>) : null;
  const candidates = [body.id, body.bookId, nested?.id, nested?.bookId];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function studioPreviewUrlFromResponse(body: StudioBookResponse | null | undefined) {
  if (!body || typeof body !== "object") return null;
  const nested = body.book && typeof body.book === "object" ? (body.book as Record<string, unknown>) : null;
  const candidates = [
    body.previewUrl,
    body.preview_url,
    body.editorUrl,
    body.editor_url,
    body.pdfUrl,
    body.pdf_url,
    nested?.previewUrl,
    nested?.preview_url,
    nested?.editorUrl,
    nested?.editor_url,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const id = studioProjectIdFromResponse(body);
  return id ? `${studioBaseUrl()}/books/${id}` : null;
}

export async function getStudioTemplate(templateId: string) {
  return studioFetch(`/v1/templates/${encodeURIComponent(templateId)}`) as Promise<Record<string, unknown>>;
}

export async function createStudioBook(payload: StudioCreateBookRequest) {
  return studioFetch("/v1/books", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<StudioBookResponse>;
}

export async function getStudioBook(bookId: string) {
  return studioFetch(`/v1/books/${encodeURIComponent(bookId)}`) as Promise<StudioBookResponse>;
}

export async function runStudioPreflight(bookId: string) {
  return studioFetch(`/v1/books/${encodeURIComponent(bookId)}/preflight`, {
    method: "POST",
    body: JSON.stringify({}),
  }) as Promise<StudioPreflightResponse>;
}

export async function renderStudioBook(bookId: string) {
  return studioFetch(`/v1/books/${encodeURIComponent(bookId)}/render`, {
    method: "POST",
    body: JSON.stringify({}),
  }) as Promise<StudioBookResponse>;
}

export function studioPdfArtifactUrl(bookId: string) {
  return `${studioBaseUrl()}/v1/books/${encodeURIComponent(bookId)}/artifacts/pdf`;
}

export type StudioOrderRequest = {
  shippingMethod: ProdigiShippingMethod;
  copies: number;
  recipient: ProdigiRecipient;
  merchantReference?: string;
  metadata?: Record<string, unknown>;
};

export async function createStudioOrder(bookId: string, payload: StudioOrderRequest) {
  return studioFetch(`/v1/books/${encodeURIComponent(bookId)}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<Record<string, unknown>>;
}

export async function submitStudioOrder(orderId: string) {
  return studioFetch(`/v1/orders/${encodeURIComponent(orderId)}/submit`, {
    method: "POST",
    body: JSON.stringify({}),
  }) as Promise<Record<string, unknown>>;
}

export function studioOrderIdFromResponse(body: Record<string, unknown> | null | undefined) {
  if (!body) return null;
  const nested = body.order && typeof body.order === "object" ? (body.order as Record<string, unknown>) : null;
  const candidates = [body.id, body.orderId, nested?.id, nested?.orderId];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Best-effort: Studio preflight may nest blocking issues under several keys. */
export function studioHasBlockingIssues(preflight: StudioPreflightResponse | null | undefined) {
  if (!preflight || typeof preflight !== "object") return false;
  if (preflight.ok === false) return true;
  const lists = [preflight.blockingIssues, preflight.issues];
  for (const list of lists) {
    if (Array.isArray(list) && list.length > 0) {
      const blocking = list.filter((item) => {
        if (!item || typeof item !== "object") return true;
        const severity = String((item as { severity?: unknown; level?: unknown }).severity
          ?? (item as { level?: unknown }).level
          ?? "").toLowerCase();
        return !severity || severity === "error" || severity === "blocking" || severity === "block";
      });
      if (blocking.length) return true;
    }
  }
  return false;
}
