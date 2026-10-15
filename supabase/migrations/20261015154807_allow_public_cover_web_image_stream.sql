-- The public image route has already verified the requested cover through the
-- read-only public view. Reuse that same bounded relation for Storage access,
-- so an anonymous request can retrieve only ready WebPs for public trips.
drop policy if exists "Anonymous visitors can read public trip cover web images" on storage.objects;

create policy "Anonymous visitors can read ready public trip cover web images"
  on storage.objects for select to anon
  using (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.public_trip_covers cover
      where cover.web_object_path = name
    )
  );
