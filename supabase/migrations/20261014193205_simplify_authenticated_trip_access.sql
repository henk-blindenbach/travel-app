-- Henk and Michel share one small private workspace. Access is intentionally
-- based on being signed in, not on a per-trip membership chain.

drop policy if exists "Members can read their trips" on public.trips;
drop policy if exists "Trip creators can read their pending trips" on public.trips;
drop policy if exists "Users can create their own trips" on public.trips;
drop policy if exists "Trip creators can delete their own trips" on public.trips;

drop policy if exists "Members can read their own membership" on public.trip_members;
drop policy if exists "Trip creators can add their own membership" on public.trip_members;

drop policy if exists "Trip members can read private trip days" on public.trip_days;
drop policy if exists "Trip members can add private trip days" on public.trip_days;
drop policy if exists "Trip members can update private trip days" on public.trip_days;

drop policy if exists "Trip members can manage planning items" on public.planning_items;
drop policy if exists "Trip members can manage private documents" on public.trip_documents;

drop policy if exists "Trip members can read private day entries" on public.day_entries;
drop policy if exists "Trip members can create private day entries" on public.day_entries;
drop policy if exists "Trip members can update private day entries" on public.day_entries;

drop policy if exists "Trip members can read day interviews" on public.day_interviews;
drop policy if exists "Trip members can create day interviews" on public.day_interviews;
drop policy if exists "Trip members can update day interviews" on public.day_interviews;

drop policy if exists "Trip members can read media metadata" on public.media_assets;
drop policy if exists "Trip members can create media metadata" on public.media_assets;
drop policy if exists "Trip members can update media metadata" on public.media_assets;

create policy "Signed-in users can manage shared trips"
  on public.trips for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared memberships"
  on public.trip_members for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared trip days"
  on public.trip_days for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared planning"
  on public.planning_items for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared documents"
  on public.trip_documents for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared day entries"
  on public.day_entries for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared interviews"
  on public.day_interviews for all to authenticated using (true) with check (true);
create policy "Signed-in users can manage shared media metadata"
  on public.media_assets for all to authenticated using (true) with check (true);

drop policy if exists "Trip members can read private documents" on storage.objects;
drop policy if exists "Trip members can upload private documents" on storage.objects;
drop policy if exists "Trip members can read private web images" on storage.objects;
drop policy if exists "Trip members can write private web images" on storage.objects;
drop policy if exists "Trip members can update private web images" on storage.objects;

create policy "Signed-in users can read shared trip files"
  on storage.objects for select to authenticated
  using (bucket_id in ('trip-documents', 'trip-web-images'));
create policy "Signed-in users can write shared trip files"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('trip-documents', 'trip-web-images'));
create policy "Signed-in users can update shared trip files"
  on storage.objects for update to authenticated
  using (bucket_id in ('trip-documents', 'trip-web-images'))
  with check (bucket_id in ('trip-documents', 'trip-web-images'));
