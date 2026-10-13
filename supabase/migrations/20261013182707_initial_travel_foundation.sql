create table public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  starts_on date not null,
  ends_on date not null,
  countries text[] not null default '{}',
  summary text,
  status text not null default 'planning' check (status in ('idea', 'planning', 'booked', 'travelling', 'completed', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  day_date date not null,
  title text,
  planned_location text,
  planned_route text,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, day_number),
  unique (trip_id, day_date)
);

create index trip_days_trip_date_idx on public.trip_days (trip_id, day_date);
create index trip_members_user_idx on public.trip_members (user_id, trip_id);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_days enable row level security;

create policy "Public trips are readable"
  on public.trips for select to anon, authenticated
  using (visibility = 'public');

create policy "Members can read their trips"
  on public.trips for select to authenticated
  using (exists (
    select 1 from public.trip_members
    where trip_members.trip_id = trips.id
      and trip_members.user_id = (select auth.uid())
  ));

create policy "Members can read their own membership"
  on public.trip_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members can read accessible trip days"
  on public.trip_days for select to anon, authenticated
  using (exists (
    select 1 from public.trips
    where trips.id = trip_days.trip_id
      and (
        trips.visibility = 'public'
        or exists (
          select 1 from public.trip_members
          where trip_members.trip_id = trips.id
            and trip_members.user_id = (select auth.uid())
        )
      )
  ));

grant select on public.trips, public.trip_days to anon, authenticated;
grant select on public.trip_members to authenticated;

insert into public.trips (id, title, slug, starts_on, ends_on, countries, summary, status, visibility)
values (
  '2047b6fd-4f2b-4796-a462-72bc3b8f9265',
  'Nepal · Tibet · Bhutan · India',
  'nepal-tibet-bhutan-india-2026',
  '2026-11-01',
  '2026-12-07',
  array['Nepal', 'Tibet', 'Bhutan', 'India'],
  'Bergen, kloosters, levendige steden en ontmoetingen die bijblijven.',
  'planning',
  'public'
)
on conflict (id) do nothing;

insert into public.trip_days (trip_id, day_number, day_date, title, planned_location, planned_route, status)
values
  ('2047b6fd-4f2b-4796-a462-72bc3b8f9265', 1, '2026-11-01', 'Aankomst in Kathmandu', 'Kathmandu', 'Amsterdam → Kathmandu', 'planned'),
  ('2047b6fd-4f2b-4796-a462-72bc3b8f9265', 2, '2026-11-02', 'Kathmandu, in beweging', 'Kathmandu', 'Kathmandu', 'planned'),
  ('2047b6fd-4f2b-4796-a462-72bc3b8f9265', 3, '2026-11-03', 'Naar de bergen', 'Pokhara', 'Kathmandu → Pokhara', 'planned'),
  ('2047b6fd-4f2b-4796-a462-72bc3b8f9265', 4, '2026-11-04', 'Ghorepani', 'Ghorepani', 'Pokhara → Ghorepani', 'planned'),
  ('2047b6fd-4f2b-4796-a462-72bc3b8f9265', 5, '2026-11-06', 'Annapurna trekking', 'Ghorepani', 'Ghorepani → Poon Hill', 'planned')
on conflict (trip_id, day_number) do nothing;
