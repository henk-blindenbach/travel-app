alter table public.planning_items add column if not exists arrives_on date;

create table public.trip_open_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_day_id uuid references public.trip_days(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  details text not null default '' check (char_length(details) <= 4000),
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);
alter table public.trip_open_items enable row level security;
grant select, insert, update, delete on public.trip_open_items to authenticated;
create policy "Authenticated users manage open items" on public.trip_open_items for all to authenticated using (true) with check (true);
