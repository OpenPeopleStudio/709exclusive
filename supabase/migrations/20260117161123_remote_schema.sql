create extension if not exists "wrappers" with schema "extensions";

create extension if not exists "postgis" with schema "public";

create type "public"."order_status" as enum ('pending', 'paid', 'fulfilled', 'shipped', 'cancelled', 'refunded');

alter table "public"."products" drop constraint "products_slug_key";

drop index if exists "public"."products_slug_key";

alter table "public"."709_profiles" alter column "role" drop default;

alter type "public"."user_role" rename to "user_role__old_version_to_be_dropped";

create type "public"."user_role" as enum ('customer', 'admin', 'owner', 'staff');


  create table "public"."account_deletions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "tenant_id" uuid,
    "email" text not null,
    "requested_at" timestamp with time zone default now(),
    "scheduled_for" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "status" text not null default 'pending'::text,
    "anonymization_details" jsonb default '{}'::jsonb,
    "requested_by" uuid
      );


alter table "public"."account_deletions" enable row level security;


  create table "public"."accounts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "institution_id" uuid,
    "name" text not null,
    "type" text not null,
    "currency" text not null default 'CAD'::text,
    "last4" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."accounts" enable row level security;


  create table "public"."activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "user_email" text,
    "action" text not null,
    "entity_type" text not null,
    "entity_id" text,
    "details" jsonb default '{}'::jsonb,
    "created_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."activity_logs" enable row level security;


  create table "public"."attachments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "transaction_id" uuid,
    "storage_path" text not null,
    "mime" text not null,
    "sha256" text not null,
    "source" text not null,
    "ocr_text" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."attachments" enable row level security;


  create table "public"."audit_log" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "entity_type" text not null,
    "entity_id" uuid not null,
    "action" text not null,
    "summary" text not null,
    "before" jsonb,
    "after" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."audit_log" enable row level security;


  create table "public"."badges" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "badge_type" text not null,
    "earned_at" timestamp with time zone not null default now()
      );


alter table "public"."badges" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "parent_id" uuid,
    "name" text not null,
    "sort" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "color" text
      );


alter table "public"."categories" enable row level security;


  create table "public"."chat_members" (
    "thread_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."chat_members" enable row level security;


  create table "public"."chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "thread_id" uuid,
    "sender_id" uuid,
    "content" text not null,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."chat_messages" enable row level security;


  create table "public"."chat_threads" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "type" text not null,
    "title" text,
    "created_by" uuid,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."chat_threads" enable row level security;


  create table "public"."consent_audit" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "tenant_id" uuid,
    "consent_type_code" text not null,
    "action" text not null,
    "previous_state" boolean,
    "new_state" boolean,
    "consent_version" integer,
    "changed_at" timestamp with time zone default now(),
    "ip_address" text,
    "user_agent" text,
    "details" jsonb default '{}'::jsonb
      );


alter table "public"."consent_audit" enable row level security;


  create table "public"."consent_types" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "description" text not null,
    "category" text not null,
    "is_required" boolean default false,
    "version" integer default 1,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."consent_types" enable row level security;


  create table "public"."consignment_items" (
    "id" uuid not null default gen_random_uuid(),
    "consignor_id" uuid not null,
    "variant_id" uuid,
    "status" text not null default 'active'::text,
    "list_price_cents" integer not null,
    "sold_price_cents" integer,
    "commission_cents" integer,
    "payout_cents" integer,
    "order_id" uuid,
    "created_at" timestamp without time zone default now(),
    "sold_at" timestamp without time zone,
    "tenant_id" uuid
      );


alter table "public"."consignment_items" enable row level security;


  create table "public"."consignment_payouts" (
    "id" uuid not null default gen_random_uuid(),
    "consignor_id" uuid not null,
    "amount_cents" integer not null,
    "method" text not null,
    "notes" text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp without time zone default now(),
    "completed_at" timestamp without time zone,
    "tenant_id" uuid
      );


alter table "public"."consignment_payouts" enable row level security;


  create table "public"."consignor_portal_access" (
    "id" uuid not null default gen_random_uuid(),
    "consignor_id" uuid not null,
    "email" text not null,
    "access_token" text not null,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone not null,
    "last_accessed_at" timestamp with time zone,
    "ip_address" text,
    "user_agent" text
      );


alter table "public"."consignor_portal_access" enable row level security;


  create table "public"."consignors" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text not null,
    "phone" text,
    "commission_rate" numeric(5,2) not null default 20.00,
    "balance_cents" integer not null default 0,
    "total_sales_cents" integer not null default 0,
    "total_paid_cents" integer not null default 0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "tenant_id" uuid,
    "payment_method_encrypted" text,
    "payment_notes_encrypted" text,
    "stripe_connect_id" text,
    "privacy_preferences" jsonb default '{}'::jsonb
      );


alter table "public"."consignors" enable row level security;


  create table "public"."data_exports" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "tenant_id" uuid,
    "export_type" text not null default 'complete_user_data'::text,
    "status" text not null default 'completed'::text,
    "file_size_bytes" integer,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."data_exports" enable row level security;


  create table "public"."drop_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "email" character varying(255) not null,
    "notified_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."drop_alerts" enable row level security;


  create table "public"."engagement_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "event_type" text not null,
    "points" integer not null default 0,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."engagement_events" enable row level security;


  create table "public"."goals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "period" text not null,
    "period_start" date not null,
    "goal_type" text not null,
    "target_value" integer not null,
    "current_progress" integer not null default 0,
    "status" text not null default 'active'::text,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."goals" enable row level security;


  create table "public"."guest_interactions" (
    "id" uuid not null default gen_random_uuid(),
    "guest_id" uuid not null,
    "interaction_type" text not null,
    "interaction_data" jsonb not null default '{}'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."guest_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "primary_email" text not null,
    "first_name" text,
    "last_name" text,
    "phone" text,
    "guest_type" text not null default 'prospect'::text,
    "tags" text[] not null default '{}'::text[],
    "notes" text,
    "source" text,
    "created_at" timestamp with time zone not null default now(),
    "last_contact" timestamp with time zone not null default now()
      );



  create table "public"."institutions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."institutions" enable row level security;


  create table "public"."inventory_audit" (
    "id" uuid not null default gen_random_uuid(),
    "variant_id" uuid,
    "delta" integer not null,
    "reason" text not null,
    "actor" uuid,
    "created_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );



  create table "public"."local_delivery_zones" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "country" text not null default 'CA'::text,
    "province" text not null default 'NL'::text,
    "city_names" text[] not null default '{}'::text[],
    "postal_fsa_prefixes" text[] not null default '{}'::text[],
    "active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."local_delivery_zones" enable row level security;


  create table "public"."merchant_aliases" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "merchant_id" uuid not null,
    "alias" text not null,
    "normalized" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."merchant_aliases" enable row level security;


  create table "public"."merchants" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "normalized" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."merchants" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "content" text not null,
    "sender_type" text not null,
    "read" boolean default false,
    "created_at" timestamp without time zone default now(),
    "encrypted" boolean default false,
    "iv" text,
    "sender_public_key" text,
    "message_index" integer default 0,
    "tenant_id" uuid
      );


alter table "public"."messages" enable row level security;


  create table "public"."model_images" (
    "id" uuid not null default gen_random_uuid(),
    "model_id" uuid,
    "source" text not null,
    "url" text not null,
    "is_primary" boolean default false,
    "position" integer default 0,
    "created_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."model_images" enable row level security;


  create table "public"."price_creep_events" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "merchant_id" uuid not null,
    "previous_amount_cents" bigint not null,
    "new_amount_cents" bigint not null,
    "detected_at" date not null,
    "note" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."price_creep_events" enable row level security;


  create table "public"."price_history" (
    "id" uuid not null default gen_random_uuid(),
    "variant_id" uuid not null,
    "price_cents" integer not null,
    "recorded_at" timestamp with time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."price_history" enable row level security;


  create table "public"."pricing_rules" (
    "id" uuid not null default gen_random_uuid(),
    "rule_type" text not null,
    "match_value" text not null,
    "multiplier" numeric(5,2) not null default 1.0,
    "active" boolean not null default true,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."pricing_rules" enable row level security;


  create table "public"."product_images" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid,
    "url" text not null,
    "position" integer default 0,
    "created_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."product_images" enable row level security;


  create table "public"."product_models" (
    "id" uuid not null default gen_random_uuid(),
    "brand" text not null,
    "model" text not null,
    "slug" text not null,
    "created_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."product_models" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "onboarding_completed" boolean default false
      );


alter table "public"."profiles" enable row level security;


  create table "public"."recently_viewed" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "viewed_at" timestamp with time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."recently_viewed" enable row level security;


  create table "public"."reconciliation_matches" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "reconciliation_run_id" uuid not null,
    "statement_line_id" uuid not null,
    "transaction_id" uuid not null,
    "score" numeric not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reconciliation_matches" enable row level security;


  create table "public"."reconciliation_runs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "account_id" uuid not null,
    "statement_import_id" uuid not null,
    "status" text not null default 'draft'::text,
    "matched_count" integer not null default 0,
    "unmatched_count" integer not null default 0,
    "diff_cents" bigint not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reconciliation_runs" enable row level security;


  create table "public"."recurring_series" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "merchant_id" uuid not null,
    "cadence" text not null,
    "typical_amount_cents" bigint not null,
    "currency" text not null default 'CAD'::text,
    "last_seen_at" date not null,
    "next_due_date" date,
    "confidence" numeric not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."recurring_series" enable row level security;


  create table "public"."retention_executions" (
    "id" uuid not null default gen_random_uuid(),
    "policy_id" uuid,
    "policy_name" text not null,
    "table_name" text not null,
    "rows_deleted" integer default 0,
    "execution_duration_ms" integer,
    "status" text not null,
    "error_message" text,
    "executed_at" timestamp with time zone default now()
      );


alter table "public"."retention_executions" enable row level security;


  create table "public"."retention_policies" (
    "id" uuid not null default gen_random_uuid(),
    "policy_name" text not null,
    "table_name" text not null,
    "retention_days" integer not null,
    "delete_column" text not null default 'created_at'::text,
    "enabled" boolean default true,
    "last_run_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."retention_policies" enable row level security;


  create table "public"."returns" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "return_type" text not null,
    "status" text not null default 'pending'::text,
    "reason" text not null,
    "inventory_action" text,
    "refund_amount_cents" integer,
    "notes" text,
    "created_by" uuid,
    "created_at" timestamp without time zone default now(),
    "completed_at" timestamp without time zone,
    "tenant_id" uuid
      );


alter table "public"."returns" enable row level security;


  create table "public"."rules" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "enabled" boolean not null default true,
    "priority" integer not null default 100,
    "match_merchant_contains" text,
    "match_memo_contains" text,
    "match_account_id" uuid,
    "action_set_category_id" uuid,
    "action_set_merchant_name" text,
    "action_mark_recurring" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."rules" enable row level security;


  create table "public"."shipping_methods" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "label" text not null,
    "description" text,
    "amount_cents" integer not null,
    "currency" text not null default 'cad'::text,
    "countries" text[] not null default '{CA}'::text[],
    "provinces" text[] not null default '{}'::text[],
    "requires_local_zone" boolean not null default false,
    "active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."shipping_methods" enable row level security;


  create table "public"."site_flags" (
    "key" text not null,
    "value" jsonb not null default '{}'::jsonb,
    "updated_at" timestamp with time zone not null default now(),
    "tenant_id" uuid
      );


alter table "public"."site_flags" enable row level security;


  create table "public"."staff_locations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "recorded_at" timestamp with time zone not null default now(),
    "latitude" double precision not null,
    "longitude" double precision not null,
    "accuracy_m" double precision,
    "task_id" text,
    "source" text default 'web'::text,
    "expires_at" timestamp with time zone not null default (now() + '48:00:00'::interval),
    "location" public.geography(Point,4326) generated always as ((public.st_setsrid(public.st_makepoint(longitude, latitude), 4326))::public.geography) stored,
    "tenant_id" uuid
      );


alter table "public"."staff_locations" enable row level security;


  create table "public"."statement_imports" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "account_id" uuid not null,
    "period_start" date not null,
    "period_end" date not null,
    "opening_balance_cents" bigint,
    "closing_balance_cents" bigint,
    "source_file" text not null,
    "imported_at" timestamp with time zone not null default now()
      );


alter table "public"."statement_imports" enable row level security;


  create table "public"."statement_lines" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "statement_import_id" uuid not null,
    "posted_at" date,
    "occurred_at" date,
    "amount_cents" bigint not null,
    "currency" text not null default 'CAD'::text,
    "description" text not null,
    "raw" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."statement_lines" enable row level security;


  create table "public"."stock_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "size" character varying(20) not null,
    "condition_code" character varying(20),
    "email" character varying(255) not null,
    "notified_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."stock_alerts" enable row level security;


  create table "public"."streaks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "current_streak" integer not null default 0,
    "longest_streak" integer not null default 0,
    "last_event_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."streaks" enable row level security;


  create table "public"."tenant_billing" (
    "tenant_id" uuid not null,
    "plan" text not null default 'starter'::text,
    "status" text not null default 'trialing'::text,
    "billing_email" text,
    "stripe_customer_id" text,
    "trial_ends_at" timestamp without time zone,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );



  create table "public"."tenant_domains" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "domain" text not null,
    "is_primary" boolean not null default false,
    "verified_at" timestamp without time zone,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."tenant_isolation_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "alert_type" text not null,
    "severity" text not null default 'medium'::text,
    "table_name" text not null,
    "operation" text not null,
    "user_id" uuid,
    "attempted_tenant_id" uuid,
    "user_tenant_id" uuid,
    "query_details" jsonb default '{}'::jsonb,
    "ip_address" text,
    "created_at" timestamp with time zone default now(),
    "resolved_at" timestamp with time zone,
    "resolved_by" uuid,
    "notes" text
      );


alter table "public"."tenant_isolation_alerts" enable row level security;


  create table "public"."tenant_isolation_tests" (
    "id" uuid not null default gen_random_uuid(),
    "test_name" text not null,
    "test_type" text not null,
    "table_name" text,
    "passed" boolean not null,
    "error_message" text,
    "test_details" jsonb default '{}'::jsonb,
    "executed_at" timestamp with time zone default now(),
    "executed_by" uuid
      );


alter table "public"."tenant_isolation_tests" enable row level security;


  create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "status" text not null default 'active'::text,
    "primary_domain" text,
    "settings" jsonb not null default '{}'::jsonb,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );



  create table "public"."transaction_fields" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "transaction_id" uuid not null,
    "field_name" text not null,
    "source" text not null,
    "confidence" numeric,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."transaction_fields" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "account_id" uuid not null,
    "posted_at" date,
    "occurred_at" date,
    "amount_cents" bigint not null,
    "currency" text not null default 'CAD'::text,
    "direction" text not null,
    "merchant_raw" text not null,
    "merchant_id" uuid,
    "memo_raw" text,
    "category_id" uuid,
    "status" text not null default 'unmatched'::text,
    "external_id" text,
    "import_source" text not null,
    "import_hash" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."transactions" enable row level security;


  create table "public"."user_consents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "tenant_id" uuid,
    "consent_type_code" text not null,
    "consent_given" boolean not null,
    "consent_version" integer not null,
    "consented_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone,
    "ip_address" text,
    "user_agent" text,
    "source" text default 'web'::text
      );


alter table "public"."user_consents" enable row level security;


  create table "public"."user_preferences" (
    "user_id" uuid not null,
    "preferred_size" character varying(20),
    "preferred_condition" character varying(20),
    "preferred_currency" character varying(3) default 'CAD'::character varying,
    "notifications_enabled" boolean default true,
    "marketing_emails" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "default_shipping_method" character varying(50),
    "saved_addresses" jsonb default '[]'::jsonb,
    "tenant_id" uuid
      );


alter table "public"."user_preferences" enable row level security;


  create table "public"."wishlist_items" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "variant_id" uuid,
    "size_preference" character varying(20),
    "condition_preference" character varying(20),
    "created_at" timestamp with time zone default now(),
    "tenant_id" uuid
      );


alter table "public"."wishlist_items" enable row level security;

alter table "public"."709_profiles" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "public"."709_profiles" alter column "role" set default 'customer'::public.user_role;

drop type "public"."user_role__old_version_to_be_dropped";

alter table "public"."709_profiles" add column "public_key" text;

alter table "public"."709_profiles" add column "public_key_updated_at" timestamp with time zone;

alter table "public"."709_profiles" add column "staff_location_opt_in" boolean default false;

alter table "public"."709_profiles" add column "tenant_id" uuid;

alter table "public"."709_profiles" enable row level security;

alter table "public"."order_items" add column "tenant_id" uuid;

alter table "public"."order_items" enable row level security;

alter table "public"."orders" add column "anonymized" boolean default false;

alter table "public"."orders" add column "anonymized_at" timestamp with time zone;

alter table "public"."orders" add column "cancelled_at" timestamp without time zone;

alter table "public"."orders" add column "carrier" text;

alter table "public"."orders" add column "crypto_charge_id" text;

alter table "public"."orders" add column "crypto_network" text;

alter table "public"."orders" add column "crypto_payment_status" text;

alter table "public"."orders" add column "crypto_transaction_id" text;

alter table "public"."orders" add column "currency" text not null default 'cad'::text;

alter table "public"."orders" add column "fulfilled_at" timestamp without time zone;

alter table "public"."orders" add column "nowpayments_invoice_id" text;

alter table "public"."orders" add column "paid_at" timestamp without time zone;

alter table "public"."orders" add column "payment_method" text default 'card'::text;

alter table "public"."orders" add column "refunded_at" timestamp without time zone;

alter table "public"."orders" add column "shipped_at" timestamp without time zone;

alter table "public"."orders" add column "shipping_address" jsonb not null;

alter table "public"."orders" add column "shipping_cents" integer not null default 0;

alter table "public"."orders" add column "shipping_method" text;

alter table "public"."orders" add column "subtotal_cents" integer not null default 0;

alter table "public"."orders" add column "tax_cents" integer not null default 0;

alter table "public"."orders" add column "tax_rate" numeric(6,4);

alter table "public"."orders" add column "tenant_id" uuid;

alter table "public"."orders" add column "tracking_number" text;

alter table "public"."orders" alter column "status" set default 'pending'::public.order_status;

alter table "public"."orders" alter column "status" set data type public.order_status using "status"::public.order_status;

alter table "public"."orders" enable row level security;

alter table "public"."product_variants" add column "brand" text not null;

alter table "public"."product_variants" add column "condition_code" text not null;

alter table "public"."product_variants" add column "first_sold_at" timestamp without time zone;

alter table "public"."product_variants" add column "model" text not null;

alter table "public"."product_variants" add column "reserved" integer not null default 0;

alter table "public"."product_variants" add column "sku" text not null;

alter table "public"."product_variants" add column "tenant_id" uuid;

alter table "public"."products" add column "drop_ends_at" timestamp without time zone;

alter table "public"."products" add column "drop_starts_at" timestamp without time zone;

alter table "public"."products" add column "is_drop" boolean default false;

alter table "public"."products" add column "tenant_id" uuid;

CREATE UNIQUE INDEX account_deletions_pkey ON public.account_deletions USING btree (id);

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX accounts_user_id_name_key ON public.accounts USING btree (user_id, name);

CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE UNIQUE INDEX attachments_pkey ON public.attachments USING btree (id);

CREATE UNIQUE INDEX audit_log_pkey ON public.audit_log USING btree (id);

CREATE UNIQUE INDEX badges_pkey ON public.badges USING btree (id);

CREATE UNIQUE INDEX badges_user_id_badge_type_key ON public.badges USING btree (user_id, badge_type);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_user_id_parent_id_name_key ON public.categories USING btree (user_id, parent_id, name);

CREATE UNIQUE INDEX chat_members_pkey ON public.chat_members USING btree (thread_id, user_id);

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE UNIQUE INDEX chat_threads_pkey ON public.chat_threads USING btree (id);

CREATE UNIQUE INDEX consent_audit_pkey ON public.consent_audit USING btree (id);

CREATE UNIQUE INDEX consent_types_code_key ON public.consent_types USING btree (code);

CREATE UNIQUE INDEX consent_types_pkey ON public.consent_types USING btree (id);

CREATE UNIQUE INDEX consignment_items_pkey ON public.consignment_items USING btree (id);

CREATE UNIQUE INDEX consignment_payouts_pkey ON public.consignment_payouts USING btree (id);

CREATE UNIQUE INDEX consignor_portal_access_access_token_key ON public.consignor_portal_access USING btree (access_token);

