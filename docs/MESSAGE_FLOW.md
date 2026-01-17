# Message System Flow Documentation

Complete end-to-end flow for the messaging system, including send/receive paths, encryption, and common failure points.

---

## 1. Admin → Customer Send Path

### Entry Point: `app/admin/messages/page.tsx`

#### A. User Action
1. Admin types message in `MessageInput` component
2. On Enter or Send click, triggers `handleSend(e)` → calls `sendMessage(newMessage)`

#### B. Send Message Flow (`sendMessage` function, lines 455-604)

**Step 1: Pre-flight checks**
```typescript
// Line 459-461
const plaintext = plaintextInput.trim()
if (!plaintext || !selectedCustomer) return
```

**Step 2: Tenant validation**
```typescript
// Lines 466-470
if (!tenantId) {
  setAttachmentError('Tenant not resolved')
  return
}
```
⚠️ **FAILURE POINT**: If tenant context is missing, message send aborts silently.

**Step 3: Attachment validation** (if file attached)
```typescript
// Lines 471-476
if (attachmentFile && options?.forceStandard) {
  setAttachmentError('Attachments require secure chat to be ready.')
  return
}
if (attachmentFile && !(selectedConvo?.has_encryption && isInitialized)) {
  setAttachmentError('Attachments require secure chat to be ready.')
  return
}
```
⚠️ **FAILURE POINT**: Attachments are blocked if encryption isn't ready, but error is only shown in UI attachment area.

**Step 4: Build base message payload**
```typescript
// Lines 478-503
let messageData = {
  tenant_id: tenantId,
  customer_id: selectedCustomer,
  content: plaintext,
  sender_type: 'admin',
  read: false,
}
```

**Step 5: Add retention expiry (if enabled)**
```typescript
// Lines 505-509
if (retentionEnabled && retentionDays) {
  messageData.expires_at = new Date(
    Date.now() + retentionDays * 24 * 60 * 60 * 1000
  ).toISOString()
}
```

**Step 6: Attempt encryption** (lines 511-541)
```typescript
if (isInitialized && !options?.forceStandard) {
  const recipientPublicKey = await getRecipientPublicKey(selectedCustomer)
  console.log('Recipient public key:', recipientPublicKey ? 'Found' : 'Missing')
  
  if (recipientPublicKey) {
    const encrypted = await encrypt(plaintext, selectedCustomer)
    console.log('Encryption result:', encrypted ? {...} : 'null')
    
    if (encrypted) {
      messageData = {
        ...messageData,
        content: encrypted.content,
        encrypted: true,
        iv: encrypted.iv,
        sender_public_key: encrypted.senderPublicKey,
        message_index: encrypted.messageIndex,
      }
      didEncrypt = true
    }
  }
} else if (!isInitialized) {
  console.log('Encryption not initialized, sending unencrypted')
}
```
⚠️ **FAILURE POINT**: Encryption failures only log to console, message continues as plaintext.

**Step 7: Upload encrypted attachment** (if present, lines 543-552)
```typescript
if (attachmentFile) {
  const recipientPublicKey = await getRecipientPublicKey(selectedCustomer)
  if (!recipientPublicKey) {
    setAttachmentError('Attachments require secure chat with the customer.')
    setSending(false)
    return
  }
  const attachmentData = await uploadEncryptedAttachment(attachmentFile)
  messageData = { ...messageData, ...attachmentData }
}
```

**Attachment Upload Flow** (`uploadEncryptedAttachment`, lines 674-717):
1. Generate random file key: `generateFileKey()`
2. Encrypt file with AES-256-GCM: `encryptFileWithKey(fileBuffer, fileKey)`
3. Encrypt the file key for recipient: `encrypt(keyPayload, selectedCustomer)`
4. Upload encrypted blob to storage via API: `POST /api/messages/attachment-upload`
5. Return attachment metadata (path, name, type, size, encrypted key)

⚠️ **FAILURE POINT**: If file upload API fails, error is caught but message send continues without attachment.

