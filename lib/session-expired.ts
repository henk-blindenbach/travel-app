/** Shared copy and login redirect for expired private-app sessions. */

export const SESSION_EXPIRED_ERROR = "session";

export const SESSION_EXPIRED_MESSAGE =
  "Je sessie is verlopen. Log opnieuw in om verder te gaan.";

export const SESSION_EXPIRED_DOCUMENT_MESSAGE =
  "Je sessie is verlopen. Log opnieuw in om dit document te openen.";

export function sessionExpiredLoginPath(pathname?: string) {
  const next =
    pathname && pathname.startsWith("/app")
      ? pathname
      : typeof window !== "undefined" && window.location.pathname.startsWith("/app")
        ? window.location.pathname
        : "/app/today";
  return "/login?next=" + encodeURIComponent(next) + "&error=" + SESSION_EXPIRED_ERROR;
}

export class SessionExpiredError extends Error {
  loginPath: string;

  constructor(message = SESSION_EXPIRED_MESSAGE, loginPath?: string) {
    super(message);
    this.name = "SessionExpiredError";
    this.loginPath = loginPath || sessionExpiredLoginPath();
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError || (error instanceof Error && error.name === "SessionExpiredError");
}

/** Show a message first, then send the user to login (keeps the message readable). */
export function redirectAfterSessionExpired(loginPath: string, delayMs = 1400) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    window.location.assign(loginPath);
  }, delayMs);
}
