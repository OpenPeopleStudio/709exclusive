# Message Deletion Feature

## Overview
The inbox now supports soft deletion of individual messages. When a message is deleted, the content is purged but the message row remains in the database as a tombstone record showing `[Message deleted]`.

## Database Schema

### Migration Required
Run the migration: `supabase/migrations/20260117200000_message_privacy.sql`

This adds the following columns to the `messages` table:
- `deleted_at` - Timestamp when message was deleted
- `deleted_by` - UUID of user who deleted the message
- `deleted_for_both` - Boolean indicating if deleted for all participants
- `expires_at` - For future automated retention policies

## How It Works

### 1. Delete Button
- Appears on hover for each message (desktop only)
- Located in the top-right corner of message bubbles
- Only shows for non-deleted messages

### 2. Soft Delete Process
When a user clicks delete:
1. API route `/api/messages/delete` validates permissions
2. Message content is purged (set to empty string)
3. All sensitive fields are cleared (encryption keys, attachments, etc.)
4. `deleted_at` timestamp is set
5. Attachment files are removed from storage
6. UI updates to show `[Message deleted]`

### 3. Permissions
Messages can be deleted by:
- **Admins/Staff** - Can delete any message in their tenant
- **Message Owner** - Can delete their own messages (customer_id matches user.id)

### 4. UI Display
- Deleted messages show as `[Message deleted]` in gray text
- Delete button disappears after deletion
- Location links and attachments are hidden for deleted messages
- Conversation preview shows `[Deleted]` for the last message if deleted

## API Endpoint

### POST `/api/messages/delete`

**Request Body:**
```json
{
  "messageId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Errors:**
- `401` - User not authenticated
- `403` - User doesn't have permission to delete this message
- `404` - Message not found
- `500` - Server error during deletion

## Technical Implementation

### Frontend (inbox/page.tsx)
```typescript
const handleDeleteMessage = async (messageId: string) => {
  const response = await fetch('/api/messages/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId })
  })

  if (response.ok) {
    // Update UI to show tombstone
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, deleted_at: new Date().toISOString(), content: '' }
          : msg
      )
    )
  }
}
```

### Backend (api/messages/delete/route.ts)
- Validates user authentication
- Checks admin access OR message ownership
- Tenant-aware (respects multi-tenancy)
- Purges content and metadata
- Removes storage attachments
- Sets tombstone fields

## Future Enhancements

### Automated Retention (Not Yet Implemented)
The schema includes support for:
- `expires_at` - Automatic message expiration
- User-level retention policies via `709_profiles` table:
  - `message_retention_enabled`
  - `message_retention_days`

### Potential Features
- Undo deletion (within grace period)
- Bulk message deletion
- Export before delete
- Notification to other party
- Hard delete option (remove row entirely)

## Testing

1. **Apply Migration:**
   ```bash
   psql <connection-string> -f supabase/migrations/20260117200000_message_privacy.sql
   ```

2. **Test Deletion:**
   - Go to `/admin/inbox`
   - Open a conversation
   - Hover over a message (desktop)
   - Click the × button
   - Verify message shows `[Message deleted]`
   - Refresh page and confirm deletion persists

3. **Test Permissions:**
   - Try deleting as admin/staff ✅
   - Try deleting as message owner ✅
   - Try deleting another user's message (should fail) ❌

## Security Considerations

- **Content Purging**: Message content is completely cleared, not just hidden
- **Encryption Keys**: All encryption metadata is removed
- **Attachments**: Files are deleted from storage
- **Audit Trail**: `deleted_by` tracks who performed the deletion
- **Tenant Isolation**: Deletion respects tenant boundaries
- **RLS Policies**: Standard row-level security applies

## Related Files

- `supabase/migrations/20260117200000_message_privacy.sql` - Schema migration
- `app/api/messages/delete/route.ts` - Delete API endpoint
- `app/admin/inbox/page.tsx` - Inbox UI with delete handler
- `components/inbox/ThreadView.tsx` - Thread view with delete button
- `sql/026_message_privacy.sql` - Original SQL reference
