/** Client-side document search helpers (also used offline). */

export type SearchablePlanningItem = {
  id: string;
  title: string;
  kind: string;
  flight_number?: string | null;
  booking_reference?: string | null;
  carrier?: string | null;
  ticket_number?: string | null;
};

export type SearchableDocument = {
  title: string;
  original_filename?: string | null;
  document_type: string;
  planningItemIds: string[];
};

const typeLabels: Record<string, string> = {
  hotel_confirmation: "Hotelbevestiging",
  visa: "Visum",
  flight_ticket: "Vliegticket",
  transport_ticket: "Vervoersticket",
  excursion_ticket: "Excursieticket",
  insurance: "Verzekering",
  other: "Ander document",
};

export function documentTypeLabel(type: string) {
  return typeLabels[type] || type;
}

/** Lowercase haystack: title, filename, type, linked items, booking/flight codes, person names in titles. */
export function documentSearchHaystack(
  document: SearchableDocument,
  itemsById: Record<string, SearchablePlanningItem | undefined>,
) {
  const linked = document.planningItemIds.flatMap((id) => {
    const item = itemsById[id];
    if (!item) return [];
    return [item.title, item.kind, item.flight_number, item.booking_reference, item.carrier, item.ticket_number];
  });
  return [document.title, document.original_filename, document.document_type, documentTypeLabel(document.document_type), ...linked]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesDocumentSearch(haystack: string, query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  if (haystack.includes(trimmed)) return true;
  const compactQuery = trimmed.replace(/[\s\-–—]+/g, "");
  const compactHaystack = haystack.replace(/[\s\-–—]+/g, "");
  return compactHaystack.includes(compactQuery);
}

export function filterDocumentsBySearch<T extends SearchableDocument>(
  documents: T[],
  query: string,
  itemsById: Record<string, SearchablePlanningItem | undefined>,
) {
  if (!query.trim()) return documents;
  return documents.filter((document) => matchesDocumentSearch(documentSearchHaystack(document, itemsById), query));
}
