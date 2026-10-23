-- Fotoboek B1: Prodigi Studio project + preview acknowledgement.
-- Print-ready books require a published Studio template (PRODIGI_STUDIO_TEMPLATE_ID).

alter table public.photo_books
  add column if not exists intro_text text,
  add column if not exists studio_template_id text,
  add column if not exists studio_project_id text,
  add column if not exists studio_preview_url text,
  add column if not exists studio_status text,
  add column if not exists studio_payload jsonb,
  add column if not exists studio_preflight jsonb,
  add column if not exists preview_acknowledged_at timestamptz;

comment on column public.photo_books.intro_text is
  'Optional intro copy for Studio text slots (cover/intro). Not public.';
comment on column public.photo_books.studio_template_id is
  'Published Prodigi Studio template id used for the last Studio sync.';
comment on column public.photo_books.studio_project_id is
  'Prodigi Studio book/project id from POST /v1/books.';
comment on column public.photo_books.studio_preview_url is
  'Studio preview URL (editor or PDF preview) for in-app review before order.';
comment on column public.photo_books.studio_status is
  'Last known Studio lifecycle status (created|preflight|rendered|failed|…).';
comment on column public.photo_books.studio_payload is
  'Last Studio create/render response (no secrets).';
comment on column public.photo_books.studio_preflight is
  'Last Studio preflight report (blocking issues + warnings).';
comment on column public.photo_books.preview_acknowledged_at is
  'Set when the user confirms they reviewed the Studio preview. Cleared on re-sync. Required before order.';