CREATE UNIQUE INDEX consignor_portal_access_pkey ON public.consignor_portal_access USING btree (id);

CREATE UNIQUE INDEX consignors_pkey ON public.consignors USING btree (id);

CREATE UNIQUE INDEX data_exports_pkey ON public.data_exports USING btree (id);

CREATE UNIQUE INDEX drop_alerts_pkey ON public.drop_alerts USING btree (id);

CREATE UNIQUE INDEX drop_alerts_user_id_product_id_key ON public.drop_alerts USING btree (user_id, product_id);

CREATE UNIQUE INDEX engagement_events_pkey ON public.engagement_events USING btree (id);

CREATE UNIQUE INDEX goals_pkey ON public.goals USING btree (id);

CREATE INDEX guest_interactions_guest_id_idx ON public.guest_interactions USING btree (guest_id);

CREATE UNIQUE INDEX guest_interactions_pkey ON public.guest_interactions USING btree (id);

CREATE INDEX guest_profiles_last_contact_idx ON public.guest_profiles USING btree (last_contact DESC);

CREATE UNIQUE INDEX guest_profiles_pkey ON public.guest_profiles USING btree (id);

CREATE UNIQUE INDEX guest_profiles_primary_email_key ON public.guest_profiles USING btree (primary_email);

CREATE INDEX idx_account_deletions_scheduled ON public.account_deletions USING btree (scheduled_for) WHERE (status = 'scheduled'::text);

CREATE INDEX idx_account_deletions_status ON public.account_deletions USING btree (status);

CREATE INDEX idx_account_deletions_tenant_id ON public.account_deletions USING btree (tenant_id);

CREATE INDEX idx_account_deletions_user_id ON public.account_deletions USING btree (user_id);

CREATE INDEX idx_accounts_institution ON public.accounts USING btree (institution_id);

CREATE INDEX idx_accounts_user ON public.accounts USING btree (user_id);

CREATE INDEX idx_activity_logs_action ON public.activity_logs USING btree (action);

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at DESC);

CREATE INDEX idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_activity_logs_tenant_id ON public.activity_logs USING btree (tenant_id);

CREATE INDEX idx_activity_logs_user ON public.activity_logs USING btree (user_id);

CREATE INDEX idx_attachments_transaction ON public.attachments USING btree (user_id, transaction_id);

CREATE INDEX idx_attachments_user ON public.attachments USING btree (user_id);

CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (created_at DESC);

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);

CREATE INDEX idx_audit_log_user ON public.audit_log USING btree (user_id);

CREATE INDEX idx_badges_user ON public.badges USING btree (user_id);

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);

CREATE INDEX idx_categories_user ON public.categories USING btree (user_id);

CREATE UNIQUE INDEX idx_categories_user_name_root ON public.categories USING btree (user_id, name) WHERE (parent_id IS NULL);

CREATE INDEX idx_chat_members_thread_id ON public.chat_members USING btree (thread_id);

CREATE INDEX idx_chat_members_user_id ON public.chat_members USING btree (user_id);

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);

CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages USING btree (thread_id);

CREATE INDEX idx_chat_threads_tenant_id ON public.chat_threads USING btree (tenant_id);

CREATE INDEX idx_consent_audit_changed_at ON public.consent_audit USING btree (changed_at DESC);

CREATE INDEX idx_consent_audit_type ON public.consent_audit USING btree (consent_type_code);

CREATE INDEX idx_consent_audit_user_id ON public.consent_audit USING btree (user_id);

CREATE INDEX idx_consignment_items_consignor ON public.consignment_items USING btree (consignor_id);

CREATE INDEX idx_consignment_items_status ON public.consignment_items USING btree (status);

CREATE INDEX idx_consignment_items_tenant_id ON public.consignment_items USING btree (tenant_id);

CREATE INDEX idx_consignment_payouts_consignor ON public.consignment_payouts USING btree (consignor_id);

CREATE INDEX idx_consignment_payouts_tenant_id ON public.consignment_payouts USING btree (tenant_id);

CREATE INDEX idx_consignor_portal_access_consignor ON public.consignor_portal_access USING btree (consignor_id);

CREATE INDEX idx_consignor_portal_access_expires ON public.consignor_portal_access USING btree (expires_at);

CREATE INDEX idx_consignor_portal_access_token ON public.consignor_portal_access USING btree (access_token);

CREATE INDEX idx_consignors_email ON public.consignors USING btree (email);

CREATE UNIQUE INDEX idx_consignors_tenant_email ON public.consignors USING btree (tenant_id, email);

CREATE INDEX idx_consignors_tenant_id ON public.consignors USING btree (tenant_id);

CREATE INDEX idx_data_exports_created_at ON public.data_exports USING btree (created_at DESC);

CREATE INDEX idx_data_exports_tenant_id ON public.data_exports USING btree (tenant_id);

CREATE INDEX idx_data_exports_user_id ON public.data_exports USING btree (user_id);

CREATE INDEX idx_drop_alerts_product ON public.drop_alerts USING btree (product_id);

CREATE INDEX idx_drop_alerts_tenant_id ON public.drop_alerts USING btree (tenant_id);

CREATE INDEX idx_engagement_events_created ON public.engagement_events USING btree (created_at);

CREATE INDEX idx_engagement_events_type ON public.engagement_events USING btree (user_id, event_type);

CREATE INDEX idx_engagement_events_user ON public.engagement_events USING btree (user_id);

CREATE INDEX idx_goals_period ON public.goals USING btree (user_id, period, period_start);

CREATE INDEX idx_goals_user ON public.goals USING btree (user_id);

CREATE INDEX idx_institutions_user ON public.institutions USING btree (user_id);

CREATE INDEX idx_inventory_audit_tenant_id ON public.inventory_audit USING btree (tenant_id);

CREATE INDEX idx_local_delivery_zones_active ON public.local_delivery_zones USING btree (active);

CREATE INDEX idx_local_delivery_zones_sort ON public.local_delivery_zones USING btree (sort_order);

CREATE INDEX idx_local_delivery_zones_tenant_id ON public.local_delivery_zones USING btree (tenant_id);

CREATE UNIQUE INDEX idx_local_delivery_zones_tenant_key ON public.local_delivery_zones USING btree (tenant_id, country, province, name);

CREATE INDEX idx_merchant_aliases_normalized ON public.merchant_aliases USING btree (user_id, normalized);

CREATE INDEX idx_merchant_aliases_user ON public.merchant_aliases USING btree (user_id);

CREATE INDEX idx_merchants_normalized ON public.merchants USING btree (user_id, normalized);

CREATE INDEX idx_merchants_user ON public.merchants USING btree (user_id);

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);

CREATE INDEX idx_messages_customer_id ON public.messages USING btree (customer_id);

CREATE INDEX idx_messages_encrypted ON public.messages USING btree (customer_id, sender_type) WHERE (encrypted = true);

CREATE INDEX idx_messages_sender_public_key ON public.messages USING btree (sender_public_key) WHERE (sender_public_key IS NOT NULL);

CREATE INDEX idx_messages_tenant_id ON public.messages USING btree (tenant_id);

CREATE INDEX idx_model_images_tenant_id ON public.model_images USING btree (tenant_id);

CREATE INDEX idx_order_items_tenant_id ON public.order_items USING btree (tenant_id);

CREATE INDEX idx_orders_anonymized ON public.orders USING btree (anonymized) WHERE (anonymized = true);

CREATE INDEX idx_orders_nowpayments_invoice_id ON public.orders USING btree (nowpayments_invoice_id);

CREATE INDEX idx_orders_tenant_id ON public.orders USING btree (tenant_id);

CREATE INDEX idx_price_creep_merchant ON public.price_creep_events USING btree (merchant_id);

CREATE INDEX idx_price_creep_user ON public.price_creep_events USING btree (user_id);

CREATE INDEX idx_price_history_tenant_id ON public.price_history USING btree (tenant_id);

CREATE INDEX idx_price_history_variant ON public.price_history USING btree (variant_id, recorded_at DESC);

CREATE INDEX idx_pricing_rules_active ON public.pricing_rules USING btree (active);

CREATE INDEX idx_pricing_rules_tenant_id ON public.pricing_rules USING btree (tenant_id);

CREATE INDEX idx_pricing_rules_type ON public.pricing_rules USING btree (rule_type);

CREATE INDEX idx_product_images_tenant_id ON public.product_images USING btree (tenant_id);

CREATE INDEX idx_product_models_tenant_id ON public.product_models USING btree (tenant_id);

CREATE UNIQUE INDEX idx_product_models_tenant_slug ON public.product_models USING btree (tenant_id, slug);

CREATE INDEX idx_products_tenant_id ON public.products USING btree (tenant_id);

CREATE UNIQUE INDEX idx_products_tenant_slug ON public.products USING btree (tenant_id, slug);

CREATE INDEX idx_profiles_public_key ON public."709_profiles" USING btree (id) WHERE (public_key IS NOT NULL);

CREATE INDEX idx_profiles_tenant_id ON public."709_profiles" USING btree (tenant_id);

CREATE INDEX idx_recently_viewed_tenant_id ON public.recently_viewed USING btree (tenant_id);

CREATE INDEX idx_recently_viewed_user ON public.recently_viewed USING btree (user_id, viewed_at DESC);

CREATE INDEX idx_reconciliation_matches_run ON public.reconciliation_matches USING btree (reconciliation_run_id);

CREATE INDEX idx_reconciliation_runs_account ON public.reconciliation_runs USING btree (account_id);

CREATE INDEX idx_reconciliation_runs_user ON public.reconciliation_runs USING btree (user_id);

CREATE INDEX idx_recurring_series_merchant ON public.recurring_series USING btree (merchant_id);

CREATE INDEX idx_recurring_series_next_due ON public.recurring_series USING btree (user_id, next_due_date);

CREATE INDEX idx_recurring_series_user ON public.recurring_series USING btree (user_id);

CREATE INDEX idx_retention_executions_executed ON public.retention_executions USING btree (executed_at DESC);

CREATE INDEX idx_retention_executions_policy ON public.retention_executions USING btree (policy_id);

CREATE INDEX idx_returns_order_id ON public.returns USING btree (order_id);

CREATE INDEX idx_returns_status ON public.returns USING btree (status);

CREATE INDEX idx_returns_tenant_id ON public.returns USING btree (tenant_id);

CREATE INDEX idx_rules_user ON public.rules USING btree (user_id, enabled, priority);

CREATE INDEX idx_shipping_methods_active ON public.shipping_methods USING btree (active);

CREATE INDEX idx_shipping_methods_sort ON public.shipping_methods USING btree (sort_order);

CREATE UNIQUE INDEX idx_shipping_methods_tenant_code ON public.shipping_methods USING btree (tenant_id, code);

CREATE INDEX idx_shipping_methods_tenant_id ON public.shipping_methods USING btree (tenant_id);

CREATE INDEX idx_site_flags_tenant_id ON public.site_flags USING btree (tenant_id);

CREATE INDEX idx_site_flags_updated_at ON public.site_flags USING btree (updated_at DESC);

CREATE INDEX idx_staff_locations_expires_at ON public.staff_locations USING btree (expires_at);

CREATE INDEX idx_staff_locations_location ON public.staff_locations USING gist (location);

CREATE INDEX idx_staff_locations_recorded_at ON public.staff_locations USING btree (recorded_at DESC);

CREATE INDEX idx_staff_locations_tenant_id ON public.staff_locations USING btree (tenant_id);

CREATE INDEX idx_staff_locations_user_id ON public.staff_locations USING btree (user_id);

CREATE INDEX idx_statement_imports_account ON public.statement_imports USING btree (account_id);

CREATE INDEX idx_statement_imports_user ON public.statement_imports USING btree (user_id);

CREATE INDEX idx_statement_lines_date ON public.statement_lines USING btree (posted_at);

CREATE INDEX idx_statement_lines_import ON public.statement_lines USING btree (statement_import_id);

CREATE INDEX idx_stock_alerts_product ON public.stock_alerts USING btree (product_id, size);

CREATE INDEX idx_stock_alerts_tenant_id ON public.stock_alerts USING btree (tenant_id);

CREATE INDEX idx_stock_alerts_user ON public.stock_alerts USING btree (user_id);

CREATE INDEX idx_tenant_isolation_alerts_created ON public.tenant_isolation_alerts USING btree (created_at DESC);

CREATE INDEX idx_tenant_isolation_alerts_severity ON public.tenant_isolation_alerts USING btree (severity);

CREATE INDEX idx_tenant_isolation_alerts_type ON public.tenant_isolation_alerts USING btree (alert_type);

CREATE INDEX idx_tenant_isolation_alerts_unresolved ON public.tenant_isolation_alerts USING btree (created_at DESC) WHERE (resolved_at IS NULL);

CREATE INDEX idx_tenant_isolation_tests_executed ON public.tenant_isolation_tests USING btree (executed_at DESC);

CREATE INDEX idx_tenant_isolation_tests_name ON public.tenant_isolation_tests USING btree (test_name);

CREATE INDEX idx_tenant_isolation_tests_passed ON public.tenant_isolation_tests USING btree (passed);

CREATE INDEX idx_transaction_fields_txn ON public.transaction_fields USING btree (transaction_id);

CREATE INDEX idx_transactions_account_date ON public.transactions USING btree (user_id, account_id, occurred_at);

CREATE INDEX idx_transactions_category ON public.transactions USING btree (category_id);

CREATE UNIQUE INDEX idx_transactions_hash ON public.transactions USING btree (user_id, import_hash);

CREATE INDEX idx_transactions_merchant ON public.transactions USING btree (merchant_id);

CREATE INDEX idx_transactions_status ON public.transactions USING btree (user_id, status);

CREATE INDEX idx_user_consents_active ON public.user_consents USING btree (user_id, consent_type_code, consent_given);

CREATE INDEX idx_user_consents_tenant_id ON public.user_consents USING btree (tenant_id);

CREATE INDEX idx_user_consents_type ON public.user_consents USING btree (consent_type_code);

CREATE UNIQUE INDEX idx_user_consents_unique_active ON public.user_consents USING btree (user_id, tenant_id, consent_type_code, consent_version);

CREATE INDEX idx_user_consents_user_id ON public.user_consents USING btree (user_id);

CREATE INDEX idx_user_preferences_tenant_id ON public.user_preferences USING btree (tenant_id);

CREATE INDEX idx_variants_tenant_id ON public.product_variants USING btree (tenant_id);

CREATE INDEX idx_wishlist_product ON public.wishlist_items USING btree (product_id);

CREATE INDEX idx_wishlist_tenant_id ON public.wishlist_items USING btree (tenant_id);

CREATE INDEX idx_wishlist_user ON public.wishlist_items USING btree (user_id);

CREATE UNIQUE INDEX institutions_pkey ON public.institutions USING btree (id);

CREATE UNIQUE INDEX institutions_user_id_name_key ON public.institutions USING btree (user_id, name);

CREATE UNIQUE INDEX inventory_audit_pkey ON public.inventory_audit USING btree (id);

CREATE UNIQUE INDEX local_delivery_zones_pkey ON public.local_delivery_zones USING btree (id);

CREATE UNIQUE INDEX merchant_aliases_pkey ON public.merchant_aliases USING btree (id);

CREATE UNIQUE INDEX merchants_pkey ON public.merchants USING btree (id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX model_images_pkey ON public.model_images USING btree (id);

CREATE UNIQUE INDEX price_creep_events_pkey ON public.price_creep_events USING btree (id);

CREATE UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id);

CREATE UNIQUE INDEX pricing_rules_pkey ON public.pricing_rules USING btree (id);

CREATE UNIQUE INDEX product_images_pkey ON public.product_images USING btree (id);

CREATE UNIQUE INDEX product_models_pkey ON public.product_models USING btree (id);

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX recently_viewed_pkey ON public.recently_viewed USING btree (id);

CREATE UNIQUE INDEX recently_viewed_user_id_product_id_key ON public.recently_viewed USING btree (user_id, product_id);

CREATE UNIQUE INDEX reconciliation_matches_pkey ON public.reconciliation_matches USING btree (id);

CREATE UNIQUE INDEX reconciliation_matches_reconciliation_run_id_statement_line_key ON public.reconciliation_matches USING btree (reconciliation_run_id, statement_line_id);

CREATE UNIQUE INDEX reconciliation_matches_reconciliation_run_id_transaction_id_key ON public.reconciliation_matches USING btree (reconciliation_run_id, transaction_id);

CREATE UNIQUE INDEX reconciliation_runs_pkey ON public.reconciliation_runs USING btree (id);

CREATE UNIQUE INDEX recurring_series_pkey ON public.recurring_series USING btree (id);

CREATE UNIQUE INDEX retention_executions_pkey ON public.retention_executions USING btree (id);

CREATE UNIQUE INDEX retention_policies_pkey ON public.retention_policies USING btree (id);

CREATE UNIQUE INDEX retention_policies_policy_name_key ON public.retention_policies USING btree (policy_name);

CREATE UNIQUE INDEX returns_pkey ON public.returns USING btree (id);

CREATE UNIQUE INDEX rules_pkey ON public.rules USING btree (id);

CREATE UNIQUE INDEX shipping_methods_pkey ON public.shipping_methods USING btree (id);

CREATE UNIQUE INDEX site_flags_pkey ON public.site_flags USING btree (key);

CREATE UNIQUE INDEX staff_locations_pkey ON public.staff_locations USING btree (id);

CREATE UNIQUE INDEX statement_imports_pkey ON public.statement_imports USING btree (id);

CREATE UNIQUE INDEX statement_lines_pkey ON public.statement_lines USING btree (id);

CREATE UNIQUE INDEX stock_alerts_pkey ON public.stock_alerts USING btree (id);

CREATE UNIQUE INDEX stock_alerts_user_id_product_id_size_condition_code_key ON public.stock_alerts USING btree (user_id, product_id, size, condition_code);

CREATE UNIQUE INDEX streaks_pkey ON public.streaks USING btree (id);

CREATE UNIQUE INDEX streaks_user_id_key ON public.streaks USING btree (user_id);

CREATE UNIQUE INDEX tenant_billing_pkey ON public.tenant_billing USING btree (tenant_id);

CREATE UNIQUE INDEX tenant_domains_domain_key ON public.tenant_domains USING btree (domain);

CREATE UNIQUE INDEX tenant_domains_pkey ON public.tenant_domains USING btree (id);

CREATE UNIQUE INDEX tenant_isolation_alerts_pkey ON public.tenant_isolation_alerts USING btree (id);

CREATE UNIQUE INDEX tenant_isolation_tests_pkey ON public.tenant_isolation_tests USING btree (id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);

CREATE UNIQUE INDEX transaction_fields_pkey ON public.transaction_fields USING btree (id);

