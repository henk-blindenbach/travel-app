/** Compact on-road labels for planning cells and today cards. */

export type PlanningSummaryItem = {
  kind?: string | null;
  title?: string | null;
  location?: string | null;
  carrier?: string | null;
  flight_number?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  arrives_on?: string | null;
  departure_terminal?: string | null;
  arrival_terminal?: string | null;
  seat_number?: string | null;
  booking_reference?: string | null;
  address?: string | null;
  external_url?: string | null;
  duration_minutes?: number | null;
  ends_on?: string | null;
};

function shortTime(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : text;
}

function push(bits: string[], value: string | null | undefined, prefix = "") {
  const text = String(value || "").trim();
  if (text) bits.push(prefix ? prefix + text : text);
}

export function planningItemSummaryBits(item: PlanningSummaryItem): string[] {
  const bits: string[] = [];
  const kind = item.kind || "";

  if (kind === "flight") {
    push(bits, item.carrier);
    push(bits, item.flight_number);
    push(bits, shortTime(item.departure_time));
    if (item.arrives_on) push(bits, "aankomst " + item.arrives_on);
    push(bits, shortTime(item.arrival_time));
    push(bits, item.departure_terminal, "vertrek T");
    push(bits, item.arrival_terminal, "aankomst T");
    push(bits, item.seat_number, "stoel ");
    push(bits, item.booking_reference);
    return bits;
  }

  if (kind === "activity" || kind === "transport" || kind === "permit") {
    push(bits, shortTime(item.departure_time));
    push(bits, item.location);
    push(bits, item.address);
    push(bits, item.booking_reference);
    if (item.duration_minutes) bits.push(item.duration_minutes + " min");
    if (item.external_url) bits.push("link");
    return bits;
  }

  if (kind === "accommodation") {
    push(bits, item.location);
    push(bits, item.address);
    push(bits, item.booking_reference);
    if (item.ends_on) bits.push("tot " + item.ends_on);
    return bits;
  }

  push(bits, item.departure_time);
  push(bits, item.arrival_time);
  push(bits, item.location);
  push(bits, item.booking_reference);
  push(bits, item.address);
  return bits;
}

export function planningItemSummaryLine(item: PlanningSummaryItem, empty = "Details in de planning") {
  const bits = planningItemSummaryBits(item);
  return bits.length ? bits.join(" · ") : empty;
}
