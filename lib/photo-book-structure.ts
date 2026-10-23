/**
 * Prodigi Studio “Travel app” template page/slot builder.
 * Fills slots by name (placement.slotName); pageIndex/positionHint are secondary.
 *
 * Template ID (prefer env PRODIGI_STUDIO_TEMPLATE_ID):
 *   112004b7-199e-4be5-a5f9-e1043876f6c8
 * Default SKU: prefer env PRODIGI_DEFAULT_SKU (Layflat A4; see lib/prodigi-defaults.ts).
 * Layflat: 18–122 pages, always even — pad with blank story pages; trim with warning.
 */

import type { StudioCreateBookRequest, StudioImageInput } from "./prodigi-studio";

export const LAYFLAT_MIN_PAGES = 18;
export const LAYFLAT_MAX_PAGES = 122;

/** Studio template UI often starts content around pages 5–8; used as secondary position hint. */
export const STUDIO_CONTENT_POSITION_BASE = 5;

export const STUDIO_SLOTS = {
  /** Cover (required on Travel-app template). */
  frontCoverTitle: "fc-title",
  spineTitle: "spine-title",
  frontCoverImage: "fc-img",
  dayPhoto: "day-photo",
  dayTitle: "day-title",
  dayMeta: "day-meta",
  daySummary: "day-summary",
  dayPhoto1: "day-photo-1",
  dayPhoto2: "day-photo-2",
  dayPhoto3: "day-photo-3",
  dayTitleAlt: "day-title-alt",
  dayCaption: "day-caption",
  chapterPhoto: "chapter-photo",
  chapterTitle: "chapter-title",
  chapterSubtitle: "chapter-subtitle",
  storyText: "story-text",
} as const;

/**
 * Travel-app template image slots in Studio `requirements.imageSlots` order.
 * assignmentMode is `ordered`; we still set clientId === slotId (verified working).
 * minimumImages for this template is 15.
 */
export const TRAVEL_APP_IMAGE_SLOTS = [
  "full-bleed-img0",
  "two-vertical-img0",
  "two-vertical-img1",
  "two-horizontal-img0",
  "two-horizontal-img1",
  "four-grid-img0",
  "four-grid-img1",
  "four-grid-img2",
  "four-grid-img3",
  STUDIO_SLOTS.dayPhoto,
  STUDIO_SLOTS.dayPhoto1,
  STUDIO_SLOTS.dayPhoto2,
  STUDIO_SLOTS.dayPhoto3,
  STUDIO_SLOTS.chapterPhoto,
  STUDIO_SLOTS.frontCoverImage,
] as const;

export const TRAVEL_APP_TEXT_SLOTS = [
  STUDIO_SLOTS.daySummary,
  STUDIO_SLOTS.dayTitle,
  STUDIO_SLOTS.dayMeta,
  STUDIO_SLOTS.dayTitleAlt,
  STUDIO_SLOTS.dayCaption,
  STUDIO_SLOTS.chapterTitle,
  STUDIO_SLOTS.chapterSubtitle,
  STUDIO_SLOTS.storyText,
  STUDIO_SLOTS.spineTitle,
  STUDIO_SLOTS.frontCoverTitle,
] as const;

export type BookPageType =
  | "day-photo-story"
  | "day-three-photos"
  | "chapter"
  | "story"
  | "blank";

export type StructurePhoto = {
  mediaAssetId: string;
  clientId: string;
  caption: string;
  favorite: boolean;
  downloadUrl: string | null;
};

export type BookStructureChapter = {
  kind: "day" | "country";
  key: string;
  title: string;
  dayNumber: number | null;
  country: string | null;
  photos: StructurePhoto[];
  body: string | null;
  meta: string | null;
};

export type BookPageSlot =
  | {
      kind: "image";
      slotName: string;
      clientId: string;
      sourceUrl: string | null;
      mediaAssetId?: string;
    }
  | {
      kind: "text";
      slotName: string;
      value: string;
    };

export type BookPage = {
  type: BookPageType;
  /** 0-based index in the final page list (after pad/trim). */
  pageIndex: number;
  /** 1-based Studio position hint (content often begins at 5–8). */
  positionHint: number;
  label: string;
  slots: BookPageSlot[];
};

