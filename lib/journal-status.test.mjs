import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countJournalStatuses,
  findNextDayWithoutEntry,
  oneDayEntry,
  savedConfirmation,
  statusMeta,
} from "./journal-status.ts";

describe("oneDayEntry", () => {
  it("reads to-one object embeds (root cause of 0 concepten)", () => {
    const entry = { id: "a", publication_status: "draft" };
    assert.equal(oneDayEntry(entry)?.publication_status, "draft");
    assert.equal(oneDayEntry([entry])?.publication_status, "draft");
    assert.equal(oneDayEntry(null), null);
    assert.equal(oneDayEntry([]), null);
  });
});

describe("statusMeta", () => {
  it("labels Concept / Klaar / Gepubliceerd", () => {
    assert.equal(statusMeta(undefined).label, "Geen verslag");
    assert.equal(statusMeta({ publication_status: "draft" }).label, "Concept");
    assert.equal(statusMeta({ publication_status: "ready" }).label, "Klaar");
    assert.equal(statusMeta({ publication_status: "published" }).label, "Gepubliceerd");
  });
});

describe("countJournalStatuses", () => {
  it("counts drafts when day_entries is an object, not only arrays", () => {
    const days = [
      { id: "1", day_number: 1, day_entries: { id: "e1", publication_status: "draft" } },
      { id: "2", day_number: 2, day_entries: [{ id: "e2", publication_status: "ready" }] },
      { id: "3", day_number: 3, day_entries: { id: "e3", publication_status: "published" } },
      { id: "4", day_number: 4, day_entries: null },
    ];
    assert.deepEqual(countJournalStatuses(days), {
      published: 1,
      ready: 1,
      drafts: 1,
      empty: 1,
      total: 4,
    });
  });
});

describe("findNextDayWithoutEntry", () => {
  it("skips days that already have a verslag", () => {
    const days = [
      { id: "d1", day_number: 1, day_entries: { id: "e1", publication_status: "draft" } },
      { id: "d2", day_number: 2, day_entries: null },
      { id: "d3", day_number: 3, day_entries: null },
    ];
    assert.equal(findNextDayWithoutEntry(days, 0)?.id, "d2");
    assert.equal(findNextDayWithoutEntry(days, 2)?.id, "d3");
    assert.equal(findNextDayWithoutEntry(days, 3), null);
  });
});

describe("savedConfirmation", () => {
  it("includes Opgeslagen checkmark and a time", () => {
    const text = savedConfirmation(new Date("2026-10-22T15:04:00"));
    assert.match(text, /^Opgeslagen ✓ /);
    assert.match(text, /\d{1,2}:\d{2}/);
  });
});
