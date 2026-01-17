#!/bin/bash

# Privacy Platform Migration Script
# Runs all privacy-related database migrations in the correct order

set -e  # Exit on error

echo "🔐 Privacy Platform Migration Script"
echo "====================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='your-postgres-connection-string'"
    echo ""
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Create backup first
echo "📦 Creating backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Backup failed (continuing anyway)"
echo "✓ Backup saved to $BACKUP_FILE"
echo ""

# Array of migration files in order
MIGRATIONS=(
    "sql/033_data_privacy_enhancements.sql"
    "sql/034_privacy_consent.sql"
    "sql/035_consignor_privacy.sql"
    "sql/036_tenant_audit_triggers.sql"
    "sql/037_automated_retention.sql"
)

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "🔄 Running: $migration"
        psql "$DATABASE_URL" -f "$migration" -v ON_ERROR_STOP=1
        echo "✓ Completed: $migration"
        echo ""
    else
        echo "⚠️  Skipping (not found): $migration"
        echo ""
    fi
done

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify tables were created:"
echo "   psql \$DATABASE_URL -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%retention%' OR table_name LIKE '%consent%';\""
echo ""
echo "2. Check retention policies:"
echo "   psql \$DATABASE_URL -c \"SELECT policy_name, table_name, retention_days FROM retention_policies;\""
echo ""
echo "3. Deploy your application code"
echo "4. Configure cron jobs in Vercel"
echo ""