export type BookStructure = {
  cover: { title: string; subtitle: string | null };
  intro: string | null;
  chapters: BookStructureChapter[];
  pages: BookPage[];
  routeSummary: string | null;
  photoCount: number;
  /** Final even page count within 18–122. */
  pageCount: number;
  padCount: number;
  trimmedCount: number;
  pageCountWarning: string | null;
};

export type StructureAsset = {
  mediaAssetId: string;
  sortOrder: number;
  filename: string;
  caption: string;
  dayNumber: number | null;
  dayTitle: string | null;
  dayBody?: string | null;
  dayLocation?: string | null;
  dayDate?: string | null;
  favorite: boolean;
  downloadUrl: string | null;
};

export function photoClientId(mediaAssetId: string) {
  return `photo-${mediaAssetId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`;
}

/** Prefer favorites, then original order. */
export function rankPhotos(photos: StructurePhoto[]) {
  return [...photos].sort((left, right) => Number(right.favorite) - Number(left.favorite));
}

/**
 * Choose day page type from media + captions/story.
 * ≥3 photos and little/no story → 3-photo spread; otherwise photo + story.
 */
export function chooseDayPageType(input: {
  photoCount: number;
  body: string | null;
  captions: string[];
}): "day-photo-story" | "day-three-photos" {
  const body = input.body?.trim() || "";
  const captionBlob = input.captions.map((c) => c.trim()).filter(Boolean).join(" ");
  const hasStory = body.length >= 40 || captionBlob.length >= 120;
  if (input.photoCount >= 3 && !hasStory) return "day-three-photos";
  return "day-photo-story";
}

export function inferCountry(haystack: string, countries: string[], fallback: string | null): string | null {
  if (!countries.length) return fallback;
  const lower = haystack.toLowerCase();
  for (const country of countries) {
    const name = country.trim();
    if (name && lower.includes(name.toLowerCase())) return name;
  }
  return fallback;
}

/**
 * Enforce layflat rules: even count in [18, 122].
 * Choice: pad with blank `story-text` pages up to 18 / next even;
 * if over 122, trim trailing content pages (keep even) and set warning.
 */
export function enforceLayflatPageCount(contentPageCount: number): {
  targetCount: number;
  padCount: number;
  trimCount: number;
  warning: string | null;
} {
  let count = Math.max(0, contentPageCount);
  let trimCount = 0;
  let warning: string | null = null;

  if (count > LAYFLAT_MAX_PAGES) {
    const evenMax = LAYFLAT_MAX_PAGES % 2 === 0 ? LAYFLAT_MAX_PAGES : LAYFLAT_MAX_PAGES - 1;
    trimCount = count - evenMax;
    count = evenMax;
    warning = `Inhoud had ${contentPageCount} pagina’s; bijgesneden tot ${evenMax} (layflat max ${LAYFLAT_MAX_PAGES}, even). Controleer de Studio-preview.`;
  }

  if (count < LAYFLAT_MIN_PAGES) {
    const padCount = LAYFLAT_MIN_PAGES - count;
    return { targetCount: LAYFLAT_MIN_PAGES, padCount, trimCount, warning };
  }

  if (count % 2 !== 0) {
    return { targetCount: count + 1, padCount: 1, trimCount, warning };
  }

  return { targetCount: count, padCount: 0, trimCount, warning };
}

function textSlot(slotName: string, value: string): BookPageSlot {
  return { kind: "text", slotName, value };
}

function imageSlot(slotName: string, photo: StructurePhoto): BookPageSlot {
  return {
    kind: "image",
    slotName,
    clientId: photo.clientId,
    sourceUrl: photo.downloadUrl,
    mediaAssetId: photo.mediaAssetId,
  };
}

function dayMetaLine(input: { dayNumber: number | null; dayDate: string | null; location: string | null }) {
  const parts: string[] = [];
  if (input.dayNumber != null) parts.push(`Dag ${input.dayNumber}`);
  if (input.dayDate) {
    try {
      parts.push(
        new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(
          new Date(`${input.dayDate}T12:00:00`),
        ),
      );
    } catch {
      parts.push(input.dayDate);
    }
  }
  if (input.location?.trim()) parts.push(input.location.trim());
  return parts.join(" · ");
}