**Step 8: Insert message to database**
```typescript
// Lines 561-565
const { data, error } = await supabase
  .from('messages')
  .insert(messageData)
  .select()
  .single()
```

**RLS Policy Applied**: `"Admins can send messages"` from `sql/016_messages.sql`:
```sql
CREATE POLICY "Admins can send messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
  AND sender_type = 'admin'
);
```
⚠️ **FAILURE POINT**: If admin role check fails or tenant_id mismatch, insert is rejected by RLS.

**Step 9: Update local state**
```typescript
// Lines 571-600
if (!error && data) {
  console.log('Message inserted successfully:', {
    id: data.id,
    encrypted: data.encrypted,
    senderKeyInDB: !!data.sender_public_key
  })
  
  // Add to messages array with decrypted content
  setMessages(prev => [...prev, { 
    ...data, 
    decryptedContent: plaintext 
  }])
  
  // Clear composer (unless clearComposer: false)
  if (shouldClearComposer) {
    setNewMessage('')
    setAttachmentFile(null)
  }
  
  // Update conversation list
  setConversations(prev => prev.map(c => 
    c.customer_id === selectedCustomer 
      ? { ...c, last_message: data.encrypted ? 'Secure message' : plaintext, last_message_at: data.created_at }
      : c
  ))
  
  // Show notice if not encrypted
  const notice = options?.notice || (!didEncrypt ? 'Sent standard' : null)
  if (notice) {
    setSendNotice(notice)
    setTimeout(() => setSendNotice(null), 4000)
  }
}
```

**Step 10: Realtime propagation**
- Database insert triggers Supabase realtime publication
- Enabled via: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;` (sql/016_messages.sql)
- Customer's realtime subscription receives the INSERT event

---

## 2. Customer → Admin Send Path

### Entry Point: `app/account/messages/page.tsx`

#### Key Differences from Admin Flow:

**A. Admin ID Resolution** (lines 132-152)
```typescript
useEffect(() => {
  const findAdmin = async () => {
    let adminQuery = supabase
      .from('709_profiles')
      .select('id, public_key')
      .in('role', ['admin', 'owner'])
      .limit(1)
    
    if (tenantId) {
      adminQuery = adminQuery.eq('tenant_id', tenantId)
    }
    
    const { data } = await adminQuery.single()
    
    if (data) {
      setAdminId(data.id)
    }
  }
  findAdmin()
}, [tenantId])
```
⚠️ **FAILURE POINT**: If no admin found for tenant, customer can't determine recipient for encryption.

**B. Feature Flag Check** (lines 121-124)
```typescript
useEffect(() => {
  if (featureFlags.messages === false) {
    router.push('/account')
  }
}, [featureFlags.messages, router])
```
⚠️ **FAILURE POINT**: If messages feature is disabled, customer is redirected away from page.

**C. Purchase Eligibility Check** (lines 250-287)
```typescript
const { data: orders } = await ordersQuery
const hasPurchase = (orders || []).some(o => 
  eligibleOrderStatuses.includes(o.status)
)

