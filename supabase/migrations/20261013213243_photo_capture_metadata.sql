alter table public.media_assets
  add column captured_at timestamptz,
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column location_source text check (location_source in ('photo_exif', 'manual'));

create index media_assets_captured_at_idx on public.media_assets(day_entry_id, captured_at);
