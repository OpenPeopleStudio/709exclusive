# Message System Setup & Troubleshooting Guide

Quick guide to get messages working end-to-end.

## Prerequisites Checklist

Before testing messages, verify:

- [ ] Supabase project is active (not paused)
- [ ] Database migrations have run (all SQL files in `/sql/`)
- [ ] Realtime is enabled in Supabase project settings
- [ ] At least one tenant exists in database
- [ ] Admin user has correct role in `709_profiles` table

---

## Step 1: Enable Realtime

### In Supabase Dashboard

1. Go to **Settings** → **API**
2. Scroll to **Realtime** section
3. Toggle **Enable Realtime** to ON

### Run SQL Setup

Open Supabase SQL Editor and run:

```sql
-- File: sql/fix_messages_realtime.sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify it worked
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

You should see `messages` in the output.

---

## Step 2: Verify Database Setup

### Check Tenant Configuration

```sql
-- Verify tenant exists
SELECT id, name, slug, status FROM tenants;
```

If no rows, create default tenant:

```sql
INSERT INTO tenants (name, slug, settings)
VALUES (
  '709exclusive',
  '709exclusive',
  '{"features": {"messages": true, "e2e_encryption": true}}'::jsonb
);
```

### Check User Roles

```sql
-- Verify admin users
SELECT id, role, full_name, tenant_id 
FROM "709_profiles" 
WHERE role IN ('admin', 'owner');
```

If your user is missing or has wrong role:

```sql
-- Update user role to admin
UPDATE "709_profiles" 
SET role = 'admin' 
WHERE id = 'YOUR-USER-UUID';
```

### Verify Messages Table

```sql
-- Check messages table structure
\d messages

-- Check recent messages
SELECT 
  id,
  customer_id,
  sender_type,
  encrypted,
  tenant_id,
  created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Step 3: Test Message Flow

### A. Admin → Customer

1. **Login as Admin**
   - Navigate to `/admin/messages`
   - Verify "Secure" badge shows (or appropriate status)

2. **Check Debug Panel** (development mode)
   - Click "Debug 🔍" button in bottom-right
   - Click "Run Diagnostics"
   - Verify:
     - ✅ Tenant context loaded
     - ✅ User role set
     - ✅ Realtime active (status: SUBSCRIBED)

3. **Send Test Message**
   - Select a customer (or create new conversation)
   - Type a message
   - Click Send
   - **Check browser console** for:
     ```
     ✅ Tenant validated: <tenant-id>
     📤 Inserting message with data: {...}
     📨 Realtime message received: {...}
     ```

4. **Verify in Database**
   ```sql
   SELECT * FROM messages ORDER BY created_at DESC LIMIT 1;
   ```
   - Check `tenant_id` is set (not NULL)
   - Check `sender_type` is 'admin'
   - Check `encrypted` field matches expectation

### B. Customer → Admin

1. **Login as Customer**
   - Navigate to `/account/messages`
   - Should auto-initialize encryption

2. **Check Purchase Eligibility**
   ```sql
   SELECT id, status FROM orders WHERE customer_id = 'CUSTOMER-UUID';
   ```
   - Customer needs at least one order in `['pending', 'paid', 'fulfilled', 'shipped']`

3. **Send Test Message**
   - Type message and send
   - Should appear on admin side **instantly** (if realtime working)

---

## Step 4: Test Encryption

### Initialize Encryption (Customer)

1. Customer visits `/account/messages`
2. Encryption auto-initializes on first visit
3. Check database:
   ```sql
   SELECT id, public_key, public_key_updated_at 
   FROM "709_profiles" 
   WHERE id = 'CUSTOMER-UUID';
   ```
   - `public_key` should be populated

### Send Encrypted Message (Admin)

1. Admin opens conversation with customer who has encryption
2. Type message and send
3. Check console for:
   ```
   Recipient public key: Found
   Encryption result: {hasContent: true, hasSenderKey: true, ...}
   ```

4. Verify in database:
   ```sql
   SELECT encrypted, sender_public_key, iv 
   FROM messages 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - `encrypted` should be `true`
   - `sender_public_key` should be set
   - `iv` should be set

---

## Common Issues & Fixes

### Issue: Messages Don't Appear

**Symptom**: Message sends but doesn't show up for recipient.

**Checks**:
1. Browser console shows: `Realtime subscription status: SUBSCRIBED`
2. Database insert succeeds (no error in console)
3. Tenant ID matches between sender and recipient

**Fix**:
```sql
-- Verify realtime is enabled
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- If messages is missing, add it:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

Refresh both browser tabs after enabling.

### Issue: Permission Denied (42501 error)

**Symptom**: Console shows "Message insert error: 42501"

**Cause**: User role doesn't match RLS policy.

**Fix**:
```sql
-- Check current role
SELECT id, role FROM "709_profiles" WHERE id = auth.uid();

-- Update to admin if needed
UPDATE "709_profiles" SET role = 'admin' WHERE id = 'YOUR-UUID';
```

