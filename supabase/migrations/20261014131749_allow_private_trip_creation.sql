alter table public.trips add column if not exists created_by uuid references auth.users(id) on delete restrict;

create policy "Users can create their own trips"
  on public.trips for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "Trip creators can add their own membership"
  on public.trip_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.trips trip where trip.id = trip_members.trip_id and trip.created_by = (select auth.uid()))
  );

create policy "Trip members can add private trip days"
  on public.trip_days for insert to authenticated
  with check (exists (
    select 1 from public.trip_members member
    where member.trip_id = trip_days.trip_id and member.user_id = (select auth.uid())
  ));

grant insert on public.trips, public.trip_members, public.trip_days to authenticated;
