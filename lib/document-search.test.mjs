import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { documentSearchHaystack, filterDocumentsBySearch, matchesDocumentSearch } from "./document-search.ts";

describe("document search", () => {
  const itemsById = {
    "flight-1": {
      id: "flight-1",
      title: "Amsterdam → Kathmandu",
      kind: "flight",
      flight_number: "KL0871",
      booking_reference: "ZCJINK",
      carrier: "KLM",
    },
  };

  const barcode = {
    title: "KLM airport-barcodes Henk – ZCJINK",
    original_filename: "klm-barcodes-henk.pdf",
    document_type: "flight_ticket",
    planningItemIds: ["flight-1"],
  };

  it("finds KLM barcodes via flight number KL0871", () => {
    const haystack = documentSearchHaystack(barcode, itemsById);
    assert.equal(matchesDocumentSearch(haystack, "KL0871"), true);
    const found = filterDocumentsBySearch([barcode], "KL0871", itemsById);
    assert.equal(found.length, 1);
    assert.equal(found[0].title, barcode.title);
  });

  it("matches booking code, person name and type label", () => {
    const haystack = documentSearchHaystack(barcode, itemsById);
    assert.equal(matchesDocumentSearch(haystack, "ZCJINK"), true);
    assert.equal(matchesDocumentSearch(haystack, "Henk"), true);
    assert.equal(matchesDocumentSearch(haystack, "Vliegticket"), true);
  });

  it("matches compact queries without spaces or dashes", () => {
    const haystack = documentSearchHaystack(barcode, itemsById);
    assert.equal(matchesDocumentSearch(haystack, "KL 0871"), true);
  });

  it("returns all documents for empty query", () => {
    assert.equal(filterDocumentsBySearch([barcode], "  ", itemsById).length, 1);
  });
});
