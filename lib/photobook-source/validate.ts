import { assertOriginalExists, OriginalFetchError } from "../scaleway";
import { softValidatePackage } from "./soft-validate";
import type { PhotobookSourceHardError, PhotobookSourcePackage } from "./types";

export { softValidatePackage } from "./soft-validate";

/** Hard-fail when any selected original is missing or inaccessible. */
export async function validateOriginalsAccessible(
  pkg: PhotobookSourcePackage,
): Promise<PhotobookSourceHardError[]> {
  const errors: PhotobookSourceHardError[] = [];
  for (const day of pkg.days) {
    for (const photo of day.photos) {
      try {
        await assertOriginalExists(photo.originalObjectKey);
      } catch (error) {
        if (error instanceof OriginalFetchError) {
          errors.push({
            code: error.code === "not_configured"
              ? "not_configured"
              : error.code === "access_denied"
              ? "access_denied"
              : error.code === "missing"
              ? "missing_original"
              : "read_failed",
            message: `${photo.originalFilename}: ${error.message}`,
            mediaAssetId: photo.id,
            filename: photo.originalFilename,
          });
        } else {
          errors.push({
            code: "read_failed",
            message: `${photo.originalFilename}: origineel kon niet worden gecontroleerd.`,
            mediaAssetId: photo.id,
            filename: photo.originalFilename,
          });
        }
      }
    }
  }
  return errors;
}
