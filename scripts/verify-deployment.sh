#!/bin/bash

# Deployment Verification Script
# Checks that all privacy features are properly deployed

set -e

echo "🔍 Privacy Platform Deployment Verification"
echo "==========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Function to run a query and check result
check_query() {
    local description=$1
    local query=$2
    local expected=$3
    
    echo -n "Checking: $description... "
    result=$(psql "$DATABASE_URL" -t -c "$query" 2>/dev/null | xargs)
    
    if [ -z "$expected" ]; then
        if [ ! -z "$result" ]; then
            echo "✓ ($result)"
        else
            echo "✗ (no result)"
        fi
    else
        if [ "$result" = "$expected" ]; then
            echo "✓"
        else
            echo "✗ (expected: $expected, got: $result)"
        fi
    fi
}

# Check tables exist
echo "📊 Database Tables"
echo "------------------"
check_query "data_exports table" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'data_exports';" \
    "1"

check_query "account_deletions table" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'account_deletions';" \
    "1"

check_query "consent_types table" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'consent_types';" \
    "1"

check_query "user_consents table" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_consents';" \
    "1"

check_query "retention_policies table" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'retention_policies';" \
    "1"

check_query "tenant_isolation_alerts table" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tenant_isolation_alerts';" \
    "1"

echo ""

# Check default data
echo "📝 Default Data"
echo "---------------"
check_query "Consent types seeded" \
    "SELECT COUNT(*) FROM consent_types;" \
    ""

check_query "Retention policies seeded" \
    "SELECT COUNT(*) FROM retention_policies;" \
    ""

echo ""

# Check functions exist
echo "⚙️  Database Functions"
echo "---------------------"
check_query "anonymize_order_data function" \
    "SELECT COUNT(*) FROM pg_proc WHERE proname = 'anonymize_order_data';" \
    "1"

check_query "delete_user_personal_data function" \
    "SELECT COUNT(*) FROM pg_proc WHERE proname = 'delete_user_personal_data';" \
    "1"

check_query "execute_retention_policy function" \
    "SELECT COUNT(*) FROM pg_proc WHERE proname = 'execute_retention_policy';" \
    "1"

check_query "get_user_consents function" \
    "SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_user_consents';" \
    "1"

echo ""

# Check RLS is enabled
echo "🔒 Row Level Security"
echo "--------------------"
check_query "data_exports RLS enabled" \
    "SELECT relrowsecurity FROM pg_class WHERE relname = 'data_exports';" \
    "t"

check_query "user_consents RLS enabled" \
    "SELECT relrowsecurity FROM pg_class WHERE relname = 'user_consents';" \
    "t"

check_query "retention_policies RLS enabled" \
    "SELECT relrowsecurity FROM pg_class WHERE relname = 'retention_policies';" \
    "t"

echo ""

# Check environment variables (if running locally)
if [ -f ".env.local" ]; then
    echo "🔐 Environment Variables"
    echo "------------------------"
    
    if grep -q "CRON_SECRET" .env.local; then
        echo "✓ CRON_SECRET is set"
    else
        echo "✗ CRON_SECRET is not set"
    fi
    
    if grep -q "PRIVACY_STRICT_LOGGING" .env.local; then
        echo "✓ PRIVACY_STRICT_LOGGING is set"
    else
        echo "⚠️  PRIVACY_STRICT_LOGGING not set (optional)"
    fi
    
    echo ""
fi

# Check application files exist
echo "📁 Application Files"
echo "-------------------"
files=(
    "app/api/account/export-data/route.ts"
    "app/api/account/delete-account/route.ts"
    "app/api/account/consents/route.ts"
    "app/api/account/privacy/stats/route.ts"
    "app/account/privacy/page.tsx"
    "app/consignor/portal/page.tsx"
    "app/api/cron/data-retention/cleanup/route.ts"
    "lib/privacy.ts"
    "lib/retention/policies.ts"
    "lib/routing/optimizer.ts"
    "lib/workflows/order-automation.ts"
    "components/account/PrivacyControls.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (missing)"
    fi
done

echo ""
echo "🎉 Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Set CRON_SECRET in Vercel dashboard"
echo "3. Test privacy features manually"
echo "4. Run tenant isolation tests"
echo ""