function buildDayPhotoStoryPage(chapter: BookStructureChapter, photo: StructurePhoto): Omit<BookPage, "pageIndex" | "positionHint"> {
  const summary =
    chapter.body?.trim()
    || photo.caption?.trim()
    || chapter.title;
  return {
    type: "day-photo-story",
    label: chapter.title,
    slots: [
      imageSlot(STUDIO_SLOTS.dayPhoto, photo),
      textSlot(STUDIO_SLOTS.dayTitle, chapter.title),
      textSlot(STUDIO_SLOTS.dayMeta, chapter.meta || (chapter.dayNumber != null ? `Dag ${chapter.dayNumber}` : "")),
      textSlot(STUDIO_SLOTS.daySummary, summary.slice(0, 1200)),
    ].filter((slot) => slot.kind === "image" || Boolean(slot.value)),
  };
}

function buildDayThreePhotosPage(chapter: BookStructureChapter, photos: StructurePhoto[]): Omit<BookPage, "pageIndex" | "positionHint"> {
  const trio = photos.slice(0, 3);
  const caption = trio.map((p) => p.caption.trim()).filter(Boolean).join(" · ") || chapter.title;
  const slots: BookPageSlot[] = [
    textSlot(STUDIO_SLOTS.dayTitleAlt, chapter.title),
    textSlot(STUDIO_SLOTS.dayCaption, caption.slice(0, 800)),
  ];
  const photoSlots = [STUDIO_SLOTS.dayPhoto1, STUDIO_SLOTS.dayPhoto2, STUDIO_SLOTS.dayPhoto3];
  trio.forEach((photo, index) => {
    slots.push(imageSlot(photoSlots[index]!, photo));
  });
  return { type: "day-three-photos", label: chapter.title, slots };
}

function buildChapterPage(country: string, photo: StructurePhoto | null, subtitle: string | null): Omit<BookPage, "pageIndex" | "positionHint"> {
  const slots: BookPageSlot[] = [
    textSlot(STUDIO_SLOTS.chapterTitle, country),
  ];
  if (subtitle) slots.push(textSlot(STUDIO_SLOTS.chapterSubtitle, subtitle));
  if (photo) slots.push(imageSlot(STUDIO_SLOTS.chapterPhoto, photo));
  return { type: "chapter", label: `Hoofdstuk · ${country}`, slots };
}

function buildStoryPage(label: string, body: string): Omit<BookPage, "pageIndex" | "positionHint"> {
  return {
    type: "story",
    label,
    slots: [textSlot(STUDIO_SLOTS.storyText, body.slice(0, 4000))],
  };
}

function buildBlankPage(label: string): Omit<BookPage, "pageIndex" | "positionHint"> {
  return {
    type: "blank",
    label,
    slots: [textSlot(STUDIO_SLOTS.storyText, " ")],
  };
}

function finalizePages(
  drafts: Array<Omit<BookPage, "pageIndex" | "positionHint">>,
  enforce: ReturnType<typeof enforceLayflatPageCount>,
): BookPage[] {
  let working = [...drafts];
  if (enforce.trimCount > 0) {
    working = working.slice(0, Math.max(0, working.length - enforce.trimCount));
  }
  while (working.length < enforce.targetCount) {
    working.push(buildBlankPage(`Opvulling ${working.length + 1}`));
  }
  return working.map((page, index) => ({
    ...page,
    pageIndex: index,
    positionHint: STUDIO_CONTENT_POSITION_BASE + index,
  }));
}

