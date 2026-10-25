-- Public photo-EXIF map pins for the visited trail on shareable trips.
-- Only ready, is_public media with GPS on published days — no private originals.

create or replace view public.public_trip_photo_map_points
with (security_barrier = true)
as
select
  asset.id,
  entry.trip_id,
  entry.day_number,
  entry.day_date,
  coalesce(
    nullif(trim(asset.caption), ''),
    nullif(trim(asset.original_filename), ''),
    'Foto'
  ) as label,
  asset.latitude,
  asset.longitude,
  asset.captured_at
from public.media_assets asset
join public.day_entries entry on entry.id = asset.day_entry_id
join public.trips trip on trip.id = entry.trip_id
where trip.visibility in ('public', 'unlisted')
  and entry.publication_status = 'published'
  and asset.is_public
  and asset.upload_status = 'ready'
  and asset.latitude is not null
  and asset.longitude is not null;

revoke all on public.public_trip_photo_map_points from public;
grant select on public.public_trip_photo_map_points to anon, authenticated;
