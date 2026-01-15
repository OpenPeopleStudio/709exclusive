-- ===== sql/001_init.sql =====
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('customer', 'admin', 'owner');
  end if;
end $$;

create table if not exists "709_profiles" (
  id uuid primary key references auth.users on delete cascade,
  role user_role default 'customer',
  full_name text,
  created_at timestamp default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  brand text,
  description text,
  category text,
  created_at timestamp default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  size text,
  condition text,
  price_cents integer not null,
  stock integer not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users,
  status text default 'pending',
  total_cents integer,
  stripe_payment_intent text,
  created_at timestamp default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  variant_id uuid references product_variants,
  qty integer,
  price_cents integer
);

-- ===== sql/002_rls.sql =====
alter table "709_profiles" enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Users read own profile"
on "709_profiles" for select
using (auth.uid() = id);

create policy "Customers read own orders"
on orders for select
using (auth.uid() = customer_id);

create policy "Admins read all orders"
on orders for select
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

-- ===== sql/003_product_images.sql =====
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  url text not null,
  position integer default 0,
  created_at timestamp default now()
);

alter table product_images enable row level security;

-- Enable RLS
alter table product_images enable row level security;

-- Public read access for all images
create policy "Anyone can view product images"
on product_images for select
using (true);

-- Admin/owner only can insert/delete images
create policy "Admins can insert product images"
on product_images for insert
with check (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

create policy "Admins can delete product images"
on product_images for delete
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

-- ===== sql/004_drop_fields.sql =====
alter table products
add column if not exists drop_starts_at timestamp,
add column if not exists drop_ends_at timestamp,
add column if not exists is_drop boolean default false;

-- ===== sql/004_inventory_locking.sql =====
alter table product_variants
add column if not exists reserved integer not null default 0;

-- Safety: stock and reserved can never go negative
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'stock_non_negative'
    and table_name = 'product_variants'
  ) then
    alter table product_variants
    add constraint stock_non_negative check (stock >= 0);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'reserved_non_negative'
    and table_name = 'product_variants'
  ) then
    alter table product_variants
    add constraint reserved_non_negative check (reserved >= 0);
  end if;
end $$;

-- Helper view (optional but useful)
create or replace view variant_availability as
select
  id,
  stock,
  reserved,
  (stock - reserved) as available
from product_variants;

-- ===== sql/005_inventory_locking.sql =====
-- This column is already added in 004_inventory_locking.sql
-- alter table product_variants
-- add column reserved integer default 0;

-- ===== sql/005_reserve_inventory.sql =====
create or replace function reserve_inventory(
  variant_id_input uuid,
  qty_input integer
)
returns void
language plpgsql
as $$
declare
  available integer;
begin
  select stock - reserved
  into available
  from product_variants
  where id = variant_id_input
  for update;

  if available < qty_input then
    raise exception 'Insufficient stock';
  end if;

  update product_variants
  set reserved = reserved + qty_input
  where id = variant_id_input;
end;
$$;

-- ===== sql/006_finalize_inventory.sql =====
create or replace function finalize_inventory(
  variant_id_input uuid,
  qty_input integer
)
returns void
language plpgsql
as $$
begin
  update product_variants
  set
    stock = stock - qty_input,
    reserved = reserved - qty_input
  where id = variant_id_input;

  -- Update first_sold_at if this is the first sale
  perform update_first_sold_at(variant_id_input);
end;
$$;

-- ===== sql/006_inventory_reservation.sql =====
-- Function to reserve inventory for cart items
-- This runs in a transaction to prevent race conditions
create or replace function reserve_inventory(cart_items jsonb)
returns text
language plpgsql
security definer
as $$
declare
  item jsonb;
  variant_id uuid;
  qty integer;
  current_stock integer;
  current_reserved integer;
  available integer;
  reservation_id text;
begin
  -- Generate unique reservation ID
  reservation_id := 'res_' || gen_random_uuid()::text;

  -- Process each cart item
  for item in select * from jsonb_array_elements(cart_items)
  loop
    variant_id := (item->>'variant_id')::uuid;
    qty := (item->>'qty')::integer;

    -- Lock the variant row for update
    select stock, reserved into current_stock, current_reserved
    from product_variants
    where id = variant_id
    for update;

    -- Check if variant exists
    if current_stock is null then
      raise exception 'Product variant not found: %', variant_id;
    end if;

    -- Calculate available stock
    available := current_stock - current_reserved;

    -- Check if enough stock is available
    if available < qty then
      raise exception 'Insufficient stock for variant %: requested %, available %',
        variant_id, qty, available;
    end if;

    -- Reserve the inventory
    update product_variants
    set reserved = reserved + qty
    where id = variant_id;
  end loop;

  return reservation_id;
exception
  when others then
    -- Rollback will happen automatically
    raise exception '%', sqlerrm;
