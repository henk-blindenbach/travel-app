/** Vendor-neutral Photobook Source Package types (not Pixum-/Prodigi-specific). */

export type PhotobookSourcePhoto = {
  id: string;
  sequence: number;
  role: "hero" | "photo";
  filename: string;
  originalFilename: string;
  originalObjectKey: string;
  mimeType: string;
  favorite: boolean;
  capturedAt: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PhotobookSourceDay = {
  id: string;
  sequence: number;
  dayNumber: number;
  date: string;
  title: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  story: string;
  folderName: string;
  photos: PhotobookSourcePhoto[];
};

export type PhotobookSourceTrip = {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
};

export type PhotobookSourcePackage = {
  version: 1;
  generatedAt: string;
  zipBasename: string;
  trip: PhotobookSourceTrip;
  days: PhotobookSourceDay[];
};

export type PhotobookSourceWarning = {
  code: "story_without_photos" | "photos_without_story" | "no_candidates";
  message: string;
  dayId?: string;
  dayNumber?: number;
};

export type PhotobookSourceHardError = {
  code: "missing_original" | "empty_export" | "not_configured" | "access_denied" | "read_failed";
  message: string;
  mediaAssetId?: string;
  filename?: string;
};

export type PhotobookSourceValidation = {
  warnings: PhotobookSourceWarning[];
  errors: PhotobookSourceHardError[];
};

export type PhotobookManifest = {
  version: 1;
  generatedAt: string;
  trip: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  days: {
    id: string;
    sequence: number;
    date: string;
    title: string;
    location: {
      name: string | null;
      latitude: number | null;
      longitude: number | null;
    };
    story: string;
    folder: string;
    photos: {
      id: string;
      filename: string;
      role: "hero" | "photo";
      sequence: number;
      capturedAt: string | null;
      latitude: number | null;
      longitude: number | null;
    }[];
  }[];
};
