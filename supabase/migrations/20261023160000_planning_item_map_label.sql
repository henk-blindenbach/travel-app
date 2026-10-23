-- Optional short label for map pin popups (planning items).
-- Generic trip platform; no trip-specific hardcoding.

alter table public.planning_items
  add column if not exists map_label text;

alter table public.planning_items drop constraint if exists planning_items_map_label_length;
alter table public.planning_items
  add constraint planning_items_map_label_length
  check (map_label is null or char_length(map_label) <= 120);

comment on column public.planning_items.map_label is
  'Optional map pin label; when empty, UI falls back to location then title.';

-- Public planning pins: prefer map_label, never booking codes / phones / prices.
-- Drop+create: CREATE OR REPLACE cannot insert/rename view columns mid-list.
drop view if exists public.public_trip_planning_map_points;

create view public.public_trip_planning_map_points
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
  item.longitude,
  item.map_label,
  coalesce(
    nullif(trim(item.map_label), ''),
    nullif(trim(item.location), ''),
    item.title
  ) as label
from public.planning_items item
join public.trips trip on trip.id = item.trip_id
where trip.visibility in ('public', 'unlisted')
  and item.latitude is not null
  and item.longitude is not null
  and item.kind in ('accommodation', 'activity', 'transport', 'flight', 'permit');

revoke all on public.public_trip_planning_map_points from public;
grant select on public.public_trip_planning_map_points to anon, authenticated;

notify pgrst, 'reload schema';
