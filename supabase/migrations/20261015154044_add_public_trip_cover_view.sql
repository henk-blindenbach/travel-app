create view public.public_trip_covers
with (security_barrier = true)
as
select cover.id, cover.trip_id
from public.trip_covers cover
join public.trips trip on trip.id = cover.trip_id
where cover.upload_status = 'ready'
  and trip.visibility = 'public';

revoke all on public.public_trip_covers from public;
grant select on public.public_trip_covers to anon;
