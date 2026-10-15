create table public.trip_document_planning_items (
  document_id uuid not null references public.trip_documents(id) on delete cascade,
  planning_item_id uuid not null references public.planning_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, planning_item_id)
);

create index trip_document_planning_items_planning_item_id_idx
  on public.trip_document_planning_items(planning_item_id);

alter table public.trip_document_planning_items enable row level security;
revoke all on table public.trip_document_planning_items from anon, authenticated;
grant select, insert, update, delete on table public.trip_document_planning_items to authenticated;

create policy "Authenticated travel workspace can manage document item links"
  on public.trip_document_planning_items
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.trip_document_planning_items (document_id, planning_item_id)
select id, planning_item_id
from public.trip_documents
where planning_item_id is not null
on conflict do nothing;