if (!hasPurchase) {
  setCanMessage(false)
} else {
  setCanMessage(true)
}
```
⚠️ **FAILURE POINT**: Window shoppers (no orders) are blocked from messaging.

**D. Message Send** (similar to admin, but uses customer_id = user.id)

**RLS Policy Applied**: `"Customers can send messages"` from `sql/016_messages.sql`:
```sql
CREATE POLICY "Customers can send messages"
ON messages FOR INSERT
WITH CHECK (
  customer_id = auth.uid() 
  AND sender_type = 'customer'
);
```

**E. Retention Settings** loaded from customer's profile (lines 236-240):
```typescript
const { data: profile } = await profileQuery.single()
const enabled = Boolean(profile?.message_retention_enabled)
const days = profile?.message_retention_days || 90
setRetentionEnabled(enabled)
setRetentionDays(days)
```

---

## 3. Receive & Render Path

### A. Admin Side (`app/admin/messages/page.tsx`)

#### Initial Load (lines 163-267)
```typescript
const loadConversations = useCallback(async () => {
  // Step 1: Fetch all messages with tenant filter
  let messagesQuery = supabase
    .from('messages')
    .select('customer_id, content, created_at, read, sender_type, encrypted, deleted_at')
    .order('created_at', { ascending: false })
  
  if (tenantId) {
    messagesQuery = messagesQuery.eq('tenant_id', tenantId)
  }
  
  const { data: messagesData } = await messagesQuery
  
  // Step 2: Group by customer_id
  const customerMap = new Map<string, {...}>()
  messagesData.forEach(msg => {
    if (!customerMap.has(msg.customer_id)) {
      customerMap.set(msg.customer_id, { messages: [], unread: 0 })
    }
    // ...count unread
  })
  
  // Step 3: Fetch user details via API (service role)
  const response = await fetch('/api/admin/messages/users')
  const { users } = await response.json()
  
  // Step 4: Check for encryption keys
  let profilesQuery = supabase
    .from('709_profiles')
    .select('id, public_key')
    .in('id', customerIds)
  
  if (tenantId) {
    profilesQuery = profilesQuery.eq('tenant_id', tenantId)
  }
  
  const { data: profiles } = await profilesQuery
  
  // Step 5: Build conversation list
  convos.push({
    customer_id: customerId,
    customer_email: user?.email || 'Unknown',
    customer_name: user?.full_name || null,
    last_message: lastMsg.encrypted ? 'Secure message' : lastMsg.content,
    unread_count: data.unread,
    has_encryption: !!profile?.public_key,
    has_purchase: buyersByCustomer.get(customerId) ?? false,
  })
}, [tenantId])
```

**RLS Policy Applied**: `"Admins can view all messages"` from `sql/016_messages.sql`:
```sql
CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);
```

#### Load Messages for Selected Conversation (lines 276-368)
```typescript
const loadMessages = useCallback(async (customerId: string) => {
  // Step 1: Fetch messages for this customer
  let messagesQuery = supabase
    .from('messages')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true })
  
  if (tenantId) {
    messagesQuery = messagesQuery.eq('tenant_id', tenantId)
  }
  
  const { data } = await messagesQuery
  
  // Step 2: Separate deleted messages
  const deletedMessages = data
    .filter(msg => msg.deleted_at)
    .map(msg => ({ ...msg, decryptedContent: '[Message deleted]' }))
  
  // Step 3: Fix old encrypted messages missing sender_public_key
  const fixedMessages = activeMessages.map(msg => {
    if (msg.encrypted && !msg.sender_public_key) {
      console.warn('Found encrypted message without sender_public_key:', msg.id)
      return {
        ...msg,
        encrypted: false,
        decryptedContent: msg.content, // Show raw content
      }
    }
    return msg
  })
  
  // Step 4: Decrypt if E2EE initialized
  if (isInitialized) {
    const decrypted = await decryptMessages(
      fixedMessages as Message[],
      (msg) => msg.sender_type === 'customer' ? msg.customer_id : adminId!
    )
    
    // Step 5: Parse location messages
    const processed = decrypted.map(msg => {
      if (msg.message_type === 'location' && msg.decryptedContent && msg.decryptedContent !== 'Secure message') {
        try {
          const locationData = JSON.parse(msg.decryptedContent)
          return {
            ...msg,
            location: locationData,
            decryptedContent: `📍 Shared location${locationData.accuracy ? ` (±${Math.round(locationData.accuracy)}m)` : ''}`
          }
        } catch {
          return msg
        }
      }
      return msg
    })
    
    setMessages(combined)
  } else {
    // Not initialized yet, show encrypted indicator
    const unencrypted = data.filter(msg => !msg.deleted_at).map(msg => ({
      ...msg,
      decryptedContent: msg.encrypted ? 'Secure message' : msg.content
    }))
    setMessages(combined)
  }
  
  // Step 6: Mark as read
  let markReadQuery = supabase
    .from('messages')
    .update({ read: true })
    .eq('customer_id', customerId)
    .eq('sender_type', 'customer')
    .eq('read', false)
  
  if (tenantId) {
    markReadQuery = markReadQuery.eq('tenant_id', tenantId)
  }
  
  await markReadQuery
}, [isInitialized, decryptMessages, adminId, tenantId])
```

⚠️ **FAILURE POINTS**:
- Tenant filter mismatch: messages won't load
- Encryption keys locked or missing: messages show as "Secure message"
- Old encrypted messages without sender_public_key: treated as plaintext

#### Realtime Updates (lines 429-449)
```typescript
useEffect(() => {
  const channel = supabase
    .channel('admin-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const msg = payload.new as { customer_id?: string } | null
        loadConversations()  // Refresh conversation list
        
        if (selectedCustomer && msg?.customer_id === selectedCustomer) {
          loadMessages(selectedCustomer)  // Reload current conversation
        }
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [loadConversations, loadMessages, selectedCustomer])
```

⚠️ **FAILURE POINTS**:
- Realtime subscription not established: new messages won't appear until page refresh
- Channel name conflicts: multiple tabs might interfere
- Slow decryption: UI might freeze on large message batches

### B. Customer Side (`app/account/messages/page.tsx`)

Similar flow but with these differences:

**Load Messages** (lines 217-289):
- Uses customer's own user ID instead of selecting a customer
- Finds adminId for encryption purposes
- Checks purchase eligibility

**Realtime** (lines 433-453):
```typescript
const channel = supabase
  .channel('customer-messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      loadAndDecryptMessages()
    }
  )
  .subscribe()
```

**RLS Policy Applied**: `"Customers can view own messages"` from `sql/016_messages.sql`:
```sql
CREATE POLICY "Customers can view own messages"
ON messages FOR SELECT
USING (customer_id = auth.uid());
```

---

## 4. Backend Components

### A. Database Schema

**Messages Table** (from `sql/016_messages.sql`, `023_encrypted_messages.sql`, `027_message_attachments.sql`):
```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  
  -- E2EE fields (023)
  encrypted BOOLEAN DEFAULT false,
  iv TEXT,
  sender_public_key TEXT,
  message_index INTEGER DEFAULT 0,
  
  -- Attachment fields (027)
  attachment_path TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  attachment_key TEXT,
  attachment_key_iv TEXT,
  attachment_key_sender_public_key TEXT,
  attachment_key_message_index INTEGER,
  
  -- Location fields (033)
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'location')),
  location JSONB,
  
  -- Multi-tenant (029)
  tenant_id uuid REFERENCES tenants(id),
  
  -- Privacy fields
  deleted_at TIMESTAMP,
  deleted_by uuid,
  deleted_for_both BOOLEAN,
  expires_at TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_messages_customer_id ON messages(customer_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_encrypted ON messages(customer_id, sender_type) WHERE encrypted = true;
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_attachment_path ON messages(attachment_path) WHERE attachment_path IS NOT NULL;
CREATE INDEX idx_messages_location ON messages(customer_id, message_type) WHERE message_type = 'location';
```

### B. Row Level Security Policies

From `sql/016_messages.sql`:

1. **Customer SELECT**: `customer_id = auth.uid()`
2. **Customer INSERT**: `customer_id = auth.uid() AND sender_type = 'customer'`
3. **Customer UPDATE**: `customer_id = auth.uid()`
4. **Admin SELECT**: `role IN ('admin', 'owner')`
5. **Admin INSERT**: `role IN ('admin', 'owner') AND sender_type = 'admin'`
6. **Admin UPDATE**: `role IN ('admin', 'owner')`

**Tenant Isolation** (from `sql/037_tenant_rls_policies.sql`):
- All queries must include `tenant_id` filter
- Profiles table enforces tenant matching via RLS

### C. API Endpoints

**`/api/messages/attachment-upload` (POST)**:
- Validates admin or customer ownership
- Sanitizes filename
- Uploads encrypted blob to `message-attachments` bucket
- Returns storage path

**`/api/messages/attachment-url` (POST)**:
- Validates ownership (admin or message owner)
- Creates 60-second signed URL for encrypted file download

**`/api/messages/delete` (POST)**:
- Soft-deletes message (sets `deleted_at`, clears content)
- Removes attachment from storage
- Requires admin or message owner

**`/api/messages/retention` (GET/POST)**:
- Manages per-user message retention settings
- Updates `709_profiles.message_retention_enabled/days`

**`/api/messages/purge` (POST)**:
- Deletes messages older than retention period
- Removes associated attachments

**`/api/admin/messages/users` (GET)**:
- Uses service role to fetch auth.users data
- Filters by tenant
- Returns user list for admin message directory

---

## 5. Encryption Flow (E2EE)

### Initialization (`hooks/useE2EEncryption.ts`, lines 64-116)

```typescript
useEffect(() => {
  if (!userId) return
  
  const init = async () => {
    // Step 1: Initialize or load identity keys from IndexedDB
    const keys = await initializeIdentityKeys()
    setKeyPair(hydratedKeys)
    
    // Step 2: Check if keys are locked
    const locked = !keys.privateKey && !!keys.encryptedPrivateKey
    setIsLocked(locked)
    
    // Step 3: Generate fingerprints
    const fp = await generateFingerprint(keys.publicKey)
    const sfp = await generateShortFingerprint(keys.publicKey)
    setFingerprint(fp)
    setShortFingerprint(sfp)
    
    // Step 4: Sync public key to server
    const { data: profile } = await supabase
      .from('709_profiles')
      .select('public_key')
      .eq('id', userId)
      .single()
    
    if (profile?.public_key !== keys.publicKey) {
      await supabase
        .from('709_profiles')
        .update({ 
          public_key: keys.publicKey,
          public_key_updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }
    
    setIsInitialized(true)
  }
  
  init()
}, [userId])
```

### Encryption (`lib/crypto/e2e.ts`)

**Key Derivation** (ECDH + HKDF):
1. Generate ephemeral ECDH keypair (P-256)
2. Derive shared secret with recipient's public key
3. Use HKDF with message index for perfect forward secrecy
4. Derive AES-256-GCM key from shared secret

**Message Encryption**:
1. Plaintext → UTF-8 bytes
2. Generate random IV (96 bits)
3. Encrypt with AES-256-GCM
4. Return: `{ ciphertext, iv, senderPublicKey, messageIndex }`

### Decryption

**Multi-key Support** (tries all available keypairs):
```typescript
const decrypt = useCallback(async (message, senderId) => {
  if (!message.encrypted || !message.iv || !message.sender_public_key) {
    return message.content // Not encrypted
  }
  
  const allKeys = keyPair ? [keyPair, ...keyPairs.filter(k => k.id !== keyPair.id)] : keyPairs
  const usableKeys = allKeys.filter(k => !!k.privateKey)
  
  if (usableKeys.length === 0) {
    throw new Error('Decryption keys not initialized or locked')
  }
  
  let lastError: Error | null = null
  for (const candidate of usableKeys) {
    try {
      const decrypted = await decryptMessage(
        message.content,
        message.iv,
        message.sender_public_key,
        message.message_index || 0,
        candidate.privateKey as string,
        senderId
      )
      await updateKeyPair(candidate.id, { lastUsedAt: Date.now() })
      return decrypted
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Decryption failed')
    }
  }
  
  throw lastError || new Error('Unable to decrypt message')
}, [keyPair, keyPairs])
```

---

## 6. Common Failure Points

### Why Messages Don't Appear

#### A. Tenant Isolation Issues
**Symptom**: Messages don't show up despite being sent successfully.

**Causes**:
1. `tenantId` context not resolved on frontend
2. Queries missing `eq('tenant_id', tenantId)` filter
3. User profile has wrong `tenant_id` in database
4. Admin viewing from wrong tenant subdomain

**Debug**:
```typescript
console.log('Tenant context:', { tenantId, user, profile })
```

**Check database**:
```sql
-- Verify user's tenant
SELECT id, tenant_id, role FROM "709_profiles" WHERE id = 'user-uuid';

-- Check message tenant
SELECT id, tenant_id, customer_id, sender_type FROM messages WHERE id = 'message-uuid';
```

#### B. RLS Policy Rejection
**Symptom**: Insert/select returns 0 rows or permission error.

**Causes**:
1. User role not in `['admin', 'owner']` for admin operations
2. `customer_id` doesn't match `auth.uid()` for customer
3. `sender_type` mismatch (customer sending as admin or vice versa)
4. Tenant RLS policy blocking cross-tenant access

**Debug**:
```sql
-- Check user role
SELECT id, role, tenant_id FROM "709_profiles" WHERE id = auth.uid();

-- Test policy manually
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-uuid';
SELECT * FROM messages WHERE customer_id = 'customer-uuid';
```

#### C. Encryption Key Missing
**Symptom**: Messages show as "Secure message" and can't be decrypted.

**Causes**:
1. Recipient hasn't initialized encryption (no `public_key` in profile)
2. Sender's keys are locked (passphrase required)
3. Old messages encrypted before key rotation
4. `sender_public_key` field missing from message row

**Debug**:
```typescript
// Check recipient key
const { data } = await supabase
  .from('709_profiles')
  .select('public_key, public_key_updated_at')
  .eq('id', recipientId)
  .single()

console.log('Recipient encryption status:', {
  hasKey: !!data?.public_key,
  updatedAt: data?.public_key_updated_at
})

// Check sender key status
console.log('Encryption state:', {
  isInitialized,
  isLocked,
  hasPublicKey: !!publicKey,
  hasPrivateKey: !!keyPair?.privateKey
})
```

**Fix**: Customer needs to visit Messages page to auto-initialize encryption.

#### D. Realtime Subscription Not Active
**Symptom**: Messages only appear after page refresh.

**Causes**:
1. Realtime not enabled in Supabase project settings
2. `ALTER PUBLICATION supabase_realtime ADD TABLE messages;` not run
3. Channel subscription failed (network, auth)
4. Browser blocking WebSocket connection
5. Multiple tabs interfering with channel

**Debug**:
```typescript
const channel = supabase.channel('admin-messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => {
      console.log('Realtime message received:', payload)
      loadConversations()
    }
  )
  .subscribe((status) => {
    console.log('Realtime status:', status) // Should be 'SUBSCRIBED'
  })
```

**Check Supabase dashboard**:
- Settings → API → Realtime enabled
- Database → Replication → `messages` table published

#### E. Feature Flag Disabled
**Symptom**: Customer redirected away from messages page.

**Causes**:
1. Tenant settings has `features.messages: false`
2. Customer account type doesn't have message access

**Debug**:
```typescript
console.log('Feature flags:', featureFlags)
```

**Fix**: Update tenant settings in database:
```sql
UPDATE tenants 
SET settings = jsonb_set(settings, '{features,messages}', 'true') 
WHERE slug = 'your-tenant';
```

#### F. Window Shopper Block
**Symptom**: Customer can't send messages, button disabled.

**Cause**: `canMessage` is false because no eligible orders found.

**Eligible statuses**: `['pending', 'paid', 'fulfilled', 'shipped']`

**Debug**:
```typescript
console.log('Messaging eligibility:', {
  canMessage,
  orders: orders?.map(o => ({ id: o.id, status: o.status }))
})
```

**Override** (admin sends setup prompt):
Admin can initiate conversation, which creates message thread customer can reply to.

#### G. Attachment Upload Failure
**Symptom**: Message sends but attachment missing.

**Causes**:
1. Storage bucket `message-attachments` not created
2. Storage policies blocking upload
3. File too large (exceeds Supabase limit)
4. Network timeout during upload
5. Encryption not ready (recipient has no key)

**Debug**:
```typescript
// In uploadEncryptedAttachment function
console.log('Uploading attachment:', {
  fileName: file.name,
  fileSize: file.size,
  recipientHasKey: !!recipientPublicKey
})
```

**Check storage**:
- Supabase dashboard → Storage → `message-attachments` bucket exists
- Policies allow insert for authenticated users

#### H. Error Swallowing
**Symptom**: Send appears to work but message doesn't arrive.

**Cause**: Errors logged to console only, no user-visible feedback.

**Common silent failures**:
- `encrypt()` returns null → continues as plaintext
- `uploadEncryptedAttachment()` throws → caught but message sends without attachment
- Database insert error → logged to console but UI shows success

**Fix**: Check browser console for errors during send.

---

## 7. Debugging Checklist

When messages don't appear:

### Frontend (Browser Console)
- [ ] Check tenant context: `console.log('Tenant:', tenantId)`
- [ ] Check auth state: `console.log('User:', user, 'Role:', profile.role)`
- [ ] Check encryption state: `console.log('E2EE:', { isInitialized, isLocked, hasPublicKey })`
- [ ] Check realtime: `console.log('Channel status:', status)`
- [ ] Look for error logs during send
- [ ] Check network tab for failed API calls

### Database
- [ ] Verify message inserted: `SELECT * FROM messages WHERE id = 'msg-uuid'`
- [ ] Check tenant_id matches: `SELECT tenant_id FROM messages WHERE id = 'msg-uuid'`
- [ ] Verify user profile: `SELECT id, tenant_id, role FROM "709_profiles" WHERE id = 'user-uuid'`
- [ ] Check RLS: Manually test SELECT with user's role/id

### Encryption
- [ ] Recipient has public key: `SELECT public_key FROM "709_profiles" WHERE id = 'recipient-uuid'`
- [ ] Message has encryption metadata: `SELECT encrypted, sender_public_key, iv FROM messages WHERE id = 'msg-uuid'`
- [ ] Sender keys unlocked: Check `isLocked` in UI

### Realtime
- [ ] Supabase → Settings → API → Realtime enabled
- [ ] Supabase → Database → Replication → messages published
- [ ] Browser console shows "SUBSCRIBED" status
- [ ] Test with second device/tab to verify propagation

### Common Fixes
1. **Wrong tenant**: Update profile tenant_id
2. **No encryption key**: Visit Messages page to auto-initialize
3. **Locked keys**: Unlock with passphrase
4. **Window shopper**: Admin sends first message
5. **Realtime broken**: Refresh page or check project settings
6. **RLS block**: Verify role in profiles table

---

## Flow Diagrams

### Send Flow (Simplified)

```
User types message
       ↓
   handleSend()
       ↓
Check tenant & recipient
       ↓
Build message payload
       ↓
Try encrypt (if E2EE ready) ──→ If fails: continue as plaintext
       ↓
Upload attachment (if any) ──→ If fails: skip attachment
       ↓
INSERT into messages table
       ↓
   RLS checks ──→ If fails: reject insert
       ↓
Update local state
       ↓
Realtime broadcasts INSERT
       ↓
Recipient's subscription fires
       ↓
Recipient loads & decrypts
       ↓
Message appears in UI
```

### Encryption Flow

```
Admin encrypts for Customer:
  1. Load customer's public_key from profiles
  2. Derive shared secret (ECDH + HKDF)
  3. Encrypt with AES-256-GCM
  4. Insert with encrypted=true, iv, sender_public_key, message_index

Customer decrypts:
  1. Fetch message with encrypted=true
  2. Extract iv, sender_public_key, message_index
  3. Derive same shared secret using sender's public key
  4. Decrypt with AES-256-GCM
  5. Display plaintext
```

---

**Last Updated**: Based on current codebase state
**Maintainer**: Reference app/admin/messages/page.tsx, app/account/messages/page.tsx, hooks/useE2EEncryption.ts
