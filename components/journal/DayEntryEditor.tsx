"use client";

import { ChangeEvent, useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  normalizeEntryTranslations,
  type EntryI18nMap,
} from "../../lib/entry-i18n";
import { formatSavedAt, savedConfirmation, statusMeta } from "../../lib/journal-status";
import {
  normalizeSocialCaptions,
  preferredShareCaption,
  selectedPublicPhotos,
  sharePhotosDisabledHint,
  type SocialCaptions,
  type SocialPlatformKey,
} from "../../lib/social-captions";
import { SocialCaptionsEditor } from "./SocialCaptionsEditor";

type Entry = {
  id: string;
  title: string;
  actual_location: string;
  body: string;
  title_i18n?: EntryI18nMap | null;
  body_i18n?: EntryI18nMap | null;
  actual_location_i18n?: EntryI18nMap | null;
  actual_latitude?: number | null;
  actual_longitude?: number | null;
  social_captions?: SocialCaptions;
  publication_status?: "draft" | "ready" | "published";
} | null;

function translationFieldsFromEntry(entry: Entry) {
  const maps = normalizeEntryTranslations(entry || {});
  return {
    enTitle: maps.title_i18n.en || "",
    enLocation: maps.actual_location_i18n.en || "",
    enBody: maps.body_i18n.en || "",
    ptTitle: maps.title_i18n.pt || "",
    ptLocation: maps.actual_location_i18n.pt || "",
    ptBody: maps.body_i18n.pt || "",
  };
}

type CoordinateStatus = "geocoded" | "manual" | "unchanged" | "failed" | "cleared" | "skipped";

function formatCoord(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? "" : String(Math.round(value * 1e5) / 1e5);
}

function parseCoordInput(value: string) {
  const text = value.trim().replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : NaN;
}

type Asset = {
  id: string;
  original_filename: string;
  caption: string;
  sort_order: number;
  is_public?: boolean;
  book_candidate?: boolean;
  book_favorite?: boolean;
  upload_status: "uploading" | "processing" | "ready" | "failed";
};

type DisplayAsset = Asset & { webUrl?: string; localUrl?: string };

type TripVisibility = "private" | "unlisted" | "public";

type Props = {
  tripDayId: string;
  tripSlug: string;
  tripVisibility?: TripVisibility;
  dayNumber: number;
  dayTitle: string;
  plannedLocation: string | null;
  journalHub: string;
  initialEntry: Entry;
  initialAssets: Asset[];
  nextEmptyDayId?: string | null;
};

const acceptedTypes = new Set(["image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"]);
const draftStorageKey = (tripDayId: string) => `nos-day-draft:${tripDayId}`;

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

