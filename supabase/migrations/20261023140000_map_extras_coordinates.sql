-- Map extras: planning-item pins + published actual_location coords.
-- Generic trip platform; no trip-specific hardcoding.

alter table public.planning_items
  add column if not exists latitude double precision
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add column if not exists longitude double precision
    check (longitude is null or (longitude >= -180 and longitude <= 180));

comment on column public.planning_items.latitude is 'Cached geocode of location/address for map pins; nullable until resolved.';
comment on column public.planning_items.longitude is 'Cached geocode of location/address for map pins; nullable until resolved.';

alter table public.day_entries
  add column if not exists actual_latitude double precision
    check (actual_latitude is null or (actual_latitude >= -90 and actual_latitude <= 90)),
  add column if not exists actual_longitude double precision
    check (actual_longitude is null or (actual_longitude >= -180 and actual_longitude <= 180));

comment on column public.day_entries.actual_latitude is 'Cached geocode of actual_location for public visited pins; nullable until resolved.';
comment on column public.day_entries.actual_longitude is 'Cached geocode of actual_location for public visited pins; nullable until resolved.';

-- Public planning pins: title + place only (never booking codes / phones / prices).
create or replace view public.public_trip_planning_map_points
with (security_barrier = true)
as
select
  item.id,
  item.trip_id,
  item.kind,
  item.title,
  coalesce(
    nullif(trim(item.location), ''),
    nullif(trim(split_part(item.address, E'\n', 1)), ''),
    item.title
  ) as place,
  item.latitude,
  item.longitude
from public.planning_items item
join public.trips trip on trip.id = item.trip_id
where trip.visibility in ('public', 'unlisted')
  and item.latitude is not null
  and item.longitude is not null
  and item.kind in ('accommodation', 'activity', 'transport', 'flight', 'permit');

revoke all on public.public_trip_planning_map_points from public;
grant select on public.public_trip_planning_map_points to anon, authenticated;

-- Public visited pins from published actual_location (not EXIF).
create or replace view public.public_trip_visited_map_points
with (security_barrier = true)
as
select
  entry.id,
  entry.trip_id,
  entry.day_number,
  entry.day_date,
  coalesce(
    nullif(trim(entry.actual_location), ''),
    nullif(trim(entry.title), ''),
    'Dag ' || entry.day_number::text
  ) as label,
  entry.actual_latitude as latitude,
  entry.actual_longitude as longitude
from public.day_entries entry
join public.trips trip on trip.id = entry.trip_id
where trip.visibility in ('public', 'unlisted')
  and entry.publication_status = 'published'
  and entry.actual_latitude is not null
  and entry.actual_longitude is not null;

revoke all on public.public_trip_visited_map_points from public;
grant select on public.public_trip_visited_map_points to anon, authenticated;