end;
$$;

-- ===== sql/007_order_fulfillment.sql =====
-- Function to fulfill an order item (decrement stock and reserved)
create or replace function fulfill_order_item(variant_id uuid, qty integer)
returns void
language plpgsql
security definer
as $$
begin
  update product_variants
  set stock = stock - qty,
      reserved = reserved - qty
  where id = variant_id
    and stock >= qty
    and reserved >= qty;

  if not found then
    raise exception 'Failed to fulfill order item: insufficient stock or reservation for variant %', variant_id;
  end if;
end;
$$;

-- Function to release reserved inventory (when payment fails)
create or replace function release_reserved_inventory(variant_id uuid, qty integer)
returns void
language plpgsql
security definer
as $$
begin
  update product_variants
  set reserved = greatest(reserved - qty, 0)
  where id = variant_id;

  if not found then
    raise exception 'Failed to release reserved inventory for variant %', variant_id;
  end if;
end;
$$;

-- ===== sql/007_reservation_timeout.sql =====
-- Function to release abandoned reservations (call periodically)
-- Releases reservations for orders that have been pending for too long
create or replace function release_abandoned_reservations()
returns integer
language plpgsql
as $$
declare
  abandoned_order record;
  item_record record;
  released_count integer := 0;
begin
  -- Find orders that are still pending after 30 minutes
  for abandoned_order in
    select id
    from orders
    where status = 'pending'
    and created_at < now() - interval '30 minutes'
  loop
    -- Get all items for this order
    for item_record in
      select variant_id, qty
      from order_items
      where order_id = abandoned_order.id
    loop
      -- Release the reservation
      update product_variants
      set reserved = greatest(reserved - item_record.qty, 0)
      where id = item_record.variant_id;

      released_count := released_count + item_record.qty;
    end loop;

    -- Mark order as expired
    update orders
    set status = 'expired'
    where id = abandoned_order.id;
  end loop;

  return released_count;
end;
$$;

-- ===== sql/007_sku_semantics.sql =====
alter table product_variants
add column if not exists brand text not null,
add column if not exists model text not null,
add column if not exists condition_code text not null,
add column if not exists sku text unique;

-- Enforce condition codes
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'valid_condition'
    and table_name = 'product_variants'
  ) then
    alter table product_variants
    add constraint valid_condition
    check (condition_code in ('DS','VNDS','USED'));
  end if;
end $$;

-- Add default values for existing rows (if any)
update product_variants
set
  brand = 'UNKNOWN',
  model = 'UNKNOWN',
  condition_code = 'DS'
where brand is null or model is null or condition_code is null;

-- ===== sql/008_generate_sku.sql =====
create or replace function generate_sku(
  brand_input text,
  model_input text,
  size_input text,
  condition_input text
)
returns text
language plpgsql
as $$
declare
  base text;
  hash text;
begin
  base := upper(brand_input)
          || '-' || upper(model_input)
          || '-' || upper(size_input)
          || '-' || upper(condition_input);

  hash := substr(md5(base || now()::text), 1, 4);

  return base || '-' || upper(hash);
end;
$$;

-- ===== sql/008_release_reserved.sql =====
-- Function for admin to manually release reserved inventory
create or replace function release_reserved_inventory_admin(
  variant_id_input uuid,
  qty_to_release integer
)
returns void
language plpgsql
security definer
as $$
begin
  -- Only allow if user is admin/owner
  if not exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin', 'owner')
  ) then
    raise exception 'Admin access required';
  end if;

  -- Release the specified amount from reserved
  update product_variants
  set reserved = greatest(reserved - qty_to_release, 0)
  where id = variant_id_input;

  if not found then
    raise exception 'Variant not found';
  end if;
end;
$$;

-- ===== sql/009_inventory_audit.sql =====
create table if not exists inventory_audit (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references product_variants,
  delta integer not null,
  reason text not null,
  actor uuid,
  created_at timestamp default now()
);

-- ===== sql/010_admin_adjust_inventory.sql =====
create or replace function admin_adjust_inventory(
  variant_id_input uuid,
  delta_input integer,
  reason_input text,
  actor_input uuid
)
returns void
language plpgsql
as $$
begin
  update product_variants
  set stock = stock + delta_input
  where id = variant_id_input;

  insert into inventory_audit (
    variant_id, delta, reason, actor
  ) values (
    variant_id_input, delta_input, reason_input, actor_input
  );
end;
$$;

-- ===== sql/011_variant_first_sold.sql =====
alter table product_variants
add column if not exists first_sold_at timestamp;

