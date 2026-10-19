import { safeText } from "./journal";

export const PLAN_IMPORT_KINDS = new Set([
  "accommodation",
  "flight",
  "transport",
  "activity",
  "permit",
  "note",
]);
export const PLAN_IMPORT_ITEM_STATUSES = new Set(["option", "planned", "confirmed"]);
export const PLAN_IMPORT_DAY_STATUSES = new Set(["planned", "in_progress", "completed", "skipped"]);

const KIND_ALIASES: Record<string, string> = {
  accommodation: "accommodation",
  verblijf: "accommodation",
  hotel: "accommodation",
  stay: "accommodation",
  flight: "flight",
  vlucht: "flight",
  transport: "transport",
  vervoer: "transport",
  activity: "activity",
  activiteit: "activity",
  permit: "permit",
  visum: "permit",
  visa: "permit",
  note: "note",
  notitie: "note",
};

const ITEM_STATUS_ALIASES: Record<string, string> = {
  option: "option",
  optie: "option",
  planned: "planned",
  gepland: "planned",
  confirmed: "confirmed",
  bevestigd: "confirmed",
};

const DAY_STATUS_ALIASES: Record<string, string> = {
  planned: "planned",
  gepland: "planned",
  in_progress: "in_progress",
  onderweg: "in_progress",
  completed: "completed",
  afgerond: "completed",
  skipped: "skipped",
  overgeslagen: "skipped",
};

const HEADER_ALIASES: Record<string, string> = {
  row_type: "row_type",
  type: "row_type",
  rijtype: "row_type",
  day_number: "day_number",
  dag: "day_number",
  day: "day_number",
  title: "title",
  titel: "title",
  planned_location: "planned_location",
  location: "planned_location",
  plaats: "planned_location",
  planned_route: "planned_route",
  route: "planned_route",
  private_notes: "private_notes",
  notes: "private_notes",
  notities: "private_notes",
  dagnotitie: "private_notes",
  day_status: "day_status",
  status_dag: "day_status",
  kind: "kind",
  soort: "kind",
  item_status: "item_status",
  status: "item_status",
  item_location: "item_location",
  item_plaats: "item_location",
  details: "details",
  bijzonderheden: "details",
  booking_reference: "booking_reference",
  boekingsnummer: "booking_reference",
  ticket_number: "ticket_number",
  ticketnummer: "ticket_number",
  departure_time: "departure_time",
  vertrektijd: "departure_time",
  arrival_time: "arrival_time",
  aankomsttijd: "arrival_time",
  arrives_on: "arrives_on",
  aankomstdatum: "arrives_on",
  ends_on: "ends_on",
  uitchecken: "ends_on",
  carrier: "carrier",
  maatschappij: "carrier",
  flight_number: "flight_number",
  vluchtnummer: "flight_number",
  departure_terminal: "departure_terminal",
  arrival_terminal: "arrival_terminal",
  seat_number: "seat_number",
  stoel: "seat_number",
  external_url: "external_url",
  link: "external_url",
  url: "external_url",
  address: "address",
  adres: "address",
  contact_phone: "contact_phone",
  telefoon: "contact_phone",
  price_amount: "price_amount",
  bedrag: "price_amount",
  currency: "currency",
  valuta: "currency",
  payment_status: "payment_status",
  betaalstatus: "payment_status",
  is_optional: "is_optional",
  optioneel: "is_optional",
  duration_minutes: "duration_minutes",
  duur: "duration_minutes",
  altitude_m: "altitude_m",
  hoogte: "altitude_m",
  latitude: "latitude",
  lat: "latitude",
  longitude: "longitude",
  lng: "longitude",
  lon: "longitude",
};

export type PlanImportDayRow = {
  rowType: "day";
  line: number;
  dayNumber: number;
  title?: string;
  plannedLocation?: string;
  plannedRoute?: string;
  privateNotes?: string;
  dayStatus?: string;
  latitude?: number | null;
  longitude?: number | null;
  clearCoordinates?: boolean;
};

