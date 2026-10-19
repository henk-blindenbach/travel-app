# Plan CSV-import

Privé import van reisdagen en planningonderdelen vanuit een spreadsheet. **CSV eerst**; native `.xlsx` is een dunne follow-up (zelfde kolommen, Excel → “Opslaan als CSV”).

## Waar in de app

`/app/trips/[tripId]/plan` → sectie **CSV-import** (onder het dossier / bij de planner). Alleen reisleden; data blijft privé.

## Workflow

1. Download de [voorbeeld-CSV](/templates/plan-import-template.csv) of exporteer je sheet als CSV (UTF-8).
2. Vul rijen in met `row_type` = `day` of `item`.
3. **Voorbeeld** in de app → controleer acties en fouten per regelnummer.
4. **Import bevestigen** alleen als er geen fouten zijn.

## Matching (idempotent-ish)

| Rij | Match | Gedrag |
|-----|--------|--------|
| `day` | `day_number` binnen de reis | Alleen meegeleverde velden bijwerken. Geen dag aanmaken/verwijderen. |
| `item` | `day_number` + `kind` + `title` (trim, case-insensitive) | Bestaand → update; anders insert. **Geen** delete van onderdelen die niet in het bestand staan. |

Lege cellen op een dagrij betekenen “niet wijzigen” (niet wissen). Locatie die wél verandert zonder `latitude`/`longitude` wist de kaartpin (voorkomt verkeerde pins bij bulk); zet coördinaten in de CSV of sla de dag later opnieuw op in de planner.

## Kolommen

Verplicht in de header: `row_type`, `day_number`.

### Gemeenschappelijk

| Kolom | Alias | Opmerking |
|-------|--------|-----------|
| `row_type` | `type`, `rijtype` | `day` / `dag` of `item` / `onderdeel` |
| `day_number` | `dag`, `day` | Bestaand dagnummer in de reis (1…n) |
| `title` | `titel` | Dagtitel of onderdeeltitel |

### Alleen `day`

| Kolom | Alias |
|-------|--------|
| `planned_location` | `location`, `plaats` |
| `planned_route` | `route` |
| `private_notes` | `notes`, `notities`, `dagnotitie` |
| `day_status` | `status` → planned / in_progress / completed / skipped (NL: gepland, onderweg, afgerond, overgeslagen) |
| `latitude` / `longitude` | `lat` / `lng` / `lon` — samen invullen, of `clear` om de pin te wissen |

### Alleen `item`

| Kolom | Alias / waarden |
|-------|------------------|
| `kind` | `soort` — flight, accommodation, transport, activity, permit, note (NL: vlucht, verblijf, vervoer, activiteit, visum, notitie) |
| `item_status` | `status` — option / planned / confirmed (optie, gepland, bevestigd) |
| `item_location` | of `location` / `plaats` |
| `details` | `bijzonderheden` |
| `booking_reference` | `boekingsnummer` |
| `ticket_number` | `ticketnummer` |
| `departure_time` / `arrival_time` | `UU:MM` |
| `arrives_on` / `ends_on` | `JJJJ-MM-DD` (ends_on alleen verblijf) |
| `carrier`, `flight_number`, terminals, `seat_number` | vluchtvelden |
| `external_url`, `address`, `contact_phone` | |
| `price_amount`, `currency`, `payment_status` | unknown / unpaid / paid |
| `is_optional` | ja/nee, true/false |
| `duration_minutes`, `altitude_m` | activiteiten |

## Fouten

Elke slechte rij krijgt een duidelijke melding met **regelnummer** (CSV-regel, header = 1). Bevestigen is geblokkeerd zolang er fouten zijn. Runtime-fouten tijdens bevestigen kunnen eerdere rijen al hebben opgeslagen — opnieuw importeren is veilig voor dezelfde matches.

## Bewust buiten scope

- Native Excel `.xlsx` parser (exporteer CSV)
- Dagen kopiëren / bulk-delete
- Open punten, dossier, documenten of budget via deze import
- Automatische Nominatim-geocode tijdens bulk (gebruik lat/lng-kolommen)

## Privacy

Boekingscodes en notities horen in de CSV; upload alleen in de privé-app. Zet geen secrets in Git of publieke mockdata.
