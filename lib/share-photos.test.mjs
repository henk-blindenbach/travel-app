import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shareDataCandidates,
  shareGestureRetryMessage,
  shareSuccessMessage,
  shareUnsupportedMessage,
} from "./share-photos.ts";

describe("shareDataCandidates", () => {
  it("puts pure files-only first (no title/text) for Chromium/iOS", () => {
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
    const candidates = shareDataCandidates({ files, title: "Dag 1", text: "  Hallo  " });
    assert.equal(candidates.length, 3);
    assert.equal(candidates[0].title, undefined);
    assert.equal(candidates[0].text, undefined);
    assert.equal(candidates[0].files?.length, 1);
    assert.equal(candidates[1].title, "Dag 1");
    assert.equal(candidates[1].text, undefined);
    assert.equal(candidates[2].text, "Hallo");
  });

  it("returns files-only then title when there is no caption", () => {
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
    const candidates = shareDataCandidates({ files, title: "Dag 1" });
    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].title, undefined);
    assert.equal(candidates[1].title, "Dag 1");
  });
});

describe("shareSuccessMessage", () => {
  it("mentions deelmenu / Opslaan and optional clipboard", () => {
    assert.match(
      shareSuccessMessage({ photoCount: 2, fileCount: 4, captionPresent: false }),
      /deelmenu|Opslaan/i,
    );
    assert.match(
      shareSuccessMessage({ photoCount: 1, fileCount: 3, captionPresent: true }),
      /klembord/i,
    );
  });
});

describe("shareUnsupportedMessage", () => {
  it("explains missing share sheet without suggesting zip", () => {
    const msg = shareUnsupportedMessage({ fileCount: 4, captionPresent: false });
    assert.match(msg, /deelmenu opende niet/i);
    assert.match(msg, /Safari/i);
    assert.doesNotMatch(msg, /zip/i);
    assert.match(shareUnsupportedMessage({ fileCount: 3, captionPresent: true }), /klembord/i);
  });
});

describe("shareGestureRetryMessage", () => {
  it("asks for a fresh tap on Open deelmenu", () => {
    assert.match(shareGestureRetryMessage({ fileCount: 14 }), /Open deelmenu/);
    assert.match(shareGestureRetryMessage({ fileCount: 1 }), /1 JPEG/);
  });
});
