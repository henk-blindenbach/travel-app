"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  SessionExpiredError,
  isSessionExpiredError,
  redirectAfterSessionExpired,
  sessionExpiredLoginPath,
} from "../../lib/session-expired";

type Entry = Record<string, unknown> & { id: string };
type Entity = "travelers" | "contacts" | "budget";

async function json(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) throw new SessionExpiredError(data.error, sessionExpiredLoginPath());
    throw new Error(data.error || "Kon niet opslaan.");
  }
  return data;
}

function EntryForm({
  entity,
  tripId,
  entry,
  children,
  onSaved,
  onCancel,
}: {
  entity: Entity;
  tripId: string;
  entry?: Entry;
  children: ReactNode;
  onSaved: (item: Entry) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = await json(
        await fetch("/api/trip-dossier", {
          method: entry ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId, entity, id: entry?.id, ...Object.fromEntries(new FormData(event.currentTarget)) }),
        }),
      );
      onSaved(data.item);
      if (!entry) event.currentTarget.reset();
      setMessage(entry ? "Wijzigingen opgeslagen." : "Toegevoegd aan het reisdossier.");
    } catch (error) {
      if (isSessionExpiredError(error)) {
        setMessage(error.message);
        redirectAfterSessionExpired(error.loginPath);
      } else {
        setMessage(error instanceof Error ? error.message : "Kon niet opslaan.");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="planner-form dossier-form" onSubmit={submit}>
      {children}
      <div className="dossier-actions">
        <button className="primary-button blue-button" disabled={busy}>
          {busy ? "Opslaan…" : entry ? "Wijzigingen opslaan" : "Toevoegen"}
        </button>
        {entry ? (
          <button className="secondary-button" type="button" onClick={onCancel}>
            Annuleer
          </button>
        ) : null}
      </div>
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function List({
  entries,
  entity,
  onEdit,
  onDelete,
  render,
}: {
  entries: Entry[];
  entity: Entity;
  onEdit: (item: Entry) => void;
  onDelete: (entity: Entity, id: string) => void;
  render: (item: Entry) => ReactNode;
}) {
  return (
    <div className="dossier-list">
      {entries.length ? (
        entries.map((item) => (
          <article key={item.id}>
            {render(item)}
            <span>
              <button className="text-button" type="button" onClick={() => onEdit(item)}>
                Bewerken
              </button>
              <button className="text-button danger-button" type="button" onClick={() => onDelete(entity, item.id)}>
                Verwijder
              </button>
            </span>
          </article>
        ))
      ) : (
        <p>Nog niets toegevoegd. Vul hieronder in en tik op Toevoegen.</p>
      )}
    </div>
  );
}

export function TripDossier({
  tripId,
  travelers: initialTravelers,
  contacts: initialContacts,
  budget: initialBudget,
}: {
  tripId: string;
  travelers: Entry[];
  contacts: Entry[];
  budget: Entry[];
}) {
  const [travelers, setTravelers] = useState(initialTravelers);
  const [contacts, setContacts] = useState(initialContacts);
  const [budget, setBudget] = useState(initialBudget);
  const [editing, setEditing] = useState<{ entity: Entity; entry: Entry } | null>(null);
  const totals = useMemo(
    () =>
      budget.reduce<Record<string, { planned: number; actual: number }>>((all, item) => {
        const currency = String(item.currency || "EUR");
        const total = all[currency] || { planned: 0, actual: 0 };
        total.planned += Number(item.planned_amount || 0);
        total.actual += Number(item.actual_amount || 0);
        all[currency] = total;
        return all;
      }, {}),
    [budget],
  );
  const replace = (entity: Entity, item: Entry) => {
    const set = entity === "travelers" ? setTravelers : entity === "contacts" ? setContacts : setBudget;
    set((all) => (all.some((entry) => entry.id === item.id) ? all.map((entry) => (entry.id === item.id ? item : entry)) : [...all, item]));
    setEditing(null);
  };
  async function remove(entity: Entity, id: string) {
    if (!window.confirm("Dit dossieritem verwijderen?")) return;
    try {
      await json(await fetch("/api/trip-dossier", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, entity, id }) }));
      (entity === "travelers" ? setTravelers : entity === "contacts" ? setContacts : setBudget)((all) => all.filter((item) => item.id !== id));
      if (editing?.entry.id === id) setEditing(null);
    } catch (error) {
      if (isSessionExpiredError(error)) redirectAfterSessionExpired(error.loginPath);
    }
  }
  const editingTraveler = editing?.entity === "travelers" ? editing.entry : undefined;
  const editingContact = editing?.entity === "contacts" ? editing.entry : undefined;
  const editingBudget = editing?.entity === "budget" ? editing.entry : undefined;

  return (
    <section className="trip-dossier" id="dossier" aria-labelledby="dossier-title">
      <header className="dossier-intro">
        <p className="eyebrow blue">Reisdossier</p>
        <h2 id="dossier-title">Reizigers, contacten en budget</h2>
        <p>
          Privé voor jullie reisgenoten. Geen paspoortnummers of scans hier — alleen wat je onderweg snel nodig hebt.{" "}
          <a href="#reizigers">Reizigers</a> · <a href="#contacten">Contacten</a> · <a href="#budget">Budget</a>
        </p>
      </header>

      <section className="planner-card dossier-card" id="reizigers">
        <p className="eyebrow blue">Reizigers</p>
        <h3>Wie reist mee</h3>
        <p className="dossier-card-lead">Naam, rol, ticket- en stoelnotities — bewerkbaar op deze reis.</p>
        <List
          entity="travelers"
          entries={travelers}
          onEdit={(entry) => setEditing({ entity: "travelers", entry })}
          onDelete={remove}
          render={(item) => (
            <>
              <b>{String(item.name)}</b>
              <small>
                {item.role ? String(item.role) : "Reiziger"}
                {item.ticket_reference ? ` · ticket ${String(item.ticket_reference)}` : ""}
                {item.seat_notes ? ` · ${String(item.seat_notes)}` : ""}
                {item.loyalty_number ? ` · loyalty ${String(item.loyalty_number)}` : ""}
              </small>
            </>
          )}
        />
        <EntryForm
          key={`traveler-${editingTraveler?.id || "new"}`}
          entity="travelers"
          tripId={tripId}
          entry={editingTraveler}
          onSaved={(item) => replace("travelers", item)}
          onCancel={() => setEditing(null)}
        >
          <label>
            Naam
            <input required name="name" placeholder="Naam" defaultValue={String(editingTraveler?.name || "")} />
          </label>
          <label>
            Rol
            <input name="role" placeholder="Bijvoorbeeld reiziger" defaultValue={String(editingTraveler?.role || "")} />
          </label>
          <label>
            Ticketreferentie
            <input name="ticketReference" placeholder="PNR / ticket" defaultValue={String(editingTraveler?.ticket_reference || "")} />
          </label>
          <label>
            Stoel / voorkeur
            <input name="seatNotes" placeholder="Stoel of voorkeur" defaultValue={String(editingTraveler?.seat_notes || "")} />
          </label>
          <label>
            Loyaliteitsnummer
            <input name="loyaltyNumber" placeholder="Frequent flyer" defaultValue={String(editingTraveler?.loyalty_number || "")} />
          </label>
          <label>
            Notitie
            <textarea name="notes" placeholder="Privé notitie (geen paspoortgegevens)" defaultValue={String(editingTraveler?.notes || "")} />
          </label>
        </EntryForm>
      </section>

      <section className="planner-card dossier-card" id="contacten">
        <p className="eyebrow blue">Contacten</p>
        <h3>Belangrijke nummers</h3>
        <p className="dossier-card-lead">Gids, hoteldesk, lokale hulp — één tik om te bellen of te mailen.</p>
        <List
          entity="contacts"
          entries={contacts}
          onEdit={(entry) => setEditing({ entity: "contacts", entry })}
          onDelete={remove}
          render={(item) => (
            <>
              <b>{String(item.name)}</b>
              <small>
                {item.role ? `${String(item.role)}` : "Contact"}
                {item.phone ? (
                  <>
                    {" · "}
                    <a href={"tel:" + String(item.phone)}>{String(item.phone)}</a>
                  </>
                ) : null}
                {item.email ? (
                  <>
                    {" · "}
                    <a href={"mailto:" + String(item.email)}>{String(item.email)}</a>
                  </>
                ) : null}
              </small>
            </>
          )}
        />
        <EntryForm
          key={`contact-${editingContact?.id || "new"}`}
          entity="contacts"
          tripId={tripId}
          entry={editingContact}
          onSaved={(item) => replace("contacts", item)}
          onCancel={() => setEditing(null)}
        >
          <label>
            Naam of organisatie
            <input required name="name" placeholder="Naam of organisatie" defaultValue={String(editingContact?.name || "")} />
          </label>
          <label>
            Rol
            <input name="role" placeholder="Bijvoorbeeld gids" defaultValue={String(editingContact?.role || "")} />
          </label>
          <label>
            Telefoon
            <input name="phone" placeholder="+31 …" defaultValue={String(editingContact?.phone || "")} />
          </label>
          <label>
            E-mail
            <input name="email" type="email" placeholder="naam@voorbeeld.nl" defaultValue={String(editingContact?.email || "")} />
          </label>
          <label>
            Adres
            <textarea name="address" placeholder="Adres" defaultValue={String(editingContact?.address || "")} />
          </label>
          <label>
            Bijzonderheden
            <textarea name="notes" placeholder="Bijzonderheden" defaultValue={String(editingContact?.notes || "")} />
          </label>
        </EntryForm>
      </section>

      <section className="planner-card dossier-card" id="budget">
        <p className="eyebrow blue">Budget</p>
        <h3>Kosten bijhouden</h3>
        <p className="dossier-card-lead">Begroot versus werkelijk, per valuta. Handig om openstaande betalingen te zien.</p>
        <List
          entity="budget"
          entries={budget}
          onEdit={(entry) => setEditing({ entity: "budget", entry })}
          onDelete={remove}
          render={(item) => (
            <>
              <b>{String(item.title)}</b>
              <small>
                {String(item.currency || "")} · begroot {Number(item.planned_amount || 0).toLocaleString("nl-NL")} · werkelijk{" "}
                {Number(item.actual_amount || 0).toLocaleString("nl-NL")}
                {item.payment_status === "unpaid" ? " · nog niet betaald" : item.payment_status === "paid" ? " · betaald" : ""}
              </small>
            </>
          )}
        />
        {Object.entries(totals).map(([currency, total]) => (
          <p className="budget-total" key={currency}>
            <b>{currency}</b> · begroot {total.planned.toLocaleString("nl-NL")} · werkelijk {total.actual.toLocaleString("nl-NL")}
          </p>
        ))}
        <EntryForm
          key={`budget-${editingBudget?.id || "new"}`}
          entity="budget"
          tripId={tripId}
          entry={editingBudget}
          onSaved={(item) => replace("budget", item)}
          onCancel={() => setEditing(null)}
        >
          <label>
            Omschrijving
            <input required name="title" placeholder="Bijvoorbeeld vlucht of hotel" defaultValue={String(editingBudget?.title || "")} />
          </label>
          <label>
            Categorie
            <select name="category" defaultValue={String(editingBudget?.category || "other")}>
              <option value="flight">Vlucht</option>
              <option value="stay">Verblijf</option>
              <option value="transport">Vervoer</option>
              <option value="activity">Activiteit</option>
              <option value="visa">Visum / permit</option>
              <option value="insurance">Verzekering</option>
              <option value="food">Eten</option>
              <option value="other">Anders</option>
            </select>
          </label>
          <label>
            Begroot
            <input name="plannedAmount" inputMode="decimal" type="number" min="0" step=".01" placeholder="0" defaultValue={String(editingBudget?.planned_amount || "")} />
          </label>
          <label>
            Werkelijk
            <input name="actualAmount" inputMode="decimal" type="number" min="0" step=".01" placeholder="0" defaultValue={String(editingBudget?.actual_amount || "")} />
          </label>
          <label>
            Valuta
            <input required name="currency" defaultValue={String(editingBudget?.currency || "EUR")} maxLength={3} />
          </label>
          <label>
            Betaalstatus
            <select name="paymentStatus" defaultValue={String(editingBudget?.payment_status || "unknown")}>
              <option value="unknown">Onbekend</option>
              <option value="unpaid">Nog niet betaald</option>
              <option value="paid">Betaald</option>
            </select>
          </label>
          <label>
            Notitie
            <textarea name="notes" placeholder="Notitie" defaultValue={String(editingBudget?.notes || "")} />
          </label>
        </EntryForm>
      </section>
    </section>
  );
}
