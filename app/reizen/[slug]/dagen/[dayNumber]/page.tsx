import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";

export default async function PublicDay({ params }: { params: Promise<{ slug: string; dayNumber: string }> }) {
  const { slug, dayNumber } = await params;
  const day = Number(dayNumber);
  if (!Number.isInteger(day)) notFound();
  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("id,title,slug").eq("slug", slug).maybeSingle();
  if (!trip) notFound();
  const { data } = await supabase.from("trip_days").select("day_number,day_date,day_entries(title,actual_location,body,published_at,media_assets(id,original_filename,caption,is_public,sort_order))").eq("trip_id", trip.id).eq("day_number", day).maybeSingle();
  if (!data) notFound();
  const entry = Array.isArray(data.day_entries) ? data.day_entries[0] : data.day_entries;
  if (!entry) notFound();
  const { data: tripDays } = await supabase.from("trip_days").select("day_number").eq("trip_id", trip.id).order("day_number", { ascending: true });
  const currentIndex = (tripDays || []).findIndex((item) => item.day_number === data.day_number);
  const previous = currentIndex > 0 ? tripDays?.[currentIndex - 1] : null;
  const next = currentIndex >= 0 ? tripDays?.[currentIndex + 1] : null;
  const photos = (entry.media_assets || []).filter((asset: { is_public: boolean }) => asset.is_public).sort((left: { sort_order: number }, right: { sort_order: number }) => left.sort_order - right.sort_order);
  return <main className="public-day"><Link className="back-link" href={`/reizen/${trip.slug}`}>← Alle verhalen</Link><p className="eyebrow blue">{trip.title} · reisdag {data.day_number}</p><h1>{entry.title}</h1><p className="journal-intro">{entry.actual_location}</p>{photos.length ? <div className="public-photo-gallery">{photos.map((asset: { id: string; original_filename: string; caption: string }, index: number) => <figure className={index === 0 ? "public-photo featured" : "public-photo"} key={asset.id}><img src={`/api/public/media/${asset.id}`} alt={asset.caption || asset.original_filename} /><figcaption>{asset.caption}</figcaption></figure>)}</div> : null}<article>{entry.body.split("\n\n").map((paragraph: string, index: number) => paragraph.startsWith("## ") ? <h2 key={index}>{paragraph.slice(3)}</h2> : <p key={index}>{paragraph}</p>)}</article><nav className="public-day-navigation">{previous ? <Link href={`/reizen/${trip.slug}/dagen/${previous.day_number}`}>← Vorige dag</Link> : <span />}{next ? <Link href={`/reizen/${trip.slug}/dagen/${next.day_number}`}>Volgende dag →</Link> : <span />}</nav></main>;
}
