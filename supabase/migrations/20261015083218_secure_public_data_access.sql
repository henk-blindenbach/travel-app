-- Public requests are restricted both by rows and columns. The explicit
-- column grants prevent accidental exposure through future public queries.
revoke all on table public.trips from anon;
revoke all on table public.day_entries from anon;
revoke all on table public.media_assets from anon;

grant select (id, title, slug, starts_on, ends_on, countries, summary, status)
  on table public.trips to anon;
grant select (id, trip_id, day_number, day_date, title, actual_location, body, published_at)
  on table public.day_entries to anon;
grant select (id, day_entry_id, web_object_path, sort_order, updated_at)
  on table public.media_assets to anon;

drop policy if exists "Public trips are readable" on public.trips;
create policy "Anonymous visitors can read public trips"
  on public.trips for select to anon
  using (visibility = 'public');

drop policy if exists "Published day entries are publicly readable" on public.day_entries;
create policy "Anonymous visitors can read published public day entries"
  on public.day_entries for select to anon
  using (
    publication_status = 'published'
    and exists (
      select 1 from public.trips
      where trips.id = day_entries.trip_id
        and trips.visibility = 'public'
    )
  );

drop policy if exists "Published selected media metadata is publicly readable" on public.media_assets;
create policy "Anonymous visitors can read selected public media"
  on public.media_assets for select to anon
  using (
    is_public
    and exists (
      select 1
      from public.day_entries entry
      join public.trips trip on trip.id = entry.trip_id
      where entry.id = media_assets.day_entry_id
        and entry.publication_status = 'published'
        and trip.visibility = 'public'
    )
  );

drop policy if exists "Published selected web images are publicly readable" on storage.objects;
create policy "Anonymous visitors can read selected public web images"
  on storage.objects for select to anon
  using (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.media_assets asset
      join public.day_entries entry on entry.id = asset.day_entry_id
      join public.trips trip on trip.id = entry.trip_id
      where asset.web_object_path = name
        and asset.is_public
        and entry.publication_status = 'published'
        and trip.visibility = 'public'
    )
  );
