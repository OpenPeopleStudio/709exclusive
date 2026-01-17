-- Fix sender_public_key not being saved in messages
-- This ensures encrypted messages can be decrypted

-- First verify the column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'sender_public_key'
  ) THEN
    ALTER TABLE messages ADD COLUMN sender_public_key TEXT;
  END IF;
END $$;

-- Ensure no constraints are blocking the field
-- Check if there are any CHECK constraints on sender_public_key
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'messages' 
    AND ccu.column_name = 'sender_public_key'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE 'Constraints exist on sender_public_key - review manually';
  END IF;
END $$;

-- Add index if not exists (already should exist from 023_encrypted_messages.sql)
CREATE INDEX IF NOT EXISTS idx_messages_sender_public_key ON messages(sender_public_key) WHERE sender_public_key IS NOT NULL;

-- Verify column is properly set up
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name IN ('encrypted', 'iv', 'sender_public_key', 'message_index');
