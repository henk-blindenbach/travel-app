/** Copy for the offline documents panel — kept pure so the counter can be unit-tested. */

export function offlineDocumentsIntro(totalDocuments: number, savedCount: number) {
  const total =
    totalDocuments === 1
      ? "Bewaar alle 1 document van deze reis alleen op dit apparaat."
      : `Bewaar alle ${totalDocuments} documenten van deze reis alleen op dit apparaat.`;
  if (!savedCount) {
    return `${total} Verwijder de kopieën na de reis of wanneer iemand anders dit toestel gebruikt.`;
  }
  const local =
    savedCount === 1
      ? "1 document staat nu lokaal klaar."
      : `${savedCount} documenten staan nu lokaal klaar.`;
  return `${total} ${local}`;
}

export const TRIP_DOCUMENTS_CHANGED = "nos-trip-documents-changed";
export const OFFLINE_DOCUMENTS_UPDATED = "nos-offline-documents-updated";

export type TripDocumentsChangedDetail = {
  tripId: string;
  documents: { id: string; title: string }[];
};

export function dispatchTripDocumentsChanged(tripId: string, documents: { id: string; title: string }[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TRIP_DOCUMENTS_CHANGED, {
      detail: { tripId, documents } satisfies TripDocumentsChangedDetail,
    }),
  );
}

export function dispatchOfflineDocumentsUpdated(tripId: string, saved?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OFFLINE_DOCUMENTS_UPDATED, {
      detail: { tripId, saved },
    }),
  );
}
