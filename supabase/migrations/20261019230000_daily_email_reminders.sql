-- Daily journal email reminders (plan-gaps prio 7).
-- Opt-out per user; send log prevents duplicate evening mails.

create table if not exists public.reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  sent_on date not null,
  channel text not null default 'email' check (channel in ('email')),
  created_at timestamptz not null default now(),
  unique (user_id, trip_day_id, sent_on, channel)
);

create index if not exists reminder_sends_day_idx
  on public.reminder_sends (trip_day_id, sent_on);

alter table public.reminder_preferences enable row level security;
alter table public.reminder_sends enable row level security;

drop policy if exists "Users manage own reminder preferences" on public.reminder_preferences;
create policy "Users manage own reminder preferences"
  on public.reminder_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sends are written by the service-role cron only; signed-in users may read their own log.
drop policy if exists "Users read own reminder sends" on public.reminder_sends;
create policy "Users read own reminder sends"
  on public.reminder_sends for select to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.reminder_preferences to authenticated;
grant select on public.reminder_sends to authenticated;

comment on table public.reminder_preferences is
  'Per-user opt-out for daily journal email reminders. Missing row = enabled.';
comment on table public.reminder_sends is
  'Idempotency log for reminder deliveries (one email per user/day/trip_day).';
