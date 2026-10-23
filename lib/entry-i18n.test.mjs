import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  localizeEntryFields,
  mergeTranslationPatch,
  normalizeEntryI18nMap,
  parseAiTranslations,
  pickEntryText,
  sanitizeTranslationPatch,
  syncDutchIntoI18n,
} from "./entry-i18n.ts";

describe("entry-i18n", () => {
  it("picks locale then falls back to nl then primary", () => {
    assert.equal(pickEntryText({ en: "Hello", nl: "Hallo" }, "en"), "Hello");
    assert.equal(pickEntryText({ nl: "Hallo" }, "pt"), "Hallo");
    assert.equal(pickEntryText({}, "en", "Primary"), "Primary");
    assert.equal(pickEntryText({ en: "  " }, "en", "Primary"), "Primary");
  });

  it("syncs Dutch into map without wiping en/pt", () => {
    const next = syncDutchIntoI18n({ en: "Hi", nl: "Oud" }, "Nieuw", 160);
    assert.deepEqual(next, { en: "Hi", nl: "Nieuw" });
  });

  it("localizes entry fields for public pages", () => {
    const localized = localizeEntryFields(
      {
        title: "NL titel",
        body: "NL body",
        actual_location: "Kathmandu",
        title_i18n: { nl: "NL titel", en: "EN title" },
        body_i18n: { nl: "NL body", pt: "PT corpo" },
        actual_location_i18n: { nl: "Kathmandu", en: "Kathmandu valley" },
      },
      "en",
    );
    assert.equal(localized.title, "EN title");
    assert.equal(localized.body, "NL body");
    assert.equal(localized.actual_location, "Kathmandu valley");
  });

  it("strips nl from translation patches", () => {
    const patch = sanitizeTranslationPatch({
      title_i18n: { nl: "hack", en: "Title", pt: "Título" },
      body_i18n: { en: "Body", pt: "Corpo" },
      actual_location_i18n: { en: "Place", pt: "Lugar" },
    });
    assert.equal(patch.title_i18n.nl, undefined);
    assert.equal(patch.title_i18n.en, "Title");
  });

  it("merges AI patch onto existing maps", () => {
    const merged = mergeTranslationPatch(
      {
        title_i18n: { nl: "Hallo", en: "Old" },
        body_i18n: { nl: "Tekst" },
        actual_location_i18n: { nl: "Stad" },
      },
      {
        title_i18n: { en: "Hello", pt: "Olá" },
        body_i18n: { en: "Text", pt: "Texto" },
        actual_location_i18n: { en: "City", pt: "Cidade" },
      },
    );
    assert.equal(merged.title_i18n.nl, "Hallo");
    assert.equal(merged.title_i18n.en, "Hello");
    assert.equal(merged.title_i18n.pt, "Olá");
  });

  it("parses AI translation JSON", () => {
    const patch = parseAiTranslations(
      JSON.stringify({
        en: { title: "A day", actual_location: "Valley", body: "We walked." },
        pt: { title: "Um dia", actual_location: "Vale", body: "Caminhámos." },
      }),
    );
    assert.ok(patch);
    assert.equal(patch.title_i18n.en, "A day");
    assert.equal(patch.body_i18n.pt, "Caminhámos.");
  });

  it("rejects incomplete AI output", () => {
    assert.equal(
      parseAiTranslations(JSON.stringify({ en: { title: "Only", actual_location: "", body: "" }, pt: {} })),
      null,
    );
  });

  it("normalizes unknown keys away", () => {
    assert.deepEqual(normalizeEntryI18nMap({ nl: "ok", de: "nein", en: 1 }, 160), { nl: "ok" });
  });
});
