import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTripBySlug, type PublicMedia } from "../../../../lib/public-travel-data";
import { createClient } from "@supabase/supabase-js";

export default async function PublicPhotos({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicTripBySlug(slug);
  if (!result) notFound();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) notFound();
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const byDay = await Promise.all(result.days.map(async (day) => ({ day, media: ((await db.from("media_assets").select("id,day_entry_id,web_object_path,sort_order,updated_at").eq("day_entry_id", day.id).order("sort_order")).data || []) as PublicMedia[] })));
  return <main className="public-trip"><Link className="back-link" href={"/reizen/" + result.trip.slug}>← Terug naar reis</Link><p className="eyebrow blue">Foto’s</p><h1>{result.trip.title}</h1>{byDay.map(({ day, media }) => media.length ? <section className="photo-strip" key={day.id}><div className="section-heading"><div><p className="eyebrow blue">Dag {day.day_number}</p><h2>{day.title || day.actual_location}</h2></div></div><div className="public-photo-gallery">{media.map((asset) => <img key={asset.id} src={"/api/public/media/" + asset.id} alt={"Foto dag " + day.day_number + " – " + (day.actual_location || "onderweg")} />)}</div></section> : null)}{!byDay.some(({ media }) => media.length) ? <p className="public-empty">Er zijn nog geen openbare foto’s.</p> : null}</main>;
}
