import { PublicHeader } from "../../components/PublicHeader";
import { getDictionary, getLocale } from "../../lib/i18n";

export default async function About() {
  const locale = await getLocale();
  const dict = getDictionary(locale).about;

  return (
    <>
      <PublicHeader />
      <main className="public-trip">
        <p className="eyebrow blue">{dict.eyebrow}</p>
        <h1>{dict.title}</h1>
        <p className="journal-intro">{dict.intro}</p>
        <p>{dict.later}</p>
      </main>
    </>
  );
}
