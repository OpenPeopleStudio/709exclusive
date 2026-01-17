#!/bin/bash

# Privacy Platform Migration Script
# Runs ONLY the new privacy-related database migrations

set -e  # Exit on error

echo "🔐 Privacy Platform Migration Script"
echo "====================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:5432/database'"
    echo ""
    echo "Or for Supabase:"
    echo "  Get it from: Supabase Dashboard → Project Settings → Database → Connection String"
    echo ""
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Array of NEW privacy migration files ONLY
MIGRATIONS=(
    "sql/033_data_privacy_enhancements.sql"
    "sql/034_privacy_consent.sql"
    "sql/035_consignor_privacy.sql"
    "sql/036_tenant_audit_triggers.sql"
    "sql/037_automated_retention.sql"
)

echo "This will run 5 new privacy migrations:"
for migration in "${MIGRATIONS[@]}"; do
    echo "  - $migration"
done
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi
echo ""

# Run each migration
SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "🔄 Running: $migration"
        if psql "$DATABASE_URL" -f "$migration" -v ON_ERROR_STOP=1 2>&1 | grep -v "NOTICE:"; then
            echo "✓ Completed: $migration"
            ((SUCCESS_COUNT++))
        else
            echo "✗ Failed: $migration"
            ((FAIL_COUNT++))
            echo ""
            echo "Migration failed. Rolling back is not automatic."
            echo "Please review the error and fix manually."
            exit 1
        fi
        echo ""
    else
        echo "⚠️  Skipping (not found): $migration"
        echo ""
    fi
done

echo "╔════════════════════════════════════╗"
echo "║     Migration Summary              ║"
echo "╠════════════════════════════════════╣"
echo "║  Successful: $SUCCESS_COUNT                       ║"
echo "║  Failed:     $FAIL_COUNT                       ║"
echo "╚════════════════════════════════════╝"
echo ""

if [ $SUCCESS_COUNT -eq 5 ]; then
    echo "🎉 All privacy migrations completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy your application: vercel --prod"
    echo "2. Set CRON_SECRET in Vercel environment variables"
    echo "3. Test features at /account/privacy"
    echo ""
else
    echo "⚠️  Some migrations failed or were skipped."
    exit 1
fi
