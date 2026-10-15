alter table public.planning_items
  add column if not exists carrier text,
  add column if not exists flight_number text,
  add column if not exists departure_terminal text,
  add column if not exists arrival_terminal text,
  add column if not exists seat_number text,
  add column if not exists external_url text;

alter table public.planning_items drop constraint if exists planning_items_kind_check;
alter table public.planning_items add constraint planning_items_kind_check
  check (kind in ('accommodation', 'flight', 'transport', 'activity', 'permit', 'note'));
alter table public.planning_items add constraint planning_items_external_url_check
  check (external_url is null or external_url ~ '^https?://');

create table public.trip_travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  role text not null default 'Reiziger' check (char_length(role) between 1 and 80),
  ticket_reference text not null default '' check (char_length(ticket_reference) <= 120),
  seat_notes text not null default '' check (char_length(seat_notes) <= 200),
  loyalty_number text not null default '' check (char_length(loyalty_number) <= 120),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_contacts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  role text not null default '' check (char_length(role) <= 120),
  phone text not null default '' check (char_length(phone) <= 80),
  email text not null default '' check (char_length(email) <= 254),
  address text not null default '' check (char_length(address) <= 500),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_budget_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_day_id uuid references public.trip_days(id) on delete set null,
  planning_item_id uuid references public.planning_items(id) on delete set null,
  category text not null default 'other' check (category in ('flight', 'stay', 'transport', 'activity', 'visa', 'insurance', 'food', 'other')),
  title text not null check (char_length(title) between 1 and 200),
  planned_amount numeric(12,2),
  actual_amount numeric(12,2),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payment_status text not null default 'unknown' check (payment_status in ('unknown', 'unpaid', 'paid')),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_amount is null or planned_amount >= 0),
  check (actual_amount is null or actual_amount >= 0)
);

alter table public.trip_open_items
  add column if not exists assigned_to text not null default '',
  add column if not exists due_on date,
  add column if not exists planning_item_id uuid references public.planning_items(id) on delete set null;
alter table public.trip_open_items add constraint trip_open_items_assigned_to_length check (char_length(assigned_to) <= 120);

create index trip_travelers_trip_idx on public.trip_travelers (trip_id, name);
create index trip_contacts_trip_idx on public.trip_contacts (trip_id, name);
create index trip_budget_entries_trip_idx on public.trip_budget_entries (trip_id, currency, created_at);
create index trip_open_items_trip_due_idx on public.trip_open_items (trip_id, status, due_on);

alter table public.trip_travelers enable row level security;
alter table public.trip_contacts enable row level security;
alter table public.trip_budget_entries enable row level security;

revoke all on table public.trip_travelers, public.trip_contacts, public.trip_budget_entries from anon;
grant select, insert, update, delete on table public.trip_travelers, public.trip_contacts, public.trip_budget_entries to authenticated;

create policy "Signed-in users can manage shared trip travelers" on public.trip_travelers for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared trip contacts" on public.trip_contacts for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared trip budget" on public.trip_budget_entries for all to authenticated using (true) with check (true);
