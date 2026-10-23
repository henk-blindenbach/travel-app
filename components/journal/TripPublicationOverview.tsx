"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { oneDayEntry, statusMeta } from "../../lib/journal-status";
import {
  SOCIAL_PLATFORMS,
  hasAnyCaption,
  normalizeSocialCaptions,
  readyPublicPhotos,
  type SocialCaptions,
} from "../../lib/social-captions";

type MediaAsset = {
  id: string;
  is_public: boolean;
  upload_status: string;
  original_filename?: string | null;
  sort_order?: number;
};

type Entry = {
  id: string;
  title: string;
  publication_status: "draft" | "ready" | "published";
  social_captions: SocialCaptions | { instagram?: string } | null;
  media_assets: MediaAsset[];
};

type Day = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  day_entries: Entry | Entry[] | null;
};

function PostPhotoThumbs({ assets }: { assets: MediaAsset[] }) {
  const selected = readyPublicPhotos(assets).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next: Record<string, string> = {};
      await Promise.all(
        selected.slice(0, 8).map(async (asset) => {
          try {
            const response = await fetch(`/api/media/${asset.id}/web-url`);
            if (!response.ok) return;
            const data = await response.json();
            if (typeof data.signedUrl === "string") next[asset.id] = data.signedUrl;
          } catch {
            /* Thumbnail is optional. */
          }
        }),
      );
      if (!cancelled) setUrls(next);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [selected.map((asset) => asset.id).join(",")]);

  if (!selected.length) {
    return <p className="posts-photo-empty">Nog geen foto’s geselecteerd voor social.</p>;
  }

  return (
    <div className="posts-photo-strip" aria-label="Geselecteerde foto’s">
      {selected.slice(0, 8).map((asset) => (
        <figure key={asset.id} className="posts-photo-thumb">
          {urls[asset.id] ? (
            <img src={urls[asset.id]} alt={asset.original_filename || "Geselecteerde foto"} />
          ) : (
            <div className="posts-photo-placeholder" />
          )}
        </figure>
      ))}
      {selected.length > 8 ? <span className="posts-photo-more">+{selected.length - 8}</span> : null}
    </div>
  );
}

export function TripPublicationOverview({ tripSlug, days }: { tripSlug: string; days: Day[] }) {
  const [message, setMessage] = useState("");

  async function copy(value: string, platform: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${platform}-caption gekopieerd.`);
    } catch {
      setMessage("Kopiëren lukte niet; selecteer de tekst handmatig.");
    }
  }

  const finished = days.filter((day) => oneDayEntry(day.day_entries)?.publication_status === "published").length;
  const withCaptions = days.filter((day) =>
    hasAnyCaption(normalizeSocialCaptions(oneDayEntry(day.day_entries)?.social_captions)),
  ).length;

  return (
    <section className="planner-card trip-publication-overview">
      <p className="eyebrow blue">Posts</p>
      <h2>
        {withCaptions} dag{withCaptions === 1 ? "" : "en"} met captions · {finished} gepubliceerd
      </h2>
      <p>
        Alle gegenereerde captions per reisdag en platform (Instagram feed, carousel, story, Facebook en Polarsteps),
        met de geselecteerde foto’s. Kopieer een caption en deel foto’s vanuit de dageditor — de app plaatst nooit
        automatisch namens jullie.
      </p>
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
      <div className="publication-day-list">
        {days.map((day) => {
          const entry = oneDayEntry(day.day_entries);
          const status = statusMeta(entry);
          const captions = normalizeSocialCaptions(entry?.social_captions);
          const publicPhotos = entry ? readyPublicPhotos(entry.media_assets || []) : [];
          return (
            <article key={day.id} className="posts-day-card">
              <div>
                <span>
                  Dag {day.day_number} ·{" "}
                  {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(
                    new Date(`${day.day_date}T12:00:00`),
                  )}
                </span>
                <h3>{entry?.title || day.title || "Nog geen dagverhaal"}</h3>
                <small>
                  <span className={`journal-status journal-status-${status.key}`}>{status.label}</span>
                  {entry?.publication_status === "published"
                    ? " — publiek verhaal"
                    : entry
                      ? " — nog niet publiek"
                      : ""}{" "}
                  · {publicPhotos.length} geselecteerde foto{publicPhotos.length === 1 ? "" : "’s"}
                </small>
              </div>
              <Link className="secondary-button" href={`/app/journal/${day.id}`}>
                {entry ? "Open dag" : "Maak verslag"}
              </Link>
              {entry ? <PostPhotoThumbs assets={entry.media_assets || []} /> : null}
              {hasAnyCaption(captions) ? (
                <div className="publication-platforms posts-caption-grid">
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const caption = captions[platform.key];
                    return caption ? (
                      <div className="posts-caption-row" key={platform.key}>
                        <div>
                          <b>{platform.label}</b>
                          <p>{caption}</p>
                        </div>
                        <span>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => void copy(caption, platform.label)}
                          >
                            Kopieer caption
                          </button>
                          <a className="text-button" href={platform.url} target="_blank" rel="noreferrer">
                            Open ↗
                          </a>
                        </span>
                      </div>
                    ) : (
                      <small key={platform.key} className="posts-caption-missing">
                        {platform.label}: nog geen caption
                      </small>
                    );
                  })}
                </div>
              ) : entry ? (
                <p className="posts-caption-empty">Nog geen captions — open de dag en kies «Maak captions».</p>
              ) : null}
            </article>
          );
        })}
      </div>
      <Link className="secondary-button" href={`/reizen/${tripSlug}`} target="_blank">
        Bekijk publieke reis ↗
      </Link>
    </section>
  );
}
