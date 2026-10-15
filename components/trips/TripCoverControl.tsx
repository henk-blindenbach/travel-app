"use client";

import { ChangeEvent, useRef, useState } from "react";
import styles from "./TripCoverControl.module.css";

type Cover = { id: string; upload_status: string; updated_at: string } | null;

const acceptedTypes = new Set(["image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"]);

function fileType(file: File) {
  if (acceptedTypes.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "heic" ? "image/heic" : extension === "heif" ? "image/heif" : "";
}

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Er ging iets mis.");
  return data;
}

export function TripCoverControl({ tripId, initialCover }: { tripId: string; initialCover: Cover }) {
  const [cover, setCover] = useState<Cover>(initialCover);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageUrl = previewUrl || (cover?.upload_status === "ready" ? `/api/trips/${tripId}/cover?v=${encodeURIComponent(cover.updated_at)}` : null);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const contentType = fileType(file);
    if (!contentType || file.size > 50 * 1024 * 1024) { setMessage("Kies een HEIC, JPEG, PNG of WebP-bestand tot 50 MB."); return; }
    setUploading(true); setMessage("");
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    try {
      const init = await responseJson(await fetch(`/api/trips/${tripId}/cover/init`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType, byteSize: file.size }) }));
      await responseJson(await fetch(init.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file }));
      const completed = await responseJson(await fetch(`/api/trips/${tripId}/cover/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coverId: init.cover.id }) }));
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      setCover(completed.cover);
      setMessage("Omslagfoto veilig opgeslagen en omgezet naar een webversie.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "De omslagfoto kon niet worden geüpload.");
    } finally { setUploading(false); }
  }

  async function removeCover() {
    if (!confirm("Omslagfoto verwijderen? De publieke hero valt dan terug op de abstracte achtergrond.")) return;
    setUploading(true); setMessage("");
    try {
      await responseJson(await fetch(`/api/trips/${tripId}/cover`, { method: "DELETE" }));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null); setCover(null); setMessage("Omslagfoto verwijderd.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "De omslagfoto kon niet worden verwijderd."); } finally { setUploading(false); }
  }

  return <section className="planner-card"><p className="eyebrow blue">Omslagfoto</p><h2>De foto bovenaan jullie publieke reis</h2><p>Kies één foto voor deze reis. Het origineel blijft privé; alleen een geoptimaliseerde WebP-versie kan op de openbare site verschijnen wanneer de reis openbaar is.</p>{imageUrl ? <img className={styles.preview} src={imageUrl} alt="Voorvertoning van de omslagfoto"/> : <div className={styles.empty}>Nog geen omslagfoto gekozen.</div>}<input ref={inputRef} className={styles.hidden} type="file" accept="image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif" onChange={onFileChange}/><div className="publication-actions"><button className="primary-button blue-button" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? "Foto verwerken…" : cover ? "Vervang omslagfoto" : "Kies omslagfoto"}</button>{cover ? <button className="secondary-button" type="button" disabled={uploading} onClick={() => void removeCover()}>Verwijder foto</button> : null}</div>{message ? <p className="form-message" role="status">{message}</p> : null}</section>;
}
