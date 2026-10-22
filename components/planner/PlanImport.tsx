"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";
import type { PlanImportPreviewAction, PlanImportRow, PlanImportRowError } from "../../lib/plan-import";

type PreviewState = {
  summary: { dayUpdates: number; itemUpdates: number; itemInserts: number; errorCount: number };
  errors: PlanImportRowError[];
  actions: PlanImportPreviewAction[];
};

type Props = { tripId: string; onImported?: () => void };

export function PlanImport({ tripId, onImported }: Props) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [rows, setRows] = useState<PlanImportRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setMessage("CSV mag maximaal ongeveer 1,5 MB zijn.");
      return;
    }
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    setPreview(null);
    setRows([]);
    setMessage(`Bestand geladen: ${file.name}. Klik op Voorbeeld om te controleren.`);
    event.target.value = "";
  }

  async function runPreview() {
    if (!csv.trim()) {
      setMessage("Kies eerst een CSV-bestand of plak CSV-tekst.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/trips/${tripId}/plan-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", csv }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Voorbeeld mislukt.");
      setPreview(data.preview as PreviewState);
      setRows((data.rows || []) as PlanImportRow[]);
      const { summary } = data.preview as PreviewState;
      if (summary.errorCount) {
        setMessage(`Voorbeeld klaar met ${summary.errorCount} fout(en). Los die op vóór bevestigen.`);
      } else {
        setMessage(
          `Voorbeeld klaar: ${summary.dayUpdates} dagen bijwerken, ${summary.itemUpdates} onderdelen bijwerken, ${summary.itemInserts} onderdelen toevoegen.`,
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Voorbeeld mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!preview || preview.summary.errorCount || !rows.length) {
      setMessage("Maak eerst een foutloos voorbeeld.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/trips/${tripId}/plan-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", rows }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Import mislukt.");
      setMessage(
        `Import gelukt: ${data.applied.dayUpdates} dagen, ${data.applied.itemUpdates} updates, ${data.applied.itemInserts} nieuwe onderdelen.`,
      );
      setPreview(null);
      setRows([]);
      setCsv("");
      setFileName("");
      onImported?.();
      // Reload so planner state matches the database.
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const canConfirm = Boolean(preview && !preview.summary.errorCount && rows.length && !busy);

  return (
    <section className="plan-import" aria-labelledby="plan-import-title">
      <div className="plan-import-heading">
        <div>
          <p className="eyebrow blue">CSV-import</p>
          <h2 id="plan-import-title">Plan vanuit spreadsheet.</h2>
          <p>
            Upload een CSV met dagen en/of planningonderdelen. Rijen matchen op{" "}
            <code>day_number</code>; onderdelen op dag + type + titel. Bestaande data die niet in het
            bestand staat blijft staan. Excel (.xlsx) volgt later — exporteer nu als CSV. Eén onderdeel
            naar een andere dag zetten kan ook vanuit de plannereditor (Kopieer naar andere dag).
          </p>
        </div>
        <Link className="secondary-button" href="/templates/plan-import-template.csv" download>
          Voorbeeld-CSV
        </Link>
      </div>

      <div className="plan-import-controls">
        <label className="plan-import-file">
          CSV kiezen
          <input accept=".csv,text/csv,text/plain" type="file" disabled={busy} onChange={(event) => void readFile(event)} />
        </label>
        {fileName ? <small>Gekozen: {fileName}</small> : <small>Of plak hieronder CSV-tekst.</small>}
        <textarea
          aria-label="CSV-tekst"
          disabled={busy}
          rows={8}
          value={csv}
          onChange={(event) => {
            setCsv(event.target.value);
            setPreview(null);
            setRows([]);
          }}
          placeholder="row_type,day_number,title,..."
        />
        <div className="plan-import-actions">
          <button className="secondary-button" type="button" disabled={busy || !csv.trim()} onClick={() => void runPreview()}>
            {busy ? "Bezig…" : "Voorbeeld"}
          </button>
          <button className="primary-button blue-button" type="button" disabled={!canConfirm} onClick={() => void confirmImport()}>
            Import bevestigen
          </button>
        </div>
      </div>

      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}

      {preview ? (
        <div className="plan-import-preview">
          <div className="trip-metrics">
            <span>{preview.summary.dayUpdates} dagen</span>
            <span>{preview.summary.itemUpdates} updates</span>
            <span>{preview.summary.itemInserts} nieuw</span>
            {preview.summary.errorCount ? <span className="attention">{preview.summary.errorCount} fouten</span> : null}
          </div>

          {preview.errors.length ? (
            <ul className="plan-import-errors">
              {preview.errors.slice(0, 40).map((error) => (
                <li key={`${error.line}-${error.message}`}>
                  Regel {error.line}: {error.message}
                </li>
              ))}
              {preview.errors.length > 40 ? <li>…en {preview.errors.length - 40} meer</li> : null}
            </ul>
          ) : null}

          {preview.actions.length ? (
            <ul className="plan-import-actions-list">
              {preview.actions.slice(0, 30).map((action, index) => (
                <li key={`${action.kind}-${index}`}>
                  {action.kind === "day_update" && (
                    <>Dag {action.dayNumber} bijwerken ({action.fields.join(", ") || "velden"})</>
                  )}
                  {action.kind === "item_update" && (
                    <>
                      Update dag {action.dayNumber}: {action.itemKind} “{action.title}”
                    </>
                  )}
                  {action.kind === "item_insert" && (
                    <>
                      Nieuw op dag {action.dayNumber}: {action.itemKind} “{action.title}”
                    </>
                  )}
                </li>
              ))}
              {preview.actions.length > 30 ? <li>…en {preview.actions.length - 30} meer acties</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="plan-import-help">
        Kolommen, aliases en idempotentie: zie <code>docs/PLAN_CSV_IMPORT.md</code> in de repo, of
        download de voorbeeld-CSV hierboven.
      </p>
    </section>
  );
}
