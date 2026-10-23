import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCopiedPlanningItem } from "./planning-item-copy.ts";

const base = {
  id: "11111111-1111-1111-1111-111111111111",
  trip_id: "22222222-2222-2222-2222-222222222222",
  trip_day_id: "33333333-3333-3333-3333-333333333333",
  kind: "flight",
  status: "confirmed",
  title: "AMS → KTM",
  map_label: "Schiphol",
  details: "ochtendvlucht",
  location: "AMS",
  starts_at: null,
  ends_on: null,
  arrives_on: "2026-10-28",
  booking_reference: "ABC123",
  ticket_number: "074-1",
  departure_time: "10:40",
  arrival_time: "06:15",
  carrier: "KLM",
  flight_number: "KL0871",
  departure_terminal: "3",
  arrival_terminal: "1",
  seat_number: "12A",
  external_url: null,
  address: null,
  contact_phone: null,
  price_amount: 800,
  currency: "EUR",
  payment_status: "paid",
  is_optional: false,
  duration_minutes: null,
  altitude_m: null,
  sort_order: 2,
};

describe("buildCopiedPlanningItem", () => {
  it("moves the item to the target day and keeps flight fields", () => {
    const copy = buildCopiedPlanningItem(base, { id: "44444444-4444-4444-4444-444444444444", day_date: "2026-10-29" }, 7);
    assert.equal(copy.trip_day_id, "44444444-4444-4444-4444-444444444444");
    assert.equal(copy.flight_number, "KL0871");
    assert.equal(copy.carrier, "KLM");
    assert.equal(copy.seat_number, "12A");
    assert.equal(copy.departure_terminal, "3");
    assert.equal(copy.sort_order, 7);
    assert.equal(copy.arrives_on, null);
    assert.equal(copy.map_label, "Schiphol");
  });

  it("clears accommodation ends_on when it would precede the new day", () => {
    const copy = buildCopiedPlanningItem(
      { ...base, kind: "accommodation", ends_on: "2026-10-28", arrives_on: null },
      { id: "44444444-4444-4444-4444-444444444444", day_date: "2026-10-29" },
      1,
    );
    assert.equal(copy.ends_on, null);
  });
});
