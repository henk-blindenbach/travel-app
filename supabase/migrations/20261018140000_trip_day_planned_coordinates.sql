-- Planned map coordinates on trip days (generic trip platform; not trip-specific).
alter table public.trip_days
  add column if not exists planned_latitude double precision
    check (planned_latitude is null or (planned_latitude >= -90 and planned_latitude <= 90)),
  add column if not exists planned_longitude double precision
    check (planned_longitude is null or (planned_longitude >= -180 and planned_longitude <= 180));

comment on column public.trip_days.planned_latitude is 'Cached geocode of planned_location for map pins; nullable until resolved.';
comment on column public.trip_days.planned_longitude is 'Cached geocode of planned_location for map pins; nullable until resolved.';

-- Public projection: place label + coords only for public trips. Never booking secrets or EXIF GPS.
create or replace view public.public_trip_map_points
with (security_barrier = true)
as
select
  day.id,
  day.trip_id,
  day.day_number,
  day.day_date,
  coalesce(nullif(trim(day.planned_location), ''), nullif(trim(day.title), ''), 'Dag ' || day.day_number::text) as label,
  day.planned_latitude as latitude,
  day.planned_longitude as longitude,
  exists (
    select 1
    from public.day_entries entry
    where entry.trip_id = day.trip_id
      and entry.day_number = day.day_number
      and entry.publication_status = 'published'
  ) as day_published
from public.trip_days day
join public.trips trip on trip.id = day.trip_id
where trip.visibility = 'public'
  and day.planned_latitude is not null
  and day.planned_longitude is not null;

revoke all on public.public_trip_map_points from public;
grant select on public.public_trip_map_points to anon, authenticated;
