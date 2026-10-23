import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, parseLocale, type Locale } from "./config";

/** Resolve public UI locale from cookie (set by toggle or ?lang= via proxy). */
export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value) || DEFAULT_LOCALE;
}
