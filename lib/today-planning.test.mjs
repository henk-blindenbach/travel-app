import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortPlanningChronologically } from "./today-planning.ts";

describe("sortPlanningChronologically", () => {
  it("orders by departure_time then sort_order", () => {
    const items = [
      { id: "c", departure_time: "14:00:00", sort_order: 0 },
      { id: "a", departure_time: "09:30", sort_order: 2 },
      { id: "b", departure_time: "09:30:00", sort_order: 1 },
      { id: "d", departure_time: null, sort_order: 0 },
    ];
    assert.deepEqual(
      sortPlanningChronologically(items).map((item) => item.id),
      ["b", "a", "c", "d"],
    );
  });

  it("keeps stable order when times and sort_order match", () => {
    const items = [
      { id: "x", departure_time: null, sort_order: 1 },
      { id: "y", departure_time: null, sort_order: 1 },
    ];
    assert.deepEqual(
      sortPlanningChronologically(items).map((item) => item.id),
      ["x", "y"],
    );
  });
});
