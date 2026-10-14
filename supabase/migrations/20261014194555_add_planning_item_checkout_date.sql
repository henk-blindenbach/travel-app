alter table public.planning_items
  add column if not exists ends_on date;

alter table public.planning_items drop constraint if exists planning_items_checkout_after_start;
alter table public.planning_items add constraint planning_items_checkout_after_start
  check (ends_on is null or trip_day_id is not null);

create index if not exists planning_items_trip_checkout_idx
  on public.planning_items (trip_id, ends_on)
  where ends_on is not null;
