-- Allow authenticated trip workspace users to delete day entries, media rows,
-- and storage objects for private documents / web images.

grant delete on public.day_entries, public.media_assets to authenticated;

drop policy if exists "Signed-in users can delete private travel files" on storage.objects;
create policy "Signed-in users can delete private travel files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('trip-documents', 'trip-web-images'));