export type PlanImportItemRow = {
  rowType: "item";
  line: number;
  dayNumber: number;
  kind: string;
  title: string;
  status: string;
  location?: string;
  details?: string;
  bookingReference?: string;
  ticketNumber?: string;
  departureTime?: string | null;
  arrivalTime?: string | null;
  arrivesOn?: string | null;
  endsOn?: string | null;
  carrier?: string;
  flightNumber?: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  seatNumber?: string;
  externalUrl?: string | null;
  address?: string;
  contactPhone?: string;
  priceAmount?: number | null;
  currency?: string | null;
  paymentStatus?: string;
  isOptional?: boolean;
  durationMinutes?: number | null;
  altitudeM?: number | null;
};

export type PlanImportRow = PlanImportDayRow | PlanImportItemRow;

export type PlanImportRowError = { line: number; message: string };

export type PlanImportParseResult = {
  rows: PlanImportRow[];
  errors: PlanImportRowError[];
};

export type PlanImportPreviewAction =
  | { kind: "day_update"; dayNumber: number; dayId: string; fields: string[] }
  | { kind: "item_update"; dayNumber: number; dayId: string; itemId: string; title: string; itemKind: string }
  | { kind: "item_insert"; dayNumber: number; dayId: string; title: string; itemKind: string };

export type PlanImportPreview = {
  rows: PlanImportRow[];
  errors: PlanImportRowError[];
  actions: PlanImportPreviewAction[];
  summary: { dayUpdates: number; itemUpdates: number; itemInserts: number; errorCount: number };
};

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function cell(record: Record<string, string>, key: string) {
  return (record[key] ?? "").trim();
}

function parseIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parseTime(value: string) {
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  return null;
}

function parseBool(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "ja", "y", "x"].includes(normalized)) return true;
  if (["0", "false", "no", "nee", "n"].includes(normalized)) return false;
  return undefined;
}

function parsePrice(value: string) {
  if (!value) return null;
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 && amount <= 9_999_999_999.99 ? amount : undefined;
}

function parseWhole(value: string, minimum: number, maximum: number) {
  if (!value) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : undefined;
}

function parseCoord(value: string) {
  if (!value) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : undefined;
}

