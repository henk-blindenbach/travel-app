# Prio 9 — Fotoboek / Prodigi Studio (B1)

## Werkt

- Privé UI `/app/trips/[tripId]/fotoboek`: kandidaten, volgorde, metadata, intro, adres.
- Tabellen `photo_books` + `photo_book_items` + Studio-kolommen (migratie `20261023140000_photo_books_studio.sql`).
- Named-slot sync naar Henk’s Travel-app template (`day-photo`, `day-photo-1..3`, `chapter-*`, `story-text`).
- Layflat even page count 18–122 (pad/trim).
- Studio-sync → project-id + preview-URL; preview-ack verplicht vóór order.
- Export → structuur-JSON + quote; order via Studio; `submitted` alleen na echte API-response.
- Live alleen met `confirmLive` (nooit auto-live).
- Nav: sidebar, Meer, Foto’s.

## Henk configureert

| Env | Status |
|-----|--------|
| `PRODIGI_API_KEY` | Vereist (sandbox eerst) |
| `PRODIGI_STUDIO_TEMPLATE_ID` | Opgeslagen template-id (fallback in code: `112004b7-…`). **Geen embed-publish nodig.** |
| `PRODIGI_DEFAULT_SKU` | Layflat A4 (fallback in code) |
| `PRODIGI_ENV` | `sandbox` default; `live` + UI-confirm voor 1 exemplaar |

Setup: `docs/PHOTOBOOK_PRODIGI.md`.

## plan-gaps

Prio 9 / §11 / Fase 4 → **B1 Studio Done** (niet optie C / Pixum-pariteit).
