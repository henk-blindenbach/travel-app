/** Keep in sync with lib/i18n/config LOCALES (self-contained for Node test runner). */
export type EntryLocale = "nl" | "en" | "pt";
const ENTRY_LOCALES = ["nl", "en", "pt"] as const;
const DEFAULT_ENTRY_LOCALE: EntryLocale = "nl";

export type EntryI18nMap = Partial<Record<EntryLocale, string>>;

export type EntryTranslations = {
  title_i18n: EntryI18nMap;
  body_i18n: EntryI18nMap;
  actual_location_i18n: EntryI18nMap;
};

const TITLE_MAX = 160;
const LOCATION_MAX = 160;
const BODY_MAX = 20_000;

function safeText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Normalize a jsonb locale map; drop empty strings. */
export function normalizeEntryI18nMap(value: unknown, maxLength: number): EntryI18nMap {
  const source = asRecord(value);
  const out: EntryI18nMap = {};
  for (const locale of ENTRY_LOCALES) {
    const raw = source[locale];
    if (typeof raw !== "string") continue;
    const text = safeText(raw, maxLength);
    if (text) out[locale] = text;
  }
  return out;
}

export function normalizeEntryTranslations(input: {
  title_i18n?: unknown;
  body_i18n?: unknown;
  actual_location_i18n?: unknown;
}): EntryTranslations {
  return {
    title_i18n: normalizeEntryI18nMap(input.title_i18n, TITLE_MAX),
    body_i18n: normalizeEntryI18nMap(input.body_i18n, BODY_MAX),
    actual_location_i18n: normalizeEntryI18nMap(input.actual_location_i18n, LOCATION_MAX),
  };
}

/** Keep non-nl keys; set/overwrite nl from Dutch primary fields. */
export function syncDutchIntoI18n(
  existing: EntryI18nMap,
  dutch: string,
  maxLength: number,
): EntryI18nMap {
  const next: EntryI18nMap = { ...existing };
  const text = safeText(dutch, maxLength);
  if (text) next.nl = text;
  else delete next.nl;
  return next;
}

export function mergeLocaleIntoI18n(
  existing: EntryI18nMap,
  locale: EntryLocale,
  value: string,
  maxLength: number,
): EntryI18nMap {
  const next: EntryI18nMap = { ...existing };
  const text = safeText(value, maxLength);
  if (text) next[locale] = text;
  else delete next[locale];
  return next;
}

/**
 * Pick translated text for UI locale with fallback: locale → nl → primary column → "".
 */
export function pickEntryText(
  map: EntryI18nMap | null | undefined,
  locale: EntryLocale,
  primaryFallback = "",
): string {
  const normalized = normalizeEntryI18nMap(map || {}, BODY_MAX);
  const fromLocale = normalized[locale]?.trim();
  if (fromLocale) return fromLocale;
  const fromNl = normalized[DEFAULT_ENTRY_LOCALE]?.trim();
  if (fromNl) return fromNl;
  return primaryFallback.trim();
}

export function localizeEntryFields(
  entry: {
    title?: string | null;
    body?: string | null;
    actual_location?: string | null;
    title_i18n?: unknown;
    body_i18n?: unknown;
    actual_location_i18n?: unknown;
  },
  locale: EntryLocale,
) {
  const maps = normalizeEntryTranslations(entry);
  return {
    title: pickEntryText(maps.title_i18n, locale, entry.title || ""),
    body: pickEntryText(maps.body_i18n, locale, entry.body || ""),
    actual_location: pickEntryText(maps.actual_location_i18n, locale, entry.actual_location || ""),
  };
}

/** Sanitize AI or manual EN/PT payload (never overwrites nl from this path). */
export function sanitizeTranslationPatch(payload: unknown): {
  title_i18n: EntryI18nMap;
  body_i18n: EntryI18nMap;
  actual_location_i18n: EntryI18nMap;
} {
  const source = asRecord(payload);
  const title = normalizeEntryI18nMap(source.title_i18n ?? source.titles, TITLE_MAX);
  const body = normalizeEntryI18nMap(source.body_i18n ?? source.bodies, BODY_MAX);
  const location = normalizeEntryI18nMap(
    source.actual_location_i18n ?? source.locations,
    LOCATION_MAX,
  );
  const stripNl = (map: EntryI18nMap): EntryI18nMap => {
    const { nl: _nl, ...rest } = map;
    void _nl;
    return rest;
  };
  return {
    title_i18n: stripNl(title),
    body_i18n: stripNl(body),
    actual_location_i18n: stripNl(location),
  };
}

export function mergeTranslationPatch(
  existing: EntryTranslations,
  patch: ReturnType<typeof sanitizeTranslationPatch>,
): EntryTranslations {
  return {
    title_i18n: { ...existing.title_i18n, ...patch.title_i18n },
    body_i18n: { ...existing.body_i18n, ...patch.body_i18n },
    actual_location_i18n: { ...existing.actual_location_i18n, ...patch.actual_location_i18n },
  };
}

export function journalTranslateJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      en: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          actual_location: { type: "string" },
          body: { type: "string" },
        },
        required: ["title", "actual_location", "body"],
      },
      pt: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          actual_location: { type: "string" },
          body: { type: "string" },
        },
        required: ["title", "actual_location", "body"],
      },
    },
    required: ["en", "pt"],
  };
}

export function journalTranslatePrompt(facts: {
  title: string;
  location: string;
  body: string;
}) {
  return [
    "Translate this travel journal entry from Dutch into English (en) and European Portuguese (pt).",
    "Keep the same meaning, first-person plural voice when present, and paragraph breaks.",
    "Do not invent facts, places, or feelings. Preserve proper names when they are already in Latin script.",
    "Place names may stay recognizable; translate descriptive location phrases when natural.",
    "Return only the structured JSON fields requested.",
    `Dutch title: ${facts.title || "(empty)"}`,
    `Dutch location: ${facts.location || "(empty)"}`,
    `Dutch body:\n${facts.body || "(empty)"}`,
  ].join("\n");
}

export function parseAiTranslations(raw: string): ReturnType<typeof sanitizeTranslationPatch> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return null;
  }
  const root = asRecord(parsed);
  const en = asRecord(root.en);
  const pt = asRecord(root.pt);
  const patch = sanitizeTranslationPatch({
    title_i18n: {
      en: typeof en.title === "string" ? en.title : "",
      pt: typeof pt.title === "string" ? pt.title : "",
    },
    body_i18n: {
      en: typeof en.body === "string" ? en.body : "",
      pt: typeof pt.body === "string" ? pt.body : "",
    },
    actual_location_i18n: {
      en: typeof en.actual_location === "string" ? en.actual_location : "",
      pt: typeof pt.actual_location === "string" ? pt.actual_location : "",
    },
  });
  if (!patch.title_i18n.en?.trim() || !patch.title_i18n.pt?.trim()) return null;
  if (!patch.body_i18n.en?.trim() || !patch.body_i18n.pt?.trim()) return null;
  return patch;
}

export { TITLE_MAX, LOCATION_MAX, BODY_MAX };
