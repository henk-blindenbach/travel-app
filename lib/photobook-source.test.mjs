import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dayFolderName,
  extensionFromFilename,
  filesystemSlug,
  photoExportFilename,
  tripZipBasename,
} from "./photobook-source/naming.ts";
import { softValidatePackage } from "./photobook-source/soft-validate.ts";
import { buildBookMarkdown, buildStoryTxt, formatNlLongDate } from "./photobook-source/texts.ts";
import { buildPhotobookManifest } from "./photobook-source/manifest.ts";

describe("photobook-source naming", () => {
  it("builds chronological day folders", () => {
    assert.equal(
      dayFolderName({ sequence: 7, date: "2026-11-02", locationOrTitle: "Annapurna" }),
      "07_2026-11-02_Annapurna",
    );
    assert.equal(
      dayFolderName({ sequence: 1, date: "2026-10-27", locationOrTitle: "Amsterdam → Kathmandu" }),
      "01_2026-10-27_Amsterdam-Kathmandu",
    );
  });

  it("names hero and following photos", () => {
    assert.equal(photoExportFilename(1, "JPG", "hero"), "01_HERO.jpg");
    assert.equal(photoExportFilename(2, "heic", "photo"), "02.heic");
    assert.equal(extensionFromFilename("IMG_1.HEIC", "image/heic"), "heic");
    assert.equal(extensionFromFilename("shot.jpeg", "image/jpeg"), "jpg");
  });

  it("builds trip zip basename", () => {
    assert.equal(
      tripZipBasename("Nepal · Tibet · Bhutan · India", "2026-10-27"),
      "Nepal-Tibet-Bhutan-India-2026",
    );
    assert.equal(
      tripZipBasename("Nepal Tibet and Bhutan 2026", "2026-10-27"),
      "Nepal-Tibet-and-Bhutan-2026",
    );
    assert.ok(filesystemSlug("Ghandruk, Nepal").startsWith("Ghandruk"));
  });
});

describe("photobook-source texts + manifest", () => {
  const pkg = {
    version: 1,
    generatedAt: "2026-10-24T12:00:00.000Z",
    zipBasename: "Test-2026",
    trip: {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Nepal, Tibet, Bhutan & India",
      slug: "nepal-tibet-bhutan-india-2026",
      startDate: "2026-10-27",
      endDate: "2026-12-03",
    },
    days: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        sequence: 1,
        dayNumber: 7,
        date: "2026-11-02",
        title: "Annapurna",
        locationName: "Ghandruk, Nepal",
        latitude: 28.48,
        longitude: 83.8,
        story: "Een mooie dag in de bergen.",
        folderName: "01_2026-11-02_Annapurna",
        photos: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            sequence: 1,
            role: "hero",
            filename: "01_HERO.jpg",
            originalFilename: "a.jpg",
            originalObjectKey: "originals/x/a.jpg",
            mimeType: "image/jpeg",
            favorite: true,
            capturedAt: "2026-11-02T09:00:00.000Z",
            latitude: 28.48,
            longitude: 83.8,
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            sequence: 2,
            role: "photo",
            filename: "02.jpg",
            originalFilename: "b.jpg",
            originalObjectKey: "originals/x/b.jpg",
            mimeType: "image/jpeg",
            favorite: false,
            capturedAt: null,
            latitude: null,
            longitude: null,
          },
        ],
      },
    ],
  };

  it("formats Dutch dates and story.txt without technical metadata", () => {
    assert.equal(formatNlLongDate("2026-11-02"), "2 november 2026");
    const story = buildStoryTxt(pkg.days[0]);
    assert.match(story, /^Dag 7 — Annapurna\n/);
    assert.match(story, /2 november 2026/);
    assert.match(story, /Ghandruk, Nepal/);
    assert.match(story, /Een mooie dag in de bergen/);
    assert.doesNotMatch(story, /latitude|mediaAsset|uuid/i);
  });

  it("omits empty location lines in story.txt", () => {
    const story = buildStoryTxt({ ...pkg.days[0], locationName: "" });
    assert.doesNotMatch(story, /Ghandruk/);
    assert.match(story, /^Dag 7 — Annapurna\n2 november 2026\n\nEen mooie dag/);
  });

  it("builds book.md with chronological content and photo list", () => {
    const md = buildBookMarkdown(pkg);
    assert.match(md, /^Nepal, Tibet, Bhutan & India\n/);
    assert.match(md, /Dag 7 — Annapurna/);
    assert.match(md, /\* 01_HERO\.jpg/);
    assert.match(md, /\* 02\.jpg/);
  });

  it("builds vendor-neutral manifest", () => {
    const manifest = buildPhotobookManifest(pkg);
    assert.equal(manifest.version, 1);
    assert.equal(manifest.days[0].photos[0].role, "hero");
    assert.equal(manifest.days[0].folder, "01_2026-11-02_Annapurna");
    assert.equal(manifest.days[0].location.name, "Ghandruk, Nepal");
  });

  it("soft-validates empty packages as hard error", () => {
    const result = softValidatePackage({ ...pkg, days: [] }, [
      { code: "no_candidates", message: "geen kandidaten" },
    ]);
    assert.equal(result.errors[0].code, "empty_export");
    assert.equal(result.warnings.length, 1);
  });
});