function parseExternalUrl(value: string) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Minimal RFC4180 CSV parser (comma-separated, quoted fields, CRLF/LF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export function parsePlanImportCsv(csvText: string): PlanImportParseResult {
  const table = parseCsv(csvText);
  const errors: PlanImportRowError[] = [];
  const rows: PlanImportRow[] = [];

  if (!table.length) {
    return { rows, errors: [{ line: 1, message: "Het CSV-bestand is leeg." }] };
  }

  const headerCells = table[0].map(normalizeHeader);
  const headerMap = new Map<string, number>();
  headerCells.forEach((raw, index) => {
    const key = HEADER_ALIASES[raw];
    if (key && !headerMap.has(key)) headerMap.set(key, index);
  });

  if (!headerMap.has("row_type") || !headerMap.has("day_number")) {
    return {
      rows,
      errors: [{ line: 1, message: "Verplichte kolommen ontbreken: row_type en day_number." }],
    };
  }

  for (let index = 1; index < table.length; index += 1) {
    const line = index + 1;
    const cells = table[index];
    const record: Record<string, string> = {};
    for (const [key, columnIndex] of headerMap.entries()) {
      record[key] = (cells[columnIndex] ?? "").trim();
    }

    const rowTypeRaw = cell(record, "row_type").toLowerCase();
    const dayNumberRaw = cell(record, "day_number");
    const dayNumber = Number(dayNumberRaw);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 500) {
      errors.push({ line, message: `Ongeldig day_number “${dayNumberRaw || "leeg"}”. Gebruik een heel getal vanaf 1.` });
      continue;
    }

    if (rowTypeRaw === "day" || rowTypeRaw === "dag") {
      const dayStatusRaw = cell(record, "day_status") || cell(record, "item_status");
      const dayStatus = dayStatusRaw
        ? DAY_STATUS_ALIASES[dayStatusRaw.toLowerCase()]
        : undefined;
      if (dayStatusRaw && !dayStatus) {
        errors.push({ line, message: `Onbekende day_status “${dayStatusRaw}”.` });
        continue;
      }

      const latRaw = cell(record, "latitude");
      const lngRaw = cell(record, "longitude");
      let latitude: number | null | undefined;
      let longitude: number | null | undefined;
      let clearCoordinates = false;
      if (latRaw.toLowerCase() === "clear" || lngRaw.toLowerCase() === "clear") {
        clearCoordinates = true;
        latitude = null;
        longitude = null;
      } else {
        if (latRaw) {
          const parsedLat = parseCoord(latRaw);
          if (parsedLat === undefined || parsedLat === null || parsedLat < -90 || parsedLat > 90) {
            errors.push({ line, message: `Ongeldige latitude “${latRaw}”.` });
            continue;
          }
          latitude = parsedLat;
        }
        if (lngRaw) {
          const parsedLng = parseCoord(lngRaw);
          if (parsedLng === undefined || parsedLng === null || parsedLng < -180 || parsedLng > 180) {
            errors.push({ line, message: `Ongeldige longitude “${lngRaw}”.` });
            continue;
          }
          longitude = parsedLng;
        }
        if ((latitude !== undefined) !== (longitude !== undefined)) {
          errors.push({ line, message: "Geef latitude én longitude samen op, of laat beide leeg." });
          continue;
        }
      }

      const dayRow: PlanImportDayRow = {
        rowType: "day",
        line,
        dayNumber,
      };
      const title = safeText(cell(record, "title"), 200);
      const plannedLocation = safeText(cell(record, "planned_location"), 200);
      const plannedRoute = safeText(cell(record, "planned_route"), 400);
      const privateNotes = safeText(cell(record, "private_notes"), 4_000);
      if (title) dayRow.title = title;
      if (plannedLocation) dayRow.plannedLocation = plannedLocation;
      if (plannedRoute) dayRow.plannedRoute = plannedRoute;
      if (privateNotes) dayRow.privateNotes = privateNotes;
      if (dayStatus) dayRow.dayStatus = dayStatus;
      if (clearCoordinates) {
        dayRow.clearCoordinates = true;
        dayRow.latitude = null;
        dayRow.longitude = null;
      } else if (latitude !== undefined && longitude !== undefined) {
        dayRow.latitude = latitude;
        dayRow.longitude = longitude;
      }

      if (
        !dayRow.title &&
        !dayRow.plannedLocation &&
        !dayRow.plannedRoute &&
        !dayRow.privateNotes &&
        !dayRow.dayStatus &&
        dayRow.latitude === undefined &&
        !dayRow.clearCoordinates
      ) {
        errors.push({
          line,
          message: "Dagrij zonder inhoud. Vul minstens titel, plaats, route, notitie, status of coördinaten in.",
        });
        continue;
      }
      rows.push(dayRow);
      continue;
    }

    if (rowTypeRaw === "item" || rowTypeRaw === "onderdeel" || rowTypeRaw === "planning") {
      const kindRaw = cell(record, "kind");
      const kind = KIND_ALIASES[kindRaw.toLowerCase()];
      if (!kind || !PLAN_IMPORT_KINDS.has(kind)) {
        errors.push({ line, message: `Onbekend kind “${kindRaw || "leeg"}”. Gebruik flight, accommodation, transport, activity, permit of note.` });
        continue;
      }
      const title = safeText(cell(record, "title"), 200);
      if (!title) {
        errors.push({ line, message: "Planningonderdeel mist een title." });
        continue;
      }
      const statusRaw = cell(record, "item_status") || "planned";
      const status = ITEM_STATUS_ALIASES[statusRaw.toLowerCase()];
      if (!status || !PLAN_IMPORT_ITEM_STATUSES.has(status)) {
        errors.push({ line, message: `Onbekende item_status “${statusRaw}”.` });
        continue;
      }

      const endsOnRaw = cell(record, "ends_on");
      const arrivesOnRaw = cell(record, "arrives_on");
      const departureTimeRaw = cell(record, "departure_time");
      const arrivalTimeRaw = cell(record, "arrival_time");
      const priceRaw = cell(record, "price_amount");
      const durationRaw = cell(record, "duration_minutes");
      const altitudeRaw = cell(record, "altitude_m");
      const urlRaw = cell(record, "external_url");
      const optionalRaw = cell(record, "is_optional");
      const paymentRaw = (cell(record, "payment_status") || "unknown").toLowerCase();
      const currencyRaw = safeText(cell(record, "currency"), 3).toUpperCase();

      const endsOn = endsOnRaw ? parseIsoDate(endsOnRaw) : null;
      if (endsOnRaw && !endsOn) {
        errors.push({ line, message: `Ongeldige ends_on “${endsOnRaw}” (verwacht JJJJ-MM-DD).` });
        continue;
      }
      const arrivesOn = arrivesOnRaw ? parseIsoDate(arrivesOnRaw) : null;
      if (arrivesOnRaw && !arrivesOn) {
        errors.push({ line, message: `Ongeldige arrives_on “${arrivesOnRaw}” (verwacht JJJJ-MM-DD).` });
        continue;
      }
      const departureTime = departureTimeRaw ? parseTime(departureTimeRaw) : null;
      if (departureTimeRaw && !departureTime) {
        errors.push({ line, message: `Ongeldige departure_time “${departureTimeRaw}” (verwacht UU:MM).` });
        continue;
      }
      const arrivalTime = arrivalTimeRaw ? parseTime(arrivalTimeRaw) : null;
      if (arrivalTimeRaw && !arrivalTime) {
        errors.push({ line, message: `Ongeldige arrival_time “${arrivalTimeRaw}” (verwacht UU:MM).` });
        continue;
      }
      const priceAmount = parsePrice(priceRaw);
      if (priceAmount === undefined) {
        errors.push({ line, message: `Ongeldig price_amount “${priceRaw}”.` });
        continue;
      }
      const durationMinutes = parseWhole(durationRaw, 1, 10080);
      if (durationMinutes === undefined) {
        errors.push({ line, message: `Ongeldige duration_minutes “${durationRaw}”.` });
        continue;
      }
      const altitudeM = parseWhole(altitudeRaw, -500, 10000);
      if (altitudeM === undefined) {
        errors.push({ line, message: `Ongeldige altitude_m “${altitudeRaw}”.` });
        continue;
      }
      const externalUrl = parseExternalUrl(urlRaw);
      if (externalUrl === undefined) {
        errors.push({ line, message: `Ongeldige external_url “${urlRaw}”.` });
        continue;
      }
      const isOptional = parseBool(optionalRaw);
      if (optionalRaw && isOptional === undefined) {
        errors.push({ line, message: `Ongeldige is_optional “${optionalRaw}”. Gebruik ja/nee of true/false.` });
        continue;
      }
      if (currencyRaw && !/^[A-Z]{3}$/.test(currencyRaw)) {
        errors.push({ line, message: `Ongeldige currency “${currencyRaw}”. Gebruik een ISO-code zoals EUR.` });
        continue;
      }
      const paymentStatus = ["unknown", "unpaid", "paid", "onbekend", "onbetaald", "betaald"].includes(paymentRaw)
        ? ({ unknown: "unknown", onbekend: "unknown", unpaid: "unpaid", onbetaald: "unpaid", paid: "paid", betaald: "paid" } as Record<string, string>)[paymentRaw]
        : undefined;
      if (!paymentStatus) {
        errors.push({ line, message: `Onbekende payment_status “${paymentRaw}”.` });
        continue;
      }

      rows.push({
        rowType: "item",
        line,
        dayNumber,
        kind,
        title,
        status,
        location: safeText(cell(record, "item_location") || cell(record, "planned_location"), 200) || undefined,
        details: safeText(cell(record, "details"), 4_000) || undefined,
        bookingReference: safeText(cell(record, "booking_reference"), 120) || undefined,
        ticketNumber: safeText(cell(record, "ticket_number"), 120) || undefined,
        departureTime,
        arrivalTime,
        arrivesOn,
        endsOn: kind === "accommodation" ? endsOn : null,
        carrier: safeText(cell(record, "carrier"), 120) || undefined,
        flightNumber: safeText(cell(record, "flight_number"), 40) || undefined,
        departureTerminal: safeText(cell(record, "departure_terminal"), 80) || undefined,
        arrivalTerminal: safeText(cell(record, "arrival_terminal"), 80) || undefined,
        seatNumber: safeText(cell(record, "seat_number"), 40) || undefined,
        externalUrl,
        address: safeText(cell(record, "address"), 500) || undefined,
        contactPhone: safeText(cell(record, "contact_phone"), 80) || undefined,
        priceAmount,
        currency: currencyRaw || null,
        paymentStatus,
        isOptional: isOptional === true,
        durationMinutes,
        altitudeM,
      });
      continue;
    }

    errors.push({
      line,
      message: `Onbekende row_type “${rowTypeRaw || "leeg"}”. Gebruik day of item.`,
    });
  }

  return { rows, errors };
}

