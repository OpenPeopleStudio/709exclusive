# Message Delivery Test Plan

## Overview
This document provides step-by-step instructions to verify that the message delivery fix is working correctly.

## Prerequisites
- ✅ Migration `20260117081047_fix_message_tenant_policies.sql` has been applied
- Access to at least one customer account with an eligible order
- Access to an admin/staff account

## Test Scenarios

### Scenario 1: Customer to Admin Message

**Steps:**
1. Log in as a **customer** who has placed an order (status: pending, paid, fulfilled, or shipped)
2. Navigate to `/account/messages`
3. You should see the messaging interface (if you have eligible orders)
4. Type a test message: "Hello, I have a question about my order"
5. Click Send
6. **Expected Result**: Message appears in your conversation immediately
7. Note the timestamp

### Scenario 2: Admin Views Customer Message

**Steps:**
1. Log in as an **admin** or **staff** member
2. Navigate to `/admin/messages`
3. Look for the customer's conversation in the inbox
4. Click on the customer's conversation
5. **Expected Result**: You should see the customer's message "Hello, I have a question about my order"
6. The message should have the correct timestamp from Scenario 1

### Scenario 3: Admin to Customer Reply

**Steps:**
1. Still logged in as **admin**
2. With the customer's conversation selected
3. Type a reply: "Thank you for your message. How can I help you?"
4. Click Send
5. **Expected Result**: Message appears in the conversation immediately

### Scenario 4: Customer Receives Admin Reply

**Steps:**
1. Log back in as the **customer** from Scenario 1
2. Navigate to `/account/messages`
3. **Expected Result**: You should see the admin's reply "Thank you for your message. How can I help you?"
4. The conversation should show both messages in chronological order

### Scenario 5: Realtime Updates (Optional)

**Steps:**
1. Open two browser windows side by side
2. Log in as **customer** in one window
3. Log in as **admin** in the other window
4. Navigate both to their respective message pages
5. Select the same conversation in the admin window
6. Send a message from one window
7. **Expected Result**: The message should appear in the other window within a few seconds (realtime subscription)

## Troubleshooting

### Issue: "Window shopper mode" message appears
**Cause**: The customer doesn't have an eligible order
**Solution**: The customer needs to place an order with status in: pending, paid, fulfilled, or shipped

### Issue: Message appears sent but not received
**Possible Causes**:
1. Browser cache - Try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. Different tenant_id - Verify both users are in the same tenant
3. Check browser console for errors

### Issue: "Secure chat unavailable" error
**Cause**: End-to-end encryption not initialized
**Solution**: This is a warning, not an error. Messages will still work but will be sent unencrypted. Wait for encryption to initialize or continue with standard messages.

## Verification Checklist

After testing, verify:
- [ ] Customer can send messages after placing an order
- [ ] Admin can see customer messages in inbox
- [ ] Admin can reply to customer messages
- [ ] Customer receives admin replies
- [ ] Messages appear in correct chronological order
- [ ] Unread count updates correctly in admin inbox
- [ ] Messages are marked as read when viewed
- [ ] Encryption status indicator shows correctly (lock icon)
- [ ] Realtime updates work (messages appear without refresh)

## Database Verification (Optional)

If you want to verify at the database level:

```sql
-- Check that messages have tenant_id set
SELECT id, customer_id, sender_type, tenant_id, created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS policies
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_clause
FROM pg_policy
WHERE polrelid = 'messages'::regclass;
```

## Success Criteria

The fix is working if:
1. ✅ Messages sent by customers appear in admin inbox
2. ✅ Messages sent by admins appear in customer conversation
3. ✅ No errors in browser console during message sending
4. ✅ Realtime updates work without page refresh
5. ✅ All messages have the correct tenant_id in the database

## Rollback Instructions

If the fix causes issues (unlikely):

1. Contact your database administrator
2. Provide the error messages from the browser console
3. The migration can be manually reverted by restoring the old policies from `031_group_chats.sql`

## Additional Notes

- The fix supports both legacy messages (without tenant_id) and new messages (with tenant_id)
- All policies now properly isolate messages by tenant
- Encryption status should not affect message delivery (it's optional)
