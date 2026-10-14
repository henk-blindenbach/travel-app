create table public.planning_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_day_id uuid references public.trip_days(id) on delete cascade,
  kind text not null check (kind in ('accommodation', 'flight', 'transport', 'activity', 'note')),
  status text not null default 'option' check (status in ('option', 'planned', 'confirmed')),
  title text not null check (char_length(title) between 1 and 200),
  details text not null default '',
  location text not null default '',
  starts_at time,
  ends_at time,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_day_id uuid references public.trip_days(id) on delete cascade,
  planning_item_id uuid references public.planning_items(id) on delete set null,
  document_type text not null check (document_type in ('hotel_confirmation', 'visa', 'flight_ticket', 'transport_ticket', 'excursion_ticket', 'insurance', 'other')),
  title text not null check (char_length(title) between 1 and 200),
  object_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 26214400),
  upload_status text not null default 'uploading' check (upload_status in ('uploading', 'ready', 'failed')),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index planning_items_trip_day_idx on public.planning_items (trip_id, trip_day_id, sort_order);
create index trip_documents_trip_day_type_idx on public.trip_documents (trip_id, trip_day_id, document_type, created_at desc);

alter table public.planning_items enable row level security;
alter table public.trip_documents enable row level security;

create policy "Trip members can manage planning items"
  on public.planning_items for all to authenticated
  using (exists (select 1 from public.trip_members member where member.trip_id = planning_items.trip_id and member.user_id = (select auth.uid())))
  with check (created_by = (select auth.uid()) and exists (select 1 from public.trip_members member where member.trip_id = planning_items.trip_id and member.user_id = (select auth.uid())));

create policy "Trip members can manage private documents"
  on public.trip_documents for all to authenticated
  using (exists (select 1 from public.trip_members member where member.trip_id = trip_documents.trip_id and member.user_id = (select auth.uid())))
  with check (created_by = (select auth.uid()) and exists (select 1 from public.trip_members member where member.trip_id = trip_documents.trip_id and member.user_id = (select auth.uid())));

grant select, insert, update, delete on public.planning_items, public.trip_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-documents', 'trip-documents', false, 26214400, array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = 26214400;

create policy "Trip members can read private documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'trip-documents' and exists (
    select 1 from public.trip_documents document
    join public.trip_members member on member.trip_id = document.trip_id
    where document.object_path = name and document.upload_status = 'ready' and member.user_id = (select auth.uid())
  ));

create policy "Trip members can upload private documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-documents' and exists (
    select 1 from public.trip_documents document
    join public.trip_members member on member.trip_id = document.trip_id
    where document.object_path = name and member.user_id = (select auth.uid())
  ));
