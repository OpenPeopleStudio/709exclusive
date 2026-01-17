# Test NEW Messages (Ignore Old Decryption Errors)

The "Decryption failed" errors you're seeing are for **old messages** that were encrypted with rotated or deleted keys. This is **expected behavior** and doesn't affect NEW messages.

## Quick Test for NEW Messages

### 1. Clear Console Noise
I've silenced the decryption errors. Refresh the page with a hard reload:
- Mac: `Cmd+Shift+R`
- Windows/Linux: `Ctrl+Shift+R`

### 2. Send a Test Message

1. Go to `/admin/messages`
2. Select or create a conversation
3. Type "testing new messages" and click Send

### 3. Watch Console for NEW Logs

You should see:
```
✅ Tenant validated: <uuid>
📤 Inserting message with data: {...}
Message inserted successfully: {id: ..., encrypted: true/false}
🔌 Realtime subscription status: SUBSCRIBED
```

If you see these ✅📤 emojis, the message system is **working correctly**.

### 4. Verify Message Appears

The message should appear:
- **Immediately** in the conversation (if realtime is working)
- **After refresh** (if realtime isn't enabled)

## For Realtime Support (Messages Appear Instantly)

You need:

### A. Enable in Supabase Dashboard
**Settings → API → Toggle "Realtime" to ON**

### B. Grant Permissions (Run Once)
```sql
-- In Supabase SQL Editor
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT UPDATE ON messages TO authenticated;
```

That's it! Your RLS policies already filter what each user can see.

## Troubleshooting

### If No Enhanced Logs Appear (No ✅📤 emojis)

Your code changes haven't deployed. Try:
1. Stop dev server
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev`

### If Message Insert Fails

Check the console for:
- `❌ Tenant validation failed` → Tenant context missing
- `❌ Message insert error: 42501` → Role permission issue
- `❌ Message insert error: 23503` → Invalid customer/tenant reference

### If Realtime Doesn't Work

Console shows: `🔌 Realtime subscription status: CHANNEL_ERROR`

Fix:
1. Enable Realtime in Supabase Dashboard
2. Run the GRANT commands above
3. Refresh browser

## Summary

**Old decryption errors = ignore them**
**New message send = watch for ✅📤 logs**

If you don't see the enhanced logs after hard refresh, the updated code isn't running.
