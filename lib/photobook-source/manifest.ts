import type { PhotobookManifest, PhotobookSourcePackage } from "./types";

export function buildPhotobookManifest(pkg: PhotobookSourcePackage): PhotobookManifest {
  return {
    version: 1,
    generatedAt: pkg.generatedAt,
    trip: {
      id: pkg.trip.id,
      title: pkg.trip.title,
      startDate: pkg.trip.startDate,
      endDate: pkg.trip.endDate,
    },
    days: pkg.days.map((day) => ({
      id: day.id,
      sequence: day.sequence,
      date: day.date,
      title: day.title,
      location: {
        name: day.locationName.trim() || null,
        latitude: day.latitude,
        longitude: day.longitude,
      },
      story: day.story,
      folder: day.folderName,
      photos: day.photos.map((photo) => ({
        id: photo.id,
        filename: photo.filename,
        role: photo.role,
        sequence: photo.sequence,
        capturedAt: photo.capturedAt,
        latitude: photo.latitude,
        longitude: photo.longitude,
      })),
    })),
  };
}
