import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  characterCount,
  compactPhotoCaptionsForPrompt,
  hasAnyCaption,
  isOverLimit,
  joinCaptionParts,
  normalizeSocialCaptions,
  preferredShareCaption,
  sanitizeSocialCaptions,
  readyPublicPhotos,
  selectedPublicPhotos,
  sharePhotosDisabledHint,
  socialCaptionsJsonSchema,
  socialCaptionsPrompt,
  splitCaptionHashtags,
} from "./social-captions.ts";

describe("normalizeSocialCaptions", () => {
  it("maps legacy instagram key to instagram_feed", () => {
    assert.deepEqual(normalizeSocialCaptions({ instagram: "Hallo #reis", facebook: "FB" }), {
      instagram_feed: "Hallo #reis",
      facebook: "FB",
    });
  });

  it("keeps modern platform keys", () => {
    const raw = {
      instagram_feed: "Feed",
      instagram_carousel: "Carousel",
      instagram_story: "Story",
      facebook: "FB",
      polarsteps: "PS",
    };
    assert.deepEqual(normalizeSocialCaptions(raw), raw);
  });
});

describe("splitCaptionHashtags / joinCaptionParts", () => {
  it("shows hashtags separately and joins them back", () => {
    const split = splitCaptionHashtags("Rust boven de wolken. #nepal #trekking #Annapurna");
    assert.equal(split.body, "Rust boven de wolken.");
    assert.deepEqual(split.hashtags, ["#nepal", "#trekking", "#annapurna"]);
    assert.equal(
      joinCaptionParts(split.body, ["#nepal", "trekking", "#Annapurna"]),
      "Rust boven de wolken.\n\n#nepal #trekking #Annapurna",
    );
  });
});

describe("character limits", () => {
  it("counts characters and flags Instagram story over limit", () => {
    const long = "x".repeat(201);
    assert.equal(characterCount(long), 201);
    assert.equal(isOverLimit(long, "instagram_story"), true);
    assert.equal(isOverLimit("kort", "instagram_story"), false);
  });
});

describe("share helpers", () => {
  it("disables share with a Dutch hint when nothing is selected or nothing ready", () => {
    assert.match(sharePhotosDisabledHint(0), /Selecteer eerst/);
    assert.match(sharePhotosDisabledHint(2, 0), /nog niet klaar/);
    assert.equal(sharePhotosDisabledHint(2, 2), "");
  });

  it("treats publication-marked photos as selected even while processing", () => {
    const assets = [
      { id: "1", is_public: true, upload_status: "ready" },
      { id: "2", is_public: true, upload_status: "uploading" },
      { id: "3", is_public: false, upload_status: "ready" },
    ];
    assert.deepEqual(selectedPublicPhotos(assets).map((a) => a.id), ["1", "2"]);
    assert.deepEqual(readyPublicPhotos(assets).map((a) => a.id), ["1"]);
  });

  it("prefers Instagram feed caption for share text", () => {
    assert.equal(
      preferredShareCaption({ facebook: "FB", instagram_feed: "Feed #a" }),
      "Feed #a",
    );
    assert.equal(preferredShareCaption({ polarsteps: "PS" }), "PS");
    assert.equal(hasAnyCaption({}), false);
    assert.equal(hasAnyCaption({ facebook: "x" }), true);
  });
});

describe("sanitizeSocialCaptions", () => {
  it("trims to platform limits", () => {
    const story = "s".repeat(250);
    const sanitized = sanitizeSocialCaptions({ instagram_story: story });
    assert.equal(sanitized.instagram_story?.length, 200);
  });
});

describe("compactPhotoCaptionsForPrompt", () => {
  it("prefers public photos, keeps order, caps count and length", () => {
    const long = "a".repeat(200);
    const assets = [
      { caption: "privé", is_public: false, sort_order: 0 },
      { caption: "eerste", is_public: true, sort_order: 2 },
      { caption: long, is_public: true, sort_order: 1 },
      ...Array.from({ length: 15 }, (_, i) => ({
        caption: `extra-${i}`,
        is_public: true,
        sort_order: 10 + i,
      })),
    ];
    const compact = compactPhotoCaptionsForPrompt(assets);
    assert.equal(compact[0], "a".repeat(120));
    assert.equal(compact[1], "eerste");
    assert.equal(compact.length, 12);
    assert.ok(!compact.includes("privé"));
  });

  it("falls back to non-public captions when nothing is marked public", () => {
    assert.deepEqual(
      compactPhotoCaptionsForPrompt([
        { caption: "alleen", is_public: false, sort_order: 1 },
        { caption: "  ", is_public: false, sort_order: 0 },
      ]),
      ["alleen"],
    );
  });
});

describe("socialCaptionsPrompt chunks", () => {
  it("scopes schema and prompt to requested platforms", () => {
    const schema = socialCaptionsJsonSchema(["facebook", "polarsteps"]);
    assert.deepEqual(schema.required, ["facebook", "polarsteps"]);
    assert.equal("instagram_feed" in schema.properties, false);
    const prompt = socialCaptionsPrompt(
      { title: "Dag", location: "Kathmandu", body: "Kort verhaal", photoCaptions: [] },
      ["facebook", "polarsteps"],
    );
    assert.match(prompt, /facebook, polarsteps/);
    assert.doesNotMatch(prompt, /instagram_feed:/);
  });
});
