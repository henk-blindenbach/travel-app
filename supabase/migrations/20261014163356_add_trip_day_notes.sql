alter table public.trip_days
  add column if not exists private_notes text not null default '';

alter table public.trip_days
  drop constraint if exists trip_days_private_notes_length;

alter table public.trip_days
  add constraint trip_days_private_notes_length
  check (char_length(private_notes) <= 4000);
