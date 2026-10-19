import type { ProdigiOrderDraft, ProdigiQuoteRequest, ProdigiRecipient, ProdigiShippingMethod } from "./prodigi";
import { prodigiConfigStatus } from "./prodigi";

export const PHOTO_BOOK_STATUSES = ["draft", "ready_for_prodigi", "submitted", "failed"] as const;
export type PhotoBookStatus = (typeof PHOTO_BOOK_STATUSES)[number];

export type PhotoBookCandidate = {
  id: string;
  original_filename: string;
  caption: string;
  sort_order: number;
  book_candidate: boolean;
  book_favorite: boolean;
  day_number: number;
  day_title: string | null;
  day_entry_id: string;
};

export type PhotoBookItemRow = {
  id: string;
  media_asset_id: string;
  sort_order: number;
  caption_override: string | null;
  media_assets?: {
    id: string;
    original_filename: string;
    caption: string;
    book_favorite: boolean;
    upload_status: string;
    day_entries?: {
      day_number: number;
      title: string | null;
      trip_id: string;
    } | null;
  } | null;
};

export type PhotoBookRow = {
  id: string;
  trip_id: string;
  title: string;
  subtitle: string | null;
  status: PhotoBookStatus;
  sku: string;
  copies: number;
  destination_country_code: string;
  shipping_method: ProdigiShippingMethod;
  recipient: Record<string, unknown>;
  export_payload: unknown;
  prodigi_quote: unknown;
  prodigi_order_id: string | null;
  prodigi_status: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

/** Softcover/hardcover photobooks need an even page count (Prodigi guidelines). */
export function evenPageCount(photoCount: number) {
  const pages = Math.max(24, photoCount);
  return pages % 2 === 0 ? pages : pages + 1;
}

export function defaultSku() {
  return process.env.PRODIGI_DEFAULT_SKU?.trim() || "BOOK-FE-A4-P-HARD-G";
}

export function parseRecipient(raw: unknown): ProdigiRecipient | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const address = value.address && typeof value.address === "object" ? (value.address as Record<string, unknown>) : null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const line1 = address && typeof address.line1 === "string" ? address.line1.trim() : "";
  const postalOrZipCode = address && typeof address.postalOrZipCode === "string" ? address.postalOrZipCode.trim() : "";
  const countryCode = address && typeof address.countryCode === "string" ? address.countryCode.trim().toUpperCase() : "";
  const townOrCity = address && typeof address.townOrCity === "string" ? address.townOrCity.trim() : "";
  if (!name || !line1 || !postalOrZipCode || !countryCode || !townOrCity) return null;
  return {
    name,
    email: typeof value.email === "string" ? value.email.trim() : undefined,
    phoneNumber: typeof value.phoneNumber === "string" ? value.phoneNumber.trim() : undefined,
    address: {
      line1,
      line2: address && typeof address.line2 === "string" ? address.line2.trim() : undefined,
      postalOrZipCode,
      countryCode,
      townOrCity,
      stateOrCounty: address && typeof address.stateOrCounty === "string" ? address.stateOrCounty.trim() : undefined,
    },
  };
}

export type ExportAsset = {
  mediaAssetId: string;
  sortOrder: number;
  filename: string;
  caption: string;
  dayNumber: number | null;
  dayTitle: string | null;
  favorite: boolean;
  /** Temporary signed URL when available; Prodigi must be able to GET this. */
  downloadUrl: string | null;
};

export type PhotoBookExport = {
  version: 1;
  provider: "prodigi";
  readyForOrder: boolean;
  blockers: string[];
  book: {
    id: string;
    tripId: string;
    title: string;
    subtitle: string | null;
    sku: string;
    copies: number;
    destinationCountryCode: string;
    shippingMethod: ProdigiShippingMethod;
    pageCount: number;
    photoCount: number;
  };
  assets: ExportAsset[];
  prodigi: {
    config: ReturnType<typeof prodigiConfigStatus>;
    quoteRequest: ProdigiQuoteRequest;
    orderDraft: ProdigiOrderDraft | null;
  };
  notes: string[];
};

/** Supabase embed typing sometimes surfaces as object or array. */
export function oneRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function buildPhotoBookExport(input: {
  book: PhotoBookRow;
  assets: ExportAsset[];
}): PhotoBookExport {
  const pageCount = evenPageCount(input.assets.length);
  const blockers: string[] = [];
  if (!input.assets.length) blockers.push("Geen foto’s in het boek.");
  if (input.assets.length < 1) blockers.push("Selecteer minstens één foto.");
  const missingUrls = input.assets.filter((asset) => !asset.downloadUrl).length;
  if (missingUrls) blockers.push(`${missingUrls} foto(’s) hebben nog geen download-URL voor Prodigi.`);

  const recipient = parseRecipient(input.book.recipient);
  if (!recipient) blockers.push("Vul een compleet afleveradres in vóór een echte bestelling.");

  const config = prodigiConfigStatus();
  if (!config.configured) blockers.push("PRODIGI_API_KEY ontbreekt (sandbox of live).");

  const quoteRequest: ProdigiQuoteRequest = {
    shippingMethod: input.book.shipping_method,
    destinationCountryCode: input.book.destination_country_code,
    currencyCode: "EUR",
    items: [
      {
        sku: input.book.sku,
        copies: input.book.copies,
        assets: [{ printArea: "default", pageCount }],
      },
    ],
  };

  const orderDraft: ProdigiOrderDraft | null =
    recipient && input.assets.every((asset) => asset.downloadUrl)
      ? {
          merchantReference: `photo-book-${input.book.id}`,
          shippingMethod: input.book.shipping_method,
          recipient,
          items: [
            {
              merchantReference: `book-${input.book.id}`,
              sku: input.book.sku,
              copies: input.book.copies,
              sizing: "fitPrintArea",
              assets: [
                // First useful slice: one multipage asset slot with pageCount.
                // Full per-page PDF/layout composition is a later Prodigi Studio step.
                {
                  printArea: "default",
                  url: input.assets[0]!.downloadUrl!,
                  pageCount,
                },
                ...input.assets.slice(1).map((asset) => ({
                  printArea: "default",
                  url: asset.downloadUrl!,
                })),
              ],
            },
          ],
          metadata: {
            tripId: input.book.trip_id,
            photoBookId: input.book.id,
            title: input.book.title,
            source: "opreis-photo-book-v1",
          },
        }
      : null;

  return {
    version: 1,
    provider: "prodigi",
    readyForOrder: blockers.length === 0 && Boolean(orderDraft),
    blockers,
    book: {
      id: input.book.id,
      tripId: input.book.trip_id,
      title: input.book.title,
      subtitle: input.book.subtitle,
      sku: input.book.sku,
      copies: input.book.copies,
      destinationCountryCode: input.book.destination_country_code,
      shippingMethod: input.book.shipping_method,
      pageCount,
      photoCount: input.assets.length,
    },
    assets: input.assets,
    prodigi: {
      config,
      quoteRequest,
      orderDraft,
    },
    notes: [
      "Interne selectie is leverancier-onafhankelijk; Prodigi is de v1-printprovider.",
      "Echte print-ready spreads (cover/spine/paginalayout) volgen via Prodigi Studio of een PDF-pipeline.",
      "Bestellen gebeurt alleen na een geslaagde Prodigi API-call — nooit gesimuleerd.",
    ],
  };
}
