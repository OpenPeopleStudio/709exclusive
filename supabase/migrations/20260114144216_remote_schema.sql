


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'admin',
    'owner'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_adjust_inventory"("variant_id_input" "uuid", "delta_input" integer, "reason_input" "text", "actor_input" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."admin_adjust_inventory"("variant_id_input" "uuid", "delta_input" integer, "reason_input" "text", "actor_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_categories"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- === Income (#4CAF50 - Green) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Income', '#4CAF50', 10) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Payroll', '#81C784', 1),
    (p_user_id, v_parent_id, 'Other', '#81C784', 2),
    (p_user_id, v_parent_id, 'Refunds & Rebates', '#81C784', 3),
    (p_user_id, v_parent_id, 'Reimbursements', '#81C784', 4),
    (p_user_id, v_parent_id, 'Interest Earned', '#81C784', 5);

    -- === Transfers & Cash Flow (#2196F3 - Blue) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Transfers & Cash Flow', '#2196F3', 20) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Between Accounts', '#64B5F6', 1),
    (p_user_id, v_parent_id, 'Savings Contribution', '#64B5F6', 2),
    (p_user_id, v_parent_id, 'E-Transfer (Send/Receive)', '#64B5F6', 3);

    -- === Cash (#607D8B - Blue Grey) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Cash', '#607D8B', 25) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'ATM Withdrawal', '#90A4AE', 1),
    (p_user_id, v_parent_id, 'Deposit', '#90A4AE', 2);

    -- === Banking, Fees & Interest (#9E9E9E - Grey) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Banking, Fees & Interest', '#9E9E9E', 30) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Bank Fees', '#BDBDBD', 1),
    (p_user_id, v_parent_id, 'Interest Expense', '#BDBDBD', 2),
    (p_user_id, v_parent_id, 'Other Fees', '#BDBDBD', 3);

    -- === Debt & Financing (#F44336 - Red) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Debt & Financing', '#F44336', 40) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Credit Card Payment', '#E57373', 1),
    (p_user_id, v_parent_id, 'Loan/BNPL Payment', '#E57373', 2),
    (p_user_id, v_parent_id, 'Auto Loan/Lease', '#E57373', 3);

    -- === Housing & Utilities (#FF9800 - Orange) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Housing & Utilities', '#FF9800', 50) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Rent / Mortgage', '#FFB74D', 1),
    (p_user_id, v_parent_id, 'Utilities (Electric/Heat/Water)', '#FFB74D', 2),
    (p_user_id, v_parent_id, 'Internet & Mobile', '#FFB74D', 3),
    (p_user_id, v_parent_id, 'Home Services', '#FFB74D', 4);

    -- === Transportation (#03A9F4 - Light Blue) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Transportation', '#03A9F4', 60) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Fuel', '#4FC3F7', 1),
    (p_user_id, v_parent_id, 'Parking', '#4FC3F7', 2),
    (p_user_id, v_parent_id, 'Taxi & Rideshare', '#4FC3F7', 3),
    (p_user_id, v_parent_id, 'Car Wash', '#4FC3F7', 4),
    (p_user_id, v_parent_id, 'Vehicle Maintenance & Repairs', '#4FC3F7', 5),
    (p_user_id, v_parent_id, 'Insurance (Auto)', '#4FC3F7', 6),
    (p_user_id, v_parent_id, 'Registration & Licensing', '#4FC3F7', 7);

    -- === Food & Dining (#FFC107 - Amber) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Food & Dining', '#FFC107', 70) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Restaurants & Bars', '#FFD54F', 1),
    (p_user_id, v_parent_id, 'Coffee & Quick Service', '#FFD54F', 2),
    (p_user_id, v_parent_id, 'Delivery & Takeout Platforms', '#FFD54F', 3);

    -- === Groceries (#8BC34A - Light Green) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Groceries', '#8BC34A', 75) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Standard', '#AED581', 1),
    (p_user_id, v_parent_id, 'Wholesale / Big-Box', '#AED581', 2);

    -- === Health & Wellness (#009688 - Teal) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Health & Wellness', '#009688', 80) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Pharmacy', '#4DB6AC', 1),
    (p_user_id, v_parent_id, 'Medical / Clinics / Telemedicine', '#4DB6AC', 2),
    (p_user_id, v_parent_id, 'Dental / Vision', '#4DB6AC', 3),
    (p_user_id, v_parent_id, 'Fitness / Gym', '#4DB6AC', 4),
    (p_user_id, v_parent_id, 'Personal Care', '#4DB6AC', 5);

    -- === Shopping & Household (#E91E63 - Pink) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Shopping & Household', '#E91E63', 90) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Clothing & Footwear', '#F06292', 1),
    (p_user_id, v_parent_id, 'Accessories', '#F06292', 2),
    (p_user_id, v_parent_id, 'Beauty & Cosmetics', '#F06292', 3),
    (p_user_id, v_parent_id, 'Electronics', '#F06292', 4),
    (p_user_id, v_parent_id, 'Home & Housewares', '#F06292', 5),
    (p_user_id, v_parent_id, 'Household & Discount', '#F06292', 6),
    (p_user_id, v_parent_id, 'Party & Seasonal', '#F06292', 7),
    (p_user_id, v_parent_id, 'Online Marketplace', '#F06292', 8);

    -- === Subscriptions & Digital Services (Personal) (#9C27B0 - Purple) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Subscriptions & Digital Services (Personal)', '#9C27B0', 100) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Software & SaaS', '#BA68C8', 1),
    (p_user_id, v_parent_id, 'Streaming & Music', '#BA68C8', 2);

    -- === Entertainment & Events (#673AB7 - Deep Purple) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Entertainment & Events', '#673AB7', 110) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Movies & Venues', '#9575CD', 1),
    (p_user_id, v_parent_id, 'Events & Festivals', '#9575CD', 2),
    (p_user_id, v_parent_id, 'Tickets', '#9575CD', 3),
    (p_user_id, v_parent_id, 'Gaming', '#9575CD', 4);

    -- === Travel (#00BCD4 - Cyan) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Travel', '#00BCD4', 120) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Airfare', '#4DD0E1', 1),
    (p_user_id, v_parent_id, 'Lodging', '#4DD0E1', 2),
    (p_user_id, v_parent_id, 'Car Rental', '#4DD0E1', 3),
    (p_user_id, v_parent_id, 'Connectivity', '#4DD0E1', 4),
    (p_user_id, v_parent_id, 'Other', '#4DD0E1', 5);

    -- === Government & Taxes (#795548 - Brown) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Government & Taxes', '#795548', 130) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Taxes & Government Fees', '#A1887F', 1),
    (p_user_id, v_parent_id, 'Municipal Services (Non-Parking)', '#A1887F', 2);

    -- === Review / Catch-All (#D32F2F - Dark Red) ===
    INSERT INTO categories (user_id, name, color, sort) VALUES (p_user_id, 'Review / Catch-All', '#D32F2F', 999) RETURNING id INTO v_parent_id;
    INSERT INTO categories (user_id, parent_id, name, color, sort) VALUES
    (p_user_id, v_parent_id, 'Needs Review', '#EF5350', 1),
    (p_user_id, v_parent_id, 'Uncategorized', '#EF5350', 2);

    -- Note: Business categories are NOT created by default. They can be added later via onboarding.

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create categories for user %: %', p_user_id, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_default_categories"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_inventory"("variant_id_input" "uuid", "qty_input" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."finalize_inventory"("variant_id_input" "uuid", "qty_input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fulfill_order_item"("variant_id" "uuid", "qty" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."fulfill_order_item"("variant_id" "uuid", "qty" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_sku"("brand_input" "text", "model_input" "text", "size_input" "text", "condition_input" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."generate_sku"("brand_input" "text", "model_input" "text", "size_input" "text", "condition_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create profile (required)
    INSERT INTO profiles (id) VALUES (NEW.id);
    
    -- Create default categories (optional - don't fail signup if this fails)
    BEGIN
        PERFORM create_default_categories(NEW.id);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create default categories: %', SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow signup to complete
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_abandoned_reservations"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."release_abandoned_reservations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_reserved_inventory"("variant_id" "uuid", "qty" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update product_variants
  set reserved = greatest(reserved - qty, 0)
  where id = variant_id;

  if not found then
    raise exception 'Failed to release reserved inventory for variant %', variant_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."release_reserved_inventory"("variant_id" "uuid", "qty" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_reserved_inventory_admin"("variant_id_input" "uuid", "qty_to_release" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."release_reserved_inventory_admin"("variant_id_input" "uuid", "qty_to_release" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_inventory"("cart_items" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."reserve_inventory"("cart_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_inventory"("variant_id_input" "uuid", "qty_input" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."reserve_inventory"("variant_id_input" "uuid", "qty_input" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."709_profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role",
    "full_name" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."709_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "institution_id" "uuid",
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "currency" "text" DEFAULT 'CAD'::"text" NOT NULL,
    "last4" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_id" "uuid",
    "storage_path" "text" NOT NULL,
    "mime" "text" NOT NULL,
    "sha256" "text" NOT NULL,
    "source" "text" NOT NULL,
    "ocr_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "before" "jsonb",
    "after" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_type" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "name" "text" NOT NULL,
    "sort" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "color" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."engagement_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "goal_type" "text" NOT NULL,
    "target_value" integer NOT NULL,
    "current_progress" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institutions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."institutions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid",
    "delta" integer NOT NULL,
    "reason" "text" NOT NULL,
    "actor" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchant_aliases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "alias" "text" NOT NULL,
    "normalized" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."merchant_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "normalized" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "variant_id" "uuid",
    "qty" integer,
    "price_cents" integer
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "total_cents" integer,
    "stripe_payment_intent" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_creep_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "previous_amount_cents" bigint NOT NULL,
    "new_amount_cents" bigint NOT NULL,
    "detected_at" "date" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."price_creep_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "url" "text" NOT NULL,
    "position" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "sku" "text" NOT NULL,
    "size" "text",
    "condition" "text",
    "price_cents" integer NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "reserved" integer DEFAULT 0 NOT NULL,
    "first_sold_at" timestamp without time zone,
    CONSTRAINT "reserved_non_negative" CHECK (("reserved" >= 0)),
    CONSTRAINT "stock_non_negative" CHECK (("stock" >= 0))
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "brand" "text",
    "description" "text",
    "category" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "drop_starts_at" timestamp without time zone,
    "drop_ends_at" timestamp without time zone,
    "is_drop" boolean DEFAULT false
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "onboarding_completed" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reconciliation_matches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reconciliation_run_id" "uuid" NOT NULL,
    "statement_line_id" "uuid" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "score" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reconciliation_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reconciliation_runs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "statement_import_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "matched_count" integer DEFAULT 0 NOT NULL,
    "unmatched_count" integer DEFAULT 0 NOT NULL,
    "diff_cents" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reconciliation_runs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'complete'::"text"])))
);


ALTER TABLE "public"."reconciliation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_series" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "cadence" "text" NOT NULL,
    "typical_amount_cents" bigint NOT NULL,
    "currency" "text" DEFAULT 'CAD'::"text" NOT NULL,
    "last_seen_at" "date" NOT NULL,
    "next_due_date" "date",
    "confidence" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recurring_series" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 100 NOT NULL,
    "match_merchant_contains" "text",
    "match_memo_contains" "text",
    "match_account_id" "uuid",
    "action_set_category_id" "uuid",
    "action_set_merchant_name" "text",
    "action_mark_recurring" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."statement_imports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "opening_balance_cents" bigint,
    "closing_balance_cents" bigint,
    "source_file" "text" NOT NULL,
    "imported_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."statement_imports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."statement_lines" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "statement_import_id" "uuid" NOT NULL,
    "posted_at" "date",
    "occurred_at" "date",
    "amount_cents" bigint NOT NULL,
    "currency" "text" DEFAULT 'CAD'::"text" NOT NULL,
    "description" "text" NOT NULL,
    "raw" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."statement_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "last_event_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_fields" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "source" "text" NOT NULL,
    "confidence" numeric,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_fields_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'imported'::"text", 'ai'::"text", 'rule'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."transaction_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "posted_at" "date",
    "occurred_at" "date",
    "amount_cents" bigint NOT NULL,
    "currency" "text" DEFAULT 'CAD'::"text" NOT NULL,
    "direction" "text" NOT NULL,
    "merchant_raw" "text" NOT NULL,
    "merchant_id" "uuid",
    "memo_raw" "text",
    "category_id" "uuid",
    "status" "text" DEFAULT 'unmatched'::"text" NOT NULL,
    "external_id" "text",
    "import_source" "text" NOT NULL,
    "import_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transactions_direction_check" CHECK (("direction" = ANY (ARRAY['in'::"text", 'out'::"text"]))),
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['unmatched'::"text", 'matched'::"text", 'pending'::"text", 'excluded'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."variant_availability" AS
 SELECT "id",
    "stock",
    "reserved",
    ("stock" - "reserved") AS "available"
   FROM "public"."product_variants";


ALTER VIEW "public"."variant_availability" OWNER TO "postgres";


ALTER TABLE ONLY "public"."709_profiles"
    ADD CONSTRAINT "709_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_badge_type_key" UNIQUE ("user_id", "badge_type");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_parent_id_name_key" UNIQUE ("user_id", "parent_id", "name");



ALTER TABLE ONLY "public"."engagement_events"
    ADD CONSTRAINT "engagement_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."inventory_audit"
    ADD CONSTRAINT "inventory_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchant_aliases"
    ADD CONSTRAINT "merchant_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_creep_events"
    ADD CONSTRAINT "price_creep_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_reconciliation_run_id_statement_line_key" UNIQUE ("reconciliation_run_id", "statement_line_id");



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_reconciliation_run_id_transaction_id_key" UNIQUE ("reconciliation_run_id", "transaction_id");



ALTER TABLE ONLY "public"."reconciliation_runs"
    ADD CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recurring_series"
    ADD CONSTRAINT "recurring_series_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statement_imports"
    ADD CONSTRAINT "statement_imports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statement_lines"
    ADD CONSTRAINT "statement_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."transaction_fields"
    ADD CONSTRAINT "transaction_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_fields"
    ADD CONSTRAINT "transaction_fields_transaction_id_field_name_key" UNIQUE ("transaction_id", "field_name");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_accounts_institution" ON "public"."accounts" USING "btree" ("institution_id");



CREATE INDEX "idx_accounts_user" ON "public"."accounts" USING "btree" ("user_id");



CREATE INDEX "idx_attachments_transaction" ON "public"."attachments" USING "btree" ("user_id", "transaction_id");



CREATE INDEX "idx_attachments_user" ON "public"."attachments" USING "btree" ("user_id");



CREATE INDEX "idx_audit_log_created" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_entity" ON "public"."audit_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_log_user" ON "public"."audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_badges_user" ON "public"."badges" USING "btree" ("user_id");



CREATE INDEX "idx_categories_parent" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_user" ON "public"."categories" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_categories_user_name_root" ON "public"."categories" USING "btree" ("user_id", "name") WHERE ("parent_id" IS NULL);



CREATE INDEX "idx_engagement_events_created" ON "public"."engagement_events" USING "btree" ("created_at");



CREATE INDEX "idx_engagement_events_type" ON "public"."engagement_events" USING "btree" ("user_id", "event_type");



CREATE INDEX "idx_engagement_events_user" ON "public"."engagement_events" USING "btree" ("user_id");



CREATE INDEX "idx_goals_period" ON "public"."goals" USING "btree" ("user_id", "period", "period_start");



CREATE INDEX "idx_goals_user" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_institutions_user" ON "public"."institutions" USING "btree" ("user_id");



CREATE INDEX "idx_merchant_aliases_normalized" ON "public"."merchant_aliases" USING "btree" ("user_id", "normalized");



CREATE INDEX "idx_merchant_aliases_user" ON "public"."merchant_aliases" USING "btree" ("user_id");



CREATE INDEX "idx_merchants_normalized" ON "public"."merchants" USING "btree" ("user_id", "normalized");



CREATE INDEX "idx_merchants_user" ON "public"."merchants" USING "btree" ("user_id");



CREATE INDEX "idx_price_creep_merchant" ON "public"."price_creep_events" USING "btree" ("merchant_id");



CREATE INDEX "idx_price_creep_user" ON "public"."price_creep_events" USING "btree" ("user_id");



CREATE INDEX "idx_reconciliation_matches_run" ON "public"."reconciliation_matches" USING "btree" ("reconciliation_run_id");



CREATE INDEX "idx_reconciliation_runs_account" ON "public"."reconciliation_runs" USING "btree" ("account_id");



CREATE INDEX "idx_reconciliation_runs_user" ON "public"."reconciliation_runs" USING "btree" ("user_id");



CREATE INDEX "idx_recurring_series_merchant" ON "public"."recurring_series" USING "btree" ("merchant_id");



CREATE INDEX "idx_recurring_series_next_due" ON "public"."recurring_series" USING "btree" ("user_id", "next_due_date");



CREATE INDEX "idx_recurring_series_user" ON "public"."recurring_series" USING "btree" ("user_id");



CREATE INDEX "idx_rules_user" ON "public"."rules" USING "btree" ("user_id", "enabled", "priority");



CREATE INDEX "idx_statement_imports_account" ON "public"."statement_imports" USING "btree" ("account_id");



CREATE INDEX "idx_statement_imports_user" ON "public"."statement_imports" USING "btree" ("user_id");



CREATE INDEX "idx_statement_lines_date" ON "public"."statement_lines" USING "btree" ("posted_at");



CREATE INDEX "idx_statement_lines_import" ON "public"."statement_lines" USING "btree" ("statement_import_id");



CREATE INDEX "idx_transaction_fields_txn" ON "public"."transaction_fields" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_account_date" ON "public"."transactions" USING "btree" ("user_id", "account_id", "occurred_at");



CREATE INDEX "idx_transactions_category" ON "public"."transactions" USING "btree" ("category_id");



CREATE UNIQUE INDEX "idx_transactions_hash" ON "public"."transactions" USING "btree" ("user_id", "import_hash");



CREATE INDEX "idx_transactions_merchant" ON "public"."transactions" USING "btree" ("merchant_id");



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("user_id", "status");



ALTER TABLE ONLY "public"."709_profiles"
    ADD CONSTRAINT "709_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_events"
    ADD CONSTRAINT "engagement_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_audit"
    ADD CONSTRAINT "inventory_audit_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id");



ALTER TABLE ONLY "public"."merchant_aliases"
    ADD CONSTRAINT "merchant_aliases_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchant_aliases"
    ADD CONSTRAINT "merchant_aliases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."price_creep_events"
    ADD CONSTRAINT "price_creep_events_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_creep_events"
    ADD CONSTRAINT "price_creep_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_reconciliation_run_id_fkey" FOREIGN KEY ("reconciliation_run_id") REFERENCES "public"."reconciliation_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_statement_line_id_fkey" FOREIGN KEY ("statement_line_id") REFERENCES "public"."statement_lines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_matches"
    ADD CONSTRAINT "reconciliation_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_runs"
    ADD CONSTRAINT "reconciliation_runs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_runs"
    ADD CONSTRAINT "reconciliation_runs_statement_import_id_fkey" FOREIGN KEY ("statement_import_id") REFERENCES "public"."statement_imports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_runs"
    ADD CONSTRAINT "reconciliation_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_series"
    ADD CONSTRAINT "recurring_series_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_series"
    ADD CONSTRAINT "recurring_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_action_set_category_id_fkey" FOREIGN KEY ("action_set_category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_match_account_id_fkey" FOREIGN KEY ("match_account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."statement_imports"
    ADD CONSTRAINT "statement_imports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."statement_imports"
    ADD CONSTRAINT "statement_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."statement_lines"
    ADD CONSTRAINT "statement_lines_statement_import_id_fkey" FOREIGN KEY ("statement_import_id") REFERENCES "public"."statement_imports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."statement_lines"
    ADD CONSTRAINT "statement_lines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_fields"
    ADD CONSTRAINT "transaction_fields_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_fields"
    ADD CONSTRAINT "transaction_fields_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."709_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins can delete product images" ON "public"."product_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."709_profiles"
  WHERE (("709_profiles"."id" = "auth"."uid"()) AND ("709_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'owner'::"public"."user_role"]))))));



CREATE POLICY "Admins can insert product images" ON "public"."product_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."709_profiles"
  WHERE (("709_profiles"."id" = "auth"."uid"()) AND ("709_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'owner'::"public"."user_role"]))))));



CREATE POLICY "Admins read all orders" ON "public"."orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."709_profiles"
  WHERE (("709_profiles"."id" = "auth"."uid"()) AND ("709_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'owner'::"public"."user_role"]))))));



CREATE POLICY "Anyone can view product images" ON "public"."product_images" FOR SELECT USING (true);



CREATE POLICY "Customers read own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Users can insert own badges" ON "public"."badges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own engagement_events" ON "public"."engagement_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own goals" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own streaks" ON "public"."streaks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own goals" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own streaks" ON "public"."streaks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own badges" ON "public"."badges" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own engagement_events" ON "public"."engagement_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own goals" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own streaks" ON "public"."streaks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own profile" ON "public"."709_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_delete" ON "public"."accounts" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "accounts_insert" ON "public"."accounts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "accounts_select" ON "public"."accounts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "accounts_update" ON "public"."accounts" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_delete" ON "public"."attachments" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "attachments_insert" ON "public"."attachments" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "attachments_select" ON "public"."attachments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "attachments_update" ON "public"."attachments" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_insert" ON "public"."audit_log" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "audit_log_select" ON "public"."audit_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_delete" ON "public"."categories" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "categories_insert" ON "public"."categories" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "categories_select" ON "public"."categories" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "categories_update" ON "public"."categories" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."engagement_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."institutions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "institutions_delete" ON "public"."institutions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "institutions_insert" ON "public"."institutions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "institutions_select" ON "public"."institutions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "institutions_update" ON "public"."institutions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."merchant_aliases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "merchant_aliases_delete" ON "public"."merchant_aliases" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "merchant_aliases_insert" ON "public"."merchant_aliases" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "merchant_aliases_select" ON "public"."merchant_aliases" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "merchant_aliases_update" ON "public"."merchant_aliases" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."merchants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "merchants_delete" ON "public"."merchants" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "merchants_insert" ON "public"."merchants" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "merchants_select" ON "public"."merchants" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "merchants_update" ON "public"."merchants" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_creep_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "price_creep_events_insert" ON "public"."price_creep_events" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "price_creep_events_select" ON "public"."price_creep_events" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."reconciliation_matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reconciliation_matches_delete" ON "public"."reconciliation_matches" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "reconciliation_matches_insert" ON "public"."reconciliation_matches" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "reconciliation_matches_select" ON "public"."reconciliation_matches" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."reconciliation_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reconciliation_runs_delete" ON "public"."reconciliation_runs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "reconciliation_runs_insert" ON "public"."reconciliation_runs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "reconciliation_runs_select" ON "public"."reconciliation_runs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "reconciliation_runs_update" ON "public"."reconciliation_runs" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."recurring_series" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recurring_series_delete" ON "public"."recurring_series" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "recurring_series_insert" ON "public"."recurring_series" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "recurring_series_select" ON "public"."recurring_series" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "recurring_series_update" ON "public"."recurring_series" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rules_delete" ON "public"."rules" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "rules_insert" ON "public"."rules" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "rules_select" ON "public"."rules" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "rules_update" ON "public"."rules" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."statement_imports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "statement_imports_delete" ON "public"."statement_imports" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "statement_imports_insert" ON "public"."statement_imports" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "statement_imports_select" ON "public"."statement_imports" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "statement_imports_update" ON "public"."statement_imports" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."statement_lines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "statement_lines_delete" ON "public"."statement_lines" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "statement_lines_insert" ON "public"."statement_lines" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "statement_lines_select" ON "public"."statement_lines" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "statement_lines_update" ON "public"."statement_lines" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_fields" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transaction_fields_delete" ON "public"."transaction_fields" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "transaction_fields_insert" ON "public"."transaction_fields" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "transaction_fields_select" ON "public"."transaction_fields" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "transaction_fields_update" ON "public"."transaction_fields" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transactions_delete" ON "public"."transactions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "transactions_insert" ON "public"."transactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "transactions_select" ON "public"."transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "transactions_update" ON "public"."transactions" FOR UPDATE USING (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
























































































































































































































































































































GRANT ALL ON FUNCTION "public"."admin_adjust_inventory"("variant_id_input" "uuid", "delta_input" integer, "reason_input" "text", "actor_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_adjust_inventory"("variant_id_input" "uuid", "delta_input" integer, "reason_input" "text", "actor_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_adjust_inventory"("variant_id_input" "uuid", "delta_input" integer, "reason_input" "text", "actor_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_categories"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_categories"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_categories"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_inventory"("variant_id_input" "uuid", "qty_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_inventory"("variant_id_input" "uuid", "qty_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_inventory"("variant_id_input" "uuid", "qty_input" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fulfill_order_item"("variant_id" "uuid", "qty" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fulfill_order_item"("variant_id" "uuid", "qty" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fulfill_order_item"("variant_id" "uuid", "qty" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_sku"("brand_input" "text", "model_input" "text", "size_input" "text", "condition_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_sku"("brand_input" "text", "model_input" "text", "size_input" "text", "condition_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_sku"("brand_input" "text", "model_input" "text", "size_input" "text", "condition_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."release_abandoned_reservations"() TO "anon";
GRANT ALL ON FUNCTION "public"."release_abandoned_reservations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_abandoned_reservations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."release_reserved_inventory"("variant_id" "uuid", "qty" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_reserved_inventory"("variant_id" "uuid", "qty" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_reserved_inventory"("variant_id" "uuid", "qty" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."release_reserved_inventory_admin"("variant_id_input" "uuid", "qty_to_release" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_reserved_inventory_admin"("variant_id_input" "uuid", "qty_to_release" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_reserved_inventory_admin"("variant_id_input" "uuid", "qty_to_release" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_inventory"("cart_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_inventory"("cart_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_inventory"("cart_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_inventory"("variant_id_input" "uuid", "qty_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_inventory"("variant_id_input" "uuid", "qty_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_inventory"("variant_id_input" "uuid", "qty_input" integer) TO "service_role";





















GRANT ALL ON TABLE "public"."709_profiles" TO "anon";
GRANT ALL ON TABLE "public"."709_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."709_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_events" TO "anon";
GRANT ALL ON TABLE "public"."engagement_events" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_events" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."institutions" TO "anon";
GRANT ALL ON TABLE "public"."institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."institutions" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_audit" TO "anon";
GRANT ALL ON TABLE "public"."inventory_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_audit" TO "service_role";



GRANT ALL ON TABLE "public"."merchant_aliases" TO "anon";
GRANT ALL ON TABLE "public"."merchant_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."merchant_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."merchants" TO "anon";
GRANT ALL ON TABLE "public"."merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."price_creep_events" TO "anon";
GRANT ALL ON TABLE "public"."price_creep_events" TO "authenticated";
GRANT ALL ON TABLE "public"."price_creep_events" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reconciliation_matches" TO "anon";
GRANT ALL ON TABLE "public"."reconciliation_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."reconciliation_matches" TO "service_role";



GRANT ALL ON TABLE "public"."reconciliation_runs" TO "anon";
GRANT ALL ON TABLE "public"."reconciliation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."reconciliation_runs" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_series" TO "anon";
GRANT ALL ON TABLE "public"."recurring_series" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_series" TO "service_role";



GRANT ALL ON TABLE "public"."rules" TO "anon";
GRANT ALL ON TABLE "public"."rules" TO "authenticated";
GRANT ALL ON TABLE "public"."rules" TO "service_role";



GRANT ALL ON TABLE "public"."statement_imports" TO "anon";
GRANT ALL ON TABLE "public"."statement_imports" TO "authenticated";
GRANT ALL ON TABLE "public"."statement_imports" TO "service_role";



GRANT ALL ON TABLE "public"."statement_lines" TO "anon";
GRANT ALL ON TABLE "public"."statement_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."statement_lines" TO "service_role";



GRANT ALL ON TABLE "public"."streaks" TO "anon";
GRANT ALL ON TABLE "public"."streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."streaks" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_fields" TO "anon";
GRANT ALL ON TABLE "public"."transaction_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_fields" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."variant_availability" TO "anon";
GRANT ALL ON TABLE "public"."variant_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_availability" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































