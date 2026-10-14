"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Entry = {
  id: string;
  title: string;
  actual_location: string;
  body: string;
  social_captions?: { instagram?: string; facebook?: string; polarsteps?: string };
  publication_status?: "draft" | "published";
} | null;

type Asset = {
  id: string;
  original_filename: string;
  caption: string;
  sort_order: number;
  is_public?: boolean;
  upload_status: "uploading" | "processing" | "ready" | "failed";
};

type DisplayAsset = Asset & { webUrl?: string; localUrl?: string };

type Props = {
  tripDayId: string;
  tripSlug: string;
  dayNumber: number;
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

export function DayEntryEditor({ tripDayId, tripSlug, dayNumber, dayTitle, plannedLocation, initialEntry, initialAssets }: Props) {
  const [entry, setEntry] = useState<Entry>(initialEntry);
  const [title, setTitle] = useState(initialEntry?.title || dayTitle || "");
  const [actualLocation, setActualLocation] = useState(initialEntry?.actual_location || plannedLocation || "");
  const [body, setBody] = useState(initialEntry?.body || "");
  const [assets, setAssets] = useState<DisplayAsset[]>(initialAssets);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [captions, setCaptions] = useState(initialEntry?.social_captions || {});
  const [publishing, setPublishing] = useState(false);
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

  async function setPublic(assetId: string, isPublic: boolean) {
    try {
      const data = await responseJson(await fetch(`/api/media/${assetId}/web-url`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic }) }));
      setAssets((current) => current.map((asset) => asset.id === assetId ? { ...asset, is_public: data.asset.is_public } : asset));
    } catch { setMessage("De publicatiefotokeuze kon niet worden opgeslagen."); }
  }

  async function savePhotosToLibrary() {
    const selected = assets.filter((asset) => asset.is_public && asset.upload_status === "ready");
    if (!selected.length) { setMessage("Kies eerst minstens één foto voor publicatie."); return; }
    try {
      const files = await Promise.all(selected.map(async (asset) => {
        const response = await fetch(`/api/media/${asset.id}/original`);
        if (!response.ok) throw new Error();
        return new File([await response.blob()], asset.original_filename, { type: response.headers.get("Content-Type") || "image/jpeg" });
      }));
      if (navigator.canShare?.({ files }) && navigator.share) await navigator.share({ files, title: dayTitle });
      else { files.forEach((file) => { const link = document.createElement("a"); link.href = URL.createObjectURL(file); link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1_000); }); }
    } catch { setMessage("De geselecteerde foto’s konden niet worden klaargezet."); }
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

  async function makeCaptions() {
    if (!entry) { setMessage("Sla eerst het verslag op."); return; }
    setSaving(true); setMessage("");
    try { const data = await responseJson(await fetch(`/api/day-entries/${entry.id}/social`, { method: "POST" })); setCaptions(data.captions); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Captions maken lukte niet."); } finally { setSaving(false); }
  }

  async function publish() {
    if (!entry) { setMessage("Sla eerst het verslag op."); return; }
    setPublishing(true); setMessage("");
    try {
      const data = await responseJson(await fetch(`/api/day-entries/${entry.id}/publish`, { method: "POST" }));
      setEntry((current) => current ? { ...current, publication_status: data.entry.publication_status } : current);
      setMessage("Dag gepubliceerd. Controleer hem nog even en deel daarna waar je wilt.");
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Publiceren lukte niet."); } finally { setPublishing(false); }
  }

  async function copy(value: string) { await navigator.clipboard.writeText(value); setMessage("Caption gekopieerd."); }

  return <div className="journal-editor">
    <section className="entry-form-card">
      <div className="entry-form-heading"><div><p className="eyebrow blue">Dagverslag</p><h2>Wat maakte deze dag bijzonder?</h2></div><div className="entry-form-actions"><Link className="secondary-button" href={`/app/today/interview?day=${tripDayId}`}>🎙 Vertel het</Link><button className="secondary-button" type="button" onClick={() => void saveEntry()} disabled={saving}>{saving ? "Opslaan…" : "Concept opslaan"}</button></div></div>
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
          <label className="photo-caption-label"><input type="checkbox" checked={Boolean(asset.is_public)} onChange={(event) => void setPublic(asset.id, event.target.checked)} /> Gebruik voor publicatie en social</label>
        </figcaption>
      </figure>)}</div> : <button className="photo-dropzone" type="button" onClick={() => inputRef.current?.click()}><b>+</b><span>Kies foto’s van vandaag</span><small>HEIC is welkom</small></button>}
    </section>
    <section className="entry-photos-card"><div className="entry-form-heading"><div><p className="eyebrow blue">Publicatie</p><h2>Klaar om te delen?</h2></div><button className="secondary-button" type="button" onClick={() => void makeCaptions()} disabled={saving}>{saving ? "Even geduld…" : "Maak captions"}</button></div>
      {([ ["Instagram", captions.instagram], ["Facebook", captions.facebook], ["Polarsteps", captions.polarsteps] ] as const).map(([name, caption]) => caption && <div className="social-caption" key={name}><b>{name}</b><p>{caption}</p><button className="text-button" type="button" onClick={() => void copy(caption)}>Kopieer caption</button></div>)}
      <div className="publication-actions"><button className="secondary-button" type="button" onClick={() => void savePhotosToLibrary()}>Bewaar geselecteerde foto’s</button><button className="primary-button blue-button" type="button" onClick={() => void publish()} disabled={publishing || entry?.publication_status === "published"}>{entry?.publication_status === "published" ? "Gepubliceerd" : publishing ? "Publiceren…" : "Publiceer dag"}</button></div>
      {entry?.publication_status === "published" ? <div className="published-handoff"><Link className="primary-button blue-button" href={`/reizen/${tripSlug}/dagen/${dayNumber}`} target="_blank">Bekijk publieke dag ↗</Link><p>Open daarna een platform, plak de caption en kies bij het delen de opgeslagen foto’s.</p><div className="social-open-actions"><a className="secondary-button" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Open Instagram ↗</a><a className="secondary-button" href="https://www.facebook.com/" target="_blank" rel="noreferrer">Open Facebook ↗</a><a className="secondary-button" href="https://www.polarsteps.com/" target="_blank" rel="noreferrer">Open Polarsteps ↗</a></div></div> : null}
    </section>
  </div>;
}