-- ===== sql/012_admin_analytics.sql =====
create or replace view admin_variant_analytics as
select
  pv.id,
  pv.sku,
  pv.stock,
  pv.reserved,
  coalesce(sum(oi.qty), 0) as sold_units,
  case
    when (coalesce(sum(oi.qty),0) + pv.stock) = 0 then 0
    else
      coalesce(sum(oi.qty),0)::float /
      (coalesce(sum(oi.qty),0) + pv.stock)
  end as sell_through_rate,
  pv.first_sold_at,
  case
    when pv.first_sold_at is not null
    then extract(epoch from (pv.first_sold_at - p.created_at))/86400
    else null
  end as days_to_first_sale
from product_variants pv
left join products p on p.id = pv.product_id
left join order_items oi on oi.variant_id = pv.id
group by pv.id, p.created_at;

-- ===== sql/012_order_status.sql =====
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'pending',     -- order created, payment not confirmed
      'paid',        -- payment succeeded
      'fulfilled',   -- picked/packed
      'shipped',     -- handed to carrier
      'cancelled',   -- admin cancelled before shipment
      'refunded'     -- refunded after payment
    );
  end if;
end $$;

-- Convert status column to enum type
do $$
begin
  -- Drop default if it exists
  if exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'status'
    and column_default is not null
  ) then
    alter table orders alter column status drop default;
  end if;

  -- Change column type
  alter table orders alter column status type order_status using status::order_status;

  -- Set new default
  alter table orders alter column status set default 'pending'::order_status;
end $$;

alter table orders
add column if not exists paid_at timestamp,
add column if not exists fulfilled_at timestamp,
add column if not exists shipped_at timestamp,
add column if not exists cancelled_at timestamp,
add column if not exists refunded_at timestamp;

-- ===== sql/013_shipping.sql =====
alter table orders
add column if not exists shipping_address jsonb not null,
add column if not exists shipping_cents integer not null default 0,
add column if not exists shipping_method text,
add column if not exists tracking_number text,
add column if not exists carrier text;

-- ===== sql/013_update_first_sold.sql =====
create or replace function update_first_sold_at(variant_id_input uuid)
returns void
language plpgsql
as $$
begin
  update product_variants
  set first_sold_at = now()
  where id = variant_id_input
    and first_sold_at is null;
end;
$$;

-- ===== sql/014_create_variant_with_sku.sql =====
create or replace function create_variant_with_sku(
  product_id_input uuid,
  brand_input text,
  model_input text,
  size_input text,
  condition_input text,
  price_input integer,
  stock_input integer
)
returns uuid
language plpgsql
as $$
declare
  generated_sku text;
  variant_id uuid;
begin
  -- Generate SKU
  generated_sku := generate_sku(brand_input, model_input, size_input, condition_input);

  -- Insert variant
  insert into product_variants (
    product_id,
    brand,
    model,
    size,
    condition,
    condition_code,
    sku,
    price_cents,
    stock
  ) values (
    product_id_input,
    brand_input,
    model_input,
    size_input,
    case
      when condition_input = 'DS' then 'Deadstock'
      when condition_input = 'VNDS' then 'Very Near Deadstock'
      when condition_input = 'USED' then 'Used'
      else condition_input
    end,
    condition_input,
    generated_sku,
    price_input,
    stock_input
  )
  returning id into variant_id;

  return variant_id;
end;
$$;

-- ===== sql/015_model_images.sql =====
create table if not exists product_models (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  slug text unique not null,
  created_at timestamp default now()
);

create table if not exists model_images (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references product_models on delete cascade,
  source text not null,          -- google | manual
  url text not null,             -- Supabase public URL
  is_primary boolean default false,
  position integer default 0,
  created_at timestamp default now()
);

-- RLS for product_models
alter table product_models enable row level security;

create policy "Anyone can view product models"
on product_models for select
using (true);

create policy "Admins can insert product models"
on product_models for insert
with check (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

create policy "Admins can update product models"
on product_models for update
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

-- RLS for model_images
alter table model_images enable row level security;

create policy "Anyone can view model images"
on model_images for select
using (true);

create policy "Admins can manage model images"
on model_images for all
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

-- ========================================
-- 024_maintenance_mode.sql
-- ========================================

CREATE TABLE IF NOT EXISTS site_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_flags_updated_at ON site_flags(updated_at DESC);

ALTER TABLE site_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read site flags" ON site_flags;
CREATE POLICY "Admins can read site flags"
ON site_flags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Public can read maintenance flag" ON site_flags;
CREATE POLICY "Public can read maintenance flag"
ON site_flags FOR SELECT
USING (key = 'maintenance_mode');

DROP POLICY IF EXISTS "Admins can manage site flags" ON site_flags;
CREATE POLICY "Admins can manage site flags"
ON site_flags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

INSERT INTO site_flags (key, value)
VALUES ('maintenance_mode', jsonb_build_object('enabled', false, 'message', null))
ON CONFLICT (key) DO NOTHING;
