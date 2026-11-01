import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IDLE_MEDIA_UPLOAD_PROGRESS,
  MEDIA_UPLOAD_CONCURRENCY,
  collectSelectedFiles,
  mediaUploadPercent,
  mediaUploadProgressLabel,
  resolveMediaContentType,
  runWithConcurrency,
} from "./media-upload.ts";

describe("MEDIA_UPLOAD_CONCURRENCY", () => {
  it("stays in the 3–5 band", () => {
    assert.ok(MEDIA_UPLOAD_CONCURRENCY >= 3 && MEDIA_UPLOAD_CONCURRENCY <= 5);
  });
});

describe("resolveMediaContentType", () => {
  it("uses mime type when present", () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    assert.equal(resolveMediaContentType(file), "image/jpeg");
  });

  it("falls back to HEIC extension", () => {
    const file = new File(["x"], "IMG_0001.HEIC", { type: "" });
    assert.equal(resolveMediaContentType(file), "image/heic");
  });

  it("falls back to JPEG/PNG extensions when mime is empty", () => {
    assert.equal(resolveMediaContentType({ name: "a.JPG", type: "" }), "image/jpeg");
    assert.equal(resolveMediaContentType({ name: "b.png", type: "" }), "image/png");
  });

  it("rejects unknown types", () => {
    const file = new File(["x"], "notes.pdf", { type: "application/pdf" });
    assert.equal(resolveMediaContentType(file), "");
  });
});

describe("collectSelectedFiles", () => {
  it("returns an independent copy of every selected file", () => {
    const input = {
      0: new File(["one"], "one.jpg", { type: "image/jpeg" }),
      1: new File(["two"], "two.heic", { type: "" }),
      2: new File(["three"], "three.png", { type: "image/png" }),
      length: 3,
      item(index) {
        return this[index] || null;
      },
      *[Symbol.iterator]() {
        for (let index = 0; index < this.length; index += 1) yield this[index];
      },
    };

    const files = collectSelectedFiles(input);
    assert.equal(files.length, 3);
    assert.equal(files[0].name, "one.jpg");
    assert.equal(files[1].name, "two.heic");
    assert.equal(files[1].type, "image/heic");
    assert.equal(files[2].name, "three.png");
    assert.notEqual(files[0], input[0]);
  });

  it("returns an empty list for a null FileList", () => {
    assert.deepEqual(collectSelectedFiles(null), []);
  });
});

describe("runWithConcurrency", () => {
  it("respects the concurrency cap", async () => {
    let inFlight = 0;
    let peak = 0;
    const items = Array.from({ length: 10 }, (_, index) => index);

    await runWithConcurrency(items, 3, async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 15));
      inFlight -= 1;
    });

    assert.equal(peak, 3);
    assert.equal(inFlight, 0);
  });

  it("runs every item exactly once", async () => {
    const seen = [];
    await runWithConcurrency(["a", "b", "c", "d"], 2, async (item, index) => {
      seen.push(`${index}:${item}`);
    });
    assert.deepEqual(seen.sort(), ["0:a", "1:b", "2:c", "3:d"]);
  });

  it("handles empty lists", async () => {
    let called = 0;
    await runWithConcurrency([], 4, async () => {
      called += 1;
    });
    assert.equal(called, 0);
  });
});

describe("mediaUploadProgressLabel", () => {
  it("is empty while idle", () => {
    assert.equal(mediaUploadProgressLabel(IDLE_MEDIA_UPLOAD_PROGRESS), "");
  });

  it("shows n/N while uploading", () => {
    assert.equal(
      mediaUploadProgressLabel({ phase: "uploading", total: 8, settled: 3, succeeded: 3, failed: 0 }),
      "Uploaden… 3 van 8",
    );
  });

  it("shows an explicit done state", () => {
    assert.match(
      mediaUploadProgressLabel({ phase: "done", total: 5, settled: 5, succeeded: 5, failed: 0 }),
      /^Klaar:/,
    );
    assert.match(
      mediaUploadProgressLabel({ phase: "done", total: 5, settled: 5, succeeded: 4, failed: 1 }),
      /4 van 5/,
    );
  });
});

describe("mediaUploadPercent", () => {
  it("rounds settled over total", () => {
    assert.equal(mediaUploadPercent({ phase: "uploading", total: 4, settled: 1, succeeded: 1, failed: 0 }), 25);
    assert.equal(mediaUploadPercent(IDLE_MEDIA_UPLOAD_PROGRESS), 0);
  });
});
