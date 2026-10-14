alter table public.planning_items
  add column if not exists is_optional boolean not null default false,
  add column if not exists duration_minutes integer,
  add column if not exists altitude_m integer;

alter table public.planning_items drop constraint if exists planning_items_duration_minutes_range;
alter table public.planning_items add constraint planning_items_duration_minutes_range
  check (duration_minutes is null or duration_minutes between 1 and 10080);

alter table public.planning_items drop constraint if exists planning_items_altitude_m_range;
alter table public.planning_items add constraint planning_items_altitude_m_range
  check (altitude_m is null or altitude_m between -500 and 10000);
