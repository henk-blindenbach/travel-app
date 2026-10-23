import Link from "next/link";
import { Suspense } from "react";
import { LanguageToggle } from "./LanguageToggle";
import { getDictionary, getLocale } from "../lib/i18n";

export async function PublicHeader() {
  const locale = await getLocale();
  const t = getDictionary(locale).header;

  return (
    <header className="public-header">
      <Link className="wordmark" href="/">
        {t.wordmark}
      </Link>
      <nav>
        <Link href="/reizen">{t.stories}</Link>
        <Link href="/reizen">{t.trips}</Link>
        <Link href="/over-ons">{t.about}</Link>
      </nav>
      <Suspense fallback={<span className="lang-toggle lang-toggle-fallback" aria-hidden />}>
        <LanguageToggle locale={locale} label={t.language} />
      </Suspense>
      <Link className="header-link" href="/app/today">
        {t.myTrip}
      </Link>
    </header>
  );
}
