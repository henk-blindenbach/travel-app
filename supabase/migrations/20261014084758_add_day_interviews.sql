create table public.day_interviews (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null unique references public.trip_days(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.day_interviews enable row level security;

create policy "Trip members can read day interviews"
  on public.day_interviews for select to authenticated
  using (exists (
    select 1 from public.trip_days day join public.trip_members member on member.trip_id = day.trip_id
    where day.id = day_interviews.trip_day_id and member.user_id = (select auth.uid())
  ));

create policy "Trip members can create day interviews"
  on public.day_interviews for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (
    select 1 from public.trip_days day join public.trip_members member on member.trip_id = day.trip_id
    where day.id = day_interviews.trip_day_id and member.user_id = (select auth.uid())
  ));

create policy "Trip members can update day interviews"
  on public.day_interviews for update to authenticated
  using (exists (
    select 1 from public.trip_days day join public.trip_members member on member.trip_id = day.trip_id
    where day.id = day_interviews.trip_day_id and member.user_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.trip_days day join public.trip_members member on member.trip_id = day.trip_id
    where day.id = day_interviews.trip_day_id and member.user_id = (select auth.uid())
  ));

grant select, insert, update on public.day_interviews to authenticated;
