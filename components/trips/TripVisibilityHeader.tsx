"use client";

import { useState } from "react";

type Visibility = "private" | "unlisted" | "public";

const OPTIONS: { value: Visibility; label: string }[] = [
  { value: "private", label: "Privé" },
  { value: "unlisted", label: "Niet-vermeld" },
  { value: "public", label: "Openbaar" },
];

function normalizeVisibility(value: string): Visibility {
  if (value === "public" || value === "unlisted") return value;
  return "private";
}

function shortCopy(visibility: Visibility) {
  if (visibility === "public") return "Openbaar";
  if (visibility === "unlisted") return "Niet-vermeld";
  return "Privé";
}

/** Compact visibility control for trip page headers. Does not change defaults on mount. */
export function TripVisibilityHeader({
  tripId,
  initialVisibility,
}: {
  tripId: string;
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
      setMessage(`Zichtbaarheid: ${shortCopy(normalizeVisibility(data.trip.visibility))}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="trip-visibility-header">
      <span className="trip-visibility-label">Zichtbaarheid</span>
      <div className="trip-visibility-toggle" role="radiogroup" aria-label="Zichtbaarheid van de reis">
        {OPTIONS.map((option) => {
          const active = visibility === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? "trip-visibility-option active" : "trip-visibility-option"}
              disabled={saving}
              onClick={() => void save(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {message ? (
        <p className="form-message trip-visibility-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
