# Message Delivery Fix Summary

## Problem
Messages sent between users were not being received by recipients due to Row Level Security (RLS) policy issues with the multi-tenant setup.

## Root Cause
When the multi-tenant migration (`029_multi_tenant.sql`) was applied, a `tenant_id` column was added to the `messages` table. However, the existing RLS policies (from `016_messages.sql`, `028_window_shopper_messages.sql`, and `031_group_chats.sql`) were not updated to handle the tenant filtering properly.

This caused message inserts to fail or be blocked because:
1. The policies checked for orders without filtering by `tenant_id`
2. The policies checked admin/staff roles without properly filtering by `tenant_id`
3. Messages with a `tenant_id` didn't match the policy conditions

## Solution Applied
Created and applied migration `032_fix_message_tenant_policies.sql` (timestamp: `20260117081047`) which:

1. **Updated customer SELECT policy**: Now properly filters messages by the customer's tenant_id
2. **Updated customer INSERT policy**: Checks for eligible orders within the same tenant
3. **Updated customer UPDATE policy**: Ensures customers can only update messages in their tenant
4. **Updated admin/staff SELECT policy**: Allows viewing all messages within their tenant
5. **Updated admin/staff INSERT policy**: Ensures messages are sent within their tenant
6. **Updated admin/staff UPDATE policy**: Allows updating messages within their tenant

All policies now handle both:
- Legacy messages without `tenant_id` (IS NULL check)
- New messages with `tenant_id` (tenant matching check)

## Files Modified
- ✅ `sql/032_fix_message_tenant_policies.sql` - New migration SQL
- ✅ `supabase/migrations/20260117081047_fix_message_tenant_policies.sql` - Applied migration
- ℹ️ `scripts/fix-message-policies.sh` - Helper script for future reference
- ℹ️ `scripts/test-message-policies.sql` - Test script to verify policies

## Migration Status
✅ **Successfully applied** to remote database (project: Tom)

Notices during application:
- "policy 'Customers can view own messages' does not exist" - Expected, policy was created fresh
- "policy 'Customers can update own messages' does not exist" - Expected, policy was created fresh

## Testing
To verify the fix works:

1. **Test as Customer**:
   - Log in as a customer who has placed an order
   - Go to `/account/messages`
   - Send a message to support
   - Verify the message appears in the conversation

2. **Test as Admin**:
   - Log in as admin/staff
   - Go to `/admin/messages`
   - Select the customer's conversation
   - Verify you can see the customer's message
   - Send a reply
   - Verify the reply appears

3. **Test as Customer (receive)**:
   - As the customer, refresh or wait for realtime update
   - Verify the admin's reply appears in your conversation

## Additional Notes
- All policies now properly support multi-tenant isolation
- Messages are automatically filtered by tenant_id
- The fix is backward compatible with messages that don't have a tenant_id
- Realtime subscriptions should work correctly now

## Rollback (if needed)
If you need to rollback this migration:
```sql
-- Restore the old policies from 031_group_chats.sql and 028_window_shopper_messages.sql
-- NOT RECOMMENDED as it will break multi-tenant message isolation
```
