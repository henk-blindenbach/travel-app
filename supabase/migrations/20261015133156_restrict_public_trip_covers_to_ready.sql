drop policy if exists "Anonymous visitors can read public trip covers" on public.trip_covers;

create policy "Anonymous visitors can read ready public trip covers"
  on public.trip_covers for select to anon
  using (
    upload_status = 'ready'
    and exists (
      select 1 from public.trips
      where trips.id = trip_covers.trip_id
        and trips.visibility = 'public'
    )
  );
