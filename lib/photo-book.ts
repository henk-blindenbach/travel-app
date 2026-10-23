import type { ProdigiOrderDraft, ProdigiQuoteRequest, ProdigiRecipient, ProdigiShippingMethod } from "./prodigi";
import { prodigiConfigStatus } from "./prodigi";
import type { StudioCreateBookRequest, StudioImageInput } from "./prodigi-studio";

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

export type BookStructureChapter = {
  kind: "day" | "country";
  key: string;
  title: string;
  dayNumber: number | null;
  photos: Array<{
    mediaAssetId: string;
    clientId: string;
    caption: string;
    favorite: boolean;
    downloadUrl: string | null;
  }>;
};

export type BookStructure = {
  cover: { title: string; subtitle: string | null };
  intro: string | null;
  chapters: BookStructureChapter[];
  routeSummary: string | null;
  photoCount: number;
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
  return `photo-${mediaAssetId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`;
}

/** Cover → optional intro → per-day photo blocks. No AI. */
export function buildBookStructure(input: {
  title: string;
  subtitle: string | null;
  introText?: string | null;
  assets: ExportAsset[];
  routeSummary?: string | null;
}): BookStructure {
  const chapterMap = new Map<string, BookStructureChapter>();
  for (const asset of input.assets) {
    const dayNumber = asset.dayNumber;
    const key = dayNumber != null ? `day-${dayNumber}` : "day-unknown";
    const title = dayNumber != null
      ? (asset.dayTitle?.trim() ? `Dag ${dayNumber} · ${asset.dayTitle.trim()}` : `Dag ${dayNumber}`)
      : "Overige foto’s";
    let chapter = chapterMap.get(key);
    if (!chapter) {
      chapter = { kind: "day", key, title, dayNumber, photos: [] };
      chapterMap.set(key, chapter);
    }
    chapter.photos.push({
      mediaAssetId: asset.mediaAssetId,
      clientId: photoClientId(asset.mediaAssetId),
      caption: asset.caption,
      favorite: asset.favorite,
      downloadUrl: asset.downloadUrl,
    });
  }

  const chapters = [...chapterMap.values()].sort((left, right) => {
    if (left.dayNumber == null && right.dayNumber == null) return 0;
    if (left.dayNumber == null) return 1;
    if (right.dayNumber == null) return -1;
    return left.dayNumber - right.dayNumber;
  });

  return {
    cover: { title: input.title, subtitle: input.subtitle },
    intro: input.introText?.trim() || null,
    chapters,
    routeSummary: input.routeSummary?.trim() || null,
    photoCount: input.assets.length,
  };
}

/**
 * Map pragmatic book structure onto Studio text slots.
 * Henk’s published template should expose these keys (or a subset):
 * cover.title, cover.subtitle, intro.body, route.summary,
 * day.{n}.title, photo.{clientId}.caption
 */
export function buildStudioTextFromStructure(structure: BookStructure): Record<string, string> {
  const text: Record<string, string> = {
    "cover.title": structure.cover.title,
  };
  if (structure.cover.subtitle) text["cover.subtitle"] = structure.cover.subtitle;
  if (structure.intro) text["intro.body"] = structure.intro;
  if (structure.routeSummary) text["route.summary"] = structure.routeSummary;

  for (const chapter of structure.chapters) {
    if (chapter.dayNumber != null) {
      text[`day.${chapter.dayNumber}.title`] = chapter.title;
    }
    for (const photo of chapter.photos) {
      if (photo.caption) text[`photo.${photo.clientId}.caption`] = photo.caption;
    }
  }
  return text;
}

export function buildStudioCreateRequest(input: {
  templateId: string;
  bookId: string;
  structure: BookStructure;
}): StudioCreateBookRequest | null {
  const images: StudioImageInput[] = [];
  for (const chapter of input.structure.chapters) {
    for (const photo of chapter.photos) {
      if (!photo.downloadUrl) continue;
      images.push({ clientId: photo.clientId, sourceUrl: photo.downloadUrl });
    }
  }
  if (!images.length) return null;
  return {
    templateId: input.templateId,
    merchantReference: `photo-book-${input.bookId}`,
    images,
    text: buildStudioTextFromStructure(input.structure),
  };
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

  const structure = buildBookStructure({
    title: input.book.title,
    subtitle: input.book.subtitle,
    introText: input.book.intro_text,
    assets: input.assets,
    routeSummary: input.routeSummary,
  });

  const templateId = input.book.studio_template_id?.trim() || config.studioTemplateId;
  const studioCreate = templateId
    ? buildStudioCreateRequest({ templateId, bookId: input.book.id, structure })
    : null;

  if (!templateId) {
    blockers.push("PRODIGI_STUDIO_TEMPLATE_ID ontbreekt — publiceer een Studio-template en zet de id in env.");
  }

  const orderBlockers = [...blockers, ...studioOrderBlockers(input.book)];

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
      "B1: print-ready layout via Prodigi Studio (template + foto’s + teksten).",
      "Bestellen vereist Studio-preview én expliciete preview-bevestiging; live alleen met confirmLive.",
      "Bestellen gebeurt alleen na een geslaagde Prodigi API-call — nooit gesimuleerd.",
    ],
  };
}
