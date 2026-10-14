create policy "Published trip days are publicly readable"
  on public.trip_days for select to anon, authenticated
  using (exists (
    select 1 from public.day_entries entry
    where entry.trip_day_id = trip_days.id
      and entry.publication_status = 'published'
  ));
