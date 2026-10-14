-- Keep existing day IDs and their linked documents/journals, but align their number with the actual calendar date.
update public.trip_days set day_number = day_number + 100000;

update public.trip_days day
set day_number = (day.day_date - trip.starts_on) + 1
from public.trips trip
where trip.id = day.trip_id;

insert into public.trip_days (trip_id, day_number, day_date)
select trip.id, (calendar.day_date::date - trip.starts_on) + 1, calendar.day_date::date
from public.trips trip
cross join lateral generate_series(trip.starts_on, trip.ends_on, interval '1 day') as calendar(day_date)
on conflict (trip_id, day_date) do nothing;

create policy "Trip members can update private trip days"
  on public.trip_days for update to authenticated
  using (exists (
    select 1 from public.trip_members member
    where member.trip_id = trip_days.trip_id and member.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.trip_members member
    where member.trip_id = trip_days.trip_id and member.user_id = (select auth.uid())
  ));

grant update on public.trip_days to authenticated;
