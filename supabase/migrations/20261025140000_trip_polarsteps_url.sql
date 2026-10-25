-- Public-safe Polarsteps trip URL (optional). Shown on public trip/day pages when set.
alter table public.trips
  add column if not exists polarsteps_url text;

comment on column public.trips.polarsteps_url is
  'Optional public Polarsteps trip URL; safe to show on public pages when set.';

alter table public.trips drop constraint if exists trips_polarsteps_url_length;
alter table public.trips add constraint trips_polarsteps_url_length
  check (polarsteps_url is null or char_length(polarsteps_url) <= 500);

alter table public.trips drop constraint if exists trips_polarsteps_url_https;
alter table public.trips add constraint trips_polarsteps_url_https
  check (
    polarsteps_url is null
    or polarsteps_url ~ '^https://([a-z0-9-]+\.)*polarsteps\.com(/|$)'
  );

-- Anon may read this column on public trips (column grants are explicit).
grant select (polarsteps_url) on table public.trips to anon;

-- Shareable trip RPC must return the URL for public/unlisted slug lookups.
-- Return type changed → drop first (CREATE OR REPLACE cannot widen OUT columns).
drop function if exists public.get_shareable_trip_by_slug(text);

create or replace function public.get_shareable_trip_by_slug(p_slug text)
returns table (
  id uuid,
  title text,
  slug text,
  starts_on date,
  ends_on date,
  countries text[],
  summary text,
  status text,
  polarsteps_url text
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
    trip.status,
    trip.polarsteps_url
  from public.trips trip
  where trip.slug = p_slug
    and trip.visibility in ('public', 'unlisted')
  limit 1;
$$;

revoke all on function public.get_shareable_trip_by_slug(text) from public;
grant execute on function public.get_shareable_trip_by_slug(text) to anon, authenticated;
