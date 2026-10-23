-- Anon day/media RLS referenced trips.visibility / day_entries.publication_status,
-- but anon has no SELECT on those columns (and trips RLS hides unlisted parents).
-- EXISTS subqueries then fail with permission denied — every public day URL 404'd
-- and selected media never appeared. Use SECURITY DEFINER helpers instead.

create or replace function public.trip_is_shareable(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trips trip
    where trip.id = p_trip_id
      and trip.visibility in ('public', 'unlisted')
  );
$$;

create or replace function public.day_entry_is_published_shareable(p_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.day_entries entry
    where entry.id = p_entry_id
      and entry.publication_status = 'published'
      and public.trip_is_shareable(entry.trip_id)
  );
$$;

revoke all on function public.trip_is_shareable(uuid) from public;
revoke all on function public.day_entry_is_published_shareable(uuid) from public;
grant execute on function public.trip_is_shareable(uuid) to anon, authenticated;
grant execute on function public.day_entry_is_published_shareable(uuid) to anon, authenticated;

drop policy if exists "Anonymous visitors can read published shareable day entries" on public.day_entries;
create policy "Anonymous visitors can read published shareable day entries"
  on public.day_entries for select to anon
  using (public.day_entry_is_published_shareable(id));

-- Public site selects title_i18n / body_i18n / actual_location_i18n (journal i18n).
grant select (title_i18n, body_i18n, actual_location_i18n) on table public.day_entries to anon;

-- Policy reads is_public on the same row; column grants must include it or anon
-- gets "permission denied for table media_assets" even for otherwise public rows.
grant select (is_public) on table public.media_assets to anon;

drop policy if exists "Anonymous visitors can read selected shareable media" on public.media_assets;
create policy "Anonymous visitors can read selected shareable media"
  on public.media_assets for select to anon
  using (
    is_public
    and public.day_entry_is_published_shareable(day_entry_id)
  );
