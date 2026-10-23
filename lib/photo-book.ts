import type { ProdigiOrderDraft, ProdigiQuoteRequest, ProdigiRecipient, ProdigiShippingMethod } from "./prodigi";
import { prodigiConfigStatus } from "./prodigi";
import type { StudioCreateBookRequest } from "./prodigi-studio";
import { getStudioTemplateId } from "./prodigi-studio";
import { DEFAULT_PHOTO_BOOK_SKU, DEFAULT_STUDIO_TEMPLATE_ID } from "./prodigi-defaults";
import {
  buildBookStructure as buildBookStructureCore,
  buildStudioCreateRequest as buildStudioCreateRequestCore,
  buildStudioTextFromStructure as buildStudioTextFromStructureCore,
  enforceLayflatPageCount,
  photoClientId as photoClientIdCore,
  type BookStructure,
  type StructureAsset,
} from "./photo-book-structure";

export { DEFAULT_PHOTO_BOOK_SKU, DEFAULT_STUDIO_TEMPLATE_ID } from "./prodigi-defaults";
export {
  LAYFLAT_MAX_PAGES,
  LAYFLAT_MIN_PAGES,
  STUDIO_CONTENT_POSITION_BASE,
  STUDIO_SLOTS,
  chooseDayPageType,
  enforceLayflatPageCount,
  inferCountry,
} from "./photo-book-structure";

export type {
  BookPage,
  BookPageSlot,
  BookPageType,
  BookStructure,
  BookStructureChapter,
  StructureAsset,
  StructurePhoto,
} from "./photo-book-structure";

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
  intro_text?: string | null;
  studio_template_id?: string | null;
  studio_project_id?: string | null;
  studio_preview_url?: string | null;
  studio_status?: string | null;
  studio_payload?: unknown;
  studio_preflight?: unknown;
  preview_acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
};

/** Layflat: even page count within 18–122 (pad/trim rules in enforceLayflatPageCount). */
export function evenPageCount(contentPageCount: number) {
  return enforceLayflatPageCount(contentPageCount).targetCount;
}

export function defaultSku() {
  return process.env.PRODIGI_DEFAULT_SKU?.trim() || DEFAULT_PHOTO_BOOK_SKU;
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

export type ExportAsset = StructureAsset;

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
  structure: BookStructure;
  assets: ExportAsset[];
  prodigi: {
    config: ReturnType<typeof prodigiConfigStatus>;
    quoteRequest: ProdigiQuoteRequest;
    orderDraft: ProdigiOrderDraft | null;
    studio: {
      templateId: string | null;
      projectId: string | null;
      previewUrl: string | null;
      previewAcknowledged: boolean;
      createRequest: StudioCreateBookRequest | null;
    };
  };
  notes: string[];
};

export function photoClientId(mediaAssetId: string) {
  return photoClientIdCore(mediaAssetId);
}

/** Cover → optional intro → country chapters + per-day Studio pages. No AI. */
export function buildBookStructure(input: {
  title: string;
  subtitle: string | null;
  introText?: string | null;
  assets: ExportAsset[];
  routeSummary?: string | null;
  countries?: string[];
}): BookStructure {
  return buildBookStructureCore(input);
}

/** Slot-name text map from structure (for tests / inspect). */
export function buildStudioTextFromStructure(structure: BookStructure): Record<string, string> {
  return buildStudioTextFromStructureCore(structure);
}

export function buildStudioCreateRequest(input: {
  templateId: string;
  bookId: string;
  structure: BookStructure;
}): StudioCreateBookRequest | null {
  return buildStudioCreateRequestCore(input);
}

export function studioOrderBlockers(book: PhotoBookRow) {
  const blockers: string[] = [];
  if (!book.studio_project_id) {
    blockers.push("Maak eerst een Studio-project (Sync naar Prodigi Studio) met preview.");
  }
  if (!book.studio_preview_url && !book.studio_project_id) {
    blockers.push("Geen Studio-preview beschikbaar.");
  }
  if (!book.preview_acknowledged_at) {
    blockers.push("Bevestig dat je de Studio-preview hebt bekeken vóór bestellen.");
  }
  return blockers;
}

/** Supabase embed typing sometimes surfaces as object or array. */
export function oneRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function buildPhotoBookExport(input: {
  book: PhotoBookRow;
  assets: ExportAsset[];
  routeSummary?: string | null;
  countries?: string[];
}): PhotoBookExport {
  const blockers: string[] = [];
  if (!input.assets.length) blockers.push("Geen foto’s in het boek.");
  if (input.assets.length < 1) blockers.push("Selecteer minstens één foto.");
  const missingUrls = input.assets.filter((asset) => !asset.downloadUrl).length;
  if (missingUrls) blockers.push(`${missingUrls} foto(’s) hebben nog geen download-URL voor Prodigi.`);

  const recipient = parseRecipient(input.book.recipient);
  if (!recipient) blockers.push("Vul een compleet afleveradres in vóór een echte bestelling.");

  const config = prodigiConfigStatus();
  if (!config.configured) blockers.push("PRODIGI_API_KEY ontbreekt (sandbox of live).");

  const structure = buildBookStructure({
    title: input.book.title,
    subtitle: input.book.subtitle,
    introText: input.book.intro_text,
    assets: input.assets,
    routeSummary: input.routeSummary,
    countries: input.countries,
  });
  const pageCount = structure.pageCount;

  const templateId = input.book.studio_template_id?.trim() || config.studioTemplateId || getStudioTemplateId();
  const studioCreate = templateId
    ? buildStudioCreateRequest({ templateId, bookId: input.book.id, structure })
    : null;

  if (!templateId) {
    blockers.push("PRODIGI_STUDIO_TEMPLATE_ID ontbreekt — zet de opgeslagen Studio-template-id in env.");
  }

  const orderBlockers = [...blockers, ...studioOrderBlockers(input.book)];
  if (structure.pageCountWarning) {
    orderBlockers.push(structure.pageCountWarning);
  }

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

  // Thin Print API draft kept for quotes/debug only — live orders go through Studio.
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
            source: "opreis-photo-book-studio-b1",
            studioProjectId: input.book.studio_project_id,
          },
        }
      : null;

  const readyForOrder = orderBlockers.length === 0;

  return {
    version: 1,
    provider: "prodigi",
    readyForOrder,
    blockers: orderBlockers,
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
    structure,
    assets: input.assets,
    prodigi: {
      config,
      quoteRequest,
      orderDraft,
      studio: {
        templateId: templateId || null,
        projectId: input.book.studio_project_id || null,
        previewUrl: input.book.studio_preview_url || null,
        previewAcknowledged: Boolean(input.book.preview_acknowledged_at),
        createRequest: studioCreate,
      },
    },
    notes: [
      "B1: print-ready layout via Prodigi Studio (saved template + named slots).",
      "Embed/merchant snippet niet nodig — alleen template-id + SKU in env.",
      "Layflat: even page count 18–122 (pad blank / trim met warning).",
      "Bestellen vereist Studio-preview én expliciete preview-bevestiging; live alleen met confirmLive.",
      "Bestellen gebeurt alleen na een geslaagde Prodigi API-call — nooit gesimuleerd.",
      ...(structure.pageCountWarning ? [structure.pageCountWarning] : []),
    ],
  };
}
