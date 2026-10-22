import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { Icon } from "../../../components/Icons";
import { MobileDayCards } from "../../../components/today/MobileDayCards";
import { TodayDocuments } from "../../../components/documents/TodayDocuments";
import { selectRoadDocuments, sortRoadDocuments } from "../../../lib/today-documents";
import { getPrivateTrip, getPrivateTrips } from "../../../lib/travel-data";
import { createClient, hasSupabaseEnv } from "../../../lib/supabase/server";

function lisbonDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return [value("year"), value("month"), value("day")].join("-");
}
function daysUntil(start: string, today: string) {
  return Math.max(0, Math.round((new Date(start + "T12:00:00").getTime() - new Date(today + "T12:00:00").getTime()) / 86_400_000));
}

type DocRow = {
  id: string;
  title: string;
  document_type: string | null;
  planning_item_id: string | null;
  trip_day_id: string | null;
  is_pinned: boolean | null;
};

async function loadRoadDocs(tripId: string, dayIds: string[]) {
  let planningItems: {
    id: string;
    trip_day_id: string;
    kind: string;
    title: string;
    location: string | null;
    departure_time: string | null;
    arrival_time: string | null;
    arrives_on: string | null;
    booking_reference: string | null;
    address: string | null;
    contact_phone: string | null;
    carrier: string | null;
    flight_number: string | null;
    departure_terminal: string | null;
    arrival_terminal: string | null;
    seat_number: string | null;
    external_url: string | null;
    duration_minutes: number | null;
  }[] = [];
  let documents: DocRow[] = [];
  if (!hasSupabaseEnv()) return { planningItems, documents };
  try {
    const supabase = await createClient();
    const [itemResult, documentResult] = await Promise.all([
      dayIds.length
        ? supabase
            .from("planning_items")
            .select(
              "id,trip_day_id,kind,title,location,departure_time,arrival_time,arrives_on,booking_reference,address,contact_phone,carrier,flight_number,departure_terminal,arrival_terminal,seat_number,external_url,duration_minutes",
            )
            .eq("trip_id", tripId)
            .in("trip_day_id", dayIds)
            .order("sort_order")
        : Promise.resolve({ data: [] }),
      supabase
        .from("trip_documents")
        .select("id,title,document_type,planning_item_id,trip_day_id,is_pinned")
        .eq("trip_id", tripId)
        .eq("upload_status", "ready"),
    ]);
    planningItems = (itemResult.data || []) as typeof planningItems;
    documents = (documentResult.data || []) as DocRow[];
  } catch {}
  return { planningItems, documents };
}

