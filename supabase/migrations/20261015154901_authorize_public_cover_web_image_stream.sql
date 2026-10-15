-- Storage policies run as the requesting role. Keep the public eligibility
-- check in one narrowly scoped definer function so the policy never needs
-- direct anonymous access to private trip columns.
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
      and trip.visibility = 'public'
  );
$$;

revoke all on function public.is_public_trip_cover_web_path(text) from public;
grant execute on function public.is_public_trip_cover_web_path(text) to anon;

drop policy if exists "Anonymous visitors can read ready public trip cover web images" on storage.objects;

create policy "Anonymous visitors can read ready public trip cover web images"
  on storage.objects for select to anon
  using (
    bucket_id = 'trip-web-images'
    and public.is_public_trip_cover_web_path(name)
  );
