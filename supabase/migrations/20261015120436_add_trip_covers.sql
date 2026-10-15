create table public.trip_covers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  original_object_key text not null unique,
  web_object_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/heic', 'image/heif', 'image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  upload_status text not null default 'uploading' check (upload_status in ('uploading', 'processing', 'ready', 'failed')),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trip_covers enable row level security;

create policy "Signed-in users can manage shared trip covers"
  on public.trip_covers for all to authenticated using (true) with check (true);

revoke all on table public.trip_covers from anon;
grant select (id, trip_id, web_object_path, updated_at) on table public.trip_covers to anon;

create policy "Anonymous visitors can read public trip covers"
  on public.trip_covers for select to anon
  using (exists (
    select 1 from public.trips
    where trips.id = trip_covers.trip_id
      and trips.visibility = 'public'
  ));

create policy "Anonymous visitors can read public trip cover web images"
  on storage.objects for select to anon
  using (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.trip_covers cover
      join public.trips trip on trip.id = cover.trip_id
      where cover.web_object_path = name
        and cover.upload_status = 'ready'
        and trip.visibility = 'public'
    )
  );
