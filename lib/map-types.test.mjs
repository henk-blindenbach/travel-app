import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayRoutePins, planningPinLabel } from "./map-types.ts";

describe("dayRoutePins", () => {
  it("connects planned and published day pins chronologically and prefers published", () => {
    const pins = [
      { id: "p3", kind: "planned", latitude: 1, longitude: 3, label: "D3", dayNumber: 3 },
      { id: "p1", kind: "planned", latitude: 1, longitude: 1, label: "D1", dayNumber: 1 },
      { id: "a2", kind: "published", latitude: 2, longitude: 2, label: "Actual 2", dayNumber: 2 },
      { id: "p2", kind: "planned", latitude: 9, longitude: 9, label: "Plan 2", dayNumber: 2 },
      { id: "hotel", kind: "accommodation", latitude: 5, longitude: 5, label: "Hotel" },
      { id: "photo", kind: "visited", latitude: 4, longitude: 4, label: "Foto", dayNumber: 4 },
    ];
    const route = dayRoutePins(pins);
    assert.deepEqual(
      route.map((pin) => [pin.dayNumber, pin.id]),
      [
        [1, "p1"],
        [2, "a2"],
        [3, "p3"],
      ],
    );
  });
});

describe("planningPinLabel", () => {
  it("falls back map_label → location → title", () => {
    assert.equal(planningPinLabel("Pin", "Kathmandu", "Hotel X"), "Pin");
    assert.equal(planningPinLabel("  ", "Kathmandu", "Hotel X"), "Kathmandu");
    assert.equal(planningPinLabel(null, null, "Hotel X"), "Hotel X");
  });
});
