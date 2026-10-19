# Prio 9 — Fotoboek / Prodigi (eerste slice)

## Werkt

- Privé UI `/app/trips/[tripId]/fotoboek`: kandidaten, volgorde, metadata, adres.
- Tabellen `photo_books` + `photo_book_items` (migratie toegepast).
- Export → `ready_for_prodigi` + JSON; order-route weigert zonder key (geen nep-success).
- Nav: sidebar, Meer, Foto’s.

## Placeholder / Henk

- Zonder `PRODIGI_API_KEY`: bestellen geblokkeerd; export wel.
- Geen Studio cover/spine/spreads; default SKU.
- Setup: `docs/PHOTOBOOK_PRODIGI.md` (`PRODIGI_API_KEY`, `PRODIGI_ENV`, `PRODIGI_DEFAULT_SKU`).

## plan-gaps

Prio 9 / §11 / Fase 4 → **Thin** (niet full E2E).