function itemMatchKey(kind: string, title: string) {
  return `${kind}::${title.trim().toLowerCase()}`;
}

export function buildPlanImportPreview(input: {
  rows: PlanImportRow[];
  errors: PlanImportRowError[];
  days: { id: string; day_number: number }[];
  items: { id: string; trip_day_id: string; kind: string; title: string }[];
}): PlanImportPreview {
  const dayByNumber = new Map(input.days.map((day) => [day.day_number, day]));
  const itemsByDay = new Map<string, Map<string, { id: string; trip_day_id: string; kind: string; title: string }>>();
  for (const item of input.items) {
    const bucket = itemsByDay.get(item.trip_day_id) || new Map();
    bucket.set(itemMatchKey(item.kind, item.title), item);
    itemsByDay.set(item.trip_day_id, bucket);
  }

  const actions: PlanImportPreviewAction[] = [];
  const errors = [...input.errors];

  for (const row of input.rows) {
    const day = dayByNumber.get(row.dayNumber);
    if (!day) {
      errors.push({
        line: row.line,
        message: `Dag ${row.dayNumber} bestaat niet in deze reis. Pas de reisdata aan of gebruik een bestaand day_number.`,
      });
      continue;
    }

    if (row.rowType === "day") {
      const fields: string[] = [];
      if (row.title !== undefined) fields.push("title");
      if (row.plannedLocation !== undefined) fields.push("planned_location");
      if (row.plannedRoute !== undefined) fields.push("planned_route");
      if (row.privateNotes !== undefined) fields.push("private_notes");
      if (row.dayStatus !== undefined) fields.push("status");
      if (row.clearCoordinates || row.latitude !== undefined) fields.push("coordinates");
      actions.push({ kind: "day_update", dayNumber: row.dayNumber, dayId: day.id, fields });
      continue;
    }

    const bucket = itemsByDay.get(day.id) || new Map();
    const existing = bucket.get(itemMatchKey(row.kind, row.title));
    if (existing) {
      actions.push({
        kind: "item_update",
        dayNumber: row.dayNumber,
        dayId: day.id,
        itemId: existing.id,
        title: row.title,
        itemKind: row.kind,
      });
    } else {
      actions.push({
        kind: "item_insert",
        dayNumber: row.dayNumber,
        dayId: day.id,
        title: row.title,
        itemKind: row.kind,
      });
      bucket.set(itemMatchKey(row.kind, row.title), {
        id: `pending-${row.line}`,
        trip_day_id: day.id,
        kind: row.kind,
        title: row.title,
      });
      itemsByDay.set(day.id, bucket);
    }
  }

  return {
    rows: input.rows,
    errors,
    actions,
    summary: {
      dayUpdates: actions.filter((action) => action.kind === "day_update").length,
      itemUpdates: actions.filter((action) => action.kind === "item_update").length,
      itemInserts: actions.filter((action) => action.kind === "item_insert").length,
      errorCount: errors.length,
    },
  };
}

