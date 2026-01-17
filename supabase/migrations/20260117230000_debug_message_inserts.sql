-- Debug and fix message insert issues with sender_public_key

-- Check current RLS policies on messages table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- Verify the columns exist and their types
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name IN ('encrypted', 'iv', 'sender_public_key', 'message_index')
ORDER BY column_name;

-- Test INSERT with all encryption fields (should work)
-- This is just a diagnostic - comment out if needed
/*
INSERT INTO messages (
  tenant_id,
  customer_id,
  content,
  sender_type,
  read,
  encrypted,
  iv,
  sender_public_key,
  message_index
) VALUES (
  (SELECT id FROM tenants WHERE slug = '709exclusive' LIMIT 1),
  (SELECT id FROM "709_profiles" WHERE role = 'admin' LIMIT 1),
  'test-encrypted-content',
  'admin',
  false,
  true,
  'test-iv',
  'test-public-key',
  0
) RETURNING id, encrypted, sender_public_key IS NOT NULL as has_key;
*/
