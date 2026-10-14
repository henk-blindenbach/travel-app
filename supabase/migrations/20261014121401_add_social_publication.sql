alter table public.day_entries
  add column social_captions jsonb not null default '{}'::jsonb;

alter table public.media_assets
  add column is_public boolean not null default false;

create index media_assets_public_idx on public.media_assets (day_entry_id, is_public, sort_order);

create policy "Published day entries are publicly readable"
  on public.day_entries for select to anon, authenticated
  using (publication_status = 'published');

create policy "Published selected media metadata is publicly readable"
  on public.media_assets for select to anon, authenticated
  using (is_public and exists (
    select 1 from public.day_entries entry
    where entry.id = media_assets.day_entry_id
      and entry.publication_status = 'published'
  ));

create policy "Published selected web images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'trip-web-images'
    and exists (
      select 1 from public.media_assets asset
      join public.day_entries entry on entry.id = asset.day_entry_id
      where asset.web_object_path = name
        and asset.is_public
        and entry.publication_status = 'published'
    )
  );
