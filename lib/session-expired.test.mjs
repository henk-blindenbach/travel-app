import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SESSION_EXPIRED_DOCUMENT_MESSAGE,
  SESSION_EXPIRED_ERROR,
  SESSION_EXPIRED_MESSAGE,
  SessionExpiredError,
  isSessionExpiredError,
  sessionExpiredLoginPath,
} from "./session-expired.ts";

describe("sessionExpiredLoginPath", () => {
  it("keeps app paths and tags the session error", () => {
    assert.equal(
      sessionExpiredLoginPath("/app/trips/abc/documents"),
      "/login?next=%2Fapp%2Ftrips%2Fabc%2Fdocuments&error=" + SESSION_EXPIRED_ERROR,
    );
  });

  it("falls back for non-app paths", () => {
    assert.equal(sessionExpiredLoginPath("/login"), "/login?next=%2Fapp%2Ftoday&error=" + SESSION_EXPIRED_ERROR);
  });
});

describe("SessionExpiredError", () => {
  it("carries a login path and is detectable", () => {
    const error = new SessionExpiredError(SESSION_EXPIRED_DOCUMENT_MESSAGE, "/login?next=%2Fapp%2Ftoday&error=session");
    assert.equal(error.message, SESSION_EXPIRED_DOCUMENT_MESSAGE);
    assert.equal(isSessionExpiredError(error), true);
    assert.equal(error.loginPath.includes("error=session"), true);
  });

  it("exposes the default message", () => {
    assert.match(SESSION_EXPIRED_MESSAGE, /sessie is verlopen/i);
  });
});
