-- Test presence tracking
SELECT 
  'Columns added:' as status,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = '709_profiles' 
  AND column_name IN ('last_active_at', 'is_online');

SELECT 
  'Functions created:' as status,
  COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_user_presence', 'mark_inactive_users_offline');

SELECT 
  'Indexes created:' as status,
  COUNT(*) as count
FROM pg_indexes
WHERE tablename = '709_profiles'
  AND indexname LIKE '%presence%' OR indexname LIKE '%last_active%';
