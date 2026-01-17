# Apply Message Deletion Migration

This guide walks you through enabling message deletion in your inbox.

## Prerequisites
- Supabase project with database access
- `psql` command-line tool installed (comes with PostgreSQL)

## Steps

### 1. Get Your Database Connection String

From your Supabase dashboard:
1. Go to **Project Settings** → **Database**
2. Copy the **Connection string** (it looks like `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)

### 2. Apply the Migration

Run this command in your terminal:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres" -f supabase/migrations/20260117200000_message_privacy.sql
```

Replace `[YOUR-PASSWORD]` with your actual database password.

### 3. Verify

You should see output similar to:
```
ALTER TABLE
ALTER TABLE
CREATE INDEX
CREATE INDEX
COMMENT
COMMENT
COMMENT
COMMENT
COMMENT
COMMENT
```

### 4. Test in the UI

1. Go to `/admin/inbox` in your app
2. Open any conversation
3. Hover over a message (desktop)
4. You should see a small **×** button appear
5. Click it to delete the message
6. The message should now show as `[Message deleted]`

## What This Migration Does

Adds soft deletion support to the `messages` table:
- `deleted_at` - When the message was deleted
- `deleted_by` - Who deleted it
- `deleted_for_both` - If both parties see it as deleted
- `expires_at` - For future auto-expiration

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE messages
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS deleted_by,
  DROP COLUMN IF EXISTS deleted_for_both,
  DROP COLUMN IF EXISTS expires_at;

ALTER TABLE "709_profiles"
  DROP COLUMN IF EXISTS message_retention_enabled,
  DROP COLUMN IF EXISTS message_retention_days;

DROP INDEX IF EXISTS idx_messages_deleted_at;
DROP INDEX IF EXISTS idx_messages_expires_at;
```

## Troubleshooting

### "psql: command not found"
Install PostgreSQL client tools:
- **Mac**: `brew install postgresql`
- **Ubuntu**: `sudo apt install postgresql-client`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

### "connection refused"
- Check your connection string is correct
- Verify your IP is allowed in Supabase dashboard → **Project Settings** → **Database** → **Connection pooling**

### Migration already applied
If you see "column already exists" errors, the migration was already applied. This is safe to ignore.

## Next Steps

- Read full documentation: `docs/message-deletion.md`
- Test message deletion in your inbox
- Consider implementing automated retention policies (see future enhancements)
