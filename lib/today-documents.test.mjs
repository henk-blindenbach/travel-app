import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectRoadDocuments, sortRoadDocuments } from "./today-documents.ts";

describe("today road documents", () => {
  const docs = [
    { id: "1", title: "Boarding Henk", trip_day_id: "day-1", document_type: "flight_ticket" },
    { id: "2", title: "Hotel morgen", trip_day_id: "day-2", document_type: "hotel_confirmation" },
    { id: "3", title: "India e-visum Michel", trip_day_id: null, document_type: "visa", is_pinned: true },
    { id: "4", title: "Later ticket", trip_day_id: "day-10", document_type: "transport_ticket" },
  ];

  it("includes today, tomorrow and hele-reis (visa) docs", () => {
    const selected = selectRoadDocuments(docs, "day-1", "day-2");
    assert.deepEqual(
      selected.map((d) => d.id).sort(),
      ["1", "2", "3"],
    );
  });

  it("before trip: first day + hele reis only", () => {
    const selected = selectRoadDocuments(docs, "day-1", null);
    assert.deepEqual(
      selected.map((d) => d.id).sort(),
      ["1", "3"],
    );
  });

  it("sorts pinned and focus day first", () => {
    const selected = selectRoadDocuments(docs, "day-1", "day-2");
    const sorted = sortRoadDocuments(selected, "day-1", "day-2");
    assert.equal(sorted[0].id, "3");
    assert.equal(sorted[1].id, "1");
  });
});
