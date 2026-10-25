import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_BASIS_MAX_CHARS,
  EARLIER_BODY_MAX_CHARS,
  EARLIER_JOURNAL_MAX_DAYS,
  buildInterviewContext,
  sanitizePlanningItemForAi,
  summarizeEarlierJournal,
} from "./interview-context.ts";

describe("sanitizePlanningItemForAi", () => {
  it("keeps operational fields and drops booking secrets", () => {
    const out = sanitizePlanningItemForAi({
      kind: "flight",
      status: "confirmed",
      title: "AMS → KTM",
      details: "ochtendvlucht",
      location: "Schiphol",
      departure_time: "10:35:00",
      arrival_time: "23:10:00",
      arrives_on: "2026-11-02",
      ends_on: null,
      carrier: "KLM",
      flight_number: "KL0875",
      address: null,
      duration_minutes: null,
      sort_order: 1,
    });
    assert.equal(out.departureTime, "10:35");
    assert.equal(out.carrier, "KLM");
    assert.equal(out.flightNumber, "KL0875");
    assert.equal("booking_reference" in out, false);
    assert.equal("price_amount" in out, false);
  });
});

describe("summarizeEarlierJournal", () => {
  it("keeps a window of recent days with clipped bodies", () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({
      day_number: index + 1,
      day_date: `2026-11-0${index + 1}`,
      title: `Dag ${index + 1}`,
      actual_location: "Kathmandu",
      body: "x".repeat(EARLIER_BODY_MAX_CHARS + 40),
    }));
    const summarized = summarizeEarlierJournal(rows);
    assert.equal(summarized.length, EARLIER_JOURNAL_MAX_DAYS);
    assert.equal(summarized[0].dayNumber, 4);
    assert.equal(summarized.at(-1)?.dayNumber, 8);
    assert.ok(summarized[0].body.endsWith("…"));
    assert.ok(summarized[0].body.length <= EARLIER_BODY_MAX_CHARS);
  });

  it("skips empty bodies", () => {
    assert.deepEqual(
      summarizeEarlierJournal([
        { day_number: 1, day_date: "2026-11-01", title: "A", actual_location: null, body: "  " },
        { day_number: 2, day_date: "2026-11-02", title: "B", actual_location: "Pokhara", body: "Mooie dag." },
      ]),
      [{ dayNumber: 2, date: "2026-11-02", title: "B", location: "Pokhara", body: "Mooie dag." }],
    );
  });
});

describe("buildInterviewContext", () => {
  it("assembles basis, planning, earlier journal and draft", () => {
    const context = buildInterviewContext({
      aiBasis: "  We reizen rustig, houden van natuur en tempels.  ",
      day: {
        title: "Punakha",
        planned_location: "Punakha",
        planned_route: "Thimphu → Punakha",
        day_date: "2026-11-20",
        day_number: 10,
      },
      entry: {
        title: "Concept",
        actual_location: null,
        body: null,
        media_assets: [{ original_filename: "a.jpg", caption: "brug", captured_at: null }],
      },
      planningItems: [
        {
          kind: "activity",
          status: "planned",
          title: "Dzong",
          details: "ochtend",
          location: "Punakha",
          departure_time: "09:00:00",
          arrival_time: null,
          arrives_on: null,
          ends_on: null,
          carrier: null,
          flight_number: null,
          address: null,
          duration_minutes: 120,
          sort_order: 0,
        },
      ],
      earlierJournal: [
        {
          day_number: 9,
          day_date: "2026-11-19",
          title: "Thimphu",
          actual_location: "Thimphu",
          body: "We wandelden door de stad.",
        },
      ],
    });

    assert.equal(context.tripAiBasis, "We reizen rustig, houden van natuur en tempels.");
    assert.equal(context.planningItems.length, 1);
    assert.equal(context.planningItems[0].title, "Dzong");
    assert.equal(context.earlierJournal.length, 1);
    assert.equal(context.photos[0].caption, "brug");
    assert.equal(context.planned.number, 10);
  });

  it("clips oversized ai_basis", () => {
    const context = buildInterviewContext({
      aiBasis: "y".repeat(AI_BASIS_MAX_CHARS + 10),
      day: {
        title: null,
        planned_location: null,
        planned_route: null,
        day_date: "2026-11-01",
        day_number: 1,
      },
    });
    assert.ok(context.tripAiBasis);
    assert.ok(context.tripAiBasis.length <= AI_BASIS_MAX_CHARS);
    assert.ok(context.tripAiBasis.endsWith("…"));
  });
});
