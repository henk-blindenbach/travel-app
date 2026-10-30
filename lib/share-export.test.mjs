import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentDispositionAttachment,
  isHeicLike,
  shareJpegFilename,
  uniqueShareFilenames,
} from "./share-export.ts";

describe("isHeicLike", () => {
  it("detects HEIC/HEIF by mime or extension", () => {
    assert.equal(isHeicLike("image/heic", "IMG_3465.HEIC"), true);
    assert.equal(isHeicLike("image/heif", "x.heif"), true);
    assert.equal(isHeicLike("application/octet-stream", "IMG_3465.HEIC"), true);
    assert.equal(isHeicLike("image/jpeg", "a.jpg"), false);
  });
});

describe("shareJpegFilename", () => {
  it("rewrites HEIC names to .jpg for Web Share", () => {
    assert.equal(shareJpegFilename("IMG_3465.HEIC"), "IMG_3465.jpg");
    assert.equal(shareJpegFilename("holiday.heif"), "holiday.jpg");
    assert.equal(shareJpegFilename("already.jpg"), "already.jpg");
  });
});

describe("uniqueShareFilenames", () => {
  it("keeps the first name and suffixes later duplicates", () => {
    assert.deepEqual(
      uniqueShareFilenames(["IMG_3615.jpg", "IMG_3615.jpg", "a.jpg", "IMG_3615.jpg"]),
      ["IMG_3615.jpg", "IMG_3615-2.jpg", "a.jpg", "IMG_3615-3.jpg"],
    );
  });
});

describe("contentDispositionAttachment", () => {
  it("encodes unicode filenames", () => {
    assert.match(contentDispositionAttachment("foto café.jpg"), /filename\*=UTF-8''/);
  });
});