CREATE UNIQUE INDEX transaction_fields_transaction_id_field_name_key ON public.transaction_fields USING btree (transaction_id, field_name);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX user_consents_pkey ON public.user_consents USING btree (id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX wishlist_items_pkey ON public.wishlist_items USING btree (id);

CREATE UNIQUE INDEX wishlist_items_user_id_product_id_variant_id_key ON public.wishlist_items USING btree (user_id, product_id, variant_id);

alter table "public"."account_deletions" add constraint "account_deletions_pkey" PRIMARY KEY using index "account_deletions_pkey";

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."attachments" add constraint "attachments_pkey" PRIMARY KEY using index "attachments_pkey";

alter table "public"."audit_log" add constraint "audit_log_pkey" PRIMARY KEY using index "audit_log_pkey";

alter table "public"."badges" add constraint "badges_pkey" PRIMARY KEY using index "badges_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."chat_members" add constraint "chat_members_pkey" PRIMARY KEY using index "chat_members_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."chat_threads" add constraint "chat_threads_pkey" PRIMARY KEY using index "chat_threads_pkey";

alter table "public"."consent_audit" add constraint "consent_audit_pkey" PRIMARY KEY using index "consent_audit_pkey";

alter table "public"."consent_types" add constraint "consent_types_pkey" PRIMARY KEY using index "consent_types_pkey";

alter table "public"."consignment_items" add constraint "consignment_items_pkey" PRIMARY KEY using index "consignment_items_pkey";

alter table "public"."consignment_payouts" add constraint "consignment_payouts_pkey" PRIMARY KEY using index "consignment_payouts_pkey";

alter table "public"."consignor_portal_access" add constraint "consignor_portal_access_pkey" PRIMARY KEY using index "consignor_portal_access_pkey";

alter table "public"."consignors" add constraint "consignors_pkey" PRIMARY KEY using index "consignors_pkey";

alter table "public"."data_exports" add constraint "data_exports_pkey" PRIMARY KEY using index "data_exports_pkey";

alter table "public"."drop_alerts" add constraint "drop_alerts_pkey" PRIMARY KEY using index "drop_alerts_pkey";

alter table "public"."engagement_events" add constraint "engagement_events_pkey" PRIMARY KEY using index "engagement_events_pkey";

alter table "public"."goals" add constraint "goals_pkey" PRIMARY KEY using index "goals_pkey";

alter table "public"."guest_interactions" add constraint "guest_interactions_pkey" PRIMARY KEY using index "guest_interactions_pkey";

alter table "public"."guest_profiles" add constraint "guest_profiles_pkey" PRIMARY KEY using index "guest_profiles_pkey";

alter table "public"."institutions" add constraint "institutions_pkey" PRIMARY KEY using index "institutions_pkey";

alter table "public"."inventory_audit" add constraint "inventory_audit_pkey" PRIMARY KEY using index "inventory_audit_pkey";

alter table "public"."local_delivery_zones" add constraint "local_delivery_zones_pkey" PRIMARY KEY using index "local_delivery_zones_pkey";

alter table "public"."merchant_aliases" add constraint "merchant_aliases_pkey" PRIMARY KEY using index "merchant_aliases_pkey";

alter table "public"."merchants" add constraint "merchants_pkey" PRIMARY KEY using index "merchants_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."model_images" add constraint "model_images_pkey" PRIMARY KEY using index "model_images_pkey";

alter table "public"."price_creep_events" add constraint "price_creep_events_pkey" PRIMARY KEY using index "price_creep_events_pkey";

alter table "public"."price_history" add constraint "price_history_pkey" PRIMARY KEY using index "price_history_pkey";

alter table "public"."pricing_rules" add constraint "pricing_rules_pkey" PRIMARY KEY using index "pricing_rules_pkey";

alter table "public"."product_images" add constraint "product_images_pkey" PRIMARY KEY using index "product_images_pkey";

alter table "public"."product_models" add constraint "product_models_pkey" PRIMARY KEY using index "product_models_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."recently_viewed" add constraint "recently_viewed_pkey" PRIMARY KEY using index "recently_viewed_pkey";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_pkey" PRIMARY KEY using index "reconciliation_matches_pkey";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_pkey" PRIMARY KEY using index "reconciliation_runs_pkey";

alter table "public"."recurring_series" add constraint "recurring_series_pkey" PRIMARY KEY using index "recurring_series_pkey";

alter table "public"."retention_executions" add constraint "retention_executions_pkey" PRIMARY KEY using index "retention_executions_pkey";

alter table "public"."retention_policies" add constraint "retention_policies_pkey" PRIMARY KEY using index "retention_policies_pkey";

alter table "public"."returns" add constraint "returns_pkey" PRIMARY KEY using index "returns_pkey";

alter table "public"."rules" add constraint "rules_pkey" PRIMARY KEY using index "rules_pkey";

alter table "public"."shipping_methods" add constraint "shipping_methods_pkey" PRIMARY KEY using index "shipping_methods_pkey";

alter table "public"."site_flags" add constraint "site_flags_pkey" PRIMARY KEY using index "site_flags_pkey";

alter table "public"."staff_locations" add constraint "staff_locations_pkey" PRIMARY KEY using index "staff_locations_pkey";

alter table "public"."statement_imports" add constraint "statement_imports_pkey" PRIMARY KEY using index "statement_imports_pkey";

alter table "public"."statement_lines" add constraint "statement_lines_pkey" PRIMARY KEY using index "statement_lines_pkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_pkey" PRIMARY KEY using index "stock_alerts_pkey";

alter table "public"."streaks" add constraint "streaks_pkey" PRIMARY KEY using index "streaks_pkey";

alter table "public"."tenant_billing" add constraint "tenant_billing_pkey" PRIMARY KEY using index "tenant_billing_pkey";

alter table "public"."tenant_domains" add constraint "tenant_domains_pkey" PRIMARY KEY using index "tenant_domains_pkey";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_pkey" PRIMARY KEY using index "tenant_isolation_alerts_pkey";

alter table "public"."tenant_isolation_tests" add constraint "tenant_isolation_tests_pkey" PRIMARY KEY using index "tenant_isolation_tests_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."transaction_fields" add constraint "transaction_fields_pkey" PRIMARY KEY using index "transaction_fields_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."user_consents" add constraint "user_consents_pkey" PRIMARY KEY using index "user_consents_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."wishlist_items" add constraint "wishlist_items_pkey" PRIMARY KEY using index "wishlist_items_pkey";

alter table "public"."709_profiles" add constraint "709_profiles_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."709_profiles" validate constraint "709_profiles_tenant_id_fkey";

alter table "public"."account_deletions" add constraint "account_deletions_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id) not valid;

alter table "public"."account_deletions" validate constraint "account_deletions_requested_by_fkey";

alter table "public"."account_deletions" add constraint "account_deletions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."account_deletions" validate constraint "account_deletions_status_check";

alter table "public"."account_deletions" add constraint "account_deletions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."account_deletions" validate constraint "account_deletions_tenant_id_fkey";

alter table "public"."accounts" add constraint "accounts_institution_id_fkey" FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE SET NULL not valid;

alter table "public"."accounts" validate constraint "accounts_institution_id_fkey";

alter table "public"."accounts" add constraint "accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_user_id_fkey";

alter table "public"."accounts" add constraint "accounts_user_id_name_key" UNIQUE using index "accounts_user_id_name_key";

alter table "public"."activity_logs" add constraint "activity_logs_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_tenant_id_fkey";

alter table "public"."activity_logs" add constraint "activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_user_id_fkey";

alter table "public"."attachments" add constraint "attachments_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL not valid;

alter table "public"."attachments" validate constraint "attachments_transaction_id_fkey";

alter table "public"."attachments" add constraint "attachments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_user_id_fkey";

alter table "public"."audit_log" add constraint "audit_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."audit_log" validate constraint "audit_log_user_id_fkey";

alter table "public"."badges" add constraint "badges_user_id_badge_type_key" UNIQUE using index "badges_user_id_badge_type_key";

alter table "public"."badges" add constraint "badges_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."badges" validate constraint "badges_user_id_fkey";

alter table "public"."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."categories" validate constraint "categories_parent_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_parent_id_name_key" UNIQUE using index "categories_user_id_parent_id_name_key";

alter table "public"."chat_members" add constraint "chat_members_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE not valid;

alter table "public"."chat_members" validate constraint "chat_members_thread_id_fkey";

alter table "public"."chat_members" add constraint "chat_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_members" validate constraint "chat_members_user_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_sender_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_thread_id_fkey";

alter table "public"."chat_threads" add constraint "chat_threads_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_created_by_fkey";

alter table "public"."chat_threads" add constraint "chat_threads_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_tenant_id_fkey";

alter table "public"."chat_threads" add constraint "chat_threads_type_check" CHECK ((type = ANY (ARRAY['direct'::text, 'group'::text]))) not valid;

alter table "public"."chat_threads" validate constraint "chat_threads_type_check";

alter table "public"."consent_audit" add constraint "consent_audit_action_check" CHECK ((action = ANY (ARRAY['granted'::text, 'withdrawn'::text, 'expired'::text, 'updated'::text]))) not valid;

alter table "public"."consent_audit" validate constraint "consent_audit_action_check";

alter table "public"."consent_audit" add constraint "consent_audit_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."consent_audit" validate constraint "consent_audit_tenant_id_fkey";

alter table "public"."consent_types" add constraint "consent_types_category_check" CHECK ((category = ANY (ARRAY['essential'::text, 'marketing'::text, 'analytics'::text, 'personalization'::text]))) not valid;

alter table "public"."consent_types" validate constraint "consent_types_category_check";

alter table "public"."consent_types" add constraint "consent_types_code_key" UNIQUE using index "consent_types_code_key";

alter table "public"."consignment_items" add constraint "consignment_items_consignor_id_fkey" FOREIGN KEY (consignor_id) REFERENCES public.consignors(id) not valid;

alter table "public"."consignment_items" validate constraint "consignment_items_consignor_id_fkey";

alter table "public"."consignment_items" add constraint "consignment_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."consignment_items" validate constraint "consignment_items_order_id_fkey";

alter table "public"."consignment_items" add constraint "consignment_items_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'sold'::text, 'returned'::text, 'paid'::text]))) not valid;

alter table "public"."consignment_items" validate constraint "consignment_items_status_check";

alter table "public"."consignment_items" add constraint "consignment_items_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."consignment_items" validate constraint "consignment_items_tenant_id_fkey";

alter table "public"."consignment_items" add constraint "consignment_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) not valid;

alter table "public"."consignment_items" validate constraint "consignment_items_variant_id_fkey";

alter table "public"."consignment_payouts" add constraint "consignment_payouts_consignor_id_fkey" FOREIGN KEY (consignor_id) REFERENCES public.consignors(id) not valid;

alter table "public"."consignment_payouts" validate constraint "consignment_payouts_consignor_id_fkey";

alter table "public"."consignment_payouts" add constraint "consignment_payouts_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text]))) not valid;

alter table "public"."consignment_payouts" validate constraint "consignment_payouts_status_check";

alter table "public"."consignment_payouts" add constraint "consignment_payouts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."consignment_payouts" validate constraint "consignment_payouts_tenant_id_fkey";

alter table "public"."consignor_portal_access" add constraint "consignor_portal_access_access_token_key" UNIQUE using index "consignor_portal_access_access_token_key";

alter table "public"."consignor_portal_access" add constraint "consignor_portal_access_consignor_id_fkey" FOREIGN KEY (consignor_id) REFERENCES public.consignors(id) ON DELETE CASCADE not valid;

alter table "public"."consignor_portal_access" validate constraint "consignor_portal_access_consignor_id_fkey";

alter table "public"."consignors" add constraint "consignors_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."consignors" validate constraint "consignors_tenant_id_fkey";

alter table "public"."data_exports" add constraint "data_exports_status_check" CHECK ((status = ANY (ARRAY['completed'::text, 'failed'::text]))) not valid;

alter table "public"."data_exports" validate constraint "data_exports_status_check";

alter table "public"."data_exports" add constraint "data_exports_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."data_exports" validate constraint "data_exports_tenant_id_fkey";

alter table "public"."data_exports" add constraint "data_exports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."data_exports" validate constraint "data_exports_user_id_fkey";

alter table "public"."drop_alerts" add constraint "drop_alerts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."drop_alerts" validate constraint "drop_alerts_product_id_fkey";

alter table "public"."drop_alerts" add constraint "drop_alerts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."drop_alerts" validate constraint "drop_alerts_tenant_id_fkey";

alter table "public"."drop_alerts" add constraint "drop_alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."drop_alerts" validate constraint "drop_alerts_user_id_fkey";

alter table "public"."drop_alerts" add constraint "drop_alerts_user_id_product_id_key" UNIQUE using index "drop_alerts_user_id_product_id_key";

alter table "public"."engagement_events" add constraint "engagement_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."engagement_events" validate constraint "engagement_events_user_id_fkey";

alter table "public"."goals" add constraint "goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."goals" validate constraint "goals_user_id_fkey";

alter table "public"."guest_interactions" add constraint "guest_interactions_guest_id_fkey" FOREIGN KEY (guest_id) REFERENCES public.guest_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."guest_interactions" validate constraint "guest_interactions_guest_id_fkey";

alter table "public"."guest_profiles" add constraint "guest_profiles_guest_type_check" CHECK ((guest_type = ANY (ARRAY['prospect'::text, 'applicant'::text, 'customer'::text]))) not valid;

alter table "public"."guest_profiles" validate constraint "guest_profiles_guest_type_check";

alter table "public"."guest_profiles" add constraint "guest_profiles_primary_email_key" UNIQUE using index "guest_profiles_primary_email_key";

alter table "public"."institutions" add constraint "institutions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."institutions" validate constraint "institutions_user_id_fkey";

alter table "public"."institutions" add constraint "institutions_user_id_name_key" UNIQUE using index "institutions_user_id_name_key";

alter table "public"."inventory_audit" add constraint "inventory_audit_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."inventory_audit" validate constraint "inventory_audit_tenant_id_fkey";

alter table "public"."inventory_audit" add constraint "inventory_audit_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) not valid;

alter table "public"."inventory_audit" validate constraint "inventory_audit_variant_id_fkey";

alter table "public"."local_delivery_zones" add constraint "local_delivery_zones_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."local_delivery_zones" validate constraint "local_delivery_zones_tenant_id_fkey";

alter table "public"."merchant_aliases" add constraint "merchant_aliases_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE not valid;

alter table "public"."merchant_aliases" validate constraint "merchant_aliases_merchant_id_fkey";

alter table "public"."merchant_aliases" add constraint "merchant_aliases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."merchant_aliases" validate constraint "merchant_aliases_user_id_fkey";

alter table "public"."merchants" add constraint "merchants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."merchants" validate constraint "merchants_user_id_fkey";

alter table "public"."messages" add constraint "messages_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_customer_id_fkey";

alter table "public"."messages" add constraint "messages_sender_type_check" CHECK ((sender_type = ANY (ARRAY['customer'::text, 'admin'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_sender_type_check";

alter table "public"."messages" add constraint "messages_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."messages" validate constraint "messages_tenant_id_fkey";

alter table "public"."model_images" add constraint "model_images_model_id_fkey" FOREIGN KEY (model_id) REFERENCES public.product_models(id) ON DELETE CASCADE not valid;

alter table "public"."model_images" validate constraint "model_images_model_id_fkey";

alter table "public"."model_images" add constraint "model_images_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."model_images" validate constraint "model_images_tenant_id_fkey";

alter table "public"."order_items" add constraint "order_items_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."order_items" validate constraint "order_items_tenant_id_fkey";

alter table "public"."orders" add constraint "orders_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."orders" validate constraint "orders_tenant_id_fkey";

alter table "public"."price_creep_events" add constraint "price_creep_events_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE not valid;

alter table "public"."price_creep_events" validate constraint "price_creep_events_merchant_id_fkey";

alter table "public"."price_creep_events" add constraint "price_creep_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."price_creep_events" validate constraint "price_creep_events_user_id_fkey";

alter table "public"."price_history" add constraint "price_history_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."price_history" validate constraint "price_history_tenant_id_fkey";

alter table "public"."price_history" add constraint "price_history_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."price_history" validate constraint "price_history_variant_id_fkey";

alter table "public"."pricing_rules" add constraint "pricing_rules_rule_type_check" CHECK ((rule_type = ANY (ARRAY['brand'::text, 'model'::text, 'condition'::text]))) not valid;

alter table "public"."pricing_rules" validate constraint "pricing_rules_rule_type_check";

alter table "public"."pricing_rules" add constraint "pricing_rules_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."pricing_rules" validate constraint "pricing_rules_tenant_id_fkey";

alter table "public"."product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_images" validate constraint "product_images_product_id_fkey";

alter table "public"."product_images" add constraint "product_images_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."product_images" validate constraint "product_images_tenant_id_fkey";

alter table "public"."product_models" add constraint "product_models_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."product_models" validate constraint "product_models_tenant_id_fkey";

alter table "public"."product_variants" add constraint "product_variants_sku_key" UNIQUE using index "product_variants_sku_key";

alter table "public"."product_variants" add constraint "product_variants_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."product_variants" validate constraint "product_variants_tenant_id_fkey";

alter table "public"."product_variants" add constraint "reserved_non_negative" CHECK ((reserved >= 0)) not valid;

alter table "public"."product_variants" validate constraint "reserved_non_negative";

alter table "public"."product_variants" add constraint "stock_non_negative" CHECK ((stock >= 0)) not valid;

alter table "public"."product_variants" validate constraint "stock_non_negative";

alter table "public"."product_variants" add constraint "valid_condition" CHECK ((condition_code = ANY (ARRAY['DS'::text, 'VNDS'::text, 'USED'::text]))) not valid;

alter table "public"."product_variants" validate constraint "valid_condition";

alter table "public"."products" add constraint "products_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."products" validate constraint "products_tenant_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."recently_viewed" add constraint "recently_viewed_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."recently_viewed" validate constraint "recently_viewed_product_id_fkey";

alter table "public"."recently_viewed" add constraint "recently_viewed_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."recently_viewed" validate constraint "recently_viewed_tenant_id_fkey";

alter table "public"."recently_viewed" add constraint "recently_viewed_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."recently_viewed" validate constraint "recently_viewed_user_id_fkey";

alter table "public"."recently_viewed" add constraint "recently_viewed_user_id_product_id_key" UNIQUE using index "recently_viewed_user_id_product_id_key";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_reconciliation_run_id_fkey" FOREIGN KEY (reconciliation_run_id) REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_matches" validate constraint "reconciliation_matches_reconciliation_run_id_fkey";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_reconciliation_run_id_statement_line_key" UNIQUE using index "reconciliation_matches_reconciliation_run_id_statement_line_key";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_reconciliation_run_id_transaction_id_key" UNIQUE using index "reconciliation_matches_reconciliation_run_id_transaction_id_key";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_statement_line_id_fkey" FOREIGN KEY (statement_line_id) REFERENCES public.statement_lines(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_matches" validate constraint "reconciliation_matches_statement_line_id_fkey";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_matches" validate constraint "reconciliation_matches_transaction_id_fkey";

alter table "public"."reconciliation_matches" add constraint "reconciliation_matches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_matches" validate constraint "reconciliation_matches_user_id_fkey";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_runs" validate constraint "reconciliation_runs_account_id_fkey";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_statement_import_id_fkey" FOREIGN KEY (statement_import_id) REFERENCES public.statement_imports(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_runs" validate constraint "reconciliation_runs_statement_import_id_fkey";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'complete'::text]))) not valid;

alter table "public"."reconciliation_runs" validate constraint "reconciliation_runs_status_check";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reconciliation_runs" validate constraint "reconciliation_runs_user_id_fkey";

alter table "public"."recurring_series" add constraint "recurring_series_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_series" validate constraint "recurring_series_merchant_id_fkey";

alter table "public"."recurring_series" add constraint "recurring_series_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_series" validate constraint "recurring_series_user_id_fkey";

alter table "public"."retention_executions" add constraint "retention_executions_policy_id_fkey" FOREIGN KEY (policy_id) REFERENCES public.retention_policies(id) not valid;

alter table "public"."retention_executions" validate constraint "retention_executions_policy_id_fkey";

alter table "public"."retention_executions" add constraint "retention_executions_status_check" CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'partial'::text]))) not valid;

alter table "public"."retention_executions" validate constraint "retention_executions_status_check";

alter table "public"."retention_policies" add constraint "retention_policies_policy_name_key" UNIQUE using index "retention_policies_policy_name_key";

alter table "public"."returns" add constraint "returns_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."returns" validate constraint "returns_created_by_fkey";

alter table "public"."returns" add constraint "returns_inventory_action_check" CHECK ((inventory_action = ANY (ARRAY['restock'::text, 'writeoff'::text]))) not valid;

alter table "public"."returns" validate constraint "returns_inventory_action_check";

alter table "public"."returns" add constraint "returns_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."returns" validate constraint "returns_order_id_fkey";

alter table "public"."returns" add constraint "returns_return_type_check" CHECK ((return_type = ANY (ARRAY['return'::text, 'exchange'::text]))) not valid;

alter table "public"."returns" validate constraint "returns_return_type_check";

alter table "public"."returns" add constraint "returns_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'received'::text, 'completed'::text, 'rejected'::text]))) not valid;

alter table "public"."returns" validate constraint "returns_status_check";

alter table "public"."returns" add constraint "returns_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."returns" validate constraint "returns_tenant_id_fkey";

alter table "public"."rules" add constraint "rules_action_set_category_id_fkey" FOREIGN KEY (action_set_category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."rules" validate constraint "rules_action_set_category_id_fkey";

alter table "public"."rules" add constraint "rules_match_account_id_fkey" FOREIGN KEY (match_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL not valid;

alter table "public"."rules" validate constraint "rules_match_account_id_fkey";

alter table "public"."rules" add constraint "rules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."rules" validate constraint "rules_user_id_fkey";

alter table "public"."shipping_methods" add constraint "shipping_methods_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."shipping_methods" validate constraint "shipping_methods_tenant_id_fkey";

alter table "public"."site_flags" add constraint "site_flags_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."site_flags" validate constraint "site_flags_tenant_id_fkey";

alter table "public"."staff_locations" add constraint "staff_locations_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."staff_locations" validate constraint "staff_locations_tenant_id_fkey";

alter table "public"."staff_locations" add constraint "staff_locations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."staff_locations" validate constraint "staff_locations_user_id_fkey";

alter table "public"."statement_imports" add constraint "statement_imports_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."statement_imports" validate constraint "statement_imports_account_id_fkey";

alter table "public"."statement_imports" add constraint "statement_imports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."statement_imports" validate constraint "statement_imports_user_id_fkey";

alter table "public"."statement_lines" add constraint "statement_lines_statement_import_id_fkey" FOREIGN KEY (statement_import_id) REFERENCES public.statement_imports(id) ON DELETE CASCADE not valid;

alter table "public"."statement_lines" validate constraint "statement_lines_statement_import_id_fkey";

alter table "public"."statement_lines" add constraint "statement_lines_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."statement_lines" validate constraint "statement_lines_user_id_fkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."stock_alerts" validate constraint "stock_alerts_product_id_fkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."stock_alerts" validate constraint "stock_alerts_tenant_id_fkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."stock_alerts" validate constraint "stock_alerts_user_id_fkey";

alter table "public"."stock_alerts" add constraint "stock_alerts_user_id_product_id_size_condition_code_key" UNIQUE using index "stock_alerts_user_id_product_id_size_condition_code_key";

alter table "public"."streaks" add constraint "streaks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."streaks" validate constraint "streaks_user_id_fkey";

alter table "public"."streaks" add constraint "streaks_user_id_key" UNIQUE using index "streaks_user_id_key";

alter table "public"."tenant_billing" add constraint "tenant_billing_status_check" CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text]))) not valid;

