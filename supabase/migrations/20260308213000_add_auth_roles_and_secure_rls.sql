create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'user';
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    v_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  nullif(u.raw_user_meta_data->>'full_name', ''),
  case
    when not exists (select 1 from public.profiles p where p.role = 'admin') and row_number() over (order by u.created_at asc, u.id) = 1 then 'admin'
    else 'user'
  end as role
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_orders_user_id on public.orders(user_id);

create or replace function public.place_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_customer_address text,
  p_items jsonb
)
returns table (
  id uuid,
  order_number text,
  status text,
  item_count integer,
  total numeric,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id bigint;
  v_qty integer;
  v_stock integer;
  v_name text;
  v_price numeric(10, 2);
  v_total numeric(12, 2) := 0;
  v_item_count integer := 0;
  v_order_id uuid;
  v_order_number text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Please sign in to place an order.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'productId', '')::bigint;
    v_qty := nullif(v_item->>'qty', '')::integer;

    if v_product_id is null or v_qty is null or v_qty <= 0 then
      raise exception 'Invalid product payload in order.';
    end if;

    select name, price, stock
      into v_name, v_price, v_stock
    from public.products
    where products.id = v_product_id
    for update;

    if not found then
      raise exception 'Product % does not exist.', v_product_id;
    end if;

    if v_stock < v_qty then
      raise exception 'Insufficient stock for "%". Available: %, Requested: %.', v_name, v_stock, v_qty;
    end if;

    v_total := v_total + (v_price * v_qty);
    v_item_count := v_item_count + v_qty;
  end loop;

  v_order_number := 'ORD-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.orders (
    user_id,
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    status,
    item_count,
    total
  )
  values (
    v_user_id,
    v_order_number,
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_phone), ''),
    nullif(trim(p_customer_email), ''),
    nullif(trim(p_customer_address), ''),
    'New',
    v_item_count,
    v_total
  )
  returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'productId', '')::bigint;
    v_qty := nullif(v_item->>'qty', '')::integer;

    select name, price
      into v_name, v_price
    from public.products
    where products.id = v_product_id;

    update public.products
    set
      stock = stock - v_qty,
      updated_at = now()
    where products.id = v_product_id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      qty,
      unit_price,
      line_total
    )
    values (
      v_order_id,
      v_product_id,
      v_name,
      v_qty,
      v_price,
      v_price * v_qty
    );
  end loop;

  return query
  select
    o.id,
    o.order_number,
    o.status,
    o.item_count,
    o.total,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.customer_address,
    o.created_at
  from public.orders o
  where o.id = v_order_id;
end;
$$;

revoke execute on function public.place_order(text, text, text, text, jsonb) from anon;
grant execute on function public.place_order(text, text, text, text, jsonb) to authenticated, service_role;

drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Public write categories" on public.categories;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Public write products" on public.products;
drop policy if exists "Public read orders" on public.orders;
drop policy if exists "Public write orders" on public.orders;
drop policy if exists "Public read order items" on public.order_items;
drop policy if exists "Public write order items" on public.order_items;

create policy "Catalog read categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Catalog read products"
on public.products
for select
to anon, authenticated
using (true);

create policy "Admin manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admin manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Order read own_or_admin"
on public.orders
for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

create policy "Order admin update"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Order admin delete"
on public.orders
for delete
to authenticated
using (public.is_admin());

create policy "Order items read own_or_admin"
on public.order_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy "Order items admin manage"
on public.order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Profile read self_or_admin" on public.profiles;
drop policy if exists "Profile update self_or_admin" on public.profiles;

create policy "Profile read self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Profile update self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (id = auth.uid() and role = 'user')
);
