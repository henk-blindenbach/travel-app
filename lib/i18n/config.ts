export const LOCALES = ["nl", "en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "nl";
export const LOCALE_COOKIE = "lang";
export const LOCALE_STORAGE_KEY = "lang";

export const LOCALE_HTML: Record<Locale, string> = {
  nl: "nl",
  en: "en",
  pt: "pt",
};

export const LOCALE_DATE: Record<Locale, string> = {
  nl: "nl-NL",
  en: "en-GB",
  pt: "pt-PT",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  nl: "NL",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "nl" || value === "en" || value === "pt";
}

export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