alter table "public"."tenant_billing" validate constraint "tenant_billing_status_check";

alter table "public"."tenant_billing" add constraint "tenant_billing_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_billing" validate constraint "tenant_billing_tenant_id_fkey";

alter table "public"."tenant_domains" add constraint "tenant_domains_domain_key" UNIQUE using index "tenant_domains_domain_key";

alter table "public"."tenant_domains" add constraint "tenant_domains_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_domains" validate constraint "tenant_domains_tenant_id_fkey";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_alert_type_check" CHECK ((alert_type = ANY (ARRAY['cross_tenant_read'::text, 'cross_tenant_write'::text, 'missing_tenant_filter'::text, 'service_role_access'::text]))) not valid;

alter table "public"."tenant_isolation_alerts" validate constraint "tenant_isolation_alerts_alert_type_check";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_attempted_tenant_id_fkey" FOREIGN KEY (attempted_tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."tenant_isolation_alerts" validate constraint "tenant_isolation_alerts_attempted_tenant_id_fkey";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."tenant_isolation_alerts" validate constraint "tenant_isolation_alerts_resolved_by_fkey";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."tenant_isolation_alerts" validate constraint "tenant_isolation_alerts_severity_check";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."tenant_isolation_alerts" validate constraint "tenant_isolation_alerts_user_id_fkey";

