import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planningItemSummaryBits, planningItemSummaryLine } from "./planning-item-summary.ts";

describe("planningItemSummaryBits", () => {
  it("includes flight number, airline, arrival, seat and terminals", () => {
    const bits = planningItemSummaryBits({
      kind: "flight",
      carrier: "KLM",
      flight_number: "KL0871",
      departure_time: "10:40",
      arrives_on: "2026-10-28",
      arrival_time: "06:15",
      departure_terminal: "3",
      arrival_terminal: "1",
      seat_number: "12A",
    });
    assert.deepEqual(bits, [
      "KLM",
      "KL0871",
      "10:40",
      "aankomst 2026-10-28",
      "06:15",
      "vertrek T3",
      "aankomst T1",
      "stoel 12A",
    ]);
  });

  it("includes activity time, address and link hint", () => {
    const bits = planningItemSummaryBits({
      kind: "activity",
      departure_time: "09:00",
      address: "Thamel, Kathmandu",
      external_url: "https://example.com/trek",
      duration_minutes: 180,
    });
    assert.deepEqual(bits, ["09:00", "Thamel, Kathmandu", "180 min", "link"]);
  });
});

describe("planningItemSummaryLine", () => {
  it("joins bits or returns the empty fallback", () => {
    assert.equal(planningItemSummaryLine({ kind: "activity" }), "Details in de planning");
    assert.equal(planningItemSummaryLine({ kind: "activity", departure_time: "09:00" }), "09:00");
  });
});
