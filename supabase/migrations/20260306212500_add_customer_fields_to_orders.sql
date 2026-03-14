alter table public.orders
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_address text;

