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
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item.';
  end if;

  -- Lock and validate all product rows first to avoid race conditions.
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

  -- Apply stock updates and create order line items.
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

grant execute on function public.place_order(text, text, text, text, jsonb) to anon, authenticated, service_role;

