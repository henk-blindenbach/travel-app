import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicLocaleControls } from "../../../../components/PublicLocaleControls";
import { getDictionary, getLocale, t } from "../../../../lib/i18n";
import { getPublicTripBySlug, localizePublicDay, type PublicMedia } from "../../../../lib/public-travel-data";

export default async function PublicPhotos({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale).photos;
  const result = await getPublicTripBySlug(slug);
  if (!result) notFound();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) notFound();
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const byDay = await Promise.all(
    result.days.map(async (rawDay) => {
      const day = localizePublicDay(rawDay, locale);
      return {
        day,
        media: ((
          await db
            .from("media_assets")
            .select("id,day_entry_id,web_object_path,sort_order,updated_at")
            .eq("day_entry_id", day.id)
            .order("sort_order")
        ).data || []) as PublicMedia[],
      };
    }),
  );

  return (
    <main className="public-trip">
      <div className="public-page-top">
        <Link className="back-link" href={"/reizen/" + result.trip.slug}>
          {dict.backToTrip}
        </Link>
        <PublicLocaleControls />
      </div>
      <p className="eyebrow blue">{dict.photos}</p>
      <h1>{result.trip.title}</h1>
      {byDay.map(({ day, media }) =>
        media.length ? (
          <section className="photo-strip" key={day.id}>
            <div className="section-heading">
              <div>
                <p className="eyebrow blue">{t(dict.dayN, { n: day.day_number })}</p>
                <h2>{day.title || day.actual_location}</h2>
              </div>
            </div>
            <div className="public-photo-gallery">
              {media.map((asset) => (
                <img
                  key={asset.id}
                  src={"/api/public/media/" + asset.id}
                  alt={t(dict.photoAlt, {
                    n: day.day_number,
                    place: day.actual_location || dict.onTheWay,
                  })}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
      {!byDay.some(({ media }) => media.length) ? <p className="public-empty">{dict.empty}</p> : null}
    </main>
  );
}
