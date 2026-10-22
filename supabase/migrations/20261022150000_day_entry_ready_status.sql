-- Allow "ready" (UI: Klaar) between draft and published for journal clarity.
alter table public.day_entries
  drop constraint if exists day_entries_publication_status_check;

alter table public.day_entries
  add constraint day_entries_publication_status_check
  check (publication_status in ('draft', 'ready', 'published'));
