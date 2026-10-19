-- Classic unlisted: reachable by direct slug, never returned by anon trip list scans.
-- trips.visibility check already allows 'unlisted' (initial foundation).
-- Keep anon trips SELECT policy as visibility = 'public' so list queries cannot see unlisted rows.
-- Shareable content (days, media, covers, map, storage) allows public OR unlisted parents.

create or replace function public.get_shareable_trip_by_slug(p_slug text)
returns table (
  id uuid,
  title text,
  slug text,
  starts_on date,
  ends_on date,
  countries text[],
  summary text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    trip.id,
    trip.title,
    trip.slug,
    trip.starts_on,
    trip.ends_on,
    trip.countries,
    trip.summary,
    trip.status
  from public.trips trip
  where trip.slug = p_slug
    and trip.visibility in ('public', 'unlisted')
  limit 1;
$$;

revoke all on function public.get_shareable_trip_by_slug(text) from public;
grant execute on function public.get_shareable_trip_by_slug(text) to anon, authenticated;

-- Day entries / media: allow published content when parent trip is public or unlisted.
drop policy if exists "Anonymous visitors can read published public day entries" on public.day_entries;
create policy "Anonymous visitors can read published shareable day entries"
  on public.day_entries for select to anon
  using (
    publication_status = 'published'
    and exists (
      select 1 from public.trips
      where trips.id = day_entries.trip_id
        and trips.visibility in ('public', 'unlisted')
    )
  );

drop policy if exists "Anonymous visitors can read selected public media" on public.media_assets;
create policy "Anonymous visitors can read selected shareable media"
  on public.media_assets for select to anon
  using (
    is_public
    and exists (
      select 1
      from public.day_entries entry
      join public.trips trip on trip.id = entry.trip_id
      where entry.id = media_assets.day_entry_id
        and entry.publication_status = 'published'
        and trip.visibility in ('public', 'unlisted')
    )
  );

drop policy if exists "Anonymous visitors can read ready public trip covers" on public.trip_covers;
create policy "Anonymous visitors can read ready shareable trip covers"
  on public.trip_covers for select to anon
  using (
    upload_status = 'ready'
    and exists (
      select 1 from public.trips
      where trips.id = trip_covers.trip_id
        and trips.visibility in ('public', 'unlisted')
    )
  );

create or replace view public.public_trip_covers
with (security_barrier = true)
as
select cover.id, cover.trip_id, cover.web_object_path
from public.trip_covers cover
join public.trips trip on trip.id = cover.trip_id
where cover.upload_status = 'ready'
  and trip.visibility in ('public', 'unlisted');

revoke all on public.public_trip_covers from public;
grant select on public.public_trip_covers to anon;

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
where trip.visibility in ('public', 'unlisted')
  and day.planned_latitude is not null
  and day.planned_longitude is not null;

revoke all on public.public_trip_map_points from public;
grant select on public.public_trip_map_points to anon, authenticated;

create or replace function public.is_public_trip_cover_web_path(candidate_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_covers cover
    join public.trips trip on trip.id = cover.trip_id
    where cover.web_object_path = candidate_path
      and cover.upload_status = 'ready'
      and trip.visibility in ('public', 'unlisted')
  );
$$;

create or replace function public.is_public_selected_media_web_path(candidate_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media_assets asset
    join public.day_entries entry on entry.id = asset.day_entry_id
    join public.trips trip on trip.id = entry.trip_id
    where asset.web_object_path = candidate_path
      and asset.is_public
      and entry.publication_status = 'published'
      and trip.visibility in ('public', 'unlisted')
  );
$$;
