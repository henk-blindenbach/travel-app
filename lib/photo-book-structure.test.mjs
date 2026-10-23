import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBookStructure,
  buildStudioCreateRequest,
  chooseDayPageType,
  enforceLayflatPageCount,
  inferCountry,
  LAYFLAT_MAX_PAGES,
  LAYFLAT_MIN_PAGES,
  STUDIO_SLOTS,
  TRAVEL_APP_IMAGE_SLOTS,
} from "./photo-book-structure.ts";

describe("photo book structure (Studio slot mapping)", () => {
  const assets = [
    {
      mediaAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      sortOrder: 0,
      filename: "a.jpg",
      caption: "Bergpas",
      dayNumber: 2,
      dayTitle: "Mustang",
      dayBody: "Lange tocht over de bergpas met uitzicht.",
      dayLocation: "Nepal",
      dayDate: "2026-11-05",
      favorite: true,
      downloadUrl: "https://example.com/a.jpg",
    },
    {
      mediaAssetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      sortOrder: 1,
      filename: "b.jpg",
      caption: "",
      dayNumber: 1,
      dayTitle: "Kathmandu",
      dayBody: null,
      dayLocation: "Nepal",
      dayDate: "2026-11-01",
      favorite: false,
      downloadUrl: "https://example.com/b.jpg",
    },
    {
      mediaAssetId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      sortOrder: 2,
      filename: "c1.jpg",
      caption: "Markt",
      dayNumber: 3,
      dayTitle: "Thimphu",
      dayBody: null,
      dayLocation: "Bhutan",
      dayDate: "2026-11-10",
      favorite: true,
      downloadUrl: "https://example.com/c1.jpg",
    },
    {
      mediaAssetId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      sortOrder: 3,
      filename: "c2.jpg",
      caption: "Dzong",
      dayNumber: 3,
      dayTitle: "Thimphu",
      dayBody: null,
      dayLocation: "Bhutan",
      dayDate: "2026-11-10",
      favorite: false,
      downloadUrl: "https://example.com/c2.jpg",
    },
    {
      mediaAssetId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      sortOrder: 4,
      filename: "c3.jpg",
      caption: "",
      dayNumber: 3,
      dayTitle: "Thimphu",
      dayBody: null,
      dayLocation: "Bhutan",
      dayDate: "2026-11-10",
      favorite: false,
      downloadUrl: "https://example.com/c3.jpg",
    },
  ];

  it("chooses page types from media/story", () => {
    assert.equal(chooseDayPageType({ photoCount: 3, body: null, captions: ["a", "b"] }), "day-three-photos");
    assert.equal(
      chooseDayPageType({ photoCount: 3, body: "Dit is een flink dagverhaal met genoeg tekst voor een samenvatting.", captions: [] }),
      "day-photo-story",
    );
    assert.equal(chooseDayPageType({ photoCount: 1, body: null, captions: [] }), "day-photo-story");
  });

  it("infers country from location haystack", () => {
    assert.equal(inferCountry("Thimphu Bhutan", ["Nepal", "Bhutan"], "Nepal"), "Bhutan");
    assert.equal(inferCountry("onbekend", ["Nepal", "Bhutan"], "Nepal"), "Nepal");
  });

  it("enforces even layflat page count 18–122", () => {
    const pad = enforceLayflatPageCount(3);
    assert.equal(pad.targetCount, LAYFLAT_MIN_PAGES);
    assert.equal(pad.padCount, LAYFLAT_MIN_PAGES - 3);

    const odd = enforceLayflatPageCount(19);
    assert.equal(odd.targetCount, 20);
    assert.equal(odd.padCount, 1);

    const over = enforceLayflatPageCount(LAYFLAT_MAX_PAGES + 5);
    assert.equal(over.targetCount, LAYFLAT_MAX_PAGES);
    assert.ok(over.trimCount > 0);
    assert.ok(over.warning);
  });

  it("builds named-slot pages with country chapters and layflat padding", () => {
    const structure = buildBookStructure({
      title: "Reisboek",
      subtitle: "2026",
      introText: "Een korte intro",
      assets,
      routeSummary: "Dag 1: Kathmandu · Dag 2: Mustang",
      countries: ["Nepal", "Bhutan"],
    });
    assert.equal(structure.cover.title, "Reisboek");
    assert.equal(structure.intro, "Een korte intro");
    assert.equal(structure.pageCount, LAYFLAT_MIN_PAGES);
    assert.ok(structure.padCount >= 1);
    assert.ok(structure.pages.some((page) => page.type === "chapter"));
    assert.ok(structure.pages.some((page) => page.type === "day-photo-story"));
    assert.ok(structure.pages.some((page) => page.type === "day-three-photos"));

    const three = structure.pages.find((page) => page.type === "day-three-photos");
    assert.ok(three.slots.some((slot) => slot.slotName === STUDIO_SLOTS.dayPhoto1));
    assert.ok(three.slots.some((slot) => slot.slotName === STUDIO_SLOTS.dayTitleAlt));

    const story = structure.pages.find((page) => page.type === "day-photo-story");
    assert.ok(story.slots.some((slot) => slot.slotName === STUDIO_SLOTS.dayPhoto));
    assert.ok(story.slots.some((slot) => slot.slotName === STUDIO_SLOTS.daySummary));
  });

  it("maps Studio payload with exact slotIds and clientId===slotId", () => {
    const structure = buildBookStructure({
      title: "Reisboek",
      subtitle: "Himalaya",
      introText: "Intro",
      assets,
      countries: ["Nepal", "Bhutan"],
    });
    const request = buildStudioCreateRequest({
      templateId: "112004b7-199e-4be5-a5f9-e1043876f6c8",
      bookId: "00000000-0000-4000-8000-000000000001",
      structure,
    });
    assert.ok(request);
    assert.equal(request.images.length, TRAVEL_APP_IMAGE_SLOTS.length);
    for (const image of request.images) {
      assert.ok(TRAVEL_APP_IMAGE_SLOTS.includes(image.clientId), `unexpected clientId ${image.clientId}`);
    }
    assert.equal(request.text[STUDIO_SLOTS.frontCoverTitle], "Reisboek");
    assert.equal(request.text[STUDIO_SLOTS.spineTitle], "Himalaya");
    assert.ok(request.text[STUDIO_SLOTS.storyText]);
    assert.ok(request.text[STUDIO_SLOTS.dayTitle]);
    assert.ok(request.text[STUDIO_SLOTS.chapterTitle]);
    // No legacy / indexed keys — Studio rejects unknown text slots.
    assert.equal(request.text["cover.title"], undefined);
    assert.ok(!Object.keys(request.text).some((key) => /^\d+\./.test(key)));
  });
});
