alter table public.day_entries
  add column if not exists trip_id uuid references public.trips(id) on delete cascade,
  add column if not exists day_number integer,
  add column if not exists day_date date;

update public.day_entries entry
set trip_id = day.trip_id,
    day_number = day.day_number,
    day_date = day.day_date
from public.trip_days day
where day.id = entry.trip_day_id
  and (entry.trip_id is null or entry.day_number is null or entry.day_date is null);

alter table public.day_entries
  alter column trip_id set not null,
  alter column day_number set not null,
  alter column day_date set not null;

create index if not exists day_entries_public_trip_day_idx
  on public.day_entries (trip_id, day_number, publication_status);

drop policy if exists "Members can read accessible trip days" on public.trip_days;
drop policy if exists "Published trip days are publicly readable" on public.trip_days;
create policy "Trip members can read private trip days"
  on public.trip_days for select to authenticated
  using (exists (
    select 1 from public.trip_members member
    where member.trip_id = trip_days.trip_id and member.user_id = (select auth.uid())
  ));

drop policy if exists "Trip members can read day entries" on public.day_entries;
drop policy if exists "Trip members can create day entries" on public.day_entries;
drop policy if exists "Trip members can update day entries" on public.day_entries;
create policy "Trip members can read private day entries"
  on public.day_entries for select to authenticated
  using (exists (
    select 1 from public.trip_members member
    where member.trip_id = day_entries.trip_id and member.user_id = (select auth.uid())
  ));
create policy "Trip members can create private day entries"
  on public.day_entries for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.trip_members member where member.trip_id = day_entries.trip_id and member.user_id = (select auth.uid()))
  );
create policy "Trip members can update private day entries"
  on public.day_entries for update to authenticated
  using (exists (select 1 from public.trip_members member where member.trip_id = day_entries.trip_id and member.user_id = (select auth.uid())))
  with check (exists (select 1 from public.trip_members member where member.trip_id = day_entries.trip_id and member.user_id = (select auth.uid())));

revoke all on public.trip_days from anon;
grant select on public.day_entries, public.media_assets to anon;
