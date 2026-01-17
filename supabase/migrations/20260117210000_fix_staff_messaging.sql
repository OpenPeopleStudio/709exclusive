-- Fix staff-to-staff and staff-to-admin messaging
-- Current policies only support customer-admin communication

-- Drop and recreate admin/staff policies to support internal messaging

DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can send messages" ON messages;
DROP POLICY IF EXISTS "Admins can update messages" ON messages;

-- Admins/Staff can view all messages within their tenant
CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
    AND (
      tenant_id IS NULL 
      OR tenant_id = messages.tenant_id
    )
  )
);

-- Admins/Staff can send messages within their tenant
-- This now supports:
-- 1. Admin → Customer (sender_type='admin', customer_id=recipient)
-- 2. Staff → Admin (sender_type='admin', customer_id=recipient_staff_id)
-- 3. Admin → Staff (sender_type='admin', customer_id=recipient_staff_id)
CREATE POLICY "Admins can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_type = 'admin'
  AND EXISTS (
    SELECT 1 FROM "709_profiles" p
    WHERE p.id = auth.uid()
    AND p.role IN ('staff', 'admin', 'owner')
    AND (
      p.tenant_id IS NULL 
      OR p.tenant_id = messages.tenant_id
    )
  )
  AND (
    -- Allow messaging to customers with orders
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_id = messages.customer_id
      AND (o.tenant_id IS NULL OR o.tenant_id = messages.tenant_id)
    )
    OR
    -- Allow internal staff/admin messaging (recipient is staff/admin/owner)
    EXISTS (
      SELECT 1 FROM "709_profiles" recipient
      WHERE recipient.id = messages.customer_id
      AND recipient.role IN ('staff', 'admin', 'owner')
      AND (recipient.tenant_id IS NULL OR recipient.tenant_id = messages.tenant_id)
    )
  )
);

-- Admins/Staff can update messages within their tenant
CREATE POLICY "Admins can update messages"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
    AND (
      tenant_id IS NULL 
      OR tenant_id = messages.tenant_id
    )
  )
);

COMMENT ON POLICY "Admins can send messages" ON messages IS 'Allows staff/admin to message customers OR other staff/admin users within tenant';
