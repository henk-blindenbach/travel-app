# Fotoboek / Prodigi Studio (B1)

Private boekbuilder per reis → **Prodigi Studio** template vullen (named slots) → preview verplicht → sandbox quote/order → pad naar 1 live exemplaar met `confirmLive`.

## Wat werkt in de app

- Route: `/app/trips/[tripId]/fotoboek` (sidebar **Fotoboek**, ook via Meer en Foto’s).
- Conceptboek uit `book_candidate`-foto’s (favorieten eerst).
- Structuur: optionele intro (`story-text`) → land-hoofdstukken (multi-country) → per-dag pagina’s:
  - **Foto + verhaal:** `day-photo`, `day-title`, `day-meta`, `day-summary`
  - **Drie foto’s:** `day-photo-1..3`, `day-title-alt`, `day-caption`
  - **Hoofdstuk:** `chapter-photo`, `chapter-title`, `chapter-subtitle`
  - **Lang verhaal / opvulling:** `story-text`
- Pagina-keuze per dag op basis van aantal foto’s + bijschriften/dagtekst.
- Layflat-pagina’s: **even count 18–122** (opvullen met lege `story-text`-pagina’s; bij >122 bijsnijden + warning).
- Optionele `route.summary`-achtige tekst uit geplande kaartpins (als intro ontbreekt → `story-text`).
- **Sync naar Prodigi Studio** → project-id + preview-URL op `photo_books` (placements op **slot name**; `pageIndex`/`position` 5+ als secundaire hint).
- **Preview bekijken + bevestigen** (`preview_acknowledged_at`) — verplicht vóór order.
- **Export** → JSON (structuur + quote-draft) + status `ready_for_prodigi`.
- **Bestellen** via Studio orders API; status `submitted` alleen na echte API-response.
- Live alleen met `PRODIGI_ENV=live` **én** `confirmLive=true` (UI-checkbox). Nooit auto-live.

## Wat Henk nog moet configureren

Zonder API-key blijft selectie/export werken; Studio-sync en order geven duidelijke 503/fouten — **geen nep print-ready boek**.

| Variable | Required | Purpose |
|----------|----------|---------|
| `PRODIGI_API_KEY` | **yes** voor Studio/quote/order | API-key uit Prodigi dashboard (sandbox ≠ live) |
| `PRODIGI_STUDIO_TEMPLATE_ID` | strongly recommended | Id van de **opgeslagen** Studio-template. App-fallback: `112004b7-199e-4be5-a5f9-e1043876f6c8` |
| `PRODIGI_DEFAULT_SKU` | strongly recommended | Default product-SKU (Layflat A4). App has a matching code fallback when env is empty |
| `PRODIGI_ENV` | optional | `sandbox` (default) of `live` |
| `PRODIGI_STUDIO_BASE_URL` | optional | Default `https://studio.prodigi.com` |

### Studio-template setup (Henk)

1. Account op [Prodigi](https://www.prodigi.com/) + inloggen op [Studio](https://studio.prodigi.com/).
2. **Book templates** → template voor Layflat A4 (SKU = `PRODIGI_DEFAULT_SKU`) met de slot-namen hierboven.
3. **Opslaan** is genoeg voor de API. Studio heeft **geen** aparte “Publish for API”-stap.
4. De Studio-UI “Publish” / storefront **embed** (`PhotobookGenerator` / merchant snippet) is **niet** nodig voor deze app — we gebruiken alleen de Studio Photobook API (`/v1/books`, …).
5. Zet in Vercel (Production + Preview) en Cursor env:
   - `PRODIGI_STUDIO_TEMPLATE_ID=112004b7-199e-4be5-a5f9-e1043876f6c8`
   - `PRODIGI_DEFAULT_SKU` = Layflat A4 SKU (zelfde waarde als in Studio / code-fallback)
   - `PRODIGI_API_KEY` (sandbox eerst)
6. In de app: selectie → Sync Studio → open preview → vink preview-ack → sandbox-order (1 exemplaar).
7. Pas daarna live-key + `PRODIGI_ENV=live` + checkbox **Bevestig live-order**.

### Slot-map (Travel-app template)

| Page type | Slots |
|-----------|--------|
| Cover | `fc-title`, `spine-title`, `fc-img` |
| Dag foto + verhaal | `day-photo`, `day-title`, `day-meta`, `day-summary` |
| Dag 3 foto’s | `day-photo-1`, `day-photo-2`, `day-photo-3`, `day-title-alt`, `day-caption` |
| Hoofdstuk / land | `chapter-photo`, `chapter-title`, `chapter-subtitle` |
| Lang verhaal / blank pad | `story-text` |
| Layout-opvulling (template vereist) | `full-bleed-img0`, `two-vertical-img0/1`, `two-horizontal-img0/1`, `four-grid-img0..3` |

**API-regels (geverifieerd):** `assignmentMode=ordered`, `minimumImages=15`. `text`-keys moeten exacte `slotId`s zijn (geen `cover.title`, geen `0.story-text`). Image `clientId` = slotId. Extra reis-foto’s vullen layout-slots.

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

Option C / masterplan-rijkdom, Peecho, multi-vendor, Pixum-pariteit, AI-layout, volledige routekaart-afbeelding in het boek, storefront embed.
