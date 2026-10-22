-- Pin documents for "Snel bij de hand" on the road.
alter table public.trip_documents
  add column if not exists is_pinned boolean not null default false;

create index if not exists trip_documents_trip_pinned_idx
  on public.trip_documents (trip_id, is_pinned desc, created_at desc);
