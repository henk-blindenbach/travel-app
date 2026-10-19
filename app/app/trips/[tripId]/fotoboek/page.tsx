import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/AppShell";
import { PhotoBookBuilder, type CandidatePhoto } from "../../../../../components/photos/PhotoBookBuilder";
import { prodigiConfigStatus } from "../../../../../lib/prodigi";
import { getPrivateTrip } from "../../../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../../../lib/supabase/server";

type EntryWithPhotos = {
  day_number: number;
  title: string | null;
  media_assets: {
    id: string;
    original_filename: string;
    caption: string;
    sort_order: number;
    upload_status: string;
    book_candidate: boolean;
    book_favorite: boolean;
  }[] | null;
};

export default async function TripPhotoBookPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const journey = await getPrivateTrip(tripId);
  if (!journey) notFound();

  let candidates: CandidatePhoto[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("day_entries")
        .select("day_number,title,media_assets(id,original_filename,caption,sort_order,upload_status,book_candidate,book_favorite)")
        .eq("trip_id", tripId)
        .order("day_number");
      candidates = ((data || []) as EntryWithPhotos[])
        .flatMap((entry) => (entry.media_assets || [])
          .filter((asset) => asset.upload_status === "ready" && asset.book_candidate)
          .map((asset) => ({
            id: asset.id,
            original_filename: asset.original_filename,
            caption: asset.caption,
            day_number: entry.day_number,
            day_title: entry.title,
            book_candidate: asset.book_candidate,
            book_favorite: asset.book_favorite,
          })))
        .sort((left, right) =>
          Number(right.book_favorite) - Number(left.book_favorite)
          || left.day_number - right.day_number);
    } catch {
      candidates = [];
    }
  }

  const prodigi = prodigiConfigStatus();

  return (
    <AppShell active="trips">
      <div className="planner-page photo-book-page">
        <Link className="back-link" href={`/app/trips/${tripId}/plan`}>
          ← Terug naar {journey.trip.title}
        </Link>
        <p className="eyebrow blue">{journey.trip.title}</p>
        <h1>Fotoboek</h1>
        <p className="journal-intro">
          Stel een privéconcept samen uit fotoboek-kandidaten, bepaal volgorde en metadata, en exporteer naar Prodigi.
          Een echte printorder gaat alleen door als de Prodigi API geconfigureerd is — anders blijft het bij “klaar voor Prodigi”.
        </p>
        <p className="photo-book-pool-meta">
          {candidates.length} kandidaat{candidates.length === 1 ? "" : "en"}
          {" · "}
          <Link href={`/app/photos?trip=${tripId}&filter=book`}>Open kandidaten in Foto’s</Link>
        </p>
        <PhotoBookBuilder
          tripId={tripId}
          tripTitle={journey.trip.title}
          candidates={candidates}
          prodigi={prodigi}
        />
      </div>
    </AppShell>
  );
}
