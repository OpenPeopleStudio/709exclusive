-- Fix: staff/admin/owner can access tenant messages in inbox
-- This is required because staff users are allowed into /admin/inbox, but older
-- message RLS policies sometimes only permitted admin/owner.

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (names used across earlier migrations)
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can send messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
DROP POLICY IF EXISTS "Customers can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Customers can send messages" ON public.messages;
DROP POLICY IF EXISTS "Customers can update own messages" ON public.messages;

-- Customers: can view their own messages (tenant-safe)
CREATE POLICY "Customers can view own messages"
ON public.messages
FOR SELECT
TO public
USING (
  customer_id = auth.uid()
  AND (
    tenant_id IS NULL
    OR tenant_id = (
      SELECT p.tenant_id
      FROM public."709_profiles" p
      WHERE p.id = auth.uid()
    )
  )
);

-- Customers: can send messages only if they have an eligible order (tenant-safe)
CREATE POLICY "Customers can send messages"
ON public.messages
FOR INSERT
TO public
WITH CHECK (
  customer_id = auth.uid()
  AND sender_type = 'customer'
  AND (
    tenant_id IS NULL
    OR tenant_id = (
      SELECT p.tenant_id
      FROM public."709_profiles" p
      WHERE p.id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.customer_id = auth.uid()
      AND o.status IN ('pending', 'paid', 'fulfilled', 'shipped')
      AND (
        o.tenant_id IS NULL
        OR o.tenant_id = (
          SELECT p.tenant_id
          FROM public."709_profiles" p
          WHERE p.id = auth.uid()
        )
      )
  )
);

-- Customers: can update their own messages (mark read/delete), tenant-safe
CREATE POLICY "Customers can update own messages"
ON public.messages
FOR UPDATE
TO public
USING (
  customer_id = auth.uid()
  AND (
    tenant_id IS NULL
    OR tenant_id = (
      SELECT p.tenant_id
      FROM public."709_profiles" p
      WHERE p.id = auth.uid()
    )
  )
);

-- Staff/Admin/Owner: can view messages for their tenant.
-- Also supports legacy rows where messages.tenant_id is NULL by matching on the
-- customer's profile tenant.
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public."709_profiles" actor
    JOIN public."709_profiles" customer ON customer.id = messages.customer_id
    WHERE actor.id = auth.uid()
      AND actor.role IN ('staff', 'admin', 'owner')
      AND (
        actor.tenant_id IS NULL
        OR actor.tenant_id = messages.tenant_id
        OR (messages.tenant_id IS NULL AND customer.tenant_id = actor.tenant_id)
      )
  )
);

-- Staff/Admin/Owner: can send messages (as sender_type='admin') within their tenant.
-- Requires the customer either has an order in-tenant, or is also staff/admin/owner.
CREATE POLICY "Admins can send messages"
ON public.messages
FOR INSERT
TO public
WITH CHECK (
  sender_type = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public."709_profiles" actor
    JOIN public."709_profiles" recipient ON recipient.id = messages.customer_id
    WHERE actor.id = auth.uid()
      AND actor.role IN ('staff', 'admin', 'owner')
      AND (
        actor.tenant_id IS NULL
        OR actor.tenant_id = messages.tenant_id
        OR (messages.tenant_id IS NULL AND recipient.tenant_id = actor.tenant_id)
      )
  )
  AND (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.customer_id = messages.customer_id
        AND (
          o.tenant_id IS NULL
          OR o.tenant_id = messages.tenant_id
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public."709_profiles" recipient
      WHERE recipient.id = messages.customer_id
        AND recipient.role IN ('staff', 'admin', 'owner')
        AND (
          recipient.tenant_id IS NULL
          OR recipient.tenant_id = messages.tenant_id
        )
    )
  )
);

-- Staff/Admin/Owner: can update messages (read/deletes) within tenant
CREATE POLICY "Admins can update messages"
ON public.messages
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public."709_profiles" actor
    WHERE actor.id = auth.uid()
      AND actor.role IN ('staff', 'admin', 'owner')
      AND (
        actor.tenant_id IS NULL
        OR actor.tenant_id = messages.tenant_id
        OR (
          messages.tenant_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM public."709_profiles" customer
            WHERE customer.id = messages.customer_id
              AND customer.tenant_id = actor.tenant_id
          )
        )
      )
  )
);

-- Ensure realtime includes the table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;

