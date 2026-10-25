"use client";

import { FormEvent, useState } from "react";
import type { Trip } from "../../lib/travel-data";

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

function toDutchInput(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Er ging iets mis.");
  return data;
}

const statusOptions = [
  ["idea", "Idee"],
  ["planning", "Voorbereiden"],
  ["booked", "Geboekt"],
  ["travelling", "Onderweg"],
  ["completed", "Afgerond"],
  ["archived", "Archief"],
] as const;

export function EditTripForm({ trip }: { trip: Trip }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startsOn, setStartsOn] = useState(toDutchInput(trip.starts_on));
  const [endsOn, setEndsOn] = useState(toDutchInput(trip.ends_on));
  const [confirmTitle, setConfirmTitle] = useState("");

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
      const data = await responseJson(await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          countries: String(form.get("countries") || "").split(","),
          travelers: form.get("travelers"),
          departureLocation: form.get("departureLocation"),
          startsOn: startDate,
          endsOn: endDate,
          summary: form.get("summary"),
          aiBasis: form.get("aiBasis"),
          status: form.get("status"),
        }),
      }));
      setMessage(data.datesChanged
        ? "Opgeslagen. Reisdagen zijn aan de nieuwe data gekoppeld (volgorde blijft; inkorten alleen als lege dagen verdwijnen)."
        : "Wijzigingen opgeslagen.");
      window.location.assign(`/app/trips/${trip.id}/plan`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTrip() {
    if (confirmTitle.trim() !== trip.title) {
      setMessage("Typ de exacte reisnaam om te bevestigen.");
      return;
    }
    if (!window.confirm(`Weet je zeker dat je “${trip.title}” wilt verwijderen? Dit wist planning, verslagen, foto-metadata en documenten van deze reis.`)) {
      return;
    }
    setDeleting(true);
    setMessage("");
    try {
      await responseJson(await fetch(`/api/trips/${trip.id}`, { method: "DELETE" }));
      window.location.assign("/app/trips");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt.");
      setDeleting(false);
    }
  }

  return (
    <div className="edit-trip-stack">
      <form className="new-trip-form planner-card" onSubmit={(event) => void submit(event)}>
        <label>Naam van de reis<input required name="title" maxLength={140} defaultValue={trip.title} /></label>
        <label>
          Reizigers
          <input name="travelers" maxLength={300} defaultValue={trip.travelers || ""} placeholder="Bijvoorbeeld: Henk & Michel" />
          <small>Vrije tekst voor jullie; gestructureerde reizigers staan in het reisdossier.</small>
        </label>
        <label>Vertrekplaats<input name="departureLocation" maxLength={200} defaultValue={trip.departure_location || ""} /></label>
        <label>
          Landen of bestemmingen
          <input name="countries" maxLength={300} defaultValue={(trip.countries || []).join(", ")} placeholder="Japan, Zuid-Korea" />
          <small>Scheid meerdere namen met een komma.</small>
        </label>
        <div className="trip-date-fields">
          <label>
            Vertrek
            <input
              required
              aria-invalid={Boolean(startsOn && !parseDutchDate(startsOn))}
              autoComplete="off"
              inputMode="numeric"
              maxLength={10}
              name="startsOn"
              onChange={(event) => setStartsOn(formatDutchDate(event.target.value))}
              placeholder="dd-mm-jjjj"
              type="text"
              value={startsOn}
            />
          </label>
          <label>
            Terug
            <input
              required
              aria-invalid={Boolean(endsOn && !parseDutchDate(endsOn))}
              autoComplete="off"
              inputMode="numeric"
              maxLength={10}
              name="endsOn"
              onChange={(event) => setEndsOn(formatDutchDate(event.target.value))}
              placeholder="dd-mm-jjjj"
              type="text"
              value={endsOn}
            />
          </label>
        </div>
        <p className="edit-trip-date-hint">
          Bij een langere periode komen er lege dagen bij. Bij inkorten verdwijnen alleen lege dagen aan het eind;
          dagen met planning, verslag of documenten blijven geblokkeerd. Verschuiven houdt de volgorde van bestaande dagen.
        </p>
        <label>
          Fase
          <select name="status" defaultValue={trip.status || "planning"}>
            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Korte omschrijving<textarea name="summary" maxLength={1000} rows={4} defaultValue={trip.summary || ""} /></label>
        <label>
          AI-basis voor dagverslagen
          <textarea
            name="aiBasis"
            maxLength={2000}
            rows={4}
            defaultValue={trip.ai_basis || ""}
            placeholder="Tone, thema’s, dingen die de interviewer mag onthouden — niet publiek."
          />
          <small>Alleen voor het reisverslag-interview. Niet zichtbaar op de publieke site (anders dan de korte omschrijving).</small>
        </label>
        {message ? <p className="form-message" role="status">{message}</p> : null}
        <button className="primary-button blue-button" disabled={saving || deleting} type="submit">
          {saving ? "Bezig met opslaan…" : "Wijzigingen opslaan"}
        </button>
      </form>

      <section className="planner-card edit-trip-danger">
        <p className="eyebrow">Gevaarzone</p>
        <h2>Reis verwijderen</h2>
        <p>Dit wist de hele reis inclusief dagen, planning, verslagen en documentrecords. Typ de reisnaam ter bevestiging.</p>
        <label>
          Typ “{trip.title}” om te bevestigen
          <input value={confirmTitle} onChange={(event) => setConfirmTitle(event.target.value)} autoComplete="off" />
        </label>
        <button className="secondary-button danger-button" disabled={deleting || saving || confirmTitle.trim() !== trip.title} onClick={() => void removeTrip()} type="button">
          {deleting ? "Wordt verwijderd…" : "Reis definitief verwijderen"}
        </button>
      </section>
    </div>
  );
}
