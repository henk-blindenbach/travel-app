"use client";

import { FormEvent, useState } from "react";

function parseDutchDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

function formatDutchDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Er ging iets mis.");
  return data;
}

export function NewTripForm() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startDate = parseDutchDate(startsOn);
    const endDate = parseDutchDate(endsOn);
    if (!startDate) { setMessage("Vul vertrek in als dd-mm-jjjj."); return; }
    if (!endDate) { setMessage("Vul terugreis in als dd-mm-jjjj."); return; }
    if (endDate < startDate) { setMessage("De terugreis kan niet vóór het vertrek liggen."); return; }

    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      const data = await responseJson(await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          countries: String(form.get("countries") || "").split(","),
          travelers: form.get("travelers"),
          departureLocation: form.get("departureLocation"),
          startsOn: startDate,
          endsOn: endDate,
          summary: form.get("summary"),
          status: form.get("status"),
        }),
      }));
      window.location.assign(`/app/trips/${data.trip.id}/plan`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aanmaken mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="new-trip-form planner-card" onSubmit={(event) => void submit(event)}>
    <label>Naam van de reis<input required name="title" maxLength={140} placeholder="Bijvoorbeeld: Japan in de lente" /></label>
    <label>Reizigers<input name="travelers" maxLength={300} placeholder="Bijvoorbeeld: Henk & Michel" /><small>Alleen zichtbaar voor jullie reisgenoten.</small></label>
    <label>Vertrekplaats<input name="departureLocation" maxLength={200} placeholder="Bijvoorbeeld: Lissabon" /></label>
    <label>Landen of bestemmingen<input name="countries" maxLength={300} placeholder="Japan, Zuid-Korea" /><small>Scheid meerdere namen met een komma.</small></label>
    <div className="trip-date-fields">
      <label>Vertrek<input required aria-invalid={Boolean(startsOn && !parseDutchDate(startsOn))} autoComplete="off" inputMode="numeric" maxLength={10} name="startsOn" onChange={(event) => setStartsOn(formatDutchDate(event.target.value))} placeholder="dd-mm-jjjj" type="text" value={startsOn} /></label>
      <label>Terug<input required aria-invalid={Boolean(endsOn && !parseDutchDate(endsOn))} autoComplete="off" inputMode="numeric" maxLength={10} name="endsOn" onChange={(event) => setEndsOn(formatDutchDate(event.target.value))} placeholder="dd-mm-jjjj" type="text" value={endsOn} /></label>
    </div>
    <label>Fase<select name="status" defaultValue="planning"><option value="idea">Idee</option><option value="planning">Voorbereiden</option><option value="booked">Geboekt</option></select></label>
    <label>Korte omschrijving <textarea name="summary" maxLength={1000} rows={4} placeholder="Waar kijken jullie naar uit?" /></label>
    {message ? <p className="form-message" role="status">{message}</p> : null}
    <button className="primary-button blue-button" disabled={saving} type="submit">{saving ? "Reis wordt aangemaakt…" : "Nieuwe reis aanmaken"}</button>
  </form>;
}
