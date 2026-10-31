"use client";

import { ChangeEvent, ReactNode, useRef } from "react";
import {
  mediaUploadPercent,
  mediaUploadProgressLabel,
  type MediaUploadProgress,
} from "../../lib/media-upload";

type Props = {
  progress: MediaUploadProgress;
  disabled?: boolean;
  /** Show the empty “Kies foto’s” dropzone when there are no assets yet. */
  showEmptyDropzone?: boolean;
  onFilesSelected: (files: File[]) => void;
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
  const busy = progress.phase === "uploading" || disabled;
  const label = mediaUploadProgressLabel(progress);
  const percent = mediaUploadPercent(progress);
  const showProgress = progress.phase === "uploading" || progress.phase === "done";

  function openPicker() {
    if (busy) return;
    inputRef.current?.click();
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || busy) return;
    onFilesSelected(files);
  }

  return (
    <section className="entry-photos-card">
      <div className="entry-form-heading">
        <div>
          <p className="eyebrow blue">Foto’s</p>
          <h2>Beelden van deze dag</h2>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={busy}
          onClick={openPicker}
        >
          {busy && progress.phase === "uploading" ? "Bezig met uploaden…" : "Foto’s kiezen"}
        </button>
      </div>
      <p className="entry-helper">
        HEIC, JPEG, PNG of WebP · maximaal 50 MB per foto. Het origineel blijft privé in Scaleway; alleen een
        geoptimaliseerde WebP-versie komt in de app. Meerdere foto’s worden parallel geüpload.
      </p>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif"
        multiple
        disabled={busy}
        onChange={onChange}
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
        <button className="photo-dropzone" type="button" disabled={busy} onClick={openPicker}>
          <b>+</b>
          <span>Kies foto’s van vandaag</span>
          <small>HEIC is welkom</small>
        </button>
      ) : null}
    </section>
  );
}
