/** Pure helpers for copying a planning item onto another trip day. */

export type CopyablePlanningItem = {
  id: string;
  trip_id: string;
  trip_day_id: string;
  kind: string;
  status: string;
  title: string;
  details: string | null;
  location: string | null;
  starts_at: string | null;
  ends_on: string | null;
  arrives_on: string | null;
  booking_reference: string | null;
  ticket_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  carrier: string | null;
  flight_number: string | null;
  departure_terminal: string | null;
  arrival_terminal: string | null;
  seat_number: string | null;
  external_url: string | null;
  address: string | null;
  contact_phone: string | null;
  price_amount: number | null;
  currency: string | null;
  payment_status: string | null;
  is_optional: boolean | null;
  duration_minutes: number | null;
  altitude_m: number | null;
  sort_order: number | null;
};

export function buildCopiedPlanningItem(
  source: CopyablePlanningItem,
  targetDay: { id: string; day_date: string },
  nextSortOrder: number,
) {
  let endsOn = source.ends_on;
  if (source.kind === "accommodation" && endsOn && endsOn <= targetDay.day_date) {
    endsOn = null;
  }

  let arrivesOn = source.arrives_on;
  if (arrivesOn && arrivesOn < targetDay.day_date) {
    arrivesOn = null;
  }

  return {
    trip_id: source.trip_id,
    trip_day_id: targetDay.id,
    kind: source.kind,
    status: source.status,
    title: source.title,
    details: source.details || "",
    location: source.location || "",
    starts_at: source.starts_at,
    ends_on: endsOn,
    arrives_on: arrivesOn,
    booking_reference: source.booking_reference,
    ticket_number: source.ticket_number,
    departure_time: source.departure_time,
    arrival_time: source.arrival_time,
    carrier: source.carrier,
    flight_number: source.flight_number,
    departure_terminal: source.departure_terminal,
    arrival_terminal: source.arrival_terminal,
    seat_number: source.seat_number,
    external_url: source.external_url,
    address: source.address,
    contact_phone: source.contact_phone,
    price_amount: source.price_amount,
    currency: source.currency,
    payment_status: source.payment_status || "unknown",
    is_optional: Boolean(source.is_optional),
    duration_minutes: source.duration_minutes,
    altitude_m: source.altitude_m,
    sort_order: nextSortOrder,
  };
}

export const COPY_SELECT =
  "id,trip_id,trip_day_id,kind,status,title,details,location,starts_at,ends_on,arrives_on,booking_reference,ticket_number,departure_time,arrival_time,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,address,contact_phone,price_amount,currency,payment_status,is_optional,duration_minutes,altitude_m,sort_order";
