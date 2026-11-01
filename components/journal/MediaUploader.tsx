"use client";

import { ChangeEvent, ReactNode, useId, useRef } from "react";
import {
  collectSelectedFiles,
  mediaUploadPercent,
  mediaUploadProgressLabel,
  type MediaUploadProgress,
} from "../../lib/media-upload";

type Props = {
  progress: MediaUploadProgress;
  disabled?: boolean;
  /** Show the empty “Kies foto’s” dropzone when there are no assets yet. */
  showEmptyDropzone?: boolean;
  onFilesSelected: (files: File[]) => void | Promise<void>;
  children?: ReactNode;
};

/**
 * Journal photo picker + batch progress.
 * Upload pipeline (init → Scaleway PUT → complete) stays in the parent / lib helpers.
 */
export function MediaUploader({
  progress,
  disabled = false,
  showEmptyDropzone = false,
  onFilesSelected,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const busy = progress.phase === "uploading" || disabled;
  const label = mediaUploadProgressLabel(progress);
  const percent = mediaUploadPercent(progress);
  const showProgress = progress.phase === "uploading" || progress.phase === "done";

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (busy) return;
    // Snapshot before any await/clear — live FileList can shrink to 1 file once value is reset.
    const files = collectSelectedFiles(input.files);
    if (!files.length) return;
    try {
      await onFilesSelected(files);
    } finally {
      input.value = "";
    }
  }

  return (
    <section className="entry-photos-card">
      <div className="entry-form-heading">
        <div>
          <p className="eyebrow blue">Foto’s</p>
          <h2>Beelden van deze dag</h2>
        </div>
        <label
          className={`secondary-button media-upload-picker${busy ? " is-busy" : ""}`}
          htmlFor={busy ? undefined : inputId}
          aria-disabled={busy || undefined}
        >
          {busy && progress.phase === "uploading" ? "Bezig met uploaden…" : "Foto’s kiezen"}
        </label>
      </div>
      <p className="entry-helper">
        HEIC, JPEG, PNG of WebP · maximaal 50 MB per foto. Het origineel blijft privé in Scaleway; alleen een
        geoptimaliseerde WebP-versie komt in de app. Meerdere foto’s worden parallel geüpload (max. 4 tegelijk).
      </p>
      <input
        id={inputId}
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*,image/heic,image/heif,.heic,.heif"
        multiple
        disabled={busy}
        onChange={(event) => void onChange(event)}
      />
      {showProgress ? (
        <div
          className={`media-upload-progress${progress.phase === "done" ? " is-done" : ""}${progress.failed ? " has-failures" : ""}`}
          role="status"
          aria-live="polite"
        >
          <div className="media-upload-progress-row">
            <strong>{label}</strong>
            <span>
              {progress.settled}/{progress.total}
            </span>
          </div>
          <div
            className="media-upload-progress-track"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            role="progressbar"
          >
            <div className="media-upload-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          {progress.phase === "done" ? (
            <p className="media-upload-progress-done">
              {progress.failed
                ? "Batch afgerond. Mislukte foto’s kun je opnieuw kiezen of opnieuw verwerken."
                : "Batch afgerond — alle gekozen foto’s zijn verwerkt."}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
      {showEmptyDropzone ? (
        <label
          className={`photo-dropzone media-upload-picker${busy ? " is-busy" : ""}`}
          htmlFor={busy ? undefined : inputId}
          aria-disabled={busy || undefined}
        >
          <b>+</b>
          <span>Kies foto’s van vandaag</span>
          <small>HEIC is welkom · meerdere tegelijk</small>
        </label>
      ) : null}
    </section>
  );
}
