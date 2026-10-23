import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shareDataCandidates,
  shareDownloadMessage,
  shareUnsupportedMessage,
  uniqueZipEntryName,
  zipJpegFiles,
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

describe("uniqueZipEntryName", () => {
  it("suffixes collisions", () => {
    const used = new Set();
    assert.equal(uniqueZipEntryName("a.jpg", used), "a.jpg");
    assert.equal(uniqueZipEntryName("a.jpg", used), "a-2.jpg");
    assert.equal(uniqueZipEntryName("a.jpg", used), "a-3.jpg");
  });
});

describe("zipJpegFiles", () => {
  it("builds a zip containing every entry", async () => {
    const files = [
      new File([new Uint8Array([1, 2, 3])], "Dag-1-start.jpg", { type: "image/jpeg" }),
      new File([new Uint8Array([4, 5])], "foto.jpg", { type: "image/jpeg" }),
      new File([new Uint8Array([6])], "Dag-1-eind.jpg", { type: "image/jpeg" }),
    ];
    const zip = await zipJpegFiles(files, "Dag-1-delen.zip");
    assert.equal(zip.name, "Dag-1-delen.zip");
    assert.equal(zip.type, "application/zip");
    assert.ok(zip.size > 30);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    /* ZIP local file header magic */
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
  });
});

describe("shareDownloadMessage", () => {
  it("mentions zip mode and optional clipboard", () => {
    assert.match(shareDownloadMessage({ photoCount: 2, captionPresent: false, mode: "zip" }), /zip/i);
    assert.match(shareDownloadMessage({ photoCount: 1, captionPresent: true, mode: "zip" }), /klembord/i);
  });
});

describe("shareUnsupportedMessage", () => {
  it("still returns download-oriented copy", () => {
    assert.match(shareUnsupportedMessage(false), /zip|JPEG/i);
    assert.match(shareUnsupportedMessage(true), /klembord/i);
  });
});
