import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyOriginalFetchError, OriginalFetchError } from "./scaleway-errors.ts";

describe("classifyOriginalFetchError", () => {
  it("keeps OriginalFetchError instances", () => {
    const err = new OriginalFetchError("missing", "gone");
    assert.equal(classifyOriginalFetchError(err), err);
  });

  it("maps NoSuchKey / 404 to missing", () => {
    const err = classifyOriginalFetchError({ name: "NoSuchKey", $metadata: { httpStatusCode: 404 } });
    assert.equal(err.code, "missing");
    assert.match(err.message, /origineel ontbreekt/i);
  });

  it("maps AccessDenied / 403 to access_denied", () => {
    const err = classifyOriginalFetchError({
      name: "AccessDenied",
      message: "Access Denied",
      $metadata: { httpStatusCode: 403 },
    });
    assert.equal(err.code, "access_denied");
    assert.match(err.message, /toegang|opslag|upload/i);
  });

  it("maps not configured message", () => {
    const err = classifyOriginalFetchError(new Error("De private foto-opslag is nog niet ingesteld."));
    assert.equal(err.code, "not_configured");
  });

  it("falls back to read_failed", () => {
    const err = classifyOriginalFetchError(new Error("boom"));
    assert.equal(err.code, "read_failed");
  });
});
