import type {
  PhotobookSourceHardError,
  PhotobookSourcePackage,
  PhotobookSourceValidation,
  PhotobookSourceWarning,
} from "./types";

export function softValidatePackage(
  pkg: PhotobookSourcePackage,
  warnings: PhotobookSourceWarning[],
): PhotobookSourceValidation {
  const errors: PhotobookSourceHardError[] = [];
  if (!pkg.days.length) {
    errors.push({
      code: "empty_export",
      message: "Geen dagen met fotoboek-kandidaten om te exporteren.",
    });
  }
  return { warnings, errors };
}
