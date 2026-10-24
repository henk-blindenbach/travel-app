"use client";

import { useState } from "react";

type PreviewResponse = {
  ok?: boolean;
  zipFilename?: string;
  dayCount?: number;
  photoCount?: number;
  warnings?: { code: string; message: string }[];
  errors?: { code: string; message: string }[];
  error?: string;
};

export function PhotobookSourceExport({ tripId }: { tripId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runExport() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const previewResponse = await fetch(`/api/trips/${tripId}/photobook-export?preview=1`);
      const preview = (await previewResponse.json()) as PreviewResponse;
      if (!previewResponse.ok || preview.ok === false) {
        const detail = preview.errors?.map((item) => item.message).join(" ")
          || preview.error
          || "Export niet mogelijk.";
        setError(detail);
        return;
      }

      const softNotes = (preview.warnings || []).map((item) => item.message);
      const summary = [
        `Exporteren: ${preview.dayCount || 0} dagen, ${preview.photoCount || 0} foto’s → ${preview.zipFilename || "fotoboek.zip"}`,
        ...softNotes,
      ].filter(Boolean);
      setMessage(summary.join(" · "));

      // Same-origin navigation streams the ZIP to disk (no full buffer in JS).
      window.location.assign(`/api/trips/${tripId}/photobook-export`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export mislukt.");
    } finally {
      // Keep busy briefly so a double-click cannot start two downloads.
      window.setTimeout(() => setBusy(false), 1500);
    }
  }

  return (
    <section className="planner-card photobook-source-export">
      <div className="planner-card-heading">
        <div>
          <p className="eyebrow blue">Photobook Source Package</p>
          <h2>Fotoboek exporteren</h2>
        </div>
        <button
          className="primary-button blue-button"
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={() => void runExport()}
        >
          {busy ? "Bezig met exporteren…" : "Fotoboek exporteren"}
        </button>
      </div>
      <p className="journal-intro">
        Download één ZIP met geselecteerde originals, dagverhalen, <code>book.md</code> en{" "}
        <code>manifest.json</code> — klaar om in Pixum (of later een andere renderer) te importeren.
        Gebruikt fotoboek-kandidaten; geen paginalayouts.
      </p>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      {error ? <p className="form-message" role="alert">{error}</p> : null}
    </section>
  );
}
