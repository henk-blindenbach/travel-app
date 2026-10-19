"use client";

import { useState } from "react";

type Visibility = "private" | "unlisted" | "public";

const OPTIONS: { value: Visibility; title: string; description: string }[] = [
  {
    value: "private",
    title: "Privé",
    description: "Alleen zichtbaar na inloggen. Geen publieke link.",
  },
  {
    value: "unlisted",
    title: "Niet-vermeld",
    description: "Bereikbaar via de directe link, maar niet op de homepage of in de reizenlijst.",
  },
  {
    value: "public",
    title: "Openbaar",
    description: "Zichtbaar op de publieke site, inclusief overzichten.",
  },
];

function normalizeVisibility(value: string): Visibility {
  if (value === "public" || value === "unlisted") return value;
  return "private";
}

function statusCopy(visibility: Visibility) {
  if (visibility === "public") return "Deze reis is openbaar";
  if (visibility === "unlisted") return "Deze reis is niet-vermeld";
  return "Deze reis is privé";
}

function savedCopy(visibility: Visibility) {
  if (visibility === "public") return "De reis is openbaar. Gepubliceerde dagverhalen verschijnen in overzichten.";
  if (visibility === "unlisted") return "De reis is niet-vermeld. Deel de link; hij verschijnt niet in publieke lijsten.";
  return "De reis is weer privé.";
}

export function TripVisibilityControl({
  tripId,
  slug,
  initialVisibility,
}: {
  tripId: string;
  slug: string;
  initialVisibility: string;
}) {
  const [visibility, setVisibility] = useState<Visibility>(normalizeVisibility(initialVisibility));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(next: Visibility) {
    if (next === visibility) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/trips/" + tripId + "/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVisibility(normalizeVisibility(data.trip.visibility));
      setMessage(savedCopy(normalizeVisibility(data.trip.visibility)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  const shareable = visibility === "public" || visibility === "unlisted";

  return (
    <section className="planner-card">
      <p className="eyebrow blue">Zichtbaarheid</p>
      <h2>{statusCopy(visibility)}</h2>
      <p>
        Alleen gepubliceerde dagverhalen en geselecteerde webfoto’s worden gedeeld. Planning, documenten en
        privégegevens blijven altijd afgesloten.
      </p>
      <div className="visibility-options" role="radiogroup" aria-label="Zichtbaarheid van de reis">
        {OPTIONS.map((option) => {
          const active = visibility === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? "visibility-option active" : "visibility-option"}
              disabled={saving}
              onClick={() => void save(option.value)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          );
        })}
      </div>
      {shareable ? (
        <a className="secondary-button" href={"/reizen/" + slug} target="_blank" rel="noreferrer">
          {visibility === "unlisted" ? "Open directe link ↗" : "Bekijk publieke reis ↗"}
        </a>
      ) : null}
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
