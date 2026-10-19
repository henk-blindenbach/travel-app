-- Private fotoboek flags (masterplan §6.2). Lean: candidate + favorite only.
-- cover_candidate deferred until Prodigi/fotoboek slice.
-- Anon already has column-level grants without these fields — do not grant them.

alter table public.media_assets
  add column if not exists book_candidate boolean not null default false,
  add column if not exists book_favorite boolean not null default false;

create index if not exists media_assets_book_candidate_idx
  on public.media_assets (day_entry_id, book_candidate)
  where book_candidate;

create index if not exists media_assets_book_favorite_idx
  on public.media_assets (day_entry_id, book_favorite)
  where book_favorite;

comment on column public.media_assets.book_candidate is
  'Private flag: photo is a fotoboek candidate. Not exposed to anon.';
comment on column public.media_assets.book_favorite is
  'Private flag: human favorite for fotoboek weighting. Not exposed to anon.';
