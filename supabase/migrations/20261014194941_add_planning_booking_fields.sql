alter table public.planning_items
  add column if not exists booking_reference text,
  add column if not exists ticket_number text,
  add column if not exists departure_time time,
  add column if not exists arrival_time time,
  add column if not exists address text,
  add column if not exists contact_phone text,
  add column if not exists price_amount numeric(12,2),
  add column if not exists currency text,
  add column if not exists payment_status text not null default 'unknown';

alter table public.planning_items drop constraint if exists planning_items_payment_status_check;
alter table public.planning_items add constraint planning_items_payment_status_check
  check (payment_status in ('unknown', 'unpaid', 'paid'));
alter table public.planning_items drop constraint if exists planning_items_currency_format;
alter table public.planning_items add constraint planning_items_currency_format
  check (currency is null or currency ~ '^[A-Z]{3}$');
alter table public.planning_items drop constraint if exists planning_items_nonnegative_price;
alter table public.planning_items add constraint planning_items_nonnegative_price
  check (price_amount is null or price_amount >= 0);
