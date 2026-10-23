"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from "../lib/i18n/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private mode */
  }
}

export function LanguageToggle({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const fromQuery = searchParams.get("lang");
    if (isLocale(fromQuery) && fromQuery !== locale) {
      writeLocale(fromQuery);
      startTransition(() => router.refresh());
      return;
    }
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored) && stored !== locale && !fromQuery) {
        writeLocale(stored);
        startTransition(() => router.refresh());
      }
    } catch {
      /* ignore */
    }
  }, [locale, router, searchParams]);

  function select(next: Locale) {
    if (next === locale) return;
    writeLocale(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      router.refresh();
    });
  }

  return (
    <div className="lang-toggle" role="group" aria-label={label} data-pending={pending || undefined}>
      {LOCALES.map((code, index) => (
        <span key={code}>
          {index ? <span className="lang-toggle-sep" aria-hidden>|</span> : null}
          <button
            type="button"
            className={code === locale ? "is-active" : undefined}
            aria-pressed={code === locale}
            onClick={() => select(code)}
          >
            {LOCALE_LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
