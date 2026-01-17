-- Test script to verify message policies are working
-- Run this in Supabase SQL Editor to check the policies

-- Show all policies on the messages table
SELECT 
  polname AS policy_name,
  polcmd AS operation,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS operation_type,
  pg_get_expr(polqual, polrelid) AS using_expression,
  pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'messages'::regclass
ORDER BY polname;
