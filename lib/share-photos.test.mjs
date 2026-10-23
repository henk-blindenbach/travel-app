import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shareDataCandidates, shareUnsupportedMessage } from "./share-photos.ts";

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

describe("shareUnsupportedMessage", () => {
  it("explains missing share sheet and JPEG download", () => {
    assert.match(shareUnsupportedMessage(false), /deelmenu opende niet/i);
    assert.match(shareUnsupportedMessage(true), /klembord/i);
  });
});
