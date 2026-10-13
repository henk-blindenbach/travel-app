create table public.day_entries (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null unique references public.trip_days(id) on delete cascade,
  title text not null default '',
  actual_location text not null default '',
  body text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  day_entry_id uuid not null references public.day_entries(id) on delete cascade,
  original_object_key text not null unique,
  web_object_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/heic', 'image/heif', 'image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  caption text not null default '',
  sort_order integer not null default 0,
  upload_status text not null default 'uploading' check (upload_status in ('uploading', 'processing', 'ready', 'failed')),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_assets_day_entry_sort_idx on public.media_assets(day_entry_id, sort_order, created_at);

alter table public.day_entries enable row level security;
alter table public.media_assets enable row level security;

create policy "Trip members can read day entries"
  on public.day_entries for select to authenticated
  using (exists (
    select 1
    from public.trip_days trip_day
    join public.trip_members member on member.trip_id = trip_day.trip_id
    where trip_day.id = day_entries.trip_day_id
      and member.user_id = (select auth.uid())
  ));

create policy "Trip members can create day entries"
  on public.day_entries for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.trip_days trip_day
      join public.trip_members member on member.trip_id = trip_day.trip_id
      where trip_day.id = day_entries.trip_day_id
        and member.user_id = (select auth.uid())
    )
  );

create policy "Trip members can update day entries"
  on public.day_entries for update to authenticated
  using (exists (
    select 1
    from public.trip_days trip_day
    join public.trip_members member on member.trip_id = trip_day.trip_id
    where trip_day.id = day_entries.trip_day_id
      and member.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.trip_days trip_day
    join public.trip_members member on member.trip_id = trip_day.trip_id
    where trip_day.id = day_entries.trip_day_id
      and member.user_id = (select auth.uid())
  ));

create policy "Trip members can read media metadata"
  on public.media_assets for select to authenticated
  using (exists (
    select 1
    from public.day_entries entry
    join public.trip_days trip_day on trip_day.id = entry.trip_day_id
    join public.trip_members member on member.trip_id = trip_day.trip_id
    where entry.id = media_assets.day_entry_id
      and member.user_id = (select auth.uid())
  ));

create policy "Trip members can create media metadata"
  on public.media_assets for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.day_entries entry
      join public.trip_days trip_day on trip_day.id = entry.trip_day_id
      join public.trip_members member on member.trip_id = trip_day.trip_id
      where entry.id = media_assets.day_entry_id
        and member.user_id = (select auth.uid())
    )
  );

create policy "Trip members can update media metadata"
  on public.media_assets for update to authenticated
  using (exists (
    select 1
    from public.day_entries entry
    join public.trip_days trip_day on trip_day.id = entry.trip_day_id
    join public.trip_members member on member.trip_id = trip_day.trip_id
    where entry.id = media_assets.day_entry_id
      and member.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.day_entries entry
    join public.trip_days trip_day on trip_day.id = entry.trip_day_id
    join public.trip_members member on member.trip_id = trip_day.trip_id
    where entry.id = media_assets.day_entry_id
      and member.user_id = (select auth.uid())
  ));

grant select, insert, update on public.day_entries, public.media_assets to authenticated;

insert into storage.buckets (id, name, public)
values ('trip-web-images', 'trip-web-images', false)
on conflict (id) do update set public = false;

create policy "Trip members can read private web images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.media_assets asset
      join public.day_entries entry on entry.id = asset.day_entry_id
      join public.trip_days trip_day on trip_day.id = entry.trip_day_id
      join public.trip_members member on member.trip_id = trip_day.trip_id
      where asset.web_object_path = name
        and member.user_id = (select auth.uid())
    )
  );

create policy "Trip members can write private web images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.media_assets asset
      join public.day_entries entry on entry.id = asset.day_entry_id
      join public.trip_days trip_day on trip_day.id = entry.trip_day_id
      join public.trip_members member on member.trip_id = trip_day.trip_id
      where asset.web_object_path = name
        and member.user_id = (select auth.uid())
    )
  );

create policy "Trip members can update private web images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.media_assets asset
      join public.day_entries entry on entry.id = asset.day_entry_id
      join public.trip_days trip_day on trip_day.id = entry.trip_day_id
      join public.trip_members member on member.trip_id = trip_day.trip_id
      where asset.web_object_path = name
        and member.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'trip-web-images'
    and exists (
      select 1
      from public.media_assets asset
      join public.day_entries entry on entry.id = asset.day_entry_id
      join public.trip_days trip_day on trip_day.id = entry.trip_day_id
      join public.trip_members member on member.trip_id = trip_day.trip_id
      where asset.web_object_path = name
        and member.user_id = (select auth.uid())
    )
  );
