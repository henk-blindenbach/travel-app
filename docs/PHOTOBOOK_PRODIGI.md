# Fotoboek / Prodigi Studio (B1)

Private boekbuilder per reis → **Prodigi Studio** template vullen → preview verplicht → sandbox quote/order → pad naar 1 live exemplaar met `confirmLive`.

## Wat werkt in de app

- Route: `/app/trips/[tripId]/fotoboek` (sidebar **Fotoboek**, ook via Meer en Foto’s).
- Conceptboek uit `book_candidate`-foto’s (favorieten eerst).
- Structuur: cover (titel/ondertitel) → optionele intro → per-dag foto’s + bijschriften/dagtitels.
- Optionele `route.summary` tekst uit geplande kaartpins (geen printkaart-afbeelding; nice-to-have).
- **Sync naar Prodigi Studio** → project-id + preview-URL op `photo_books`.
- **Preview bekijken + bevestigen** (`preview_acknowledged_at`) — verplicht vóór order.
- **Export** → JSON (structuur + quote-draft) + status `ready_for_prodigi`.
- **Bestellen** via Studio orders API; status `submitted` alleen na echte API-response.
- Live alleen met `PRODIGI_ENV=live` **én** `confirmLive=true` (UI-checkbox). Nooit auto-live.

## Wat Henk nog moet configureren

Zonder deze env vars blijft selectie/export werken; Studio-sync en order geven duidelijke 503/fouten — **geen nep print-ready boek**.

| Variable | Required | Purpose |
|----------|----------|---------|
| `PRODIGI_API_KEY` | **yes** voor Studio/quote/order | API-key uit Prodigi dashboard (sandbox ≠ live) |
| `PRODIGI_STUDIO_TEMPLATE_ID` | **yes** voor B1 Studio-sync | Id van een **gepubliceerde** photobook-template in [Prodigi Studio](https://studio.prodigi.com/) |
| `PRODIGI_DEFAULT_SKU` | strongly recommended | Default product-SKU (bv. hardcover A4). Template kan SKU overschrijven na sync |
| `PRODIGI_ENV` | optional | `sandbox` (default) of `live` |
| `PRODIGI_STUDIO_BASE_URL` | optional | Default `https://studio.prodigi.com` |

### Studio-template setup (Henk)

1. Account op [Prodigi](https://www.prodigi.com/) + inloggen op [Studio](https://studio.prodigi.com/).
2. **Book templates** → nieuw template voor het gekozen product/SKU (formaat/binding/papier).
3. Zet editable slots (aanbevolen keys die de app vult):
   - `cover.title`, `cover.subtitle`
   - `intro.body`
   - `day.{n}.title` (per dag)
   - `photo.{clientId}.caption` (per foto; `clientId` = `photo-<mediaAssetId>`)
   - `route.summary` (optioneel)
4. **Publish** de template → kopieer template-id → `PRODIGI_STUDIO_TEMPLATE_ID` in Vercel (Production + Preview) en Cursor env.
5. Zet sandbox-key als `PRODIGI_API_KEY`, laat `PRODIGI_ENV` leeg/`sandbox`.
6. In de app: selectie → Sync Studio → open preview → vink preview-ack → sandbox-order (1 exemplaar).
7. Pas daarna live-key + `PRODIGI_ENV=live` + checkbox **Bevestig live-order**.

Print API reference: [docs](https://www.prodigi.com/print-api/docs/reference/).  
Studio Photobook API: `POST/GET https://studio.prodigi.com/v1/books` (+ `/preflight`, `/render`, `/artifacts/pdf`, `/orders`) met header `X-API-Key`.

## Data

- `photo_books` — draft/export/order + Studio velden (`studio_project_id`, `studio_preview_url`, `preview_acknowledged_at`, …)
- `photo_book_items` — geordende `media_assets`
- Flags `book_candidate` / `book_favorite` op media blijven de selectiebron

## API

| Method | Path | Actie |
|--------|------|--------|
| GET/POST | `/api/trips/[tripId]/photo-books` | Lijst / nieuw concept |
| GET/PATCH/DELETE | `/api/photo-books/[bookId]` | Laden / metadata / wissen |
| PUT | `/api/photo-books/[bookId]/items` | Volgorde vervangen |
| POST | `/api/photo-books/[bookId]/export` | Payload + optioneel quote |
| POST | `/api/photo-books/[bookId]/studio` | Studio create + preflight + render |
| POST | `/api/photo-books/[bookId]/preview-ack` | Preview bevestigen / wissen |
| POST | `/api/photo-books/[bookId]/order` | Studio-order + submit (of 400/503) |

## Out of scope (deze slice)

Option C / masterplan-rijkdom, Peecho, multi-vendor, Pixum-pariteit, AI-layout, volledige routekaart-afbeelding in het boek.
