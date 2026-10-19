# Fotoboek / Prodigi (eerste slice)

Private boekbuilder per reis + exportpipeline richting Prodigi Print API v4. Geen nep-orders.

## Wat werkt in de app

- Route: `/app/trips/[tripId]/fotoboek` (sidebar **Fotoboek**, ook via Meer en Foto’s).
- Conceptboek uit `book_candidate`-foto’s (favorieten eerst).
- Volgorde, titel/ondertitel, SKU, exemplaren, land, verzendmethode, afleveradres.
- **Export opslaan** → status `ready_for_prodigi` + JSON payload (assets + quote/order-draft).
- **Bestellen** alleen als `PRODIGI_API_KEY` gezet is; status `submitted` alleen na echte Prodigi-response.

## Wat nog placeholder / later is

- Volledige print-ready layout (cover, spine, spreads) via Prodigi Studio of PDF.
- Productkeuze (formaat/binding/papier) nog default-SKU; Henk bepaalt definitieve SKU.
- Live fulfilment pas na sandbox-test + `PRODIGI_ENV=live` + `confirmLive`.

## Secrets (Vercel Production / Preview)

| Variable | Required | Purpose |
|----------|----------|---------|
| `PRODIGI_API_KEY` | **yes** om te quoten/bestellen | API-key uit Prodigi dashboard (sandbox ≠ live) |
| `PRODIGI_ENV` | optional | `sandbox` (default) of `live` |
| `PRODIGI_DEFAULT_SKU` | optional | Default `BOOK-FE-A4-P-HARD-G` |

Zonder key: builder + export blijven werken; order-route antwoordt **503** met setup-hints.

### Henk setup

1. Account op [Prodigi](https://www.prodigi.com/) → sandbox + live keys.
2. Zet sandbox-key als `PRODIGI_API_KEY`, laat `PRODIGI_ENV` leeg/`sandbox`.
3. Test: Fotoboek → Export + Prodigi-quote → eventueel sandbox-bestelling (1 exemplaar).
4. Pas daarna live-key + `PRODIGI_ENV=live`.

Docs: [Print API reference](https://www.prodigi.com/print-api/docs/reference/).

## Data

- `photo_books` — draft/export/order-state (privé)
- `photo_book_items` — geordende `media_assets`
- Flags `book_candidate` / `book_favorite` op media blijven de selectiebron

## API

| Method | Path | Actie |
|--------|------|--------|
| GET/POST | `/api/trips/[tripId]/photo-books` | Lijst / nieuw concept |
| GET/PATCH/DELETE | `/api/photo-books/[bookId]` | Laden / metadata / wissen |
| PUT | `/api/photo-books/[bookId]/items` | Volgorde vervangen |
| POST | `/api/photo-books/[bookId]/export` | Payload + optioneel quote |
| POST | `/api/photo-books/[bookId]/order` | Echte Prodigi-order (of 503) |

## Out of scope deze slice

Kaart in boek, AI-layout, xlsx, reminders-secrets (aparte prio).
