# Prio 9 — Fotoboek / Prodigi Studio (B1)

## Werkt

- Privé UI `/app/trips/[tripId]/fotoboek`: kandidaten, volgorde, metadata, intro, adres.
- Tabellen `photo_books` + `photo_book_items` + Studio-kolommen (migratie `20261023140000_photo_books_studio.sql`).
- Studio-sync → project-id + preview-URL; preview-ack verplicht vóór order.
- Export → structuur-JSON + quote; order via Studio; `submitted` alleen na echte API-response.
- Live alleen met `confirmLive` (nooit auto-live).
- Nav: sidebar, Meer, Foto’s.

## Henk configureert

| Env | Status |
|-----|--------|
| `PRODIGI_API_KEY` | Vereist (sandbox eerst) |
| `PRODIGI_STUDIO_TEMPLATE_ID` | **Vereist** — gepubliceerde Studio-template |
| `PRODIGI_DEFAULT_SKU` | Sterk aangeraden als template SKU niet terugkomt |
| `PRODIGI_ENV` | `sandbox` default; `live` + UI-confirm voor 1 exemplaar |

Setup: `docs/PHOTOBOOK_PRODIGI.md`.

## plan-gaps

Prio 9 / §11 / Fase 4 → **B1 Studio Done** (niet optie C / Pixum-pariteit).
