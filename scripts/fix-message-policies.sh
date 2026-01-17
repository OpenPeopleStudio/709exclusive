#!/bin/bash

# Script to fix message RLS policies for multi-tenant support
# This fixes the issue where messages are not being received by recipients

echo "🔧 Fixing message RLS policies..."

# Check if psql is available (for direct database connection)
if command -v psql &> /dev/null; then
  echo "Using psql to apply migration..."
  # You'll need to set DATABASE_URL in your environment
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set"
    echo "Please run: export DATABASE_URL='your-supabase-connection-string'"
    echo "Or use the Supabase SQL Editor instead (see below)"
    exit 1
  fi
  psql "$DATABASE_URL" < sql/032_fix_message_tenant_policies.sql
  echo "✅ Migration applied successfully!"
else
  echo "📋 psql not found. Please apply the migration manually:"
  echo ""
  echo "Option 1: Supabase Dashboard"
  echo "  1. Go to your Supabase project dashboard"
  echo "  2. Navigate to SQL Editor"
  echo "  3. Copy and paste the contents of sql/032_fix_message_tenant_policies.sql"
  echo "  4. Run the query"
  echo ""
  echo "Option 2: Supabase CLI"
  echo "  Run: supabase db execute -f sql/032_fix_message_tenant_policies.sql"
  echo ""
fi
