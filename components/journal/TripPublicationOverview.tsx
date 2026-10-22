"use client";

import Link from "next/link";
import { useState } from "react";
import { oneDayEntry, statusMeta } from "../../lib/journal-status";

type Entry = {
  id: string;
  title: string;
  publication_status: "draft" | "ready" | "published";
  social_captions: { instagram?: string; facebook?: string; polarsteps?: string } | null;
  media_assets: { id: string; is_public: boolean; upload_status: string }[];
};

type Day = {
  id: string;
  day_number: number;
  day_date: string;
  title: string | null;
  day_entries: Entry | Entry[] | null;
};

const platforms = [
  ["instagram", "Instagram", "https://www.instagram.com/"],
  ["facebook", "Facebook", "https://www.facebook.com/"],
  ["polarsteps", "Polarsteps", "https://www.polarsteps.com/"],
] as const;

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
  return (
    <section className="planner-card trip-publication-overview">
      <p className="eyebrow blue">Publicatie-overzicht</p>
      <h2>
        {finished} van {days.length} dagverhalen gepubliceerd
      </h2>
      <p>
        Open een dag, controleer verhaal en foto’s, publiceer de dag en kies daarna het platform. De app plaatst nooit
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
          const publicPhotos = entry?.media_assets.filter((asset) => asset.is_public && asset.upload_status === "ready").length || 0;
          return (
            <article key={day.id}>
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
                  · {publicPhotos} geselecteerde foto{publicPhotos === 1 ? "" : "’s"}
                </small>
              </div>
              <Link className="secondary-button" href={`/app/journal/${day.id}`}>
                {entry ? "Open dag" : "Maak verslag"}
              </Link>
              {entry?.publication_status === "published" && entry.social_captions ? (
                <div className="publication-platforms">
                  {platforms.map(([key, label, url]) => {
                    const caption = entry.social_captions?.[key];
                    return caption ? (
                      <span key={key}>
                        <button className="text-button" type="button" onClick={() => void copy(caption, label)}>
                          Kopieer {label}
                        </button>
                        <a className="text-button" href={url} target="_blank" rel="noreferrer">
                          Open ↗
                        </a>
                      </span>
                    ) : (
                      <small key={key}>{label}: maak eerst captions</small>
                    );
                  })}
                </div>
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
