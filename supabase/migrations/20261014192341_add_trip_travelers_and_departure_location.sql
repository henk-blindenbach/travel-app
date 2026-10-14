alter table public.trips
  add column if not exists travelers text,
  add column if not exists departure_location text;

alter table public.trips drop constraint if exists trips_travelers_length;
alter table public.trips add constraint trips_travelers_length
  check (travelers is null or char_length(travelers) <= 300);

alter table public.trips drop constraint if exists trips_departure_location_length;
alter table public.trips add constraint trips_departure_location_length
  check (departure_location is null or char_length(departure_location) <= 200);
