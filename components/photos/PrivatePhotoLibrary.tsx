"use client";

import { useEffect, useState } from "react";

export type PrivatePhoto = {
  id: string;
  original_filename: string;
  caption: string;
  day_number: number;
  day_title: string | null;
  book_candidate?: boolean;
  book_favorite?: boolean;
};

export function PrivatePhotoLibrary({ photos }: { photos: PrivatePhoto[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [items, setItems] = useState(photos);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(photos);
  }, [photos]);

  useEffect(() => {
    let active = true;
    void Promise.all(photos.map(async (photo) => {
      const response = await fetch(`/api/media/${photo.id}/web-url`);
      const data = await response.json().catch(() => ({}));
      return response.ok ? [photo.id, data.signedUrl] as const : null;
    })).then((results) => {
      if (!active) return;
      setUrls(Object.fromEntries(results.filter((item): item is readonly [string, string] => Boolean(item))));
    });
    return () => { active = false; };
  }, [photos]);

  async function setBookFlag(photoId: string, patch: { bookCandidate?: boolean; bookFavorite?: boolean }) {
    setMessage("");
    try {
      const response = await fetch(`/api/media/${photoId}/web-url`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Opslaan mislukt.");
      setItems((current) => current.map((photo) => photo.id === photoId ? {
        ...photo,
        book_candidate: data.asset.book_candidate,
        book_favorite: data.asset.book_favorite,
      } : photo));
    } catch {
      setMessage("De fotoboekkeuze kon niet worden opgeslagen.");
    }
  }

  if (!items.length) return <section className="planner-card photo-library-empty"><h2>Nog geen foto’s</h2><p>Foto’s die jullie bij een dagverslag uploaden, verschijnen hier privé bij deze reis.</p></section>;

  return <>
    {message ? <p className="form-message" role="status">{message}</p> : null}
    <div className="private-photo-grid">{items.map((photo) => <figure key={photo.id} className="private-photo">
      {urls[photo.id] ? <img src={urls[photo.id]} alt={photo.caption || photo.original_filename} /> : <div className="photo-processing">Foto wordt geladen…</div>}
      <figcaption>
        <b>Dag {photo.day_number}{photo.day_title ? ` · ${photo.day_title}` : ""}</b>
        <span>{photo.caption || photo.original_filename}</span>
        <label className="photo-caption-label"><input type="checkbox" checked={Boolean(photo.book_candidate)} onChange={(event) => void setBookFlag(photo.id, { bookCandidate: event.target.checked })} /> Fotoboek-kandidaat</label>
        <label className="photo-caption-label"><input type="checkbox" checked={Boolean(photo.book_favorite)} onChange={(event) => void setBookFlag(photo.id, { bookFavorite: event.target.checked })} /> Favoriet</label>
      </figcaption>
    </figure>)}</div>
  </>;
}
