-- Journal content translations (nl source + en/pt).
-- Primary columns title / body / actual_location stay the Dutch source of truth.
-- One publication_status still covers the entry as a whole.

alter table public.day_entries
  add column if not exists title_i18n jsonb not null default '{}'::jsonb,
  add column if not exists body_i18n jsonb not null default '{}'::jsonb,
  add column if not exists actual_location_i18n jsonb not null default '{}'::jsonb;

comment on column public.day_entries.title_i18n is
  'Localized titles: { nl, en, pt }. Dutch also mirrored in title.';
comment on column public.day_entries.body_i18n is
  'Localized bodies: { nl, en, pt }. Dutch also mirrored in body.';
comment on column public.day_entries.actual_location_i18n is
  'Localized place labels: { nl, en, pt }. Dutch also mirrored in actual_location.';

-- Backfill nl from existing primary fields where maps are empty.
update public.day_entries
set
  title_i18n = case
    when coalesce(title_i18n, '{}'::jsonb) = '{}'::jsonb and coalesce(title, '') <> ''
      then jsonb_build_object('nl', title)
    else title_i18n
  end,
  body_i18n = case
    when coalesce(body_i18n, '{}'::jsonb) = '{}'::jsonb and coalesce(body, '') <> ''
      then jsonb_build_object('nl', body)
    else body_i18n
  end,
  actual_location_i18n = case
    when coalesce(actual_location_i18n, '{}'::jsonb) = '{}'::jsonb and coalesce(actual_location, '') <> ''
      then jsonb_build_object('nl', actual_location)
    else actual_location_i18n
  end
where coalesce(title, '') <> ''
   or coalesce(body, '') <> ''
   or coalesce(actual_location, '') <> '';

notify pgrst, 'reload schema';