export const PLAN_IMPORT_TEMPLATE_CSV = `row_type,day_number,title,planned_location,planned_route,private_notes,day_status,kind,item_status,item_location,details,booking_reference,ticket_number,departure_time,arrival_time,arrives_on,ends_on,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,address,contact_phone,price_amount,currency,payment_status,is_optional,duration_minutes,altitude_m,latitude,longitude
day,1,Aankomst,Voorbeeldstad,Airport → hotel,,planned,,,,,,,,,,,,,,,,,,,,,,,,,,
item,1,Voorbeeldvlucht,,,,,flight,confirmed,Vertrekstad,Directe vlucht,ABC123,,10:25,06:40,2026-11-02,,ExampleAir,XX123,,,,,,,450,EUR,paid,false,,,,
item,1,Voorbeeldhotel,,,,,accommodation,planned,Voorbeeldstad,Check-in na 14:00,HTL-44,,,,,,,,,,,,Centrum 12,+00-0-000000,80,EUR,unpaid,false,,,,
day,2,Stadswandeling,Voorbeeldstad,Centrum → museum,,planned,,,,,,,,,,,,,,,,,,,,,,,,,,
item,2,Museumbezoek,,,,,activity,option,Voorbeeldstad,Tickets ter plaatse,,,,,,,,,,,,,,,12,EUR,unknown,true,120,100,,
`;
