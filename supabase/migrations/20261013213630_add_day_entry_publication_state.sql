alter table public.day_entries
  add column publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published')),
  add column published_at timestamptz;

create index day_entries_publication_idx
  on public.day_entries (publication_status, published_at desc);
