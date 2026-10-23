/** Classifies Scaleway / S3-compatible GetObject failures for media complete/retry. */

export type OriginalFetchCode = "missing" | "access_denied" | "not_configured" | "read_failed";

export class OriginalFetchError extends Error {
  readonly code: OriginalFetchCode;

  constructor(code: OriginalFetchCode, message: string) {
    super(message);
    this.name = "OriginalFetchError";
    this.code = code;
  }
}

type S3LikeError = {
  name?: string;
  Code?: string;
  message?: string;
  $metadata?: { httpStatusCode?: number };
};

export function classifyOriginalFetchError(error: unknown): OriginalFetchError {
  if (error instanceof OriginalFetchError) return error;

  const err = (error || {}) as S3LikeError;
  const status = err.$metadata?.httpStatusCode;
  const code = String(err.Code || err.name || "");
  const message = String(err.message || "");

  if (message.includes("opslag is nog niet ingesteld")) {
    return new OriginalFetchError("not_configured", "De private foto-opslag is nog niet ingesteld.");
  }

  if (status === 404 || code === "NoSuchKey" || code === "NotFound" || code === "404") {
    return new OriginalFetchError(
      "missing",
      "Het privé-origineel ontbreekt in de opslag. Upload de foto opnieuw.",
    );
  }

  if (status === 403 || code === "AccessDenied" || code === "AllAccessDisabled" || code === "InvalidAccessKeyId" || code === "SignatureDoesNotMatch") {
    return new OriginalFetchError(
      "access_denied",
      "Geen toegang tot het privé-origineel. Controleer de Scaleway-sleutels of upload de foto opnieuw.",
    );
  }

  // Some S3 setups return AccessDenied (403) for missing keys when ListBucket is denied.
  if (/access denied/i.test(message) || /forbidden/i.test(message)) {
    return new OriginalFetchError(
      "access_denied",
      "Privé-origineel niet leesbaar (ontbreekt of geen toegang). Upload de foto opnieuw als opnieuw verwerken blijft mislukken.",
    );
  }

  return new OriginalFetchError("read_failed", "Het geüploade origineel kon niet worden gelezen.");
}
