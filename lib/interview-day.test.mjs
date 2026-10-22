import assert from "node:assert/strict";
import { describe, it } from "node:test";

function validUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Mirrors interview page: URL day wins; never use featured limit-5 fallback mock id "1". */
function pickInterviewDay(dayId, daysById, todayDay, firstDay) {
  if (dayId && validUuid(dayId) && daysById[dayId]) return daysById[dayId];
  return todayDay || firstDay || null;
}

describe("interview day resolution", () => {
  const day1 = { id: "a7171ec5-5c08-4624-b10a-f6a010975c67", day_number: 1, title: "Faro → Amsterdam" };
  const day5 = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", day_number: 5, title: "Annapurna trekking" };
  const byId = { [day1.id]: day1, [day5.id]: day5 };

  it("opens the day from the URL, not Annapurna day 5", () => {
    const picked = pickInterviewDay(day1.id, byId, day5, day5);
    assert.equal(picked.day_number, 1);
    assert.equal(picked.title, "Faro → Amsterdam");
  });

  it("rejects non-uuid day ids that caused Ongeldig interview", () => {
    assert.equal(validUuid("1"), false);
    const picked = pickInterviewDay("1", { 1: day5 }, day5, day5);
    assert.equal(picked.day_number, 5);
  });
});
