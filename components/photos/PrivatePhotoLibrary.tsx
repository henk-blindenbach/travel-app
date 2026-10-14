"use client";

import { useEffect, useState } from "react";

export type PrivatePhoto = {
  id: string;
  original_filename: string;
  caption: string;
  day_number: number;
  day_title: string | null;
};

export function PrivatePhotoLibrary({ photos }: { photos: PrivatePhoto[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

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

  if (!photos.length) return <section className="planner-card photo-library-empty"><h2>Nog geen foto’s</h2><p>Foto’s die jullie bij een dagverslag uploaden, verschijnen hier privé bij deze reis.</p></section>;

  return <div className="private-photo-grid">{photos.map((photo) => <figure key={photo.id} className="private-photo">
    {urls[photo.id] ? <img src={urls[photo.id]} alt={photo.caption || photo.original_filename} /> : <div className="photo-processing">Foto wordt geladen…</div>}
    <figcaption><b>Dag {photo.day_number}{photo.day_title ? ` · ${photo.day_title}` : ""}</b><span>{photo.caption || photo.original_filename}</span></figcaption>
  </figure>)}</div>;
}
