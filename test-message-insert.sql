-- Test if sender_public_key can be inserted

-- Get a test tenant and user
WITH test_data AS (
  SELECT 
    (SELECT id FROM tenants WHERE slug = '709exclusive' LIMIT 1) as tenant_id,
    (SELECT id FROM "709_profiles" WHERE role IN ('admin', 'owner') ORDER BY created_at LIMIT 1) as user_id
)
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
)
SELECT 
  tenant_id,
  user_id,
  'TEST: This message has sender_public_key set',
  'admin',
  false,
  true,
  'test-iv-value-12345',
  'test-sender-public-key-value-ABCDEF',
  0
FROM test_data
RETURNING 
  id,
  encrypted,
  sender_public_key,
  sender_public_key IS NOT NULL as key_was_saved,
  created_at;