function readLocalDraft(tripDayId: string) {
  try {
    const raw = localStorage.getItem(draftStorageKey(tripDayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { title?: string; actualLocation?: string; body?: string; savedAt?: string };
    if (typeof parsed?.title !== "string" || typeof parsed?.body !== "string") return null;
    return {
      title: parsed.title,
      actualLocation: typeof parsed.actualLocation === "string" ? parsed.actualLocation : "",
      body: parsed.body,
      savedAt: parsed.savedAt || "",
    };
  } catch {
    return null;
  }
}

export function DayEntryEditor({
  tripDayId,
  tripSlug,
  tripVisibility: initialVisibility = "private",
  dayNumber,
  dayTitle,
  plannedLocation,
  journalHub,
  initialEntry,
  initialAssets,
  nextEmptyDayId = null,
}: Props) {
  const router = useRouter();
  const [entry, setEntry] = useState<Entry>(initialEntry);
  const [shareSlug, setShareSlug] = useState(tripSlug);
  const [tripVisibility, setTripVisibility] = useState<TripVisibility>(initialVisibility);
  const [title, setTitle] = useState(initialEntry?.title || dayTitle || "");
  const [actualLocation, setActualLocation] = useState(initialEntry?.actual_location || plannedLocation || "");
  const [body, setBody] = useState(initialEntry?.body || "");
  const [assets, setAssets] = useState<DisplayAsset[]>(initialAssets);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [captionsBusy, setCaptionsBusy] = useState(false);
  const [captionsError, setCaptionsError] = useState("");
  const [captions, setCaptions] = useState<SocialCaptions>(
    normalizeSocialCaptions(initialEntry?.social_captions || {}),
  );
  const [activeCaptionKey, setActiveCaptionKey] = useState<SocialPlatformKey>("instagram_feed");
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [translateBusy, setTranslateBusy] = useState(false);
  const [translationsBusy, setTranslationsBusy] = useState(false);
  const [showTranslateOffer, setShowTranslateOffer] = useState(false);
  const initialTranslations = translationFieldsFromEntry(initialEntry);
  const [enTitle, setEnTitle] = useState(initialTranslations.enTitle);
  const [enLocation, setEnLocation] = useState(initialTranslations.enLocation);
  const [enBody, setEnBody] = useState(initialTranslations.enBody);
  const [ptTitle, setPtTitle] = useState(initialTranslations.ptTitle);
  const [ptLocation, setPtLocation] = useState(initialTranslations.ptLocation);
  const [ptBody, setPtBody] = useState(initialTranslations.ptBody);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [clearCoordinates, setClearCoordinates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baselineRef = useRef({
    title: initialEntry?.title || dayTitle || "",
    actualLocation: initialEntry?.actual_location || plannedLocation || "",
    body: initialEntry?.body || "",
  });
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function coordPayload() {
    const payload: Record<string, unknown> = {};
    if (clearCoordinates) {
      payload.clearCoordinates = true;
      return payload;
    }
    const latitude = parseCoordInput(manualLat);
    const longitude = parseCoordInput(manualLng);
    if (Number.isNaN(latitude as number) || Number.isNaN(longitude as number)) {
      throw new Error("Lat/lng moeten geldige getallen zijn, of laat beide leeg.");
    }
    if ((latitude === null) !== (longitude === null)) {
      throw new Error("Vul lat én lng in, of laat beide leeg voor automatische geocode.");
    }
    if (latitude !== null && longitude !== null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }
    return payload;
  }

  function pinFeedback(status: CoordinateStatus | undefined, latitude: number | null | undefined, longitude: number | null | undefined) {
    const pin = latitude != null && longitude != null ? `${formatCoord(latitude)}, ${formatCoord(longitude)}` : "";
    if (status === "geocoded" && pin) return ` Kaartpin: ${pin}.`;
    if (status === "manual" && pin) return ` Handmatige pin: ${pin}.`;
    if (status === "failed") return " Geen kaartpin gevonden — vul een duidelijker plaats in of lat/lng.";
    if (status === "cleared") return " Kaartpin verwijderd.";
    return "";
  }

  function applyTranslationEntry(next: NonNullable<Entry>) {
    setEntry(next);
    const fields = translationFieldsFromEntry(next);
    setEnTitle(fields.enTitle);
    setEnLocation(fields.enLocation);
    setEnBody(fields.enBody);
    setPtTitle(fields.ptTitle);
    setPtLocation(fields.ptLocation);
    setPtBody(fields.ptBody);
  }

  const onAutosave = useEffectEvent(async (snapshot: { title: string; actualLocation: string; body: string }) => {
    try {
      localStorage.setItem(draftStorageKey(tripDayId), JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }));
    } catch { /* quota / private mode */ }
    if (!navigator.onLine) {
      setMessage("Offline: concept lokaal bewaard. Wordt opgeslagen zodra je weer verbinding hebt.");
      return;
    }
    setSaving(true);
    try {
      const coords = coordPayload();
      const data = await responseJson(await fetch("/api/day-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripDayId, ...snapshot, ...coords }),
      }));
      const nextEntry = {
        ...(entry || { id: data.entry.id, title: "", actual_location: "", body: "" }),
        ...data.entry,
        publication_status: data.entry.publication_status || entry?.publication_status || "draft",
      } as NonNullable<Entry>;
      applyTranslationEntry(nextEntry);
      baselineRef.current = snapshot;
      setDirty(false);
      setClearCoordinates(false);
      setManualLat("");
      setManualLng("");
      const stamp = formatSavedAt();
      setLastSavedAt(stamp);
      const status = data.coordinateStatus as CoordinateStatus | undefined;
      setMessage(savedConfirmation() + pinFeedback(status, data.entry.actual_latitude, data.entry.actual_longitude));
      if (snapshot.body.trim()) setShowTranslateOffer(true);
      try { localStorage.removeItem(draftStorageKey(tripDayId)); } catch { /* ignore */ }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Automatisch opslaan mislukt; lokaal concept blijft bewaard.");
    } finally {
      setSaving(false);
    }
  });

  useEffect(() => {
    initialAssets.filter((asset) => asset.upload_status === "ready").forEach((asset) => void loadWebUrl(asset.id));
    const local = readLocalDraft(tripDayId);
    if (local && local.body && local.body !== (initialEntry?.body || "")) {
      const serverUpdated = initialEntry && "updated_at" in (initialEntry as object);
      void serverUpdated;
      setTitle(local.title);
      setActualLocation(local.actualLocation);
      setBody(local.body);
      setDirty(true);
      setMessage("Lokaal concept hersteld (nog niet online opgeslagen).");
    }
  // Existing photos / local draft only once per page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextDirty =
      title !== baselineRef.current.title
      || actualLocation !== baselineRef.current.actualLocation
      || body !== baselineRef.current.body;
    setDirty(nextDirty);
    if (!nextDirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void onAutosave({ title, actualLocation, body });
    }, 1_200);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, actualLocation, body]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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
      const coords = coordPayload();
      const data = await responseJson(await fetch("/api/day-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripDayId, title, actualLocation, body, ...coords }),
      }));
      const nextEntry = {
        ...(entry || { id: data.entry.id, title: "", actual_location: "", body: "" }),
        ...data.entry,
        publication_status: data.entry.publication_status || entry?.publication_status || "draft",
      } as NonNullable<Entry>;
      applyTranslationEntry(nextEntry);
      baselineRef.current = { title, actualLocation, body };
      setDirty(false);
      setClearCoordinates(false);
      setManualLat("");
      setManualLng("");
      const stamp = formatSavedAt();
      setLastSavedAt(stamp);
      const status = data.coordinateStatus as CoordinateStatus | undefined;
      setMessage(savedConfirmation() + pinFeedback(status, data.entry.actual_latitude, data.entry.actual_longitude));
      if (body.trim()) setShowTranslateOffer(true);
      try { localStorage.removeItem(draftStorageKey(tripDayId)); } catch { /* ignore */ }
      return nextEntry;
    } catch (error) {
      try {
        localStorage.setItem(draftStorageKey(tripDayId), JSON.stringify({ title, actualLocation, body, savedAt: new Date().toISOString() }));
      } catch { /* ignore */ }
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function confirmLeave() {
    if (!dirty) return true;
    return window.confirm("Je hebt niet-opgeslagen tekst. Toch weggaan? Een lokaal concept blijft bewaard.");
  }

  function rememberLocalDraft() {
    try {
      localStorage.setItem(draftStorageKey(tripDayId), JSON.stringify({ title, actualLocation, body, savedAt: new Date().toISOString() }));
    } catch { /* ignore */ }
  }

  async function goBack() {
    if (leaving) return;
    setLeaving(true);
    try {
      if (dirty) {
        const saved = await saveEntry();
        if (!saved) {
          if (!confirmLeave()) return;
          rememberLocalDraft();
        }
      }
      router.push(journalHub);
    } finally {
      setLeaving(false);
    }
  }

  async function goNextEmptyDay() {
    if (!nextEmptyDayId) return;
    if (leaving) return;
    setLeaving(true);
    try {
      if (dirty) {
        const saved = await saveEntry();
        if (!saved) {
          if (!confirmLeave()) return;
          rememberLocalDraft();
        }
      }
      router.push(`/app/journal/${nextEmptyDayId}`);
    } finally {
      setLeaving(false);
    }
  }

  async function setReadyStatus(status: "draft" | "ready") {
    const saved = entry || await saveEntry();
    if (!saved) return;
    setStatusBusy(true);
    setMessage("");
    try {
      const data = await responseJson(await fetch(`/api/day-entries/${saved.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }));
      setEntry((current) => current ? { ...current, publication_status: data.entry.publication_status } : current);
      setMessage(status === "ready" ? "Dag gemarkeerd als klaar." : "Teruggezet naar concept.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status kon niet worden opgeslagen.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function deleteEntry() {
    if (!entry) {
      setTitle(dayTitle || "");
      setActualLocation(plannedLocation || "");
      setBody("");
      baselineRef.current = { title: dayTitle || "", actualLocation: plannedLocation || "", body: "" };
      setDirty(false);
      try { localStorage.removeItem(draftStorageKey(tripDayId)); } catch { /* ignore */ }
      setMessage("Leeg concept gewist.");
      return;
    }
    if (!window.confirm("Dit concept of dagverslag definitief verwijderen? Foto’s en captions gaan ook weg.")) return;
    setDeleting(true);
    setMessage("");
    try {
      await responseJson(await fetch(`/api/day-entries/${entry.id}`, { method: "DELETE" }));
      setEntry(null);
      setTitle(dayTitle || "");
      setActualLocation(plannedLocation || "");
      setBody("");
      setAssets([]);
      setCaptions({});
      baselineRef.current = { title: dayTitle || "", actualLocation: plannedLocation || "", body: "" };
      setDirty(false);
      try { localStorage.removeItem(draftStorageKey(tripDayId)); } catch { /* ignore */ }
      setMessage("Verslag verwijderd.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt.");
    } finally {
      setDeleting(false);
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

  async function setBookFlag(assetId: string, patch: { bookCandidate?: boolean; bookFavorite?: boolean }) {
    try {
      const data = await responseJson(await fetch(`/api/media/${assetId}/web-url`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }));
      setAssets((current) => current.map((asset) => asset.id === assetId ? {
        ...asset,
        book_candidate: data.asset.book_candidate,
        book_favorite: data.asset.book_favorite,
      } : asset));
    } catch { setMessage("De fotoboekkeuze kon niet worden opgeslagen."); }
  }

  async function savePhotosToLibrary() {
    const selected = selectedPublicPhotos(assets);
    if (!selected.length) {
      setMessage(sharePhotosDisabledHint(0));
      return;
    }
    const caption =
      captions[activeCaptionKey]?.trim() || preferredShareCaption(captions);
    try {
      if (caption) {
        try {
          await navigator.clipboard.writeText(caption);
        } catch {
          /* Clipboard may be blocked; share text below still helps on supporting browsers. */
        }
      }
      const files = await Promise.all(selected.map(async (asset) => {
        const response = await fetch(`/api/media/${asset.id}/original`);
        if (!response.ok) throw new Error();
        return new File([await response.blob()], asset.original_filename, {
          type: response.headers.get("Content-Type") || "image/jpeg",
        });
      }));
      const sharePayload: ShareData = { files, title: dayTitle };
      if (caption) sharePayload.text = caption;
      if (navigator.canShare?.(sharePayload) && navigator.share) {
        await navigator.share(sharePayload);
        setMessage(caption ? "Foto’s gedeeld; caption staat op het klembord." : "Foto’s gedeeld.");
      } else {
        files.forEach((file) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(file);
          link.download = file.name;
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
        });
        setMessage(
          caption
            ? "Foto’s gedownload; caption gekopieerd — plak in Instagram of Facebook."
            : "Foto’s gedownload. Maak eerst captions om mee te delen.",
        );
      }
    } catch {
      setMessage("De geselecteerde foto’s konden niet worden klaargezet.");
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

  async function translateWithAi() {
    const saved = entry || await saveEntry();
    if (!saved) return;
    if (!body.trim() && !saved.body?.trim()) {
      setMessage("Schrijf eerst een Nederlands verslag vóór je vertaalt.");
      return;
    }
    setTranslateBusy(true);
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const data = await responseJson(await fetch(`/api/day-entries/${saved.id}/translate`, {
        method: "POST",
        signal: controller.signal,
      }));
      applyTranslationEntry(data.entry);
      setShowTranslateOffer(false);
      setMessage("EN- en PT-vertalingen klaar. Controleer ze vóór je publiceert.");
    } catch (error) {
      const text = error instanceof DOMException && error.name === "AbortError"
        ? "Vertalen duurde te lang."
        : error instanceof Error ? error.message : "Vertalen lukte niet.";
      setMessage(text);
    } finally {
      window.clearTimeout(timeout);
      setTranslateBusy(false);
    }
  }

  async function saveTranslations() {
    const saved = entry || await saveEntry();
    if (!saved) return;
    setTranslationsBusy(true);
    setMessage("");
    try {
      const data = await responseJson(await fetch(`/api/day-entries/${saved.id}/translations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_i18n: { en: enTitle, pt: ptTitle },
          body_i18n: { en: enBody, pt: ptBody },
          actual_location_i18n: { en: enLocation, pt: ptLocation },
        }),
      }));
      applyTranslationEntry(data.entry);
      setShowTranslateOffer(false);
      setMessage("Vertalingen opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vertalingen opslaan lukte niet.");
    } finally {
      setTranslationsBusy(false);
    }
  }

  async function makeCaptions() {
    if (!entry) { setCaptionsError("Sla eerst het verslag op."); return; }
    setCaptionsBusy(true);
    setCaptionsError("");
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const data = await responseJson(await fetch(`/api/day-entries/${entry.id}/social`, {
        method: "POST",
        signal: controller.signal,
      }));
      setCaptions(normalizeSocialCaptions(data.captions));
      setMessage("Captions klaar.");
    } catch (error) {
      const text = error instanceof DOMException && error.name === "AbortError"
        ? "Captions maken duurde te lang."
        : error instanceof Error ? error.message : "Captions maken lukte niet.";
      setCaptionsError(text);
    } finally {
      window.clearTimeout(timeout);
      setCaptionsBusy(false);
    }
  }

  async function publish() {
    if (!entry) { setMessage("Sla eerst het verslag op."); return; }
    setPublishing(true);
    setMessage("");
    try {
      const data = await responseJson(await fetch(`/api/day-entries/${entry.id}/publish`, { method: "POST" }));
      setEntry((current) => current ? { ...current, publication_status: data.entry.publication_status } : current);
      if (data.trip?.slug) setShareSlug(data.trip.slug);
      if (data.trip?.visibility === "public" || data.trip?.visibility === "unlisted" || data.trip?.visibility === "private") {
        setTripVisibility(data.trip.visibility);
      }
      const promoted = initialVisibility === "private" && data.trip?.visibility === "unlisted";
      setMessage(
        promoted
          ? "Dag gepubliceerd. De reis staat nu op niet-vermeld zodat de directe link werkt."
          : "Dag gepubliceerd. Controleer hem nog even en deel daarna waar je wilt.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publiceren lukte niet.");
    } finally {
      setPublishing(false);
    }
  }

  const chip = statusMeta(entry);
  const published = entry?.publication_status === "published";
  const ready = entry?.publication_status === "ready";
  const selectedCount = selectedPublicPhotos(assets).length;
  const shareDisabled = selectedCount === 0;
  const shareHint = sharePhotosDisabledHint(selectedCount);
  const publicDayHref = `/reizen/${shareSlug}/dagen/${dayNumber}`;
  const shareableTrip = tripVisibility === "public" || tripVisibility === "unlisted";
  const hasEnOrPt =
    Boolean(enTitle.trim() || enBody.trim() || enLocation.trim() || ptTitle.trim() || ptBody.trim() || ptLocation.trim());

  return (
    <div className="journal-editor">
      <section className="entry-form-card">
        <div className="entry-form-heading">
          <div>
            <p className="eyebrow blue">Dagverslag</p>
            <h2>Wat maakte deze dag bijzonder?</h2>
            <p className="journal-day-status">
              Status: <span className={`journal-status journal-status-${chip.key}`}>{chip.label}</span>
            </p>
          </div>
          <div className="entry-form-actions">
            <button className="secondary-button" type="button" onClick={() => void goBack()} disabled={leaving}>
              {leaving ? "Even geduld…" : "← Terug naar reisverslag"}
            </button>
            <Link className="secondary-button" href={`/app/today/interview?day=${tripDayId}`}>🎙 Vertel het</Link>
            <button className="secondary-button" type="button" onClick={() => void saveEntry()} disabled={saving}>
              {saving ? "Opslaan…" : lastSavedAt ? `Opgeslagen ✓ ${lastSavedAt}` : "Concept opslaan"}
            </button>
            {!published ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => void setReadyStatus(ready ? "draft" : "ready")}
                disabled={statusBusy || saving || (!entry && !body.trim())}
              >
                {statusBusy ? "Status…" : ready ? "Terug naar concept" : "Markeer als klaar"}
              </button>
            ) : null}
            {nextEmptyDayId ? (
              <button className="secondary-button" type="button" onClick={() => void goNextEmptyDay()} disabled={leaving}>
                Volgende dag zonder verslag →
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => void deleteEntry()} disabled={deleting || (!entry && !body && !title)}>
              {deleting ? "Verwijderen…" : "Verwijderen"}
            </button>
          </div>
        </div>
        <label>Eigen titel<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Bijvoorbeeld: Stilte boven de wolken" /></label>
        <label>Waar waren jullie?<input value={actualLocation} maxLength={160} onChange={(event) => setActualLocation(event.target.value)} placeholder={plannedLocation || "Plaats of gebied"} /><small>Bij wijziging zoekt de app een publieke kaartpin (geen EXIF). Boekingscodes horen hier niet.</small></label>
        <label>Breedtegraad (lat)<input value={manualLat} inputMode="decimal" autoComplete="off" placeholder={formatCoord(entry?.actual_latitude) || "bijv. 27.7172"} onChange={(event) => setManualLat(event.target.value)} /><small>Optioneel · vul beide in om de pin handmatig te zetten</small></label>
        <label>Lengtegraad (lng)<input value={manualLng} inputMode="decimal" autoComplete="off" placeholder={formatCoord(entry?.actual_longitude) || "bijv. 85.3240"} onChange={(event) => setManualLng(event.target.value)} /></label>
        <label className="optional-toggle"><input type="checkbox" checked={clearCoordinates} onChange={(event) => setClearCoordinates(event.target.checked)} /> Kaartpin wissen</label>
        <p className="day-pin-status" role="status">{entry?.actual_latitude != null && entry?.actual_longitude != null ? `Huidige pin: ${formatCoord(entry.actual_latitude)}, ${formatCoord(entry.actual_longitude)}` : "Nog geen kaartpin voor deze bezochte plek."}</p>
        <label>Het verslag<textarea value={body} maxLength={20_000} onChange={(event) => setBody(event.target.value)} placeholder="Schrijf hier vrijuit wat er gebeurde, wat je zag en hoe het voelde…" rows={11} /></label>
        <p className="entry-helper">
          Schrijf in het Nederlands. Concepten worden automatisch opgeslagen{lastSavedAt ? ` · laatste keer ${lastSavedAt}` : ""}. Offline blijft een lokale kopie bewaard.
        </p>
        {message && <p className="form-message" role="status">{message}</p>}
      </section>

      <section className="entry-photos-card">
        <div className="entry-form-heading">
          <div>
            <p className="eyebrow blue">Vertalingen</p>
            <h2>Engels &amp; Portugees</h2>
          </div>
          <div className="entry-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void translateWithAi()}
              disabled={translateBusy || saving || (!entry && !body.trim())}
            >
              {translateBusy ? "Vertalen…" : "Vertaal naar EN/PT"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void saveTranslations()}
              disabled={translationsBusy || (!entry && !hasEnOrPt)}
            >
              {translationsBusy ? "Opslaan…" : "Vertalingen opslaan"}
            </button>
          </div>
        </div>
        <p className="entry-helper">
          Na een geslaagde NL-opslag kun je EN/PT laten genereren. Controleer of pas de tekst aan vóór publicatie — er is geen stille auto-vertaling.
        </p>
        {showTranslateOffer && !hasEnOrPt ? (
          <p className="form-message" role="status">
            Concept opgeslagen. Wil je nu EN- en PT-vertalingen genereren?{" "}
            <button className="text-button" type="button" onClick={() => void translateWithAi()} disabled={translateBusy}>
              Vertaal naar EN/PT
            </button>
          </p>
        ) : null}
        <div className="journal-translation-grid">
          <div className="journal-translation-column">
            <h3>English</h3>
            <label>Title<input value={enTitle} maxLength={160} onChange={(event) => setEnTitle(event.target.value)} /></label>
            <label>Place<input value={enLocation} maxLength={160} onChange={(event) => setEnLocation(event.target.value)} /></label>
            <label>Story<textarea value={enBody} maxLength={20_000} rows={8} onChange={(event) => setEnBody(event.target.value)} /></label>
          </div>
          <div className="journal-translation-column">
            <h3>Português</h3>
            <label>Título<input value={ptTitle} maxLength={160} onChange={(event) => setPtTitle(event.target.value)} /></label>
            <label>Lugar<input value={ptLocation} maxLength={160} onChange={(event) => setPtLocation(event.target.value)} /></label>
            <label>Relato<textarea value={ptBody} maxLength={20_000} rows={8} onChange={(event) => setPtBody(event.target.value)} /></label>
          </div>
        </div>
      </section>

      <section className="entry-photos-card">
        <div className="entry-form-heading">
          <div>
            <p className="eyebrow blue">Foto’s</p>
            <h2>Beelden van deze dag</h2>
          </div>
          <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Foto’s kiezen</button>
        </div>
        <p className="entry-helper">HEIC, JPEG, PNG of WebP · maximaal 50 MB per foto. Het origineel blijft privé in Scaleway; alleen een geoptimaliseerde WebP-versie komt in de app.</p>
        <input ref={inputRef} className="visually-hidden" type="file" accept="image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif" multiple onChange={(event) => void choosePhotos(event)} />
        {assets.length ? (
          <div className="journal-photo-grid">
            {assets.map((asset, index) => (
              <figure key={asset.id} className="journal-photo">
                {asset.webUrl || asset.localUrl
                  ? <img src={asset.webUrl || asset.localUrl} alt={asset.caption || asset.original_filename} />
                  : <div className="photo-processing">{asset.upload_status === "failed" ? "Mislukt" : "Wordt verwerkt…"}</div>}
                <figcaption>
                  {asset.original_filename}
                  <small>{asset.upload_status === "ready" ? "Private webversie" : asset.upload_status}</small>
                  <div className="photo-order-actions">
                    <button type="button" className="text-button" disabled={index === 0} onClick={() => void movePhoto(index, -1)}>↑ Eerder</button>
                    <button type="button" className="text-button" disabled={index === assets.length - 1} onClick={() => void movePhoto(index, 1)}>Later ↓</button>
                  </div>
                  <label className="photo-caption-label">
                    Bijschrift
                    <input
                      defaultValue={asset.caption}
                      maxLength={500}
                      placeholder="Wat zie je op deze foto?"
                      onBlur={(event) => {
                        if (event.target.value.trim() !== asset.caption) void saveCaption(asset.id, event.target.value);
                      }}
                    />
                  </label>
                  <label className="photo-caption-label">
                    <input type="checkbox" checked={Boolean(asset.is_public)} onChange={(event) => void setPublic(asset.id, event.target.checked)} /> Gebruik voor publicatie en social
                  </label>
                  <label className="photo-caption-label">
                    <input type="checkbox" checked={Boolean(asset.book_candidate)} onChange={(event) => void setBookFlag(asset.id, { bookCandidate: event.target.checked })} /> Fotoboek-kandidaat
                  </label>
                  <label className="photo-caption-label">
                    <input type="checkbox" checked={Boolean(asset.book_favorite)} onChange={(event) => void setBookFlag(asset.id, { bookFavorite: event.target.checked })} /> Favoriet voor fotoboek
                  </label>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <button className="photo-dropzone" type="button" onClick={() => inputRef.current?.click()}>
            <b>+</b><span>Kies foto’s van vandaag</span><small>HEIC is welkom</small>
          </button>
        )}
      </section>

      <section className="entry-photos-card">
        <div className="entry-form-heading">
          <div>
            <p className="eyebrow blue">Publicatie</p>
            <h2>Klaar om te delen?</h2>
          </div>
          <button className="secondary-button" type="button" onClick={() => void makeCaptions()} disabled={captionsBusy}>
            {captionsBusy ? "Even geduld…" : "Maak captions"}
          </button>
        </div>
        <p className="entry-helper">
          Kies eerst de foto’s met <b>Gebruik voor publicatie en social</b>. Daarna deel je ze via het iPhone-deelmenu en plak je de juiste caption in het gekozen platform.
        </p>
        {captionsError ? (
          <p className="form-message" role="alert">
            {captionsError}{" "}
            <button className="text-button" type="button" onClick={() => void makeCaptions()} disabled={captionsBusy}>
              Probeer opnieuw
            </button>
          </p>
        ) : null}
        <SocialCaptionsEditor
          entryId={entry?.id || null}
          captions={captions}
          activeKey={activeCaptionKey}
          onActiveKeyChange={setActiveCaptionKey}
          onCaptionsChange={setCaptions}
          onMessage={setMessage}
        />
        <div className="publication-actions">
          <div className="share-photos-wrap">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void savePhotosToLibrary()}
              disabled={shareDisabled}
              aria-disabled={shareDisabled}
              title={shareHint || undefined}
            >
              Deel geselecteerde foto’s
            </button>
            {shareDisabled ? (
              <p className="share-photos-hint" role="status">{shareHint}</p>
            ) : (
              <p className="share-photos-hint">
                Deelt {selectedCount} foto{selectedCount === 1 ? "" : "’s"} via het iPhone-deelmenu
                {captions[activeCaptionKey] || preferredShareCaption(captions)
                  ? " en kopieert de actieve caption naar het klembord."
                  : "."}
              </p>
            )}
          </div>
          <button className="primary-button blue-button" type="button" onClick={() => void publish()} disabled={publishing || entry?.publication_status === "published"}>
            {entry?.publication_status === "published" ? "Gepubliceerd" : publishing ? "Publiceren…" : "Publiceer dag"}
          </button>
        </div>
        {entry?.publication_status === "published" ? (
          <div className="published-handoff">
            {shareableTrip ? (
              <Link className="primary-button blue-button" href={publicDayHref} target="_blank" rel="noreferrer">
                Bekijk publieke dag ↗
              </Link>
            ) : (
              <p className="share-photos-hint" role="status">
                Zet de reis op niet-vermeld of openbaar onder Publiceren om de publieke daglink te openen.
              </p>
            )}
            <p>Deel de geselecteerde foto’s met het systeemdeelmenu; kies Instagram of Facebook en plak daar de passende caption.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