/** Cover → optional intro story → country chapters + per-day pages → layflat pad/trim. */
export function buildBookStructure(input: {
  title: string;
  subtitle: string | null;
  introText?: string | null;
  assets: StructureAsset[];
  routeSummary?: string | null;
  countries?: string[];
}): BookStructure {
  const countries = (input.countries || []).map((c) => c.trim()).filter(Boolean);
  const multiCountry = countries.length > 1;

  const chapterMap = new Map<string, BookStructureChapter & { dayDate: string | null; location: string | null }>();
  for (const asset of input.assets) {
    const dayNumber = asset.dayNumber;
    const key = dayNumber != null ? `day-${dayNumber}` : "day-unknown";
    const title = dayNumber != null
      ? (asset.dayTitle?.trim() ? `Dag ${dayNumber} · ${asset.dayTitle.trim()}` : `Dag ${dayNumber}`)
      : "Overige foto’s";
    let chapter = chapterMap.get(key);
    if (!chapter) {
      const location = asset.dayLocation?.trim() || null;
      const haystack = [asset.dayTitle, location, title].filter(Boolean).join(" ");
      chapter = {
        kind: "day",
        key,
        title,
        dayNumber,
        country: null,
        photos: [],
        body: asset.dayBody?.trim() || null,
        meta: null,
        dayDate: asset.dayDate || null,
        location,
      };
      chapter.country = multiCountry
        ? inferCountry(haystack, countries, null)
        : (countries[0] || null);
      chapterMap.set(key, chapter);
    } else if (asset.dayBody?.trim() && !chapter.body) {
      chapter.body = asset.dayBody.trim();
    }
    if (!chapter.location && asset.dayLocation?.trim()) chapter.location = asset.dayLocation.trim();
    if (!chapter.dayDate && asset.dayDate) chapter.dayDate = asset.dayDate;
    if (asset.dayBody?.trim() && (asset.dayBody.trim().length > (chapter.body?.length || 0))) {
      chapter.body = asset.dayBody.trim();
    }
    chapter.photos.push({
      mediaAssetId: asset.mediaAssetId,
      clientId: photoClientId(asset.mediaAssetId),
      caption: asset.caption,
      favorite: asset.favorite,
      downloadUrl: asset.downloadUrl,
    });
  }

  const dayChapters = [...chapterMap.values()].sort((left, right) => {
    if (left.dayNumber == null && right.dayNumber == null) return 0;
    if (left.dayNumber == null) return 1;
    if (right.dayNumber == null) return -1;
    return left.dayNumber - right.dayNumber;
  });

  // Inherit country forward when inference missed a day.
  let lastCountry: string | null = countries[0] || null;
  for (const chapter of dayChapters) {
    if (chapter.country) lastCountry = chapter.country;
    else if (multiCountry) chapter.country = lastCountry;
    chapter.meta = dayMetaLine({
      dayNumber: chapter.dayNumber,
      dayDate: chapter.dayDate,
      location: chapter.location,
    });
  }

  const drafts: Array<Omit<BookPage, "pageIndex" | "positionHint">> = [];
  const intro = input.introText?.trim() || null;
  if (intro) {
    drafts.push(buildStoryPage("Intro", intro));
  }

  const seenCountries = new Set<string>();
  for (const chapter of dayChapters) {
    if (multiCountry && chapter.country && !seenCountries.has(chapter.country)) {
      seenCountries.add(chapter.country);
      const coverPhoto = rankPhotos(chapter.photos).find((p) => p.downloadUrl) || chapter.photos[0] || null;
      drafts.push(buildChapterPage(
        chapter.country,
        coverPhoto,
        input.subtitle || input.routeSummary || null,
      ));
    }

    const ranked = rankPhotos(chapter.photos);
    const pageType = chooseDayPageType({
      photoCount: ranked.length,
      body: chapter.body,
      captions: ranked.map((p) => p.caption),
    });

    if (pageType === "day-three-photos" && ranked.length >= 3) {
      drafts.push(buildDayThreePhotosPage(chapter, ranked));
    } else if (ranked[0]) {
      drafts.push(buildDayPhotoStoryPage(chapter, ranked[0]));
      const body = chapter.body?.trim() || "";
      if (body.length > 600) {
        drafts.push(buildStoryPage(`${chapter.title} · verhaal`, body));
      }
    } else if (chapter.body?.trim()) {
      drafts.push(buildStoryPage(chapter.title, chapter.body.trim()));
    }
  }

  // Optional long route blurb as story page when no intro used it.
  if (input.routeSummary?.trim() && !intro) {
    drafts.push(buildStoryPage("Route", input.routeSummary.trim()));
  }

  const enforce = enforceLayflatPageCount(drafts.length);
  const pages = finalizePages(drafts, enforce);

  return {
    cover: { title: input.title, subtitle: input.subtitle },
    intro,
    chapters: dayChapters.map(({ dayDate: _d, location: _l, ...rest }) => rest),
    pages,
    routeSummary: input.routeSummary?.trim() || null,
    photoCount: input.assets.length,
    pageCount: pages.length,
    padCount: enforce.padCount,
    trimmedCount: enforce.trimCount,
    pageCountWarning: enforce.warning,
  };
}

