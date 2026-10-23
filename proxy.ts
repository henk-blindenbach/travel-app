import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE } from "./lib/i18n/config";
import { updateSession } from "./lib/supabase/proxy";

const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function proxy(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get("lang");
  const applyLangCookie = (response: NextResponse) => {
    if (isLocale(langParam)) {
      response.cookies.set(LOCALE_COOKIE, langParam, {
        path: "/",
        maxAge: LANG_COOKIE_MAX_AGE,
        sameSite: "lax",
      });
    }
    return response;
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return applyLangCookie(NextResponse.next());
  }

  if (!request.nextUrl.pathname.startsWith("/app")) {
    return applyLangCookie(NextResponse.next());
  }

  const response = await updateSession(request);
  return applyLangCookie(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
