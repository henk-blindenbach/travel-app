-- Do not make the Storage role traverse private trip rows. This function
-- returns only whether one opaque web-object path belongs to an already
-- selected, published image of a public trip.
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
      and trip.visibility = 'public'
  );
$$;

revoke all on function public.is_public_selected_media_web_path(text) from public;
grant execute on function public.is_public_selected_media_web_path(text) to anon;

drop policy if exists "Anonymous visitors can read selected public web images" on storage.objects;

create policy "Anonymous visitors can read selected public web images"
  on storage.objects for select to anon
  using (
    bucket_id = 'trip-web-images'
    and public.is_public_selected_media_web_path(name)
  );
