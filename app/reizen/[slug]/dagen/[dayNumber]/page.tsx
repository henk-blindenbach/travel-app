import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLocaleControls } from "../../../../../components/PublicLocaleControls";
import { getDictionary, getLocale, LOCALE_DATE, t } from "../../../../../lib/i18n";
import { getPublicDayByNumber, localizePublicDay } from "../../../../../lib/public-travel-data";

export default async function PublicDay({
  params,
}: {
  params: Promise<{ slug: string; dayNumber: string }>;
}) {
  const { slug, dayNumber } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale).day;
  const dayNumberValue = Number(dayNumber);
  if (!Number.isInteger(dayNumberValue)) notFound();
  const result = await getPublicDayByNumber(slug, dayNumberValue);
  if (!result) notFound();
  const { trip, days, media } = result;
  const entry = localizePublicDay(result.entry, locale);
  const currentIndex = days.findIndex((day) => day.id === entry.id);
  const previous = currentIndex > 0 ? days[currentIndex - 1] : null;
  const next = currentIndex < days.length - 1 ? days[currentIndex + 1] : null;
  const date = new Intl.DateTimeFormat(LOCALE_DATE[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(entry.day_date + "T12:00:00"));
  const bodyParagraphs = (entry.body || "").split("\n\n").filter(Boolean);

  return (
    <main className="public-day">
      <div className="public-page-top">
        <Link className="back-link" href={"/reizen/" + trip.slug}>
          {dict.allStories}
        </Link>
        <PublicLocaleControls />
      </div>
      <p className="eyebrow blue">{t(dict.dayNDate, { n: entry.day_number, date })}</p>
      <h1>{entry.title || dict.travelStory}</h1>
      <p className="journal-intro">{entry.actual_location}</p>
      {media.length ? (
        <div className="public-photo-gallery">
          {media.map((asset, index) => (
            <figure className={index === 0 ? "public-photo featured" : "public-photo"} key={asset.id}>
              <img
                src={"/api/public/media/" + asset.id}
                alt={t(dict.photoAlt, {
                  n: entry.day_number,
                  place: entry.actual_location || dict.onTheWay,
                })}
              />
            </figure>
          ))}
        </div>
      ) : null}
      <article>
        {bodyParagraphs.map((paragraph, index) =>
          paragraph.startsWith("## ") ? (
            <h2 key={index}>{paragraph.slice(3)}</h2>
          ) : (
            <p key={index}>{paragraph}</p>
          ),
        )}
      </article>
      <nav className="public-day-navigation">
        {previous ? (
          <Link href={"/reizen/" + trip.slug + "/dagen/" + previous.day_number}>{dict.previousDay}</Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={"/reizen/" + trip.slug + "/dagen/" + next.day_number}>{dict.nextDay}</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