alter table "public"."tenant_isolation_alerts" add constraint "tenant_isolation_alerts_user_tenant_id_fkey" FOREIGN KEY (user_tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."tenant_isolation_alerts" validate constraint "tenant_isolation_alerts_user_tenant_id_fkey";

alter table "public"."tenant_isolation_tests" add constraint "tenant_isolation_tests_executed_by_fkey" FOREIGN KEY (executed_by) REFERENCES auth.users(id) not valid;

alter table "public"."tenant_isolation_tests" validate constraint "tenant_isolation_tests_executed_by_fkey";

alter table "public"."tenant_isolation_tests" add constraint "tenant_isolation_tests_test_type_check" CHECK ((test_type = ANY (ARRAY['rls_policy'::text, 'api_endpoint'::text, 'function'::text, 'view'::text]))) not valid;

alter table "public"."tenant_isolation_tests" validate constraint "tenant_isolation_tests_test_type_check";

alter table "public"."tenants" add constraint "tenants_slug_key" UNIQUE using index "tenants_slug_key";

alter table "public"."tenants" add constraint "tenants_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text]))) not valid;

alter table "public"."tenants" validate constraint "tenants_status_check";

alter table "public"."transaction_fields" add constraint "transaction_fields_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'imported'::text, 'ai'::text, 'rule'::text, 'system'::text]))) not valid;

alter table "public"."transaction_fields" validate constraint "transaction_fields_source_check";

alter table "public"."transaction_fields" add constraint "transaction_fields_transaction_id_field_name_key" UNIQUE using index "transaction_fields_transaction_id_field_name_key";

alter table "public"."transaction_fields" add constraint "transaction_fields_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_fields" validate constraint "transaction_fields_transaction_id_fkey";

alter table "public"."transaction_fields" add constraint "transaction_fields_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_fields" validate constraint "transaction_fields_user_id_fkey";

alter table "public"."transactions" add constraint "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_account_id_fkey";

alter table "public"."transactions" add constraint "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_category_id_fkey";

alter table "public"."transactions" add constraint "transactions_direction_check" CHECK ((direction = ANY (ARRAY['in'::text, 'out'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_direction_check";

alter table "public"."transactions" add constraint "transactions_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_merchant_id_fkey";

alter table "public"."transactions" add constraint "transactions_status_check" CHECK ((status = ANY (ARRAY['unmatched'::text, 'matched'::text, 'pending'::text, 'excluded'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_status_check";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

alter table "public"."user_consents" add constraint "user_consents_consent_type_code_fkey" FOREIGN KEY (consent_type_code) REFERENCES public.consent_types(code) not valid;

alter table "public"."user_consents" validate constraint "user_consents_consent_type_code_fkey";

alter table "public"."user_consents" add constraint "user_consents_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."user_consents" validate constraint "user_consents_tenant_id_fkey";

alter table "public"."user_consents" add constraint "user_consents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_consents" validate constraint "user_consents_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_tenant_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."wishlist_items" add constraint "wishlist_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."wishlist_items" validate constraint "wishlist_items_product_id_fkey";

alter table "public"."wishlist_items" add constraint "wishlist_items_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) not valid;

alter table "public"."wishlist_items" validate constraint "wishlist_items_tenant_id_fkey";

alter table "public"."wishlist_items" add constraint "wishlist_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."wishlist_items" validate constraint "wishlist_items_user_id_fkey";

alter table "public"."wishlist_items" add constraint "wishlist_items_user_id_product_id_variant_id_key" UNIQUE using index "wishlist_items_user_id_product_id_variant_id_key";

alter table "public"."wishlist_items" add constraint "wishlist_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."wishlist_items" validate constraint "wishlist_items_variant_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.admin_adjust_inventory(variant_id_input uuid, delta_input integer, reason_input text, actor_input uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."admin_variant_analytics" as  SELECT pv.id,
    pv.tenant_id,
    pv.sku,
    pv.stock,
    pv.reserved,
    COALESCE(sum(oi.qty), (0)::bigint) AS sold_units,
        CASE
            WHEN ((COALESCE(sum(oi.qty), (0)::bigint) + pv.stock) = 0) THEN (0)::double precision
            ELSE ((COALESCE(sum(oi.qty), (0)::bigint))::double precision / ((COALESCE(sum(oi.qty), (0)::bigint) + pv.stock))::double precision)
        END AS sell_through_rate,
    pv.first_sold_at,
        CASE
            WHEN (pv.first_sold_at IS NOT NULL) THEN (EXTRACT(epoch FROM (pv.first_sold_at - p.created_at)) / (86400)::numeric)
            ELSE NULL::numeric
        END AS days_to_first_sale
   FROM ((public.product_variants pv
     LEFT JOIN public.products p ON ((p.id = pv.product_id)))
     LEFT JOIN public.order_items oi ON ((oi.variant_id = pv.id)))
  GROUP BY pv.id, pv.tenant_id, p.created_at;


CREATE OR REPLACE FUNCTION public.anonymize_order_data(p_user_id uuid, p_tenant_id uuid)
 RETURNS TABLE(orders_anonymized integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_orders_count INTEGER;
BEGIN
  -- Anonymize shipping addresses in orders
  UPDATE orders
  SET 
    shipping_address = jsonb_build_object(
      'anonymized', true,
      'city', COALESCE(shipping_address->>'city', 'Unknown'),
      'province', COALESCE(shipping_address->>'province', 'Unknown'),
      'country', COALESCE(shipping_address->>'country', 'Unknown')
    ),
    anonymized = TRUE,
    anonymized_at = NOW()
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND anonymized = FALSE;
  
  GET DIAGNOSTICS v_orders_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_orders_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.apply_pricing_rules(p_brand text, p_model text, p_condition text, p_base_price integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_multiplier numeric := 1.0;
  v_rule RECORD;
BEGIN
  -- Apply brand multiplier
  SELECT multiplier INTO v_rule FROM pricing_rules
  WHERE rule_type = 'brand' AND match_value ILIKE p_brand AND active = true
  LIMIT 1;
  IF FOUND THEN
    v_multiplier := v_multiplier * v_rule.multiplier;
  END IF;

  -- Apply model multiplier
  SELECT multiplier INTO v_rule FROM pricing_rules
  WHERE rule_type = 'model' AND match_value ILIKE p_model AND active = true
  LIMIT 1;
  IF FOUND THEN
    v_multiplier := v_multiplier * v_rule.multiplier;
  END IF;

  -- Apply condition multiplier
  SELECT multiplier INTO v_rule FROM pricing_rules
  WHERE rule_type = 'condition' AND match_value ILIKE p_condition AND active = true
  LIMIT 1;
  IF FOUND THEN
    v_multiplier := v_multiplier * v_rule.multiplier;
  END IF;

  RETURN ROUND(p_base_price * v_multiplier);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.archive_old_orders(p_years integer DEFAULT 7)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_archived INTEGER;
  v_archive_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_archive_date := NOW() - (p_years || ' years')::INTERVAL;
  
  -- For now, just mark them (in production, move to cold storage)
  UPDATE orders
  SET status = 'archived'
  WHERE created_at < v_archive_date
    AND status NOT IN ('pending', 'paid', 'fulfilled', 'shipped')
    AND status != 'archived';
  
  GET DIAGNOSTICS v_archived = ROW_COUNT;
  RETURN v_archived;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_stock_alerts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  product_name text;
begin
  if new.stock > old.stock then
    select p.name into product_name
    from products p
    where p.id = new.product_id;

    update stock_alerts
    set notified_at = now()
    where tenant_id = new.tenant_id
      and product_id = new.product_id
      and size = new.size
      and (condition_code is null or condition_code = new.condition_code)
      and notified_at is null;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_tenant_isolation(p_table_name text, p_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_has_tenant_column BOOLEAN;
  v_row_count INTEGER;
BEGIN
  -- Check if table has tenant_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table_name
    AND column_name = 'tenant_id'
  ) INTO v_has_tenant_column;
  
  IF NOT v_has_tenant_column THEN
    RETURN TRUE; -- Table doesn't need tenant filtering
  END IF;
  
  -- Try to count rows without tenant filter (should be blocked by RLS)
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id != $1', p_table_name)
    INTO v_row_count
    USING p_tenant_id;
  
  -- If we can see rows from other tenants, isolation is broken
  RETURN v_row_count = 0;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- RLS is working - access denied
    RETURN TRUE;
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO tenant_isolation_alerts (
      alert_type,
      severity,
      table_name,
      operation,
      query_details
    ) VALUES (
      'missing_tenant_filter',
      'high',
      p_table_name,
      'SELECT',
      jsonb_build_object('error', SQLERRM)
    );
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_consents()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Mark expired consents
  UPDATE user_consents
  SET consent_given = FALSE
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND consent_given = TRUE;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Log the expiration in audit
  IF v_deleted > 0 THEN
    INSERT INTO consent_audit (
      user_id,
      tenant_id,
      consent_type_code,
      action,
      previous_state,
      new_state,
      details
    )
    SELECT
      user_id,
      tenant_id,
      consent_type_code,
      'expired',
      TRUE,
      FALSE,
      jsonb_build_object('expired_at', NOW())
    FROM user_consents
    WHERE expires_at IS NOT NULL
      AND expires_at < NOW()
      AND consent_given = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM consent_audit ca
        WHERE ca.user_id = user_consents.user_id
          AND ca.consent_type_code = user_consents.consent_type_code
          AND ca.action = 'expired'
          AND ca.changed_at > NOW() - INTERVAL '1 hour'
      );
  END IF;
  
  RETURN v_deleted;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_message_attachments()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete attachments for deleted messages
  DELETE FROM message_attachments ma
  WHERE NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = ma.message_id
    AND m.deleted_at IS NULL
  );
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$
;

create or replace view "public"."consignor_dashboard" as  SELECT c.id AS consignor_id,
    c.name,
    c.email,
    c.commission_rate,
    c.balance_cents,
    c.total_sales_cents,
    c.total_paid_cents,
    count(DISTINCT ci.id) FILTER (WHERE (ci.status = 'active'::text)) AS active_items,
    count(DISTINCT ci.id) FILTER (WHERE (ci.status = 'sold'::text)) AS sold_items,
    count(DISTINCT ci.id) FILTER (WHERE (ci.status = 'paid'::text)) AS paid_items,
    max(ci.sold_at) AS last_sale_date
   FROM (public.consignors c
     LEFT JOIN public.consignment_items ci ON ((c.id = ci.consignor_id)))
  GROUP BY c.id;


create or replace view "public"."consignor_items_view" as  SELECT ci.id,
    ci.consignor_id,
    ci.status,
    ci.list_price_cents,
    ci.sold_price_cents,
    ci.commission_cents,
    ci.payout_cents,
    ci.created_at,
    ci.sold_at,
    pv.sku,
    pv.size,
    pv.condition,
    p.brand,
    p.name AS product_name
   FROM ((public.consignment_items ci
     LEFT JOIN public.product_variants pv ON ((ci.variant_id = pv.id)))
     LEFT JOIN public.products p ON ((pv.product_id = p.id)));


CREATE OR REPLACE FUNCTION public.create_default_categories(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_variant_with_sku(product_id_input uuid, brand_input text, model_input text, size_input text, condition_input text, price_input integer, stock_input integer)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_personal_data(p_user_id uuid, p_tenant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
  v_messages_deleted INTEGER;
  v_wishlist_deleted INTEGER;
  v_locations_deleted INTEGER;
  v_preferences_deleted INTEGER;
  v_alerts_deleted INTEGER;
BEGIN
  -- Delete messages
  DELETE FROM messages WHERE customer_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_messages_deleted = ROW_COUNT;
  
  -- Delete wishlist items
  DELETE FROM wishlist_items WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_wishlist_deleted = ROW_COUNT;
  
  -- Delete staff locations
  DELETE FROM staff_locations WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_locations_deleted = ROW_COUNT;
  
  -- Delete user preferences
  DELETE FROM user_preferences WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_preferences_deleted = ROW_COUNT;
  
  -- Delete stock and drop alerts
  DELETE FROM stock_alerts WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  DELETE FROM drop_alerts WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_alerts_deleted = ROW_COUNT;
  
  -- Delete recently viewed
  DELETE FROM recently_viewed WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  -- Clear profile PII (keep record for audit but remove identifiable info)
  UPDATE "709_profiles"
  SET 
    full_name = 'Deleted User',
    public_key = NULL,
    public_key_updated_at = NULL
  WHERE id = p_user_id AND tenant_id = p_tenant_id;
  
  v_result := jsonb_build_object(
    'messages_deleted', v_messages_deleted,
    'wishlist_deleted', v_wishlist_deleted,
    'locations_deleted', v_locations_deleted,
    'preferences_deleted', v_preferences_deleted,
    'alerts_deleted', v_alerts_deleted
  );
  
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.execute_all_retention_policies()
 RETURNS TABLE(policy_name text, rows_deleted integer, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_policy RECORD;
  v_deleted INTEGER;
BEGIN
  FOR v_policy IN 
    SELECT id, policy_name FROM retention_policies WHERE enabled = TRUE
  LOOP
    BEGIN
      v_deleted := execute_retention_policy(v_policy.id);
      
      RETURN QUERY SELECT 
        v_policy.policy_name,
        v_deleted,
        'success'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        v_policy.policy_name,
        0,
        'failed'::TEXT;
    END;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.execute_retention_policy(p_policy_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_policy RECORD;
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_rows_deleted INTEGER;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_duration_ms INTEGER;
  v_error_msg TEXT;
BEGIN
  -- Get policy details
  SELECT * INTO v_policy FROM retention_policies WHERE id = p_policy_id AND enabled = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policy not found or disabled';
  END IF;
  
  v_start_time := clock_timestamp();
  v_cutoff_date := NOW() - (v_policy.retention_days || ' days')::INTERVAL;
  
  BEGIN
    -- Execute delete with dynamic SQL
    EXECUTE format(
      'DELETE FROM %I WHERE %I < $1',
      v_policy.table_name,
      v_policy.delete_column
    ) USING v_cutoff_date;
    
    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
    v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000;
    
    -- Log successful execution
    INSERT INTO retention_executions (
      policy_id,
      policy_name,
      table_name,
      rows_deleted,
      execution_duration_ms,
      status
    ) VALUES (
      p_policy_id,
      v_policy.policy_name,
      v_policy.table_name,
      v_rows_deleted,
      v_duration_ms,
      'success'
    );
    
    -- Update last run time
    UPDATE retention_policies SET last_run_at = NOW() WHERE id = p_policy_id;
    
    RETURN v_rows_deleted;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000;
    
    -- Log failed execution
    INSERT INTO retention_executions (
      policy_id,
      policy_name,
      table_name,
      rows_deleted,
      execution_duration_ms,
      status,
      error_message
    ) VALUES (
      p_policy_id,
      v_policy.policy_name,
      v_policy.table_name,
      0,
      v_duration_ms,
      'failed',
      v_error_msg
    );
    
    RAISE EXCEPTION 'Retention policy execution failed: %', v_error_msg;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.finalize_inventory(variant_id_input uuid, qty_input integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update product_variants
  set
    stock = stock - qty_input,
    reserved = reserved - qty_input
  where id = variant_id_input;

  -- Update first_sold_at if this is the first sale
  perform update_first_sold_at(variant_id_input);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.fulfill_order_item(variant_id uuid, qty integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_consignor_access_token(p_consignor_id uuid, p_email text, p_validity_hours integer DEFAULT 24)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := NOW() + (p_validity_hours || ' hours')::INTERVAL;
  
  -- Store token
  INSERT INTO consignor_portal_access (
    consignor_id,
    email,
    access_token,
    expires_at
  ) VALUES (
    p_consignor_id,
    p_email,
    v_token,
    v_expires_at
  );
  
  RETURN v_token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_sku(brand_input text, model_input text, size_input text, condition_input text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create type "public"."geometry_dump" as ("path" integer[], "geom" public.geometry);

CREATE OR REPLACE FUNCTION public.get_user_consents(p_user_id uuid, p_tenant_id uuid)
 RETURNS TABLE(consent_code text, consent_name text, consent_description text, category text, is_required boolean, consent_given boolean, consented_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ct.code,
    ct.name,
    ct.description,
    ct.category,
    ct.is_required,
    COALESCE(uc.consent_given, FALSE) as consent_given,
    uc.consented_at
  FROM consent_types ct
  LEFT JOIN user_consents uc 
    ON ct.code = uc.consent_type_code 
    AND uc.user_id = p_user_id
    AND uc.tenant_id = p_tenant_id
  WHERE ct.active = TRUE
  ORDER BY 
    CASE ct.category
      WHEN 'essential' THEN 1
      WHEN 'analytics' THEN 2
      WHEN 'personalization' THEN 3
      WHEN 'marketing' THEN 4
      ELSE 5
    END,
    ct.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  resolved_tenant uuid;
begin
  if new.raw_user_meta_data ? 'tenant_id' then
    resolved_tenant := (new.raw_user_meta_data->>'tenant_id')::uuid;
  elsif new.raw_user_meta_data ? 'tenant_slug' then
    select id into resolved_tenant from public.tenants where slug = new.raw_user_meta_data->>'tenant_slug' limit 1;
  end if;

  if resolved_tenant is null then
    select id into resolved_tenant from public.tenants where slug = '709exclusive' limit 1;
  end if;

  insert into public."709_profiles" (id, role, full_name, tenant_id, created_at)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data->>'full_name', null),
    resolved_tenant,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_consent(p_user_id uuid, p_tenant_id uuid, p_consent_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_consent_given BOOLEAN;
BEGIN
  SELECT consent_given INTO v_consent_given
  FROM user_consents
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND consent_type_code = p_consent_code
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY consented_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_consent_given, FALSE);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_product_edit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create_product'
      WHEN TG_OP = 'UPDATE' THEN 'update_product'
      WHEN TG_OP = 'DELETE' THEN 'delete_product'
    END,
    'product',
    COALESCE(NEW.id::text, OLD.id::text),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('name', NEW.name, 'brand', NEW.brand)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old', jsonb_build_object('name', OLD.name, 'brand', OLD.brand),
        'new', jsonb_build_object('name', NEW.name, 'brand', NEW.brand)
      )
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('name', OLD.name, 'brand', OLD.brand)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_service_role_usage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if current role is service role
  IF current_setting('role', true) = 'service_role' THEN
    INSERT INTO tenant_isolation_alerts (
      alert_type,
      severity,
      table_name,
      operation,
      query_details
    ) VALUES (
      'service_role_access',
      'low',
      TG_TABLE_NAME,
      TG_OP,
      jsonb_build_object(
        'trigger_name', TG_NAME,
        'table', TG_TABLE_NAME,
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_variant_edit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create_variant'
      WHEN TG_OP = 'UPDATE' THEN 'update_variant'
      WHEN TG_OP = 'DELETE' THEN 'delete_variant'
    END,
    'variant',
    COALESCE(NEW.id::text, OLD.id::text),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('sku', NEW.sku, 'price', NEW.price_cents)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old', jsonb_build_object('sku', OLD.sku, 'price', OLD.price_cents, 'stock', OLD.stock),
        'new', jsonb_build_object('sku', NEW.sku, 'price', NEW.price_cents, 'stock', NEW.stock)
      )
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('sku', OLD.sku)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_consent_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Log to audit trail
  INSERT INTO consent_audit (
    user_id,
    tenant_id,
    consent_type_code,
    action,
    previous_state,
    new_state,
    consent_version,
    changed_at,
    details
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(NEW.consent_type_code, OLD.consent_type_code),
    CASE
      WHEN TG_OP = 'INSERT' AND NEW.consent_given THEN 'granted'
      WHEN TG_OP = 'INSERT' AND NOT NEW.consent_given THEN 'withdrawn'
      WHEN TG_OP = 'UPDATE' AND NEW.consent_given AND NOT OLD.consent_given THEN 'granted'
      WHEN TG_OP = 'UPDATE' AND NOT NEW.consent_given AND OLD.consent_given THEN 'withdrawn'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE 'expired'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.consent_given ELSE NULL END,
    NEW.consent_given,
    NEW.consent_version,
    NOW(),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new_consent', true)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('previous_version', OLD.consent_version)
      ELSE '{}'::jsonb
    END
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_price_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.status = 'paid' and old.status != 'paid' then
    insert into price_history (tenant_id, variant_id, price_cents)
    select new.tenant_id, oi.variant_id, oi.price_cents
    from order_items oi
    where oi.order_id = new.id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.release_abandoned_reservations()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.release_reserved_inventory(variant_id uuid, qty integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update product_variants
  set reserved = greatest(reserved - qty, 0)
  where id = variant_id;

  if not found then
    raise exception 'Failed to release reserved inventory for variant %', variant_id;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.release_reserved_inventory_admin(variant_id_input uuid, qty_to_release integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_inventory(cart_items jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_inventory(variant_id_input uuid, qty_input integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.run_tenant_isolation_tests()
 RETURNS TABLE(test_name text, passed boolean, details text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_test_record RECORD;
  v_tables TEXT[];
  v_table TEXT;
  v_passed BOOLEAN;
  v_details TEXT;
BEGIN
  -- Get all tables with tenant_id column
  SELECT array_agg(table_name::TEXT)
  INTO v_tables
  FROM information_schema.columns
  WHERE column_name = 'tenant_id'
    AND table_schema = 'public';
  
  -- Test 1: Check RLS is enabled on all tenant tables
  FOR v_table IN SELECT unnest(v_tables) LOOP
    SELECT relrowsecurity
    INTO v_passed
    FROM pg_class
    WHERE relname = v_table;
    
    v_details := format('RLS enabled: %s', v_passed);
    
    INSERT INTO tenant_isolation_tests (
      test_name,
      test_type,
      table_name,
      passed,
      test_details
    ) VALUES (
      format('RLS enabled on %s', v_table),
      'rls_policy',
      v_table,
      COALESCE(v_passed, FALSE),
      jsonb_build_object('rls_enabled', v_passed)
    );
    
    RETURN QUERY SELECT 
      format('RLS enabled on %s', v_table)::TEXT,
      COALESCE(v_passed, FALSE),
      v_details;
  END LOOP;
  
  -- Test 2: Check that policies exist for tenant filtering
  FOR v_table IN SELECT unnest(v_tables) LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = v_table
      AND policyname LIKE '%tenant%'
    ) INTO v_passed;
    
    v_details := format('Tenant policy exists: %s', v_passed);
    
    INSERT INTO tenant_isolation_tests (
      test_name,
      test_type,
      table_name,
      passed,
      test_details
    ) VALUES (
      format('Tenant policy on %s', v_table),
      'rls_policy',
      v_table,
      v_passed,
      jsonb_build_object('has_tenant_policy', v_passed)
    );
    
    RETURN QUERY SELECT 
      format('Tenant policy on %s', v_table)::TEXT,
      v_passed,
      v_details;
  END LOOP;
  
  RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_consignor_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'sold' AND OLD.status = 'active' THEN
    -- Calculate commission and payout
    NEW.commission_cents := ROUND(NEW.sold_price_cents * (
      SELECT commission_rate / 100 FROM consignors WHERE id = NEW.consignor_id
    ));
    NEW.payout_cents := NEW.sold_price_cents - NEW.commission_cents;
    NEW.sold_at := now();
    
    -- Update consignor totals
    UPDATE consignors SET
      total_sales_cents = total_sales_cents + NEW.sold_price_cents,
      balance_cents = balance_cents + NEW.payout_cents,
      updated_at = now()
    WHERE id = NEW.consignor_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_first_sold_at(variant_id_input uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update product_variants
  set first_sold_at = now()
  where id = variant_id_input
    and first_sold_at is null;
end;
$function$
;

create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" public.geometry);

CREATE OR REPLACE FUNCTION public.validate_consignor_token(p_token text)
 RETURNS TABLE(consignor_id uuid, email text, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cpa.consignor_id,
    cpa.email,
    (cpa.expires_at > NOW()) as is_valid
  FROM consignor_portal_access cpa
  WHERE cpa.access_token = p_token;
  
  -- Update last accessed time
  UPDATE consignor_portal_access
  SET last_accessed_at = NOW()
  WHERE access_token = p_token
    AND expires_at > NOW();
END;
$function$
;

create or replace view "public"."variant_availability" as  SELECT id,
    tenant_id,
    stock,
    reserved,
    (stock - reserved) AS available
   FROM public.product_variants;


grant delete on table "public"."account_deletions" to "anon";

grant insert on table "public"."account_deletions" to "anon";

grant references on table "public"."account_deletions" to "anon";

grant select on table "public"."account_deletions" to "anon";

grant trigger on table "public"."account_deletions" to "anon";

grant truncate on table "public"."account_deletions" to "anon";

grant update on table "public"."account_deletions" to "anon";

grant delete on table "public"."account_deletions" to "authenticated";

grant insert on table "public"."account_deletions" to "authenticated";

grant references on table "public"."account_deletions" to "authenticated";

grant select on table "public"."account_deletions" to "authenticated";

grant trigger on table "public"."account_deletions" to "authenticated";

grant truncate on table "public"."account_deletions" to "authenticated";

grant update on table "public"."account_deletions" to "authenticated";

grant delete on table "public"."account_deletions" to "service_role";

grant insert on table "public"."account_deletions" to "service_role";

grant references on table "public"."account_deletions" to "service_role";

grant select on table "public"."account_deletions" to "service_role";

grant trigger on table "public"."account_deletions" to "service_role";

grant truncate on table "public"."account_deletions" to "service_role";

grant update on table "public"."account_deletions" to "service_role";

grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant references on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant trigger on table "public"."activity_logs" to "anon";

grant truncate on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant references on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant trigger on table "public"."activity_logs" to "authenticated";

grant truncate on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant references on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant trigger on table "public"."activity_logs" to "service_role";

grant truncate on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."attachments" to "anon";

grant insert on table "public"."attachments" to "anon";

grant references on table "public"."attachments" to "anon";

grant select on table "public"."attachments" to "anon";

grant trigger on table "public"."attachments" to "anon";

grant truncate on table "public"."attachments" to "anon";

grant update on table "public"."attachments" to "anon";

grant delete on table "public"."attachments" to "authenticated";

grant insert on table "public"."attachments" to "authenticated";

grant references on table "public"."attachments" to "authenticated";

grant select on table "public"."attachments" to "authenticated";

grant trigger on table "public"."attachments" to "authenticated";

grant truncate on table "public"."attachments" to "authenticated";

grant update on table "public"."attachments" to "authenticated";

grant delete on table "public"."attachments" to "service_role";

grant insert on table "public"."attachments" to "service_role";

grant references on table "public"."attachments" to "service_role";

grant select on table "public"."attachments" to "service_role";

grant trigger on table "public"."attachments" to "service_role";

grant truncate on table "public"."attachments" to "service_role";

grant update on table "public"."attachments" to "service_role";

grant delete on table "public"."audit_log" to "anon";

grant insert on table "public"."audit_log" to "anon";

grant references on table "public"."audit_log" to "anon";

grant select on table "public"."audit_log" to "anon";

grant trigger on table "public"."audit_log" to "anon";

grant truncate on table "public"."audit_log" to "anon";

grant update on table "public"."audit_log" to "anon";

grant delete on table "public"."audit_log" to "authenticated";

grant insert on table "public"."audit_log" to "authenticated";

grant references on table "public"."audit_log" to "authenticated";

grant select on table "public"."audit_log" to "authenticated";

grant trigger on table "public"."audit_log" to "authenticated";

grant truncate on table "public"."audit_log" to "authenticated";

grant update on table "public"."audit_log" to "authenticated";

grant delete on table "public"."audit_log" to "service_role";

grant insert on table "public"."audit_log" to "service_role";

grant references on table "public"."audit_log" to "service_role";

grant select on table "public"."audit_log" to "service_role";

grant trigger on table "public"."audit_log" to "service_role";

grant truncate on table "public"."audit_log" to "service_role";

grant update on table "public"."audit_log" to "service_role";

grant delete on table "public"."badges" to "anon";

grant insert on table "public"."badges" to "anon";

grant references on table "public"."badges" to "anon";

grant select on table "public"."badges" to "anon";

grant trigger on table "public"."badges" to "anon";

grant truncate on table "public"."badges" to "anon";

grant update on table "public"."badges" to "anon";

grant delete on table "public"."badges" to "authenticated";

grant insert on table "public"."badges" to "authenticated";

grant references on table "public"."badges" to "authenticated";

grant select on table "public"."badges" to "authenticated";

grant trigger on table "public"."badges" to "authenticated";

grant truncate on table "public"."badges" to "authenticated";

grant update on table "public"."badges" to "authenticated";

grant delete on table "public"."badges" to "service_role";

grant insert on table "public"."badges" to "service_role";

grant references on table "public"."badges" to "service_role";

grant select on table "public"."badges" to "service_role";

grant trigger on table "public"."badges" to "service_role";

grant truncate on table "public"."badges" to "service_role";

grant update on table "public"."badges" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."chat_members" to "anon";

grant insert on table "public"."chat_members" to "anon";

grant references on table "public"."chat_members" to "anon";

grant select on table "public"."chat_members" to "anon";

grant trigger on table "public"."chat_members" to "anon";

grant truncate on table "public"."chat_members" to "anon";

grant update on table "public"."chat_members" to "anon";

grant delete on table "public"."chat_members" to "authenticated";

grant insert on table "public"."chat_members" to "authenticated";

grant references on table "public"."chat_members" to "authenticated";

grant select on table "public"."chat_members" to "authenticated";

grant trigger on table "public"."chat_members" to "authenticated";

grant truncate on table "public"."chat_members" to "authenticated";

grant update on table "public"."chat_members" to "authenticated";

grant delete on table "public"."chat_members" to "service_role";

grant insert on table "public"."chat_members" to "service_role";

grant references on table "public"."chat_members" to "service_role";

grant select on table "public"."chat_members" to "service_role";

grant trigger on table "public"."chat_members" to "service_role";

grant truncate on table "public"."chat_members" to "service_role";

grant update on table "public"."chat_members" to "service_role";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."chat_threads" to "anon";

grant insert on table "public"."chat_threads" to "anon";

grant references on table "public"."chat_threads" to "anon";

grant select on table "public"."chat_threads" to "anon";

grant trigger on table "public"."chat_threads" to "anon";

grant truncate on table "public"."chat_threads" to "anon";

grant update on table "public"."chat_threads" to "anon";

grant delete on table "public"."chat_threads" to "authenticated";

grant insert on table "public"."chat_threads" to "authenticated";

grant references on table "public"."chat_threads" to "authenticated";

grant select on table "public"."chat_threads" to "authenticated";

grant trigger on table "public"."chat_threads" to "authenticated";

grant truncate on table "public"."chat_threads" to "authenticated";

grant update on table "public"."chat_threads" to "authenticated";

grant delete on table "public"."chat_threads" to "service_role";

grant insert on table "public"."chat_threads" to "service_role";

grant references on table "public"."chat_threads" to "service_role";

grant select on table "public"."chat_threads" to "service_role";

grant trigger on table "public"."chat_threads" to "service_role";

grant truncate on table "public"."chat_threads" to "service_role";

grant update on table "public"."chat_threads" to "service_role";

grant delete on table "public"."consent_audit" to "anon";

grant insert on table "public"."consent_audit" to "anon";

grant references on table "public"."consent_audit" to "anon";

grant select on table "public"."consent_audit" to "anon";

grant trigger on table "public"."consent_audit" to "anon";

grant truncate on table "public"."consent_audit" to "anon";

grant update on table "public"."consent_audit" to "anon";

grant delete on table "public"."consent_audit" to "authenticated";

grant insert on table "public"."consent_audit" to "authenticated";

grant references on table "public"."consent_audit" to "authenticated";

grant select on table "public"."consent_audit" to "authenticated";

grant trigger on table "public"."consent_audit" to "authenticated";

grant truncate on table "public"."consent_audit" to "authenticated";

grant update on table "public"."consent_audit" to "authenticated";

grant delete on table "public"."consent_audit" to "service_role";

grant insert on table "public"."consent_audit" to "service_role";

grant references on table "public"."consent_audit" to "service_role";

grant select on table "public"."consent_audit" to "service_role";

grant trigger on table "public"."consent_audit" to "service_role";

grant truncate on table "public"."consent_audit" to "service_role";

grant update on table "public"."consent_audit" to "service_role";

grant delete on table "public"."consent_types" to "anon";

grant insert on table "public"."consent_types" to "anon";

grant references on table "public"."consent_types" to "anon";

grant select on table "public"."consent_types" to "anon";

grant trigger on table "public"."consent_types" to "anon";

grant truncate on table "public"."consent_types" to "anon";

grant update on table "public"."consent_types" to "anon";

grant delete on table "public"."consent_types" to "authenticated";

grant insert on table "public"."consent_types" to "authenticated";

grant references on table "public"."consent_types" to "authenticated";

grant select on table "public"."consent_types" to "authenticated";

grant trigger on table "public"."consent_types" to "authenticated";

grant truncate on table "public"."consent_types" to "authenticated";

grant update on table "public"."consent_types" to "authenticated";

grant delete on table "public"."consent_types" to "service_role";

grant insert on table "public"."consent_types" to "service_role";

grant references on table "public"."consent_types" to "service_role";

grant select on table "public"."consent_types" to "service_role";

grant trigger on table "public"."consent_types" to "service_role";

grant truncate on table "public"."consent_types" to "service_role";

grant update on table "public"."consent_types" to "service_role";

grant delete on table "public"."consignment_items" to "anon";

grant insert on table "public"."consignment_items" to "anon";

grant references on table "public"."consignment_items" to "anon";

grant select on table "public"."consignment_items" to "anon";

grant trigger on table "public"."consignment_items" to "anon";

grant truncate on table "public"."consignment_items" to "anon";

grant update on table "public"."consignment_items" to "anon";

grant delete on table "public"."consignment_items" to "authenticated";

grant insert on table "public"."consignment_items" to "authenticated";

grant references on table "public"."consignment_items" to "authenticated";

grant select on table "public"."consignment_items" to "authenticated";

grant trigger on table "public"."consignment_items" to "authenticated";

grant truncate on table "public"."consignment_items" to "authenticated";

grant update on table "public"."consignment_items" to "authenticated";

grant delete on table "public"."consignment_items" to "service_role";

grant insert on table "public"."consignment_items" to "service_role";

grant references on table "public"."consignment_items" to "service_role";

grant select on table "public"."consignment_items" to "service_role";

grant trigger on table "public"."consignment_items" to "service_role";

grant truncate on table "public"."consignment_items" to "service_role";

grant update on table "public"."consignment_items" to "service_role";

grant delete on table "public"."consignment_payouts" to "anon";

grant insert on table "public"."consignment_payouts" to "anon";

grant references on table "public"."consignment_payouts" to "anon";

grant select on table "public"."consignment_payouts" to "anon";

grant trigger on table "public"."consignment_payouts" to "anon";

grant truncate on table "public"."consignment_payouts" to "anon";

grant update on table "public"."consignment_payouts" to "anon";

grant delete on table "public"."consignment_payouts" to "authenticated";

grant insert on table "public"."consignment_payouts" to "authenticated";

grant references on table "public"."consignment_payouts" to "authenticated";

grant select on table "public"."consignment_payouts" to "authenticated";

grant trigger on table "public"."consignment_payouts" to "authenticated";

grant truncate on table "public"."consignment_payouts" to "authenticated";

grant update on table "public"."consignment_payouts" to "authenticated";

grant delete on table "public"."consignment_payouts" to "service_role";

grant insert on table "public"."consignment_payouts" to "service_role";

grant references on table "public"."consignment_payouts" to "service_role";

grant select on table "public"."consignment_payouts" to "service_role";

grant trigger on table "public"."consignment_payouts" to "service_role";

grant truncate on table "public"."consignment_payouts" to "service_role";

grant update on table "public"."consignment_payouts" to "service_role";

grant delete on table "public"."consignor_portal_access" to "anon";

grant insert on table "public"."consignor_portal_access" to "anon";

grant references on table "public"."consignor_portal_access" to "anon";

grant select on table "public"."consignor_portal_access" to "anon";

grant trigger on table "public"."consignor_portal_access" to "anon";

grant truncate on table "public"."consignor_portal_access" to "anon";

grant update on table "public"."consignor_portal_access" to "anon";

grant delete on table "public"."consignor_portal_access" to "authenticated";

grant insert on table "public"."consignor_portal_access" to "authenticated";

grant references on table "public"."consignor_portal_access" to "authenticated";

grant select on table "public"."consignor_portal_access" to "authenticated";

grant trigger on table "public"."consignor_portal_access" to "authenticated";

grant truncate on table "public"."consignor_portal_access" to "authenticated";

grant update on table "public"."consignor_portal_access" to "authenticated";

grant delete on table "public"."consignor_portal_access" to "service_role";

grant insert on table "public"."consignor_portal_access" to "service_role";

grant references on table "public"."consignor_portal_access" to "service_role";

grant select on table "public"."consignor_portal_access" to "service_role";

grant trigger on table "public"."consignor_portal_access" to "service_role";

grant truncate on table "public"."consignor_portal_access" to "service_role";

grant update on table "public"."consignor_portal_access" to "service_role";

grant delete on table "public"."consignors" to "anon";

grant insert on table "public"."consignors" to "anon";

grant references on table "public"."consignors" to "anon";

grant select on table "public"."consignors" to "anon";

grant trigger on table "public"."consignors" to "anon";

grant truncate on table "public"."consignors" to "anon";

grant update on table "public"."consignors" to "anon";

grant delete on table "public"."consignors" to "authenticated";

grant insert on table "public"."consignors" to "authenticated";

grant references on table "public"."consignors" to "authenticated";

grant select on table "public"."consignors" to "authenticated";

grant trigger on table "public"."consignors" to "authenticated";

grant truncate on table "public"."consignors" to "authenticated";

grant update on table "public"."consignors" to "authenticated";

grant delete on table "public"."consignors" to "service_role";

grant insert on table "public"."consignors" to "service_role";

grant references on table "public"."consignors" to "service_role";

grant select on table "public"."consignors" to "service_role";

grant trigger on table "public"."consignors" to "service_role";

grant truncate on table "public"."consignors" to "service_role";

grant update on table "public"."consignors" to "service_role";

grant delete on table "public"."data_exports" to "anon";

grant insert on table "public"."data_exports" to "anon";

grant references on table "public"."data_exports" to "anon";

grant select on table "public"."data_exports" to "anon";

grant trigger on table "public"."data_exports" to "anon";

grant truncate on table "public"."data_exports" to "anon";

grant update on table "public"."data_exports" to "anon";

grant delete on table "public"."data_exports" to "authenticated";

grant insert on table "public"."data_exports" to "authenticated";

grant references on table "public"."data_exports" to "authenticated";

grant select on table "public"."data_exports" to "authenticated";

grant trigger on table "public"."data_exports" to "authenticated";

grant truncate on table "public"."data_exports" to "authenticated";

grant update on table "public"."data_exports" to "authenticated";

grant delete on table "public"."data_exports" to "service_role";

grant insert on table "public"."data_exports" to "service_role";

grant references on table "public"."data_exports" to "service_role";

grant select on table "public"."data_exports" to "service_role";

grant trigger on table "public"."data_exports" to "service_role";

grant truncate on table "public"."data_exports" to "service_role";

grant update on table "public"."data_exports" to "service_role";

grant delete on table "public"."drop_alerts" to "anon";

grant insert on table "public"."drop_alerts" to "anon";

grant references on table "public"."drop_alerts" to "anon";

grant select on table "public"."drop_alerts" to "anon";

grant trigger on table "public"."drop_alerts" to "anon";

grant truncate on table "public"."drop_alerts" to "anon";

grant update on table "public"."drop_alerts" to "anon";

grant delete on table "public"."drop_alerts" to "authenticated";

grant insert on table "public"."drop_alerts" to "authenticated";

grant references on table "public"."drop_alerts" to "authenticated";

grant select on table "public"."drop_alerts" to "authenticated";

grant trigger on table "public"."drop_alerts" to "authenticated";

grant truncate on table "public"."drop_alerts" to "authenticated";

grant update on table "public"."drop_alerts" to "authenticated";

grant delete on table "public"."drop_alerts" to "service_role";

grant insert on table "public"."drop_alerts" to "service_role";

grant references on table "public"."drop_alerts" to "service_role";

grant select on table "public"."drop_alerts" to "service_role";

grant trigger on table "public"."drop_alerts" to "service_role";

grant truncate on table "public"."drop_alerts" to "service_role";

grant update on table "public"."drop_alerts" to "service_role";

grant delete on table "public"."engagement_events" to "anon";

grant insert on table "public"."engagement_events" to "anon";

grant references on table "public"."engagement_events" to "anon";

grant select on table "public"."engagement_events" to "anon";

grant trigger on table "public"."engagement_events" to "anon";

grant truncate on table "public"."engagement_events" to "anon";

grant update on table "public"."engagement_events" to "anon";

grant delete on table "public"."engagement_events" to "authenticated";

grant insert on table "public"."engagement_events" to "authenticated";

grant references on table "public"."engagement_events" to "authenticated";

grant select on table "public"."engagement_events" to "authenticated";

grant trigger on table "public"."engagement_events" to "authenticated";

grant truncate on table "public"."engagement_events" to "authenticated";

grant update on table "public"."engagement_events" to "authenticated";

grant delete on table "public"."engagement_events" to "service_role";

grant insert on table "public"."engagement_events" to "service_role";

grant references on table "public"."engagement_events" to "service_role";

grant select on table "public"."engagement_events" to "service_role";

grant trigger on table "public"."engagement_events" to "service_role";

grant truncate on table "public"."engagement_events" to "service_role";

grant update on table "public"."engagement_events" to "service_role";

grant delete on table "public"."goals" to "anon";

grant insert on table "public"."goals" to "anon";

grant references on table "public"."goals" to "anon";

grant select on table "public"."goals" to "anon";

grant trigger on table "public"."goals" to "anon";

grant truncate on table "public"."goals" to "anon";

grant update on table "public"."goals" to "anon";

grant delete on table "public"."goals" to "authenticated";

grant insert on table "public"."goals" to "authenticated";

grant references on table "public"."goals" to "authenticated";

grant select on table "public"."goals" to "authenticated";

grant trigger on table "public"."goals" to "authenticated";

grant truncate on table "public"."goals" to "authenticated";

grant update on table "public"."goals" to "authenticated";

grant delete on table "public"."goals" to "service_role";

grant insert on table "public"."goals" to "service_role";

grant references on table "public"."goals" to "service_role";

grant select on table "public"."goals" to "service_role";

grant trigger on table "public"."goals" to "service_role";

grant truncate on table "public"."goals" to "service_role";

grant update on table "public"."goals" to "service_role";

grant delete on table "public"."guest_interactions" to "anon";

grant insert on table "public"."guest_interactions" to "anon";

grant references on table "public"."guest_interactions" to "anon";

grant select on table "public"."guest_interactions" to "anon";

grant trigger on table "public"."guest_interactions" to "anon";

grant truncate on table "public"."guest_interactions" to "anon";

grant update on table "public"."guest_interactions" to "anon";

grant delete on table "public"."guest_interactions" to "authenticated";

grant insert on table "public"."guest_interactions" to "authenticated";

grant references on table "public"."guest_interactions" to "authenticated";

grant select on table "public"."guest_interactions" to "authenticated";

grant trigger on table "public"."guest_interactions" to "authenticated";

grant truncate on table "public"."guest_interactions" to "authenticated";

grant update on table "public"."guest_interactions" to "authenticated";

grant delete on table "public"."guest_interactions" to "service_role";

grant insert on table "public"."guest_interactions" to "service_role";

grant references on table "public"."guest_interactions" to "service_role";

grant select on table "public"."guest_interactions" to "service_role";

grant trigger on table "public"."guest_interactions" to "service_role";

grant truncate on table "public"."guest_interactions" to "service_role";

grant update on table "public"."guest_interactions" to "service_role";

grant delete on table "public"."guest_profiles" to "anon";

grant insert on table "public"."guest_profiles" to "anon";

grant references on table "public"."guest_profiles" to "anon";

grant select on table "public"."guest_profiles" to "anon";

grant trigger on table "public"."guest_profiles" to "anon";

grant truncate on table "public"."guest_profiles" to "anon";

grant update on table "public"."guest_profiles" to "anon";

grant delete on table "public"."guest_profiles" to "authenticated";

grant insert on table "public"."guest_profiles" to "authenticated";

grant references on table "public"."guest_profiles" to "authenticated";

grant select on table "public"."guest_profiles" to "authenticated";

grant trigger on table "public"."guest_profiles" to "authenticated";

grant truncate on table "public"."guest_profiles" to "authenticated";

grant update on table "public"."guest_profiles" to "authenticated";

grant delete on table "public"."guest_profiles" to "service_role";

grant insert on table "public"."guest_profiles" to "service_role";

grant references on table "public"."guest_profiles" to "service_role";

grant select on table "public"."guest_profiles" to "service_role";

grant trigger on table "public"."guest_profiles" to "service_role";

grant truncate on table "public"."guest_profiles" to "service_role";

grant update on table "public"."guest_profiles" to "service_role";

grant delete on table "public"."institutions" to "anon";

grant insert on table "public"."institutions" to "anon";

grant references on table "public"."institutions" to "anon";

grant select on table "public"."institutions" to "anon";

grant trigger on table "public"."institutions" to "anon";

grant truncate on table "public"."institutions" to "anon";

grant update on table "public"."institutions" to "anon";

grant delete on table "public"."institutions" to "authenticated";

grant insert on table "public"."institutions" to "authenticated";

grant references on table "public"."institutions" to "authenticated";

grant select on table "public"."institutions" to "authenticated";

grant trigger on table "public"."institutions" to "authenticated";

grant truncate on table "public"."institutions" to "authenticated";

grant update on table "public"."institutions" to "authenticated";

grant delete on table "public"."institutions" to "service_role";

grant insert on table "public"."institutions" to "service_role";

grant references on table "public"."institutions" to "service_role";

grant select on table "public"."institutions" to "service_role";

grant trigger on table "public"."institutions" to "service_role";

grant truncate on table "public"."institutions" to "service_role";

grant update on table "public"."institutions" to "service_role";

grant delete on table "public"."inventory_audit" to "anon";

grant insert on table "public"."inventory_audit" to "anon";

grant references on table "public"."inventory_audit" to "anon";

grant select on table "public"."inventory_audit" to "anon";

grant trigger on table "public"."inventory_audit" to "anon";

grant truncate on table "public"."inventory_audit" to "anon";

grant update on table "public"."inventory_audit" to "anon";

grant delete on table "public"."inventory_audit" to "authenticated";

grant insert on table "public"."inventory_audit" to "authenticated";

grant references on table "public"."inventory_audit" to "authenticated";

grant select on table "public"."inventory_audit" to "authenticated";

grant trigger on table "public"."inventory_audit" to "authenticated";

grant truncate on table "public"."inventory_audit" to "authenticated";

grant update on table "public"."inventory_audit" to "authenticated";

grant delete on table "public"."inventory_audit" to "service_role";

grant insert on table "public"."inventory_audit" to "service_role";

grant references on table "public"."inventory_audit" to "service_role";

grant select on table "public"."inventory_audit" to "service_role";

grant trigger on table "public"."inventory_audit" to "service_role";

grant truncate on table "public"."inventory_audit" to "service_role";

grant update on table "public"."inventory_audit" to "service_role";

grant delete on table "public"."local_delivery_zones" to "anon";

grant insert on table "public"."local_delivery_zones" to "anon";

grant references on table "public"."local_delivery_zones" to "anon";

grant select on table "public"."local_delivery_zones" to "anon";

grant trigger on table "public"."local_delivery_zones" to "anon";

grant truncate on table "public"."local_delivery_zones" to "anon";

grant update on table "public"."local_delivery_zones" to "anon";

grant delete on table "public"."local_delivery_zones" to "authenticated";

grant insert on table "public"."local_delivery_zones" to "authenticated";

grant references on table "public"."local_delivery_zones" to "authenticated";

grant select on table "public"."local_delivery_zones" to "authenticated";

grant trigger on table "public"."local_delivery_zones" to "authenticated";

grant truncate on table "public"."local_delivery_zones" to "authenticated";

grant update on table "public"."local_delivery_zones" to "authenticated";

grant delete on table "public"."local_delivery_zones" to "service_role";

grant insert on table "public"."local_delivery_zones" to "service_role";

grant references on table "public"."local_delivery_zones" to "service_role";

grant select on table "public"."local_delivery_zones" to "service_role";

grant trigger on table "public"."local_delivery_zones" to "service_role";

grant truncate on table "public"."local_delivery_zones" to "service_role";

grant update on table "public"."local_delivery_zones" to "service_role";

grant delete on table "public"."merchant_aliases" to "anon";

grant insert on table "public"."merchant_aliases" to "anon";

grant references on table "public"."merchant_aliases" to "anon";

grant select on table "public"."merchant_aliases" to "anon";

grant trigger on table "public"."merchant_aliases" to "anon";

grant truncate on table "public"."merchant_aliases" to "anon";

grant update on table "public"."merchant_aliases" to "anon";

grant delete on table "public"."merchant_aliases" to "authenticated";

grant insert on table "public"."merchant_aliases" to "authenticated";

grant references on table "public"."merchant_aliases" to "authenticated";

grant select on table "public"."merchant_aliases" to "authenticated";

grant trigger on table "public"."merchant_aliases" to "authenticated";

grant truncate on table "public"."merchant_aliases" to "authenticated";

grant update on table "public"."merchant_aliases" to "authenticated";

grant delete on table "public"."merchant_aliases" to "service_role";

grant insert on table "public"."merchant_aliases" to "service_role";

grant references on table "public"."merchant_aliases" to "service_role";

grant select on table "public"."merchant_aliases" to "service_role";

grant trigger on table "public"."merchant_aliases" to "service_role";

grant truncate on table "public"."merchant_aliases" to "service_role";

grant update on table "public"."merchant_aliases" to "service_role";

grant delete on table "public"."merchants" to "anon";

grant insert on table "public"."merchants" to "anon";

grant references on table "public"."merchants" to "anon";

grant select on table "public"."merchants" to "anon";

grant trigger on table "public"."merchants" to "anon";

grant truncate on table "public"."merchants" to "anon";

grant update on table "public"."merchants" to "anon";

grant delete on table "public"."merchants" to "authenticated";

grant insert on table "public"."merchants" to "authenticated";

grant references on table "public"."merchants" to "authenticated";

grant select on table "public"."merchants" to "authenticated";

grant trigger on table "public"."merchants" to "authenticated";

grant truncate on table "public"."merchants" to "authenticated";

grant update on table "public"."merchants" to "authenticated";

grant delete on table "public"."merchants" to "service_role";

grant insert on table "public"."merchants" to "service_role";

grant references on table "public"."merchants" to "service_role";

grant select on table "public"."merchants" to "service_role";

grant trigger on table "public"."merchants" to "service_role";

grant truncate on table "public"."merchants" to "service_role";

grant update on table "public"."merchants" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."model_images" to "anon";

grant insert on table "public"."model_images" to "anon";

grant references on table "public"."model_images" to "anon";

grant select on table "public"."model_images" to "anon";

grant trigger on table "public"."model_images" to "anon";

grant truncate on table "public"."model_images" to "anon";

grant update on table "public"."model_images" to "anon";

grant delete on table "public"."model_images" to "authenticated";

grant insert on table "public"."model_images" to "authenticated";

grant references on table "public"."model_images" to "authenticated";

grant select on table "public"."model_images" to "authenticated";

grant trigger on table "public"."model_images" to "authenticated";

grant truncate on table "public"."model_images" to "authenticated";

grant update on table "public"."model_images" to "authenticated";

grant delete on table "public"."model_images" to "service_role";

grant insert on table "public"."model_images" to "service_role";

grant references on table "public"."model_images" to "service_role";

grant select on table "public"."model_images" to "service_role";

grant trigger on table "public"."model_images" to "service_role";

grant truncate on table "public"."model_images" to "service_role";

grant update on table "public"."model_images" to "service_role";

grant delete on table "public"."price_creep_events" to "anon";

grant insert on table "public"."price_creep_events" to "anon";

grant references on table "public"."price_creep_events" to "anon";

grant select on table "public"."price_creep_events" to "anon";

grant trigger on table "public"."price_creep_events" to "anon";

grant truncate on table "public"."price_creep_events" to "anon";

grant update on table "public"."price_creep_events" to "anon";

grant delete on table "public"."price_creep_events" to "authenticated";

grant insert on table "public"."price_creep_events" to "authenticated";

grant references on table "public"."price_creep_events" to "authenticated";

grant select on table "public"."price_creep_events" to "authenticated";

grant trigger on table "public"."price_creep_events" to "authenticated";

grant truncate on table "public"."price_creep_events" to "authenticated";

grant update on table "public"."price_creep_events" to "authenticated";

grant delete on table "public"."price_creep_events" to "service_role";

grant insert on table "public"."price_creep_events" to "service_role";

grant references on table "public"."price_creep_events" to "service_role";

grant select on table "public"."price_creep_events" to "service_role";

grant trigger on table "public"."price_creep_events" to "service_role";

grant truncate on table "public"."price_creep_events" to "service_role";

grant update on table "public"."price_creep_events" to "service_role";

grant delete on table "public"."price_history" to "anon";

grant insert on table "public"."price_history" to "anon";

grant references on table "public"."price_history" to "anon";

grant select on table "public"."price_history" to "anon";

grant trigger on table "public"."price_history" to "anon";

grant truncate on table "public"."price_history" to "anon";

grant update on table "public"."price_history" to "anon";

grant delete on table "public"."price_history" to "authenticated";

grant insert on table "public"."price_history" to "authenticated";

grant references on table "public"."price_history" to "authenticated";

grant select on table "public"."price_history" to "authenticated";

grant trigger on table "public"."price_history" to "authenticated";

grant truncate on table "public"."price_history" to "authenticated";

grant update on table "public"."price_history" to "authenticated";

grant delete on table "public"."price_history" to "service_role";

grant insert on table "public"."price_history" to "service_role";

grant references on table "public"."price_history" to "service_role";

grant select on table "public"."price_history" to "service_role";

grant trigger on table "public"."price_history" to "service_role";

grant truncate on table "public"."price_history" to "service_role";

grant update on table "public"."price_history" to "service_role";

grant delete on table "public"."pricing_rules" to "anon";

grant insert on table "public"."pricing_rules" to "anon";

grant references on table "public"."pricing_rules" to "anon";

grant select on table "public"."pricing_rules" to "anon";

grant trigger on table "public"."pricing_rules" to "anon";

grant truncate on table "public"."pricing_rules" to "anon";

grant update on table "public"."pricing_rules" to "anon";

grant delete on table "public"."pricing_rules" to "authenticated";

grant insert on table "public"."pricing_rules" to "authenticated";

grant references on table "public"."pricing_rules" to "authenticated";

grant select on table "public"."pricing_rules" to "authenticated";

grant trigger on table "public"."pricing_rules" to "authenticated";

grant truncate on table "public"."pricing_rules" to "authenticated";

grant update on table "public"."pricing_rules" to "authenticated";

grant delete on table "public"."pricing_rules" to "service_role";

grant insert on table "public"."pricing_rules" to "service_role";

grant references on table "public"."pricing_rules" to "service_role";

grant select on table "public"."pricing_rules" to "service_role";

grant trigger on table "public"."pricing_rules" to "service_role";

grant truncate on table "public"."pricing_rules" to "service_role";

grant update on table "public"."pricing_rules" to "service_role";

grant delete on table "public"."product_images" to "anon";

grant insert on table "public"."product_images" to "anon";

grant references on table "public"."product_images" to "anon";

grant select on table "public"."product_images" to "anon";

grant trigger on table "public"."product_images" to "anon";

grant truncate on table "public"."product_images" to "anon";

grant update on table "public"."product_images" to "anon";

grant delete on table "public"."product_images" to "authenticated";

grant insert on table "public"."product_images" to "authenticated";

grant references on table "public"."product_images" to "authenticated";

grant select on table "public"."product_images" to "authenticated";

grant trigger on table "public"."product_images" to "authenticated";

grant truncate on table "public"."product_images" to "authenticated";

grant update on table "public"."product_images" to "authenticated";

grant delete on table "public"."product_images" to "service_role";

grant insert on table "public"."product_images" to "service_role";

grant references on table "public"."product_images" to "service_role";

grant select on table "public"."product_images" to "service_role";

grant trigger on table "public"."product_images" to "service_role";

grant truncate on table "public"."product_images" to "service_role";

grant update on table "public"."product_images" to "service_role";

grant delete on table "public"."product_models" to "anon";

grant insert on table "public"."product_models" to "anon";

grant references on table "public"."product_models" to "anon";

grant select on table "public"."product_models" to "anon";

grant trigger on table "public"."product_models" to "anon";

grant truncate on table "public"."product_models" to "anon";

grant update on table "public"."product_models" to "anon";

grant delete on table "public"."product_models" to "authenticated";

grant insert on table "public"."product_models" to "authenticated";

grant references on table "public"."product_models" to "authenticated";

grant select on table "public"."product_models" to "authenticated";

grant trigger on table "public"."product_models" to "authenticated";

grant truncate on table "public"."product_models" to "authenticated";

grant update on table "public"."product_models" to "authenticated";

grant delete on table "public"."product_models" to "service_role";

grant insert on table "public"."product_models" to "service_role";

grant references on table "public"."product_models" to "service_role";

grant select on table "public"."product_models" to "service_role";

grant trigger on table "public"."product_models" to "service_role";

grant truncate on table "public"."product_models" to "service_role";

grant update on table "public"."product_models" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."recently_viewed" to "anon";

grant insert on table "public"."recently_viewed" to "anon";

grant references on table "public"."recently_viewed" to "anon";

grant select on table "public"."recently_viewed" to "anon";

grant trigger on table "public"."recently_viewed" to "anon";

grant truncate on table "public"."recently_viewed" to "anon";

grant update on table "public"."recently_viewed" to "anon";

grant delete on table "public"."recently_viewed" to "authenticated";

grant insert on table "public"."recently_viewed" to "authenticated";

grant references on table "public"."recently_viewed" to "authenticated";

grant select on table "public"."recently_viewed" to "authenticated";

grant trigger on table "public"."recently_viewed" to "authenticated";

grant truncate on table "public"."recently_viewed" to "authenticated";

grant update on table "public"."recently_viewed" to "authenticated";

grant delete on table "public"."recently_viewed" to "service_role";

grant insert on table "public"."recently_viewed" to "service_role";

grant references on table "public"."recently_viewed" to "service_role";

grant select on table "public"."recently_viewed" to "service_role";

grant trigger on table "public"."recently_viewed" to "service_role";

grant truncate on table "public"."recently_viewed" to "service_role";

grant update on table "public"."recently_viewed" to "service_role";

grant delete on table "public"."reconciliation_matches" to "anon";

grant insert on table "public"."reconciliation_matches" to "anon";

grant references on table "public"."reconciliation_matches" to "anon";

grant select on table "public"."reconciliation_matches" to "anon";

grant trigger on table "public"."reconciliation_matches" to "anon";

grant truncate on table "public"."reconciliation_matches" to "anon";

grant update on table "public"."reconciliation_matches" to "anon";

grant delete on table "public"."reconciliation_matches" to "authenticated";

grant insert on table "public"."reconciliation_matches" to "authenticated";

grant references on table "public"."reconciliation_matches" to "authenticated";

grant select on table "public"."reconciliation_matches" to "authenticated";

grant trigger on table "public"."reconciliation_matches" to "authenticated";

grant truncate on table "public"."reconciliation_matches" to "authenticated";

grant update on table "public"."reconciliation_matches" to "authenticated";

grant delete on table "public"."reconciliation_matches" to "service_role";

grant insert on table "public"."reconciliation_matches" to "service_role";

grant references on table "public"."reconciliation_matches" to "service_role";

grant select on table "public"."reconciliation_matches" to "service_role";

grant trigger on table "public"."reconciliation_matches" to "service_role";

grant truncate on table "public"."reconciliation_matches" to "service_role";

grant update on table "public"."reconciliation_matches" to "service_role";

grant delete on table "public"."reconciliation_runs" to "anon";

grant insert on table "public"."reconciliation_runs" to "anon";

grant references on table "public"."reconciliation_runs" to "anon";

grant select on table "public"."reconciliation_runs" to "anon";

grant trigger on table "public"."reconciliation_runs" to "anon";

grant truncate on table "public"."reconciliation_runs" to "anon";

grant update on table "public"."reconciliation_runs" to "anon";

grant delete on table "public"."reconciliation_runs" to "authenticated";

grant insert on table "public"."reconciliation_runs" to "authenticated";

grant references on table "public"."reconciliation_runs" to "authenticated";

grant select on table "public"."reconciliation_runs" to "authenticated";

grant trigger on table "public"."reconciliation_runs" to "authenticated";

grant truncate on table "public"."reconciliation_runs" to "authenticated";

grant update on table "public"."reconciliation_runs" to "authenticated";

grant delete on table "public"."reconciliation_runs" to "service_role";

grant insert on table "public"."reconciliation_runs" to "service_role";

grant references on table "public"."reconciliation_runs" to "service_role";

grant select on table "public"."reconciliation_runs" to "service_role";

grant trigger on table "public"."reconciliation_runs" to "service_role";

grant truncate on table "public"."reconciliation_runs" to "service_role";

grant update on table "public"."reconciliation_runs" to "service_role";

grant delete on table "public"."recurring_series" to "anon";

grant insert on table "public"."recurring_series" to "anon";

grant references on table "public"."recurring_series" to "anon";

grant select on table "public"."recurring_series" to "anon";

grant trigger on table "public"."recurring_series" to "anon";

grant truncate on table "public"."recurring_series" to "anon";

grant update on table "public"."recurring_series" to "anon";

grant delete on table "public"."recurring_series" to "authenticated";

grant insert on table "public"."recurring_series" to "authenticated";

grant references on table "public"."recurring_series" to "authenticated";

grant select on table "public"."recurring_series" to "authenticated";

grant trigger on table "public"."recurring_series" to "authenticated";

grant truncate on table "public"."recurring_series" to "authenticated";

grant update on table "public"."recurring_series" to "authenticated";

grant delete on table "public"."recurring_series" to "service_role";

grant insert on table "public"."recurring_series" to "service_role";

grant references on table "public"."recurring_series" to "service_role";

grant select on table "public"."recurring_series" to "service_role";

grant trigger on table "public"."recurring_series" to "service_role";

grant truncate on table "public"."recurring_series" to "service_role";

grant update on table "public"."recurring_series" to "service_role";

grant delete on table "public"."retention_executions" to "anon";

grant insert on table "public"."retention_executions" to "anon";

grant references on table "public"."retention_executions" to "anon";

grant select on table "public"."retention_executions" to "anon";

grant trigger on table "public"."retention_executions" to "anon";

grant truncate on table "public"."retention_executions" to "anon";

grant update on table "public"."retention_executions" to "anon";

grant delete on table "public"."retention_executions" to "authenticated";

grant insert on table "public"."retention_executions" to "authenticated";

grant references on table "public"."retention_executions" to "authenticated";

grant select on table "public"."retention_executions" to "authenticated";

grant trigger on table "public"."retention_executions" to "authenticated";

grant truncate on table "public"."retention_executions" to "authenticated";

grant update on table "public"."retention_executions" to "authenticated";

grant delete on table "public"."retention_executions" to "service_role";

grant insert on table "public"."retention_executions" to "service_role";

grant references on table "public"."retention_executions" to "service_role";

grant select on table "public"."retention_executions" to "service_role";

grant trigger on table "public"."retention_executions" to "service_role";

grant truncate on table "public"."retention_executions" to "service_role";

grant update on table "public"."retention_executions" to "service_role";

grant delete on table "public"."retention_policies" to "anon";

grant insert on table "public"."retention_policies" to "anon";

grant references on table "public"."retention_policies" to "anon";

grant select on table "public"."retention_policies" to "anon";

grant trigger on table "public"."retention_policies" to "anon";

grant truncate on table "public"."retention_policies" to "anon";

grant update on table "public"."retention_policies" to "anon";

grant delete on table "public"."retention_policies" to "authenticated";

grant insert on table "public"."retention_policies" to "authenticated";

grant references on table "public"."retention_policies" to "authenticated";

grant select on table "public"."retention_policies" to "authenticated";

grant trigger on table "public"."retention_policies" to "authenticated";

grant truncate on table "public"."retention_policies" to "authenticated";

grant update on table "public"."retention_policies" to "authenticated";

grant delete on table "public"."retention_policies" to "service_role";

grant insert on table "public"."retention_policies" to "service_role";

grant references on table "public"."retention_policies" to "service_role";

grant select on table "public"."retention_policies" to "service_role";

grant trigger on table "public"."retention_policies" to "service_role";

grant truncate on table "public"."retention_policies" to "service_role";

grant update on table "public"."retention_policies" to "service_role";

grant delete on table "public"."returns" to "anon";

grant insert on table "public"."returns" to "anon";

grant references on table "public"."returns" to "anon";

grant select on table "public"."returns" to "anon";

grant trigger on table "public"."returns" to "anon";

grant truncate on table "public"."returns" to "anon";

grant update on table "public"."returns" to "anon";

grant delete on table "public"."returns" to "authenticated";

grant insert on table "public"."returns" to "authenticated";

grant references on table "public"."returns" to "authenticated";

grant select on table "public"."returns" to "authenticated";

grant trigger on table "public"."returns" to "authenticated";

grant truncate on table "public"."returns" to "authenticated";

grant update on table "public"."returns" to "authenticated";

grant delete on table "public"."returns" to "service_role";

grant insert on table "public"."returns" to "service_role";

grant references on table "public"."returns" to "service_role";

grant select on table "public"."returns" to "service_role";

grant trigger on table "public"."returns" to "service_role";

grant truncate on table "public"."returns" to "service_role";

grant update on table "public"."returns" to "service_role";

grant delete on table "public"."rules" to "anon";

grant insert on table "public"."rules" to "anon";

grant references on table "public"."rules" to "anon";

grant select on table "public"."rules" to "anon";

grant trigger on table "public"."rules" to "anon";

grant truncate on table "public"."rules" to "anon";

grant update on table "public"."rules" to "anon";

grant delete on table "public"."rules" to "authenticated";

grant insert on table "public"."rules" to "authenticated";

grant references on table "public"."rules" to "authenticated";

grant select on table "public"."rules" to "authenticated";

grant trigger on table "public"."rules" to "authenticated";

grant truncate on table "public"."rules" to "authenticated";

grant update on table "public"."rules" to "authenticated";

grant delete on table "public"."rules" to "service_role";

grant insert on table "public"."rules" to "service_role";

grant references on table "public"."rules" to "service_role";

grant select on table "public"."rules" to "service_role";

grant trigger on table "public"."rules" to "service_role";

grant truncate on table "public"."rules" to "service_role";

grant update on table "public"."rules" to "service_role";

grant delete on table "public"."shipping_methods" to "anon";

grant insert on table "public"."shipping_methods" to "anon";

grant references on table "public"."shipping_methods" to "anon";

grant select on table "public"."shipping_methods" to "anon";

grant trigger on table "public"."shipping_methods" to "anon";

grant truncate on table "public"."shipping_methods" to "anon";

grant update on table "public"."shipping_methods" to "anon";

grant delete on table "public"."shipping_methods" to "authenticated";

grant insert on table "public"."shipping_methods" to "authenticated";

grant references on table "public"."shipping_methods" to "authenticated";

grant select on table "public"."shipping_methods" to "authenticated";

grant trigger on table "public"."shipping_methods" to "authenticated";

grant truncate on table "public"."shipping_methods" to "authenticated";

grant update on table "public"."shipping_methods" to "authenticated";

grant delete on table "public"."shipping_methods" to "service_role";

grant insert on table "public"."shipping_methods" to "service_role";

grant references on table "public"."shipping_methods" to "service_role";

grant select on table "public"."shipping_methods" to "service_role";

grant trigger on table "public"."shipping_methods" to "service_role";

grant truncate on table "public"."shipping_methods" to "service_role";

grant update on table "public"."shipping_methods" to "service_role";

grant delete on table "public"."site_flags" to "anon";

grant insert on table "public"."site_flags" to "anon";

grant references on table "public"."site_flags" to "anon";

grant select on table "public"."site_flags" to "anon";

grant trigger on table "public"."site_flags" to "anon";

grant truncate on table "public"."site_flags" to "anon";

grant update on table "public"."site_flags" to "anon";

grant delete on table "public"."site_flags" to "authenticated";

grant insert on table "public"."site_flags" to "authenticated";

grant references on table "public"."site_flags" to "authenticated";

grant select on table "public"."site_flags" to "authenticated";

grant trigger on table "public"."site_flags" to "authenticated";

grant truncate on table "public"."site_flags" to "authenticated";

grant update on table "public"."site_flags" to "authenticated";

grant delete on table "public"."site_flags" to "service_role";

grant insert on table "public"."site_flags" to "service_role";

grant references on table "public"."site_flags" to "service_role";

grant select on table "public"."site_flags" to "service_role";

grant trigger on table "public"."site_flags" to "service_role";

grant truncate on table "public"."site_flags" to "service_role";

grant update on table "public"."site_flags" to "service_role";

grant delete on table "public"."spatial_ref_sys" to "anon";

grant insert on table "public"."spatial_ref_sys" to "anon";

grant references on table "public"."spatial_ref_sys" to "anon";

grant select on table "public"."spatial_ref_sys" to "anon";

grant trigger on table "public"."spatial_ref_sys" to "anon";

grant truncate on table "public"."spatial_ref_sys" to "anon";

grant update on table "public"."spatial_ref_sys" to "anon";

grant delete on table "public"."spatial_ref_sys" to "authenticated";

grant insert on table "public"."spatial_ref_sys" to "authenticated";

grant references on table "public"."spatial_ref_sys" to "authenticated";

grant select on table "public"."spatial_ref_sys" to "authenticated";

grant trigger on table "public"."spatial_ref_sys" to "authenticated";

grant truncate on table "public"."spatial_ref_sys" to "authenticated";

grant update on table "public"."spatial_ref_sys" to "authenticated";

grant delete on table "public"."spatial_ref_sys" to "postgres";

grant insert on table "public"."spatial_ref_sys" to "postgres";

grant references on table "public"."spatial_ref_sys" to "postgres";

grant select on table "public"."spatial_ref_sys" to "postgres";

grant trigger on table "public"."spatial_ref_sys" to "postgres";

grant truncate on table "public"."spatial_ref_sys" to "postgres";

grant update on table "public"."spatial_ref_sys" to "postgres";

grant delete on table "public"."spatial_ref_sys" to "service_role";

grant insert on table "public"."spatial_ref_sys" to "service_role";

grant references on table "public"."spatial_ref_sys" to "service_role";

grant select on table "public"."spatial_ref_sys" to "service_role";

grant trigger on table "public"."spatial_ref_sys" to "service_role";

grant truncate on table "public"."spatial_ref_sys" to "service_role";

grant update on table "public"."spatial_ref_sys" to "service_role";

grant delete on table "public"."staff_locations" to "anon";

grant insert on table "public"."staff_locations" to "anon";

grant references on table "public"."staff_locations" to "anon";

grant select on table "public"."staff_locations" to "anon";

grant trigger on table "public"."staff_locations" to "anon";

grant truncate on table "public"."staff_locations" to "anon";

grant update on table "public"."staff_locations" to "anon";

grant delete on table "public"."staff_locations" to "authenticated";

grant insert on table "public"."staff_locations" to "authenticated";

grant references on table "public"."staff_locations" to "authenticated";

grant select on table "public"."staff_locations" to "authenticated";

grant trigger on table "public"."staff_locations" to "authenticated";

grant truncate on table "public"."staff_locations" to "authenticated";

grant update on table "public"."staff_locations" to "authenticated";

grant delete on table "public"."staff_locations" to "service_role";

grant insert on table "public"."staff_locations" to "service_role";

grant references on table "public"."staff_locations" to "service_role";

grant select on table "public"."staff_locations" to "service_role";

grant trigger on table "public"."staff_locations" to "service_role";

grant truncate on table "public"."staff_locations" to "service_role";

grant update on table "public"."staff_locations" to "service_role";

grant delete on table "public"."statement_imports" to "anon";

grant insert on table "public"."statement_imports" to "anon";

grant references on table "public"."statement_imports" to "anon";

grant select on table "public"."statement_imports" to "anon";

grant trigger on table "public"."statement_imports" to "anon";

grant truncate on table "public"."statement_imports" to "anon";

grant update on table "public"."statement_imports" to "anon";

grant delete on table "public"."statement_imports" to "authenticated";

grant insert on table "public"."statement_imports" to "authenticated";

grant references on table "public"."statement_imports" to "authenticated";

grant select on table "public"."statement_imports" to "authenticated";

grant trigger on table "public"."statement_imports" to "authenticated";

grant truncate on table "public"."statement_imports" to "authenticated";

grant update on table "public"."statement_imports" to "authenticated";

grant delete on table "public"."statement_imports" to "service_role";

grant insert on table "public"."statement_imports" to "service_role";

grant references on table "public"."statement_imports" to "service_role";

grant select on table "public"."statement_imports" to "service_role";

grant trigger on table "public"."statement_imports" to "service_role";

grant truncate on table "public"."statement_imports" to "service_role";

grant update on table "public"."statement_imports" to "service_role";

grant delete on table "public"."statement_lines" to "anon";

grant insert on table "public"."statement_lines" to "anon";

grant references on table "public"."statement_lines" to "anon";

grant select on table "public"."statement_lines" to "anon";

grant trigger on table "public"."statement_lines" to "anon";

grant truncate on table "public"."statement_lines" to "anon";

grant update on table "public"."statement_lines" to "anon";

grant delete on table "public"."statement_lines" to "authenticated";

grant insert on table "public"."statement_lines" to "authenticated";

grant references on table "public"."statement_lines" to "authenticated";

grant select on table "public"."statement_lines" to "authenticated";

grant trigger on table "public"."statement_lines" to "authenticated";

grant truncate on table "public"."statement_lines" to "authenticated";

grant update on table "public"."statement_lines" to "authenticated";

grant delete on table "public"."statement_lines" to "service_role";

grant insert on table "public"."statement_lines" to "service_role";

grant references on table "public"."statement_lines" to "service_role";

grant select on table "public"."statement_lines" to "service_role";

grant trigger on table "public"."statement_lines" to "service_role";

grant truncate on table "public"."statement_lines" to "service_role";

grant update on table "public"."statement_lines" to "service_role";

grant delete on table "public"."stock_alerts" to "anon";

grant insert on table "public"."stock_alerts" to "anon";

grant references on table "public"."stock_alerts" to "anon";

grant select on table "public"."stock_alerts" to "anon";

grant trigger on table "public"."stock_alerts" to "anon";

grant truncate on table "public"."stock_alerts" to "anon";

grant update on table "public"."stock_alerts" to "anon";

grant delete on table "public"."stock_alerts" to "authenticated";

grant insert on table "public"."stock_alerts" to "authenticated";

grant references on table "public"."stock_alerts" to "authenticated";

grant select on table "public"."stock_alerts" to "authenticated";

grant trigger on table "public"."stock_alerts" to "authenticated";

grant truncate on table "public"."stock_alerts" to "authenticated";

grant update on table "public"."stock_alerts" to "authenticated";

grant delete on table "public"."stock_alerts" to "service_role";

grant insert on table "public"."stock_alerts" to "service_role";

grant references on table "public"."stock_alerts" to "service_role";

grant select on table "public"."stock_alerts" to "service_role";

grant trigger on table "public"."stock_alerts" to "service_role";

grant truncate on table "public"."stock_alerts" to "service_role";

grant update on table "public"."stock_alerts" to "service_role";

grant delete on table "public"."streaks" to "anon";

grant insert on table "public"."streaks" to "anon";

grant references on table "public"."streaks" to "anon";

grant select on table "public"."streaks" to "anon";

grant trigger on table "public"."streaks" to "anon";

grant truncate on table "public"."streaks" to "anon";

grant update on table "public"."streaks" to "anon";

grant delete on table "public"."streaks" to "authenticated";

grant insert on table "public"."streaks" to "authenticated";

grant references on table "public"."streaks" to "authenticated";

grant select on table "public"."streaks" to "authenticated";

grant trigger on table "public"."streaks" to "authenticated";

grant truncate on table "public"."streaks" to "authenticated";

grant update on table "public"."streaks" to "authenticated";

grant delete on table "public"."streaks" to "service_role";

grant insert on table "public"."streaks" to "service_role";

grant references on table "public"."streaks" to "service_role";

grant select on table "public"."streaks" to "service_role";

grant trigger on table "public"."streaks" to "service_role";

grant truncate on table "public"."streaks" to "service_role";

grant update on table "public"."streaks" to "service_role";

grant delete on table "public"."tenant_billing" to "anon";

grant insert on table "public"."tenant_billing" to "anon";

grant references on table "public"."tenant_billing" to "anon";

grant select on table "public"."tenant_billing" to "anon";

grant trigger on table "public"."tenant_billing" to "anon";

grant truncate on table "public"."tenant_billing" to "anon";

grant update on table "public"."tenant_billing" to "anon";

grant delete on table "public"."tenant_billing" to "authenticated";

grant insert on table "public"."tenant_billing" to "authenticated";

grant references on table "public"."tenant_billing" to "authenticated";

grant select on table "public"."tenant_billing" to "authenticated";

grant trigger on table "public"."tenant_billing" to "authenticated";

grant truncate on table "public"."tenant_billing" to "authenticated";

grant update on table "public"."tenant_billing" to "authenticated";

grant delete on table "public"."tenant_billing" to "service_role";

grant insert on table "public"."tenant_billing" to "service_role";

grant references on table "public"."tenant_billing" to "service_role";

grant select on table "public"."tenant_billing" to "service_role";

grant trigger on table "public"."tenant_billing" to "service_role";

grant truncate on table "public"."tenant_billing" to "service_role";

grant update on table "public"."tenant_billing" to "service_role";

grant delete on table "public"."tenant_domains" to "anon";

grant insert on table "public"."tenant_domains" to "anon";

grant references on table "public"."tenant_domains" to "anon";

grant select on table "public"."tenant_domains" to "anon";

grant trigger on table "public"."tenant_domains" to "anon";

grant truncate on table "public"."tenant_domains" to "anon";

grant update on table "public"."tenant_domains" to "anon";

grant delete on table "public"."tenant_domains" to "authenticated";

grant insert on table "public"."tenant_domains" to "authenticated";

grant references on table "public"."tenant_domains" to "authenticated";

grant select on table "public"."tenant_domains" to "authenticated";

grant trigger on table "public"."tenant_domains" to "authenticated";

grant truncate on table "public"."tenant_domains" to "authenticated";

grant update on table "public"."tenant_domains" to "authenticated";

grant delete on table "public"."tenant_domains" to "service_role";

grant insert on table "public"."tenant_domains" to "service_role";

grant references on table "public"."tenant_domains" to "service_role";

grant select on table "public"."tenant_domains" to "service_role";

grant trigger on table "public"."tenant_domains" to "service_role";

grant truncate on table "public"."tenant_domains" to "service_role";

grant update on table "public"."tenant_domains" to "service_role";

grant delete on table "public"."tenant_isolation_alerts" to "anon";

grant insert on table "public"."tenant_isolation_alerts" to "anon";

grant references on table "public"."tenant_isolation_alerts" to "anon";

grant select on table "public"."tenant_isolation_alerts" to "anon";

grant trigger on table "public"."tenant_isolation_alerts" to "anon";

grant truncate on table "public"."tenant_isolation_alerts" to "anon";

grant update on table "public"."tenant_isolation_alerts" to "anon";

grant delete on table "public"."tenant_isolation_alerts" to "authenticated";

grant insert on table "public"."tenant_isolation_alerts" to "authenticated";

grant references on table "public"."tenant_isolation_alerts" to "authenticated";

grant select on table "public"."tenant_isolation_alerts" to "authenticated";

grant trigger on table "public"."tenant_isolation_alerts" to "authenticated";

grant truncate on table "public"."tenant_isolation_alerts" to "authenticated";

grant update on table "public"."tenant_isolation_alerts" to "authenticated";

grant delete on table "public"."tenant_isolation_alerts" to "service_role";

grant insert on table "public"."tenant_isolation_alerts" to "service_role";

grant references on table "public"."tenant_isolation_alerts" to "service_role";

grant select on table "public"."tenant_isolation_alerts" to "service_role";

grant trigger on table "public"."tenant_isolation_alerts" to "service_role";

grant truncate on table "public"."tenant_isolation_alerts" to "service_role";

grant update on table "public"."tenant_isolation_alerts" to "service_role";

grant delete on table "public"."tenant_isolation_tests" to "anon";

grant insert on table "public"."tenant_isolation_tests" to "anon";

grant references on table "public"."tenant_isolation_tests" to "anon";

grant select on table "public"."tenant_isolation_tests" to "anon";

grant trigger on table "public"."tenant_isolation_tests" to "anon";

grant truncate on table "public"."tenant_isolation_tests" to "anon";

grant update on table "public"."tenant_isolation_tests" to "anon";

grant delete on table "public"."tenant_isolation_tests" to "authenticated";

grant insert on table "public"."tenant_isolation_tests" to "authenticated";

grant references on table "public"."tenant_isolation_tests" to "authenticated";

grant select on table "public"."tenant_isolation_tests" to "authenticated";

grant trigger on table "public"."tenant_isolation_tests" to "authenticated";

grant truncate on table "public"."tenant_isolation_tests" to "authenticated";

grant update on table "public"."tenant_isolation_tests" to "authenticated";

grant delete on table "public"."tenant_isolation_tests" to "service_role";

grant insert on table "public"."tenant_isolation_tests" to "service_role";

grant references on table "public"."tenant_isolation_tests" to "service_role";

grant select on table "public"."tenant_isolation_tests" to "service_role";

grant trigger on table "public"."tenant_isolation_tests" to "service_role";

grant truncate on table "public"."tenant_isolation_tests" to "service_role";

grant update on table "public"."tenant_isolation_tests" to "service_role";

grant delete on table "public"."tenants" to "anon";

grant insert on table "public"."tenants" to "anon";

grant references on table "public"."tenants" to "anon";

grant select on table "public"."tenants" to "anon";

grant trigger on table "public"."tenants" to "anon";

grant truncate on table "public"."tenants" to "anon";

grant update on table "public"."tenants" to "anon";

grant delete on table "public"."tenants" to "authenticated";

grant insert on table "public"."tenants" to "authenticated";

grant references on table "public"."tenants" to "authenticated";

grant select on table "public"."tenants" to "authenticated";

grant trigger on table "public"."tenants" to "authenticated";

grant truncate on table "public"."tenants" to "authenticated";

grant update on table "public"."tenants" to "authenticated";

grant delete on table "public"."tenants" to "service_role";

grant insert on table "public"."tenants" to "service_role";

grant references on table "public"."tenants" to "service_role";

grant select on table "public"."tenants" to "service_role";

grant trigger on table "public"."tenants" to "service_role";

grant truncate on table "public"."tenants" to "service_role";

grant update on table "public"."tenants" to "service_role";

grant delete on table "public"."transaction_fields" to "anon";

grant insert on table "public"."transaction_fields" to "anon";

grant references on table "public"."transaction_fields" to "anon";

grant select on table "public"."transaction_fields" to "anon";

grant trigger on table "public"."transaction_fields" to "anon";

grant truncate on table "public"."transaction_fields" to "anon";

grant update on table "public"."transaction_fields" to "anon";

grant delete on table "public"."transaction_fields" to "authenticated";

grant insert on table "public"."transaction_fields" to "authenticated";

grant references on table "public"."transaction_fields" to "authenticated";

grant select on table "public"."transaction_fields" to "authenticated";

grant trigger on table "public"."transaction_fields" to "authenticated";

grant truncate on table "public"."transaction_fields" to "authenticated";

grant update on table "public"."transaction_fields" to "authenticated";

grant delete on table "public"."transaction_fields" to "service_role";

grant insert on table "public"."transaction_fields" to "service_role";

grant references on table "public"."transaction_fields" to "service_role";

grant select on table "public"."transaction_fields" to "service_role";

grant trigger on table "public"."transaction_fields" to "service_role";

grant truncate on table "public"."transaction_fields" to "service_role";

grant update on table "public"."transaction_fields" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."user_consents" to "anon";

grant insert on table "public"."user_consents" to "anon";

grant references on table "public"."user_consents" to "anon";

grant select on table "public"."user_consents" to "anon";

grant trigger on table "public"."user_consents" to "anon";

grant truncate on table "public"."user_consents" to "anon";

grant update on table "public"."user_consents" to "anon";

grant delete on table "public"."user_consents" to "authenticated";

grant insert on table "public"."user_consents" to "authenticated";

grant references on table "public"."user_consents" to "authenticated";

grant select on table "public"."user_consents" to "authenticated";

grant trigger on table "public"."user_consents" to "authenticated";

grant truncate on table "public"."user_consents" to "authenticated";

grant update on table "public"."user_consents" to "authenticated";

grant delete on table "public"."user_consents" to "service_role";

grant insert on table "public"."user_consents" to "service_role";

grant references on table "public"."user_consents" to "service_role";

grant select on table "public"."user_consents" to "service_role";

grant trigger on table "public"."user_consents" to "service_role";

grant truncate on table "public"."user_consents" to "service_role";

grant update on table "public"."user_consents" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."wishlist_items" to "anon";

grant insert on table "public"."wishlist_items" to "anon";

grant references on table "public"."wishlist_items" to "anon";

grant select on table "public"."wishlist_items" to "anon";

grant trigger on table "public"."wishlist_items" to "anon";

grant truncate on table "public"."wishlist_items" to "anon";

grant update on table "public"."wishlist_items" to "anon";

grant delete on table "public"."wishlist_items" to "authenticated";

grant insert on table "public"."wishlist_items" to "authenticated";

grant references on table "public"."wishlist_items" to "authenticated";

grant select on table "public"."wishlist_items" to "authenticated";

grant trigger on table "public"."wishlist_items" to "authenticated";

grant truncate on table "public"."wishlist_items" to "authenticated";

grant update on table "public"."wishlist_items" to "authenticated";

grant delete on table "public"."wishlist_items" to "service_role";

grant insert on table "public"."wishlist_items" to "service_role";

grant references on table "public"."wishlist_items" to "service_role";

grant select on table "public"."wishlist_items" to "service_role";

grant trigger on table "public"."wishlist_items" to "service_role";

grant truncate on table "public"."wishlist_items" to "service_role";

grant update on table "public"."wishlist_items" to "service_role";


  create policy "Anyone can read public keys"
  on "public"."709_profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Users can update own public key"
  on "public"."709_profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users read own profile"
  on "public"."709_profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Admins can manage deletions"
  on "public"."account_deletions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Users can view own deletion requests"
  on "public"."account_deletions"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (auth.uid() = requested_by)));



  create policy "accounts_delete"
  on "public"."accounts"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "accounts_insert"
  on "public"."accounts"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "accounts_select"
  on "public"."accounts"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "accounts_update"
  on "public"."accounts"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admins can insert activity logs"
  on "public"."activity_logs"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can view activity logs"
  on "public"."activity_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "attachments_delete"
  on "public"."attachments"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "attachments_insert"
  on "public"."attachments"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "attachments_select"
  on "public"."attachments"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "attachments_update"
  on "public"."attachments"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "audit_log_insert"
  on "public"."audit_log"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "audit_log_select"
  on "public"."audit_log"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can insert own badges"
  on "public"."badges"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view own badges"
  on "public"."badges"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "categories_delete"
  on "public"."categories"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "categories_insert"
  on "public"."categories"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "categories_select"
  on "public"."categories"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "categories_update"
  on "public"."categories"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Chat members can view members"
  on "public"."chat_members"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.chat_members cm
  WHERE ((cm.thread_id = chat_members.thread_id) AND (cm.user_id = auth.uid())))));



  create policy "Staff can add chat members"
  on "public"."chat_members"
  as permissive
  for insert
  to public
with check (((EXISTS ( SELECT 1
   FROM public."709_profiles" actor
  WHERE ((actor.id = auth.uid()) AND (actor.role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role]))))) AND (EXISTS ( SELECT 1
   FROM public.chat_threads
  WHERE ((chat_threads.id = chat_members.thread_id) AND (chat_threads.tenant_id = ( SELECT "709_profiles".tenant_id
           FROM public."709_profiles"
          WHERE ("709_profiles".id = auth.uid())))))) AND (EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = chat_members.user_id) AND ("709_profiles".tenant_id = ( SELECT "709_profiles_1".tenant_id
           FROM public."709_profiles" "709_profiles_1"
          WHERE ("709_profiles_1".id = auth.uid()))) AND ("709_profiles".role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])))))));



  create policy "Chat members can send messages"
  on "public"."chat_messages"
  as permissive
  for insert
  to public
with check (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.chat_members
  WHERE ((chat_members.thread_id = chat_messages.thread_id) AND (chat_members.user_id = auth.uid()))))));



  create policy "Chat members can view messages"
  on "public"."chat_messages"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.chat_members
  WHERE ((chat_members.thread_id = chat_messages.thread_id) AND (chat_members.user_id = auth.uid())))));



  create policy "Chat members can view threads"
  on "public"."chat_threads"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.chat_members
  WHERE ((chat_members.thread_id = chat_threads.id) AND (chat_members.user_id = auth.uid())))));



  create policy "Staff can create chat threads"
  on "public"."chat_threads"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])) AND ("709_profiles".tenant_id = chat_threads.tenant_id)))));



  create policy "Admins can view all consent audits"
  on "public"."consent_audit"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Users can view own consent audit"
  on "public"."consent_audit"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Anyone can read consent types"
  on "public"."consent_types"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Admins can manage consignment items"
  on "public"."consignment_items"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can manage consignment payouts"
  on "public"."consignment_payouts"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can manage consignor access"
  on "public"."consignor_portal_access"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Consignors can view own access"
  on "public"."consignor_portal_access"
  as permissive
  for select
  to public