### Issue: Encryption Shows "Secure message"

**Symptom**: Messages show "Secure message" instead of plaintext.

**Causes**:
1. Recipient hasn't initialized encryption (no public_key)
2. Keys are locked (passphrase required)
3. Old message encrypted with rotated key

**Fix**:
```sql
-- Check recipient encryption status
SELECT id, public_key, public_key_updated_at 
FROM "709_profiles" 
WHERE id = 'RECIPIENT-UUID';
```

If no public_key, recipient needs to visit Messages page to initialize.

### Issue: Tenant ID is NULL

**Symptom**: Console shows "Tenant validation failed"

**Cause**: Tenant context not loading properly.

**Fix**:
```sql
-- Check if default tenant exists
SELECT id, slug FROM tenants WHERE slug = '709exclusive';

-- If missing, create it:
INSERT INTO tenants (name, slug) 
VALUES ('709exclusive', '709exclusive');
```

Verify environment variables:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: Window Shopper Can't Message

**Symptom**: Customer can't send messages, UI shows "canMessage: false"

**Cause**: No eligible orders found.

**Fix Options**:

**Option 1**: Admin sends first message
- Admin clicks customer in directory
- Sends "Send setup prompt" or regular message
- Creates conversation customer can reply to

**Option 2**: Create test order
```sql
INSERT INTO orders (customer_id, status, tenant_id)
VALUES ('CUSTOMER-UUID', 'paid', 'TENANT-UUID');
```

---

## Verification Script

Run this in Supabase SQL Editor for a full system check:

```sql
-- 1. Realtime Publication
SELECT 'Realtime' as check_name, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- 2. Tenant Configuration
SELECT 'Tenants' as check_name, COUNT(*) as count, 
       string_agg(slug, ', ') as tenants
FROM tenants;

-- 3. Admin Users
SELECT 'Admins' as check_name, COUNT(*) as count
FROM "709_profiles" 
WHERE role IN ('admin', 'owner');

-- 4. Encryption Enabled Users
SELECT 'Encrypted Users' as check_name, COUNT(*) as count
FROM "709_profiles" 
WHERE public_key IS NOT NULL;

-- 5. Recent Messages
SELECT 'Recent Messages' as check_name, COUNT(*) as count,
       SUM(CASE WHEN encrypted THEN 1 ELSE 0 END) as encrypted_count
FROM messages 
WHERE created_at > NOW() - INTERVAL '7 days';

-- 6. Messages Missing Tenant
SELECT 'Orphan Messages' as check_name, COUNT(*) as count
FROM messages 
WHERE tenant_id IS NULL;
```

Expected output:
- ✅ Realtime: 1 row with `messages`
- ✅ Tenants: At least 1
- ✅ Admins: At least 1
- ✅ Recent Messages: Should match your test sends
- ⚠️ Orphan Messages: Should be 0

---

## Debug Logs Reference

### Successful Send (Console Output)

```
✅ Tenant validated: <uuid>
Recipient public key: Found
Encryption result: {hasContent: true, hasSenderKey: true, hasIv: true, messageIndex: 0}
📤 Inserting message with data: {encrypted: true, hasSenderKey: true, ...}
Message inserted successfully: {id: <uuid>, encrypted: true, senderKeyInDB: true}
🔌 Realtime subscription status: SUBSCRIBED
📨 Realtime message received: {new: {...}}
```

### Failed Send (What to Look For)

```
❌ Tenant validation failed: {tenantId: 'default'}
→ Fix: Check tenant loading in TenantProvider

❌ Message insert error: {...code: '42501'...}
→ Fix: User needs admin role

Encryption not initialized, sending unencrypted
→ Warning: Not an error, just info that message is plaintext

❌ Realtime connection failed: CHANNEL_ERROR
→ Fix: Enable realtime in Supabase settings
```

---

## Performance Tips

1. **Realtime Connection**: Each browser tab creates a new subscription. Close unused tabs.

2. **Encryption**: First message to a recipient is slower (key exchange). Subsequent messages are fast.

3. **Large Attachments**: Files are encrypted client-side which can freeze UI on slow devices. Consider file size limits.

4. **Message History**: Old messages with deleted senders or rotated keys may show "Unable to decrypt". This is expected.

---

## Next Steps After Setup

Once messages are working:

1. **Remove Debug Panel**: Delete `<MessageDebugPanel />` from production builds
2. **Configure Retention**: Set message expiry in `/api/messages/retention`
3. **Backup Keys**: Admins should save recovery code
4. **Monitor Logs**: Watch Supabase logs for errors
5. **Test Realtime**: Use two devices/tabs to verify instant delivery

---

**Last Updated**: Based on current codebase
**Support**: See `docs/MESSAGE_FLOW.md` for detailed architecture