function firstPageOfType(structure: BookStructure, type: BookPageType) {
  return structure.pages.find((page) => page.type === type) || null;
}

function slotValue(page: BookPage | null, slotName: string): string | null {
  if (!page) return null;
  for (const slot of page.slots) {
    if (slot.slotName !== slotName) continue;
    if (slot.kind === "text" && slot.value.trim()) return slot.value;
  }
  return null;
}

function slotPhoto(page: BookPage | null, slotName: string): StructurePhoto | null {
  if (!page) return null;
  for (const slot of page.slots) {
    if (slot.kind === "image" && slot.slotName === slotName && slot.sourceUrl) {
      return {
        mediaAssetId: slot.mediaAssetId || slot.clientId,
        clientId: slot.clientId,
        caption: "",
        favorite: false,
        downloadUrl: slot.sourceUrl,
      };
    }
  }
  return null;
}

function allStructurePhotos(structure: BookStructure): StructurePhoto[] {
  const photos: StructurePhoto[] = [];
  const seen = new Set<string>();
  for (const chapter of structure.chapters) {
    for (const photo of rankPhotos(chapter.photos)) {
      if (!photo.downloadUrl || seen.has(photo.mediaAssetId)) continue;
      seen.add(photo.mediaAssetId);
      photos.push(photo);
    }
  }
  return photos;
}

/**
 * Map structure → Studio create payload for the Travel-app template.
 *
 * Verified against live Studio API:
 * - `text` keys must be exact template slotIds (unknown keys → 400)
 * - image `clientId` should equal the target slotId (named assignment)
 * - template requires all listed image slots (15) + cover text slots
 * - do NOT send indexed keys like `0.story-text` or legacy `cover.title`
 * - placements omitted (named clientIds are enough; mixed placements were brittle)
 *
 * Content pages in `structure.pages` drive which day/chapter/story values win
 * (first of each type). Extra photos fill layout slots (full-bleed, grids, …).
 */
