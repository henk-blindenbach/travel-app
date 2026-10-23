import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Mirrors lib/photo-book.ts structure helpers (no Prodigi imports under node:test ESM). */
function photoClientId(mediaAssetId) {
  return `photo-${mediaAssetId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`;
}

function buildBookStructure(input) {
  const chapterMap = new Map();
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

function buildStudioTextFromStructure(structure) {
  const text = { "cover.title": structure.cover.title };
  if (structure.cover.subtitle) text["cover.subtitle"] = structure.cover.subtitle;
  if (structure.intro) text["intro.body"] = structure.intro;
  if (structure.routeSummary) text["route.summary"] = structure.routeSummary;
  for (const chapter of structure.chapters) {
    if (chapter.dayNumber != null) text[`day.${chapter.dayNumber}.title`] = chapter.title;
    for (const photo of chapter.photos) {
      if (photo.caption) text[`photo.${photo.clientId}.caption`] = photo.caption;
    }
  }
  return text;
}

function studioOrderBlockers(book) {
  const blockers = [];
  if (!book.studio_project_id) blockers.push("Maak eerst een Studio-project (Sync naar Prodigi Studio) met preview.");
  if (!book.preview_acknowledged_at) blockers.push("Bevestig dat je de Studio-preview hebt bekeken vóór bestellen.");
  return blockers;
}

describe("photo book structure (Studio B1)", () => {
  const assets = [
    {
      mediaAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      caption: "Bergpas",
      dayNumber: 2,
      dayTitle: "Mustang",
      favorite: true,
      downloadUrl: "https://example.com/a.jpg",
    },
    {
      mediaAssetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      caption: "",
      dayNumber: 1,
      dayTitle: "Kathmandu",
      favorite: false,
      downloadUrl: "https://example.com/b.jpg",
    },
  ];

  it("groups photos by day with cover/intro/route", () => {
    const structure = buildBookStructure({
      title: "Reisboek",
      subtitle: "2026",
      introText: "Een korte intro",
      assets,
      routeSummary: "Dag 1: Kathmandu · Dag 2: Mustang",
    });
    assert.equal(structure.cover.title, "Reisboek");
    assert.equal(structure.intro, "Een korte intro");
    assert.equal(structure.chapters.length, 2);
    assert.equal(structure.chapters[0].dayNumber, 1);
    assert.equal(structure.chapters[1].title, "Dag 2 · Mustang");
  });

  it("maps Studio text slots", () => {
    const structure = buildBookStructure({
      title: "Reisboek",
      subtitle: null,
      introText: "Intro",
      assets,
      routeSummary: "Route tekst",
    });
    const text = buildStudioTextFromStructure(structure);
    assert.equal(text["cover.title"], "Reisboek");
    assert.equal(text["intro.body"], "Intro");
    assert.equal(text["day.2.title"], "Dag 2 · Mustang");
    assert.ok(text[`photo.${photoClientId(assets[0].mediaAssetId)}.caption`]);
  });

  it("blocks order without studio project or preview ack", () => {
    const blockers = studioOrderBlockers({ studio_project_id: null, preview_acknowledged_at: null });
    assert.ok(blockers.some((item) => /Studio-project/i.test(item)));
    assert.ok(blockers.some((item) => /preview/i.test(item)));
  });
});