export default async function Today() {
  const trips = await getPrivateTrips();
  if (!trips.length)
    return (
      <AppShell active="today">
        <header className="app-header">
          <div>
            <p className="eyebrow blue">Welkom</p>
            <h1>Klaar voor een nieuwe reis.</h1>
            <p>Maak eerst een reis aan. Daarna verschijnen planning, documenten, dagverslagen en foto’s vanzelf op de juiste plek.</p>
          </div>
        </header>
        <section className="planner-card empty-start-card">
          <p className="eyebrow blue">Nog geen reizen</p>
          <h2>Waar gaan jullie heen?</h2>
          <p>Een reis blijft standaard privé en krijgt meteen eigen reisdagen, zodat jullie kunnen beginnen met plannen.</p>
          <Link className="primary-button blue-button" href="/app/trips/new">
            + Nieuwe reis aanmaken
          </Link>
        </section>
      </AppShell>
    );
  const today = lisbonDate();
  const activeTrip = trips.find((trip) => trip.starts_on <= today && trip.ends_on >= today);
  const upcomingTrip = trips.filter((trip) => trip.starts_on > today).sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0];
  if (!activeTrip) {
    if (!upcomingTrip)
      return (
        <AppShell active="today">
          <header className="app-header">
            <div>
              <p className="eyebrow blue">Vandaag</p>
              <h1>Geen reis onderweg.</h1>
              <p>Jullie eerdere reizen blijven beschikbaar en een nieuwe reis krijgt hier straks vanzelf een afteller.</p>
            </div>
          </header>
          <section className="planner-card">
            <h2>Alles rustig klaarzetten</h2>
            <p className="journal-intro">Bekijk een eerdere reis of maak de volgende aan wanneer jullie eraan toe zijn.</p>
            <Link className="primary-button blue-button" href="/app/trips">
              Alle reizen bekijken <Icon name="arrow" size={18} />
            </Link>
          </section>
        </AppShell>
      );
    const remaining = daysUntil(upcomingTrip.starts_on, today);
    const start = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
      new Date(upcomingTrip.starts_on + "T12:00:00"),
    );
    const journey = await getPrivateTrip(upcomingTrip.id);
    const firstDay = journey?.days[0] || null;
    const secondDay = journey?.days[1] || null;
    const ids = [firstDay?.id, secondDay?.id].filter(Boolean) as string[];
    const { planningItems: previewItems, documents: allDocs } = await loadRoadDocs(upcomingTrip.id, ids);
    const previewDocuments = selectRoadDocuments(allDocs, firstDay?.id, secondDay?.id);
    const roadDocs = sortRoadDocuments(previewDocuments, firstDay?.id, secondDay?.id);
    return (
      <AppShell active="today">
        <header className="app-header">
          <div>
            <p className="eyebrow blue">Volgende reis</p>
            <h1>{upcomingTrip.title}</h1>
            <p>{remaining === 0 ? "Vertrek is vandaag." : "Nog " + remaining + " " + (remaining === 1 ? "dag" : "dagen") + " tot vertrek."}</p>
          </div>
        </header>
        <section className="today-grid">
          <div className="journal-card">
            <div className="journal-icon">✦</div>
            <p className="eyebrow blue">Voorbereiden</p>
            <h2>Nog even voorpret.</h2>
            <p>De reis is nog niet begonnen. Hieronder staat alvast hoe jullie eerste dagen eruitzien.</p>
            <Link className="primary-button blue-button" href={"/app/trips/" + upcomingTrip.id + "/plan"}>
              Open reisplan <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="info-card">
            <p className="eyebrow blue">Praktisch</p>
            <h3>Vertrek</h3>
            <p>{start}</p>
            <hr />
            <h3>Documenten</h3>
            <p>Bewaar tickets, visa en bevestigingen alvast bij de juiste reis.</p>
            <Link href={"/app/trips/" + upcomingTrip.id + "/documents"}>
              Open documenten <Icon name="arrow" size={16} />
            </Link>
          </div>
        </section>
        <TodayDocuments tripId={upcomingTrip.id} documents={roadDocs} focusLabel="Documenten eerste reisdag" />
        {firstDay ? (
          <MobileDayCards
            tripId={upcomingTrip.id}
            today={firstDay}
            tomorrow={secondDay}
            items={previewItems}
            documents={previewDocuments}
            headings={{ first: "Eerste reisdag", second: "Daarna" }}
          />
        ) : null}
      </AppShell>
    );
  }
  const journey = await getPrivateTrip(activeTrip.id);
  const day = journey?.days.find((entry) => entry.day_date === today);
  if (!day)
    return (
      <AppShell active="today">
        <header className="app-header">
          <div>
            <p className="eyebrow blue">Onderweg</p>
            <h1>{activeTrip.title}</h1>
            <p>Vandaag valt binnen deze reis, maar heeft nog geen eigen reisdag in de planning.</p>
          </div>
        </header>
        <section className="planner-card">
          <Link className="primary-button blue-button" href={"/app/trips/" + activeTrip.id + "/plan"}>
            Open reisplan <Icon name="arrow" size={18} />
          </Link>
        </section>
      </AppShell>
    );
  const formattedDate = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" }).format(new Date(day.day_date + "T12:00:00"));
  const tomorrow = journey?.days.find((entry) => entry.day_date > today) || null;
  const ids = [day.id, ...(tomorrow ? [tomorrow.id] : [])];
  const { planningItems, documents: allDocs } = await loadRoadDocs(activeTrip.id, ids);
  const documents = selectRoadDocuments(allDocs, day.id, tomorrow?.id);
  const roadDocs = sortRoadDocuments(documents, day.id, tomorrow?.id);
  return (
    <AppShell active="today">
      <header className="app-header">
        <div>
          <p className="eyebrow blue">Vandaag</p>
          <h1>{day.title || day.planned_location || "Reisdag"}</h1>
          <p>
            {formattedDate} · Reisdag {day.day_number}
          </p>
        </div>
      </header>
      <section className="today-hero">
        <div>
          <p className="eyebrow">Reisdag {day.day_number}</p>
          <h2>{day.title || "Onderweg"}</h2>
          <p>{day.planned_route || "De planning voor vandaag wordt nog aangevuld."}</p>
        </div>
        <div className="today-hero-image" />
      </section>
      <TodayDocuments tripId={activeTrip.id} documents={roadDocs} />
      <MobileDayCards tripId={activeTrip.id} today={day} tomorrow={tomorrow} items={planningItems} documents={documents} />
      <section className="today-grid">
        <div className="journal-card">
          <div className="journal-icon">
            <Icon name="spark" />
          </div>
          <p className="eyebrow blue">Jullie dagboek</p>
          <h2>Leg jullie dag vast.</h2>
          <p>Schrijf het verslag wanneer het uitkomt en voeg foto’s toe. HEIC-originelen blijven privé; de app gebruikt een lichte webversie.</p>
          <Link className="primary-button blue-button" href={"/app/journal/" + day.id}>
            Open dagverslag <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="info-card">
          <p className="eyebrow blue">In de planning</p>
          <h3>Route</h3>
          <p>{day.planned_route || "Nog niet ingevuld"}</p>
          <hr />
          <h3>Overnachting</h3>
          <p>{day.planned_location ? "In " + day.planned_location : "Nog niet ingevuld"}</p>
          <Link href={"/app/trips/" + activeTrip.id + "/plan#day-" + day.id}>
            Bekijk reisdag <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>
      <section className="photo-strip">
        <div className="section-heading">
          <div>
            <p className="eyebrow blue">Foto’s</p>
            <h2>Leg vandaag vast</h2>
          </div>
          <Link href={"/app/journal/" + day.id}>
            Foto’s toevoegen <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="photo-placeholders">
          <div />
          <div />
          <div />
          <Link href={"/app/journal/" + day.id} className="photo-placeholder-button">
            <b>+</b>
            <span>Foto’s kiezen</span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