using ((email = current_setting('app.consignor_email'::text, true)));



  create policy "Admins can manage consignors"
  on "public"."consignors"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can view all exports"
  on "public"."data_exports"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Users can view own exports"
  on "public"."data_exports"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users manage own drop alerts"
  on "public"."drop_alerts"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own engagement_events"
  on "public"."engagement_events"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view own engagement_events"
  on "public"."engagement_events"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own goals"
  on "public"."goals"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own goals"
  on "public"."goals"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own goals"
  on "public"."goals"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "institutions_delete"
  on "public"."institutions"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "institutions_insert"
  on "public"."institutions"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "institutions_select"
  on "public"."institutions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "institutions_update"
  on "public"."institutions"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admins can manage local delivery zones"
  on "public"."local_delivery_zones"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Anyone can view active local delivery zones"
  on "public"."local_delivery_zones"
  as permissive
  for select
  to public
using ((active = true));



  create policy "merchant_aliases_delete"
  on "public"."merchant_aliases"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "merchant_aliases_insert"
  on "public"."merchant_aliases"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "merchant_aliases_select"
  on "public"."merchant_aliases"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "merchant_aliases_update"
  on "public"."merchant_aliases"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "merchants_delete"
  on "public"."merchants"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "merchants_insert"
  on "public"."merchants"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "merchants_select"
  on "public"."merchants"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "merchants_update"
  on "public"."merchants"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admins can send messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((sender_type = 'admin'::text) AND (EXISTS ( SELECT 1
   FROM public."709_profiles" p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])) AND ((p.tenant_id IS NULL) OR (p.tenant_id = messages.tenant_id))))) AND ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.customer_id = messages.customer_id) AND ((o.tenant_id IS NULL) OR (o.tenant_id = messages.tenant_id))))) OR (EXISTS ( SELECT 1
   FROM public."709_profiles" recipient
  WHERE ((recipient.id = messages.customer_id) AND (recipient.role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])) AND ((recipient.tenant_id IS NULL) OR (recipient.tenant_id = messages.tenant_id))))))));



  create policy "Admins can update messages"
  on "public"."messages"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])) AND (("709_profiles".tenant_id IS NULL) OR ("709_profiles".tenant_id = messages.tenant_id))))));



  create policy "Admins can view all messages"
  on "public"."messages"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])) AND (("709_profiles".tenant_id IS NULL) OR ("709_profiles".tenant_id = messages.tenant_id))))));



  create policy "Customers can send messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((customer_id = auth.uid()) AND (sender_type = 'customer'::text) AND ((tenant_id IS NULL) OR (tenant_id = ( SELECT "709_profiles".tenant_id
   FROM public."709_profiles"
  WHERE ("709_profiles".id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.customer_id = auth.uid()) AND (orders.status = ANY (ARRAY['pending'::public.order_status, 'paid'::public.order_status, 'fulfilled'::public.order_status, 'shipped'::public.order_status])) AND ((orders.tenant_id IS NULL) OR (orders.tenant_id = ( SELECT "709_profiles".tenant_id
           FROM public."709_profiles"
          WHERE ("709_profiles".id = auth.uid())))))))));



  create policy "Customers can update own messages"
  on "public"."messages"
  as permissive
  for update
  to public
