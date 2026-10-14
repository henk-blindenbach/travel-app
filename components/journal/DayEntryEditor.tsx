"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Entry = {
  id: string;
  title: string;
  actual_location: string;
  body: string;
} | null;

type Asset = {
  id: string;
  original_filename: string;
  caption: string;
  sort_order: number;
  upload_status: "uploading" | "processing" | "ready" | "failed";
};

type DisplayAsset = Asset & { webUrl?: string; localUrl?: string };

type Props = {
  tripDayId: string;
  dayTitle: string;
  plannedLocation: string | null;
  initialEntry: Entry;
  initialAssets: Asset[];
};

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

export function DayEntryEditor({ tripDayId, dayTitle, plannedLocation, initialEntry, initialAssets }: Props) {
  const [entry, setEntry] = useState<Entry>(initialEntry);
  const [title, setTitle] = useState(initialEntry?.title || dayTitle || "");
  const [actualLocation, setActualLocation] = useState(initialEntry?.actual_location || plannedLocation || "");
  const [body, setBody] = useState(initialEntry?.body || "");
  const [assets, setAssets] = useState<DisplayAsset[]>(initialAssets);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialAssets.filter((asset) => asset.upload_status === "ready").forEach((asset) => void loadWebUrl(asset.id));
  // Existing photos only need a signed display URL once per page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadWebUrl(assetId: string) {
    try {
      const data = await responseJson(await fetch(`/api/media/${assetId}/web-url`));
      setAssets((current) => current.map((asset) => asset.id === assetId ? { ...asset, webUrl: data.signedUrl } : asset));
    } catch {
      setMessage("Een opgeslagen foto kon niet worden geopend.");
    }
  }

  async function saveEntry() {
    setSaving(true);
    setMessage("");
    try {
      const data = await responseJson(await fetch("/api/day-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripDayId, title, actualLocation, body }),
      }));
      setEntry(data.entry);
      setMessage("Concept opgeslagen.");
      return data.entry as NonNullable<Entry>;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file: File, savedEntry: NonNullable<Entry>) {
    const contentType = fileType(file);
    if (!contentType || file.size > 50 * 1024 * 1024) {
      setMessage(`${file.name} is geen ondersteunde foto of is groter dan 50 MB.`);
      return;
    }

    try {
      const init = await responseJson(await fetch("/api/media/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayEntryId: savedEntry.id, filename: file.name, contentType, byteSize: file.size }),
      }));
      const pending: DisplayAsset = { ...init.asset, original_filename: file.name, caption: "", sort_order: assets.length, localUrl: URL.createObjectURL(file) };
      setAssets((current) => [...current, pending]);
      await responseJson(await fetch(init.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file }));
      const complete = await responseJson(await fetch("/api/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: init.asset.id }),
      }));
      setAssets((current) => current.map((asset) => asset.id === init.asset.id ? { ...asset, ...complete.asset, localUrl: undefined } : asset));
      await loadWebUrl(init.asset.id);
      setMessage("Foto veilig opgeslagen en omgezet naar een webversie.");
    } catch (error) {
      setAssets((current) => current.map((asset) => asset.id === (error as { assetId?: string }).assetId ? { ...asset, upload_status: "failed" } : asset));
      setMessage(error instanceof Error ? error.message : "De foto kon niet worden geüpload.");
    }
  }

  async function saveCaption(assetId: string, caption: string) {
    setMessage("");
    try {
      const data = await responseJson(await fetch(`/api/media/${assetId}/web-url`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      }));
      setAssets((current) => current.map((asset) => asset.id === assetId ? { ...asset, caption: data.asset.caption } : asset));
      setMessage("Bijschrift opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Het bijschrift kon niet worden opgeslagen.");
    }
  }

  async function movePhoto(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= assets.length) return;
    const current = assets;
    const reordered = [...current];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    const updated = reordered.map((asset, sortOrder) => ({ ...asset, sort_order: sortOrder }));
    setAssets(updated);
    setMessage("");
    try {
      await Promise.all([
        responseJson(await fetch(`/api/media/${current[index].id}/web-url`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: destination }) })),
        responseJson(await fetch(`/api/media/${current[destination].id}/web-url`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: index }) })),
      ]);
      setMessage("Fotovolgorde opgeslagen.");
    } catch (error) {
      setAssets(current);
      setMessage(error instanceof Error ? error.message : "De fotovolgorde kon niet worden opgeslagen.");
    }
  }

  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const savedEntry = entry || await saveEntry();
    if (savedEntry) {
      for (const file of files) await uploadFile(file, savedEntry);
    }
    event.target.value = "";
  }

  return <div className="journal-editor">
    <section className="entry-form-card">
      <div className="entry-form-heading"><div><p className="eyebrow blue">Dagverslag</p><h2>Wat maakte deze dag bijzonder?</h2></div><div><Link className="secondary-button" href="/app/today/interview">🎙 Vertel het</Link><button className="secondary-button" type="button" onClick={() => void saveEntry()} disabled={saving}>{saving ? "Opslaan…" : "Concept opslaan"}</button></div></div>
      <label>Eigen titel<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Bijvoorbeeld: Stilte boven de wolken" /></label>
      <label>Waar waren jullie?<input value={actualLocation} maxLength={160} onChange={(event) => setActualLocation(event.target.value)} placeholder={plannedLocation || "Plaats of gebied"} /></label>
      <label>Het verslag<textarea value={body} maxLength={20_000} onChange={(event) => setBody(event.target.value)} placeholder="Schrijf hier vrijuit wat er gebeurde, wat je zag en hoe het voelde…" rows={11} /></label>
      <p className="entry-helper">Je kunt tussendoor altijd als concept opslaan. Alleen reisgenoten kunnen dit verslag zien.</p>
      {message && <p className="form-message" role="status">{message}</p>}
    </section>

    <section className="entry-photos-card">
      <div className="entry-form-heading"><div><p className="eyebrow blue">Foto’s</p><h2>Beelden van deze dag</h2></div><button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Foto’s kiezen</button></div>
      <p className="entry-helper">HEIC, JPEG, PNG of WebP · maximaal 50 MB per foto. Het origineel blijft privé in Scaleway; alleen een geoptimaliseerde WebP-versie komt in de app.</p>
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif" multiple onChange={(event) => void choosePhotos(event)} />
      {assets.length ? <div className="journal-photo-grid">{assets.map((asset, index) => <figure key={asset.id} className="journal-photo">
        {asset.webUrl || asset.localUrl ? <img src={asset.webUrl || asset.localUrl} alt={asset.caption || asset.original_filename} /> : <div className="photo-processing">{asset.upload_status === "failed" ? "Mislukt" : "Wordt verwerkt…"}</div>}
        <figcaption>{asset.original_filename}<small>{asset.upload_status === "ready" ? "Private webversie" : asset.upload_status}</small>
          <div className="photo-order-actions"><button type="button" className="text-button" disabled={index === 0} onClick={() => void movePhoto(index, -1)}>↑ Eerder</button><button type="button" className="text-button" disabled={index === assets.length - 1} onClick={() => void movePhoto(index, 1)}>Later ↓</button></div>
          <label className="photo-caption-label">Bijschrift<input defaultValue={asset.caption} maxLength={500} placeholder="Wat zie je op deze foto?" onBlur={(event) => {
            if (event.target.value.trim() !== asset.caption) void saveCaption(asset.id, event.target.value);
          }} /></label>
        </figcaption>
      </figure>)}</div> : <button className="photo-dropzone" type="button" onClick={() => inputRef.current?.click()}><b>+</b><span>Kies foto’s van vandaag</span><small>HEIC is welkom</small></button>}
    </section>
  </div>;
}
