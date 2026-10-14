create policy "Trip creators can read their pending trips"
  on public.trips for select to authenticated
  using (created_by = (select auth.uid()));

create policy "Trip creators can delete their own trips"
  on public.trips for delete to authenticated
  using (created_by = (select auth.uid()));

grant delete on public.trips to authenticated;
