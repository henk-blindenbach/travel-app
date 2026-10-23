import { Suspense } from "react";
import { LanguageToggle } from "./LanguageToggle";
import { getDictionary, getLocale } from "../lib/i18n";

/** Language toggle for public pages that omit PublicHeader (route / fotos / day). */
export async function PublicLocaleControls() {
  const locale = await getLocale();
  const label = getDictionary(locale).header.language;

  return (
    <div className="public-locale-bar">
      <Suspense fallback={<span className="lang-toggle lang-toggle-fallback" aria-hidden />}>
        <LanguageToggle locale={locale} label={label} />
      </Suspense>
    </div>
  );
}
