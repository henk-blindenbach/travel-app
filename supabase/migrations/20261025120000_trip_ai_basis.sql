-- Private trip briefing for journal AI. Not granted to anon (summary stays public).
alter table public.trips
  add column if not exists ai_basis text;

comment on column public.trips.ai_basis is
  'Private AI briefing for day-journal interviews; never exposed on public trip pages.';

alter table public.trips drop constraint if exists trips_ai_basis_length;
alter table public.trips add constraint trips_ai_basis_length
  check (ai_basis is null or char_length(ai_basis) <= 2000);