using (((customer_id = auth.uid()) AND ((tenant_id IS NULL) OR (tenant_id = ( SELECT "709_profiles".tenant_id
   FROM public."709_profiles"
  WHERE ("709_profiles".id = auth.uid()))))));



  create policy "Customers can view own messages"
  on "public"."messages"
  as permissive
  for select
  to public
using (((customer_id = auth.uid()) AND ((tenant_id IS NULL) OR (tenant_id = ( SELECT "709_profiles".tenant_id
   FROM public."709_profiles"
  WHERE ("709_profiles".id = auth.uid()))))));



  create policy "Admins can manage model images"
  on "public"."model_images"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Anyone can view model images"
  on "public"."model_images"
  as permissive
  for select
  to public
using (true);



  create policy "Admins read all orders"
  on "public"."orders"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Customers read own orders"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth.uid() = customer_id));



  create policy "price_creep_events_insert"
  on "public"."price_creep_events"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "price_creep_events_select"
  on "public"."price_creep_events"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Anyone can read price history"
  on "public"."price_history"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can manage pricing rules"
  on "public"."pricing_rules"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can delete product images"
  on "public"."product_images"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can insert product images"
  on "public"."product_images"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Anyone can view product images"
  on "public"."product_images"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can insert product models"
  on "public"."product_models"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can update product models"
  on "public"."product_models"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Anyone can view product models"
  on "public"."product_models"
  as permissive
  for select
  to public
