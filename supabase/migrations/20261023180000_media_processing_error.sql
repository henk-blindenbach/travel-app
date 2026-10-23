-- Durable last failure reason for journal photo complete/retry UI.
alter table public.media_assets
  add column if not exists processing_error text;

comment on column public.media_assets.processing_error is
  'Last complete/retry failure message for the owner UI; cleared when upload_status becomes ready.';
