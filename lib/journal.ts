export const acceptedImageTypes = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const maxImageBytes = 50 * 1024 * 1024;

export function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function safeText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function originalExtension(contentType: string) {
  return ({ "image/heic": "heic", "image/heif": "heif", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[contentType];
}