using (true);



  create policy "profiles_insert"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((id = auth.uid()));



  create policy "profiles_select"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "profiles_update"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = auth.uid()));



  create policy "Users manage own recently viewed"
  on "public"."recently_viewed"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "reconciliation_matches_delete"
  on "public"."reconciliation_matches"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "reconciliation_matches_insert"
  on "public"."reconciliation_matches"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "reconciliation_matches_select"
  on "public"."reconciliation_matches"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "reconciliation_runs_delete"
  on "public"."reconciliation_runs"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "reconciliation_runs_insert"
  on "public"."reconciliation_runs"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "reconciliation_runs_select"
  on "public"."reconciliation_runs"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "reconciliation_runs_update"
  on "public"."reconciliation_runs"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "recurring_series_delete"
  on "public"."recurring_series"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "recurring_series_insert"
  on "public"."recurring_series"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "recurring_series_select"
  on "public"."recurring_series"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "recurring_series_update"
  on "public"."recurring_series"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admins can view retention executions"
  on "public"."retention_executions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can manage retention policies"
  on "public"."retention_policies"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = 'owner'::public.user_role)))));



  create policy "Admins can view retention policies"
  on "public"."retention_policies"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can manage returns"
  on "public"."returns"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "rules_delete"
  on "public"."rules"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "rules_insert"
  on "public"."rules"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "rules_select"
  on "public"."rules"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "rules_update"
  on "public"."rules"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admins can manage shipping methods"
  on "public"."shipping_methods"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Anyone can view active shipping methods"
  on "public"."shipping_methods"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Admins can manage site flags"
  on "public"."site_flags"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can read site flags"
  on "public"."site_flags"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Public can read maintenance flag"
  on "public"."site_flags"
  as permissive
  for select
  to public
using ((key = 'maintenance_mode'::text));



  create policy "Admins read staff locations"
  on "public"."staff_locations"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Staff insert own locations"
  on "public"."staff_locations"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])))))));



  create policy "Staff read own locations"
  on "public"."staff_locations"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['staff'::public.user_role, 'admin'::public.user_role, 'owner'::public.user_role])))))));



  create policy "statement_imports_delete"
  on "public"."statement_imports"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "statement_imports_insert"
  on "public"."statement_imports"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "statement_imports_select"
  on "public"."statement_imports"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "statement_imports_update"
  on "public"."statement_imports"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "statement_lines_delete"
  on "public"."statement_lines"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "statement_lines_insert"
  on "public"."statement_lines"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "statement_lines_select"
  on "public"."statement_lines"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "statement_lines_update"
  on "public"."statement_lines"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users manage own stock alerts"
  on "public"."stock_alerts"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own streaks"
  on "public"."streaks"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own streaks"
  on "public"."streaks"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own streaks"
  on "public"."streaks"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can manage isolation alerts"
  on "public"."tenant_isolation_alerts"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can view isolation alerts"
  on "public"."tenant_isolation_alerts"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Admins can view test results"
  on "public"."tenant_isolation_tests"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "transaction_fields_delete"
  on "public"."transaction_fields"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "transaction_fields_insert"
  on "public"."transaction_fields"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "transaction_fields_select"
  on "public"."transaction_fields"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "transaction_fields_update"
  on "public"."transaction_fields"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "transactions_delete"
  on "public"."transactions"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "transactions_insert"
  on "public"."transactions"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "transactions_select"
  on "public"."transactions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "transactions_update"
  on "public"."transactions"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admins can view all consents"
  on "public"."user_consents"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public."709_profiles"
  WHERE (("709_profiles".id = auth.uid()) AND ("709_profiles".role = ANY (ARRAY['admin'::public.user_role, 'owner'::public.user_role]))))));



  create policy "Users can insert own consents"
  on "public"."user_consents"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own consents"
  on "public"."user_consents"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view own consents"
  on "public"."user_consents"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users manage own preferences"
  on "public"."user_preferences"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users manage own wishlist"
  on "public"."wishlist_items"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER trigger_consignment_sale BEFORE UPDATE ON public.consignment_items FOR EACH ROW EXECUTE FUNCTION public.update_consignor_on_sale();

CREATE TRIGGER trigger_record_price AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.record_price_on_sale();

CREATE TRIGGER trigger_check_stock_alerts AFTER UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.check_stock_alerts();

CREATE TRIGGER trigger_log_variant_edit AFTER INSERT OR DELETE OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.log_variant_edit();

CREATE TRIGGER trigger_log_product_edit AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.log_product_edit();

CREATE TRIGGER trigger_consent_change AFTER INSERT OR UPDATE ON public.user_consents FOR EACH ROW EXECUTE FUNCTION public.record_consent_change();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "admin upload access"
  on "storage"."buckets"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "read access"
  on "storage"."buckets"
  as permissive
  for select
  to public
using (true);



  create policy "Admin upload acess 16tc3h8_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Public Read Access 16tc3h8_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



