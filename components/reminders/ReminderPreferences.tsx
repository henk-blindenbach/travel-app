"use client";

import { useEffect, useState } from "react";

export function ReminderPreferences() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/reminder-preferences");
        const data = await response.json();
        if (!cancelled && response.ok) setEmailEnabled(Boolean(data.emailEnabled));
      } catch {
        if (!cancelled) setMessage("Voorkeuren konden niet worden geladen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next: boolean) {
    setSaving(true);
    setMessage("");
    setEmailEnabled(next);
    try {
      const response = await fetch("/api/reminder-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Opslaan mislukt.");
      setMessage(next ? "Dagelijkse e-mailherinnering staat aan." : "Dagelijkse e-mailherinnering staat uit.");
    } catch (error) {
      setEmailEnabled(!next);
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="planner-card reminder-preferences">
      <p className="eyebrow blue">Herinneringen</p>
      <h2>Dagelijkse e-mail</h2>
      <p>
        ’s avonds (Europe/Amsterdam) een mail om de reisdag af te ronden. Niets wordt automatisch gepubliceerd —
        de link opent Vandaag of het dagverslag in de app.
      </p>
      {loading ? (
        <p className="form-message">Laden…</p>
      ) : (
        <label className="reminder-toggle">
          <input
            type="checkbox"
            checked={emailEnabled}
            disabled={saving}
            onChange={(event) => void save(event.target.checked)}
          />
          <span>Stuur mij een dagelijkse e-mailherinnering tijdens een actieve reis</span>
        </label>
      )}
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
