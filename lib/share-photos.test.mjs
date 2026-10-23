import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shareDataCandidates,
  shareDownloadMessage,
  shareUnsupportedMessage,
} from "./share-photos.ts";

describe("shareDataCandidates", () => {
  it("puts files+text first, then files-only when caption is present", () => {
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
    const candidates = shareDataCandidates({ files, title: "Dag 1", text: "  Hallo  " });
    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].text, "Hallo");
    assert.equal(candidates[0].files?.length, 1);
    assert.equal(candidates[1].text, undefined);
    assert.equal(candidates[1].files?.length, 1);
  });

  it("returns only files when there is no caption", () => {
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg" })];
    const candidates = shareDataCandidates({ files, title: "Dag 1" });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].text, undefined);
  });
});

describe("shareDownloadMessage", () => {
  it("mentions JPEG download, day cards, and optional clipboard", () => {
    assert.match(shareDownloadMessage({ photoCount: 2, captionPresent: false }), /JPEG/i);
    assert.match(shareDownloadMessage({ photoCount: 2, captionPresent: false }), /dagkaarten/i);
    assert.match(shareDownloadMessage({ photoCount: 1, captionPresent: true }), /klembord/i);
  });
});

describe("shareUnsupportedMessage", () => {
  it("still returns download-oriented copy", () => {
    assert.match(shareUnsupportedMessage(false), /JPEG/i);
    assert.match(shareUnsupportedMessage(true), /klembord/i);
  });
});