export function buildStudioCreateRequest(input: {
  templateId: string;
  bookId: string;
  structure: BookStructure;
}): StudioCreateBookRequest | null {
  const text: Record<string, string> = {};
  const photos = allStructurePhotos(input.structure);
  if (!photos.length) return null;

  const coverTitle = input.structure.cover.title.trim() || "Reisboek";
  text[STUDIO_SLOTS.frontCoverTitle] = coverTitle.slice(0, 120);
  text[STUDIO_SLOTS.spineTitle] = (input.structure.cover.subtitle?.trim() || coverTitle).slice(0, 80);

  const storyPage = firstPageOfType(input.structure, "story")
    || firstPageOfType(input.structure, "blank");
  const chapterPage = firstPageOfType(input.structure, "chapter");
  const dayStoryPage = firstPageOfType(input.structure, "day-photo-story");
  const dayThreePage = firstPageOfType(input.structure, "day-three-photos");

  const storyText = slotValue(storyPage, STUDIO_SLOTS.storyText)
    || input.structure.intro
    || input.structure.routeSummary
    || coverTitle;
  text[STUDIO_SLOTS.storyText] = storyText.slice(0, 4000);

  const chapterTitle = slotValue(chapterPage, STUDIO_SLOTS.chapterTitle)
    || input.structure.chapters.find((c) => c.country)?.country
    || coverTitle;
  text[STUDIO_SLOTS.chapterTitle] = chapterTitle.slice(0, 120);
  text[STUDIO_SLOTS.chapterSubtitle] = (
    slotValue(chapterPage, STUDIO_SLOTS.chapterSubtitle)
    || input.structure.cover.subtitle
    || " "
  ).slice(0, 200);

  text[STUDIO_SLOTS.dayTitle] = (
    slotValue(dayStoryPage, STUDIO_SLOTS.dayTitle)
    || input.structure.chapters[0]?.title
    || "Dag 1"
  ).slice(0, 120);
  text[STUDIO_SLOTS.dayMeta] = (
    slotValue(dayStoryPage, STUDIO_SLOTS.dayMeta)
    || input.structure.chapters[0]?.meta
    || " "
  ).slice(0, 200);
  text[STUDIO_SLOTS.daySummary] = (
    slotValue(dayStoryPage, STUDIO_SLOTS.daySummary)
    || input.structure.chapters[0]?.body
    || photos[0]?.caption
    || " "
  ).slice(0, 1200);

  text[STUDIO_SLOTS.dayTitleAlt] = (
    slotValue(dayThreePage, STUDIO_SLOTS.dayTitleAlt)
    || input.structure.chapters.find((c) => c.photos.length >= 3)?.title
    || text[STUDIO_SLOTS.dayTitle]
  ).slice(0, 120);
  text[STUDIO_SLOTS.dayCaption] = (
    slotValue(dayThreePage, STUDIO_SLOTS.dayCaption)
    || photos.slice(0, 3).map((p) => p.caption).filter(Boolean).join(" · ")
    || " "
  ).slice(0, 800);

  // Preferred photos for named content slots; leftovers + repeats fill layout slots.
  const preferredBySlot = new Map<string, StructurePhoto>();
  const coverPhoto = photos[0]!;
  preferredBySlot.set(STUDIO_SLOTS.frontCoverImage, coverPhoto);

  const chapterPhoto = slotPhoto(chapterPage, STUDIO_SLOTS.chapterPhoto) || photos[0]!;
  preferredBySlot.set(STUDIO_SLOTS.chapterPhoto, chapterPhoto);

  const dayPhoto = slotPhoto(dayStoryPage, STUDIO_SLOTS.dayPhoto) || photos[0]!;
  preferredBySlot.set(STUDIO_SLOTS.dayPhoto, dayPhoto);

  const trioSources = [
    slotPhoto(dayThreePage, STUDIO_SLOTS.dayPhoto1),
    slotPhoto(dayThreePage, STUDIO_SLOTS.dayPhoto2),
    slotPhoto(dayThreePage, STUDIO_SLOTS.dayPhoto3),
  ];
  preferredBySlot.set(STUDIO_SLOTS.dayPhoto1, trioSources[0] || photos[0]!);
  preferredBySlot.set(STUDIO_SLOTS.dayPhoto2, trioSources[1] || photos[1] || photos[0]!);
  preferredBySlot.set(STUDIO_SLOTS.dayPhoto3, trioSources[2] || photos[2] || photos[0]!);

  const usedIds = new Set<string>();
  for (const photo of preferredBySlot.values()) usedIds.add(photo.mediaAssetId);
  const pool = [
    ...photos.filter((p) => !usedIds.has(p.mediaAssetId)),
    ...photos, // allow reuse to satisfy minimumImages / required layout slots
  ];
  let poolIndex = 0;
  const nextPoolPhoto = () => {
    const photo = pool[poolIndex % pool.length]!;
    poolIndex += 1;
    return photo;
  };

  const images: StudioImageInput[] = [];

  for (const slotId of TRAVEL_APP_IMAGE_SLOTS) {
    const photo = preferredBySlot.get(slotId) || nextPoolPhoto();
    // clientId MUST equal slotId for this template (verified dry sync).
    images.push({ clientId: slotId, sourceUrl: photo.downloadUrl! });
  }

  return {
    templateId: input.templateId,
    merchantReference: `photo-book-${input.bookId}`,
    images,
    text,
    // No placements: named clientId===slotId + exact text slotIds is enough
    // (placements with empty image refs caused Studio 400s in dry sync).
  };
}

/** @deprecated Prefer buildStudioCreateRequest; kept for narrow text-only checks. */
export function buildStudioTextFromStructure(structure: BookStructure): Record<string, string> {
  const request = buildStudioCreateRequest({
    templateId: "test",
    bookId: "00000000-0000-4000-8000-000000000000",
    structure,
  });
  return request?.text || {};
}
