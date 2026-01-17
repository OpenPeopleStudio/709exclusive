# Presence Tracking Migration - Deployment Summary

## Status: ✅ SUCCESSFULLY DEPLOYED

**Date:** January 17, 2026  
**Migration:** `20260117142751_presence_tracking.sql`

---

## What Was Deployed

### Database Changes

1. **New Columns on `709_profiles` table:**
   - `last_active_at` (timestamp with time zone) - Tracks when user last sent heartbeat
   - `is_online` (boolean, default false) - Indicates if user is currently online (active within 5 minutes)

2. **New Functions:**
   - `update_user_presence(user_uuid uuid)` - Updates user's presence timestamp
   - `mark_inactive_users_offline()` - Marks users offline after 5 minutes of inactivity

3. **New Indexes:**
   - `idx_profiles_presence` - Optimizes queries for online users (with tenant_id if available)
   - `idx_profiles_last_active` - Optimizes last_active_at queries

### API Endpoints Created

1. **`POST /api/presence/heartbeat`**
   - Updates current user's presence every 60 seconds
   - Marks user as online

2. **`GET /api/presence/status?userIds=id1,id2,id3`**
   - Batch fetch presence data for multiple users
   - Returns online status and last active timestamp

3. **`GET /api/admin/customers/[id]/profile`**
   - Rich customer profile with orders and activity
   - Includes presence information

### Frontend Features

1. **React Hook: `usePresence()`**
   - Automatic heartbeat every 60 seconds
   - Page Visibility API integration
   - Helper functions for formatting timestamps

2. **Components:**
   - `PresenceIndicator` - Green dot for online, last seen for offline
   - `ConversationCard` - Thread preview with presence
   - `InboxSidebar` - Unified navigation
   - `ThreadView` - Message display
   - `CustomerProfilePanel` - Slide-over with customer details
   - `ComposeModal` - New conversation creation

3. **Main Page: `/admin/inbox`**
   - Unified inbox combining customer support and team chat
   - Real-time presence tracking
   - E2E encryption support maintained

---

## Migration Details

**Applied to:** Production Database (Supabase)  
**Applied at:** 2026-01-17 14:27:51 UTC  
**Status:** ✅ Successfully applied

### Verification

Run this query to verify deployment:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = '709_profiles' 
  AND column_name IN ('last_active_at', 'is_online');
```

Expected result: 2 rows showing both columns

---

## How It Works

1. **Heartbeat System:**
   - User opens admin/inbox page
   - `usePresence` hook sends heartbeat every 60 seconds to `/api/presence/heartbeat`
   - API calls `update_user_presence()` function to update `last_active_at` and set `is_online = true`

2. **Online Detection:**
   - User is "online" if `last_active_at` is within last 5 minutes
   - Green dot indicator shown for online users
   - "Last seen X ago" shown for offline users

3. **Offline Detection:**
   - Background job or manual call to `mark_inactive_users_offline()` 
   - Sets `is_online = false` for users with `last_active_at > 5 minutes ago`

---

## Next Steps

1. **Access the new inbox:**
   - Navigate to `/admin/inbox`
   - Old routes `/admin/messages` and `/admin/team-chat` still work but should be deprecated

2. **Optional cleanup:**
   - Add redirects from old routes to new inbox
   - Update any hardcoded links to point to `/admin/inbox`

3. **Monitoring:**
   - Check presence indicators appear correctly
   - Verify heartbeats are being sent (check network tab)
   - Confirm users marked online/offline appropriately

---

## Rollback Instructions (if needed)

To rollback this migration:

```sql
-- Remove columns
ALTER TABLE "709_profiles" 
  DROP COLUMN IF EXISTS last_active_at,
  DROP COLUMN IF EXISTS is_online;

-- Remove functions
DROP FUNCTION IF EXISTS update_user_presence(uuid);
DROP FUNCTION IF EXISTS mark_inactive_users_offline();

-- Remove indexes (will be auto-dropped with columns)
DROP INDEX IF EXISTS idx_profiles_presence;
DROP INDEX IF EXISTS idx_profiles_last_active;
```

---

## Performance Notes

- Indexes added for optimal query performance
- Heartbeat batched (60s intervals) to minimize database load
- Presence queries use indexed fields for fast lookups
- Page Visibility API ensures heartbeats pause when tab inactive

---

## Files Modified

**Database:**
- `sql/038_presence_tracking.sql` (source)
- `supabase/migrations/20260117142751_presence_tracking.sql` (applied)

**Backend:**
- `app/api/presence/heartbeat/route.ts`
- `app/api/presence/status/route.ts`
- `app/api/admin/customers/[id]/profile/route.ts`

**Frontend:**
- `hooks/usePresence.ts`
- `types/database.ts`
- `components/inbox/PresenceIndicator.tsx`
- `components/inbox/ConversationCard.tsx`
- `components/inbox/InboxSidebar.tsx`
- `components/inbox/ThreadView.tsx`
- `components/inbox/CustomerProfilePanel.tsx`
- `components/inbox/ComposeModal.tsx`
- `app/admin/inbox/page.tsx`
- `app/admin/layout.tsx`

**Total:** 1 SQL migration, 3 API routes, 1 hook, 7 components, 2 pages, 1 type definition
