-- Private fotoboek drafts (plan-gaps prio 9 / masterplan §7 Fase 4).
-- Vendor-neutral selection + order metadata. Prodigi submit is optional and gated by API keys.

create table if not exists public.photo_books (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  subtitle text,
  status text not null default 'draft'
    check (status in ('draft', 'ready_for_prodigi', 'submitted', 'failed')),
  sku text not null default 'BOOK-FE-A4-P-HARD-G',
  copies integer not null default 1 check (copies >= 1 and copies <= 20),
  destination_country_code text not null default 'PT',
  shipping_method text not null default 'Standard'
    check (shipping_method in ('Budget', 'Standard', 'StandardPlus', 'Express', 'Overnight')),
  recipient jsonb not null default '{}'::jsonb,
  export_payload jsonb,
  prodigi_quote jsonb,
  prodigi_order_id text,
  prodigi_status text,
  last_error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_book_items (
  id uuid primary key default gen_random_uuid(),
  photo_book_id uuid not null references public.photo_books (id) on delete cascade,
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  sort_order integer not null default 0,
  caption_override text,
  created_at timestamptz not null default now(),
  unique (photo_book_id, media_asset_id)
);

create index if not exists photo_books_trip_idx
  on public.photo_books (trip_id, updated_at desc);

create index if not exists photo_book_items_book_order_idx
  on public.photo_book_items (photo_book_id, sort_order);

alter table public.photo_books enable row level security;
alter table public.photo_book_items enable row level security;

drop policy if exists "Signed-in users can manage shared photo books" on public.photo_books;
create policy "Signed-in users can manage shared photo books"
  on public.photo_books for all to authenticated
  using (true) with check (true);

drop policy if exists "Signed-in users can manage shared photo book items" on public.photo_book_items;
create policy "Signed-in users can manage shared photo book items"
  on public.photo_book_items for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.photo_books to authenticated;
grant select, insert, update, delete on public.photo_book_items to authenticated;

comment on table public.photo_books is
  'Private fotoboek draft per trip: metadata + Prodigi export/order state. Never public.';
comment on table public.photo_book_items is
  'Ordered photo selection for a photo_books draft. Source media must belong to the same trip.';
comment on column public.photo_books.status is
  'draft | ready_for_prodigi | submitted | failed. submitted only after a real Prodigi API response.';
