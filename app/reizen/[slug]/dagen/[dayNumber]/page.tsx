import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";

export default async function PublicDay({ params }: { params: Promise<{ slug: string; dayNumber: string }> }) {
  const { slug, dayNumber } = await params;
  const day = Number(dayNumber);
  if (!Number.isInteger(day)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("trip_days").select("day_number,day_date,day_entries(title,actual_location,body,published_at,media_assets(original_filename,web_object_path,is_public,sort_order))").eq("day_number", day).single();
  if (!data) notFound();
  const entry = Array.isArray(data.day_entries) ? data.day_entries[0] : data.day_entries;
  if (!entry) notFound();
  return <main className="public-day"><p className="eyebrow blue">Reisdag {data.day_number}</p><h1>{entry.title}</h1><p className="journal-intro">{entry.actual_location}</p><article>{entry.body.split("\n\n").map((paragraph: string, index: number) => paragraph.startsWith("## ") ? <h2 key={index}>{paragraph.slice(3)}</h2> : <p key={index}>{paragraph}</p>)}</article></main>;
}
