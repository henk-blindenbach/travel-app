import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DAY_SHARE_CARD_HEIGHT,
  DAY_SHARE_CARD_WIDTH,
  dayShareCardFilename,
  dayShareCardLabel,
  dayShareCardSvg,
  parseDayShareCardSlot,
  renderDayShareCardJpeg,
} from "./day-share-cards.ts";

describe("parseDayShareCardSlot", () => {
  it("accepts start and eind only", () => {
    assert.equal(parseDayShareCardSlot("start"), "start");
    assert.equal(parseDayShareCardSlot("eind"), "eind");
    assert.equal(parseDayShareCardSlot("end"), null);
    assert.equal(parseDayShareCardSlot(""), null);
  });
});

describe("dayShareCardLabel / filename", () => {
  it("formats Dag N start/eind", () => {
    assert.equal(dayShareCardLabel(3, "start"), "Dag 3 start");
    assert.equal(dayShareCardLabel(3, "eind"), "Dag 3 eind");
    assert.equal(dayShareCardFilename(3, "start"), "Dag-3-start.jpg");
    assert.equal(dayShareCardFilename(12, "eind"), "Dag-12-eind.jpg");
  });
});

describe("dayShareCardSvg", () => {
  it("embeds the label and 4:5 dimensions", () => {
    const svg = dayShareCardSvg(7, "start");
    assert.match(svg, /Dag 7 start/);
    assert.match(svg, new RegExp(`width="${DAY_SHARE_CARD_WIDTH}"`));
    assert.match(svg, new RegExp(`height="${DAY_SHARE_CARD_HEIGHT}"`));
  });
});

describe("renderDayShareCardJpeg", () => {
  it("returns a JPEG buffer at 4:5", async () => {
    const jpeg = await renderDayShareCardJpeg(1, "eind");
    assert.ok(jpeg.length > 1_000);
    assert.equal(jpeg[0], 0xff);
    assert.equal(jpeg[1], 0xd8);
  });
});
