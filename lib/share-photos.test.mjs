import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shareDataCandidates,
  shareSuccessMessage,
  shareUnsupportedMessage,
} from "./share-photos.ts";

describe("shareDataCandidates", () => {
  it("puts files-only first when caption is present (iOS multi-save)", () => {
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
    const candidates = shareDataCandidates({ files, title: "Dag 1", text: "  Hallo  " });
    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].text, undefined);
    assert.equal(candidates[0].files?.length, 1);
    assert.equal(candidates[1].text, "Hallo");
    assert.equal(candidates[1].files?.length, 1);
  });

  it("returns only files when there is no caption", () => {
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
    const candidates = shareDataCandidates({ files, title: "Dag 1" });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].text, undefined);
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
