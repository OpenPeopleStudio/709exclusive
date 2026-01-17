# Privacy-First Platform Deployment Guide

This guide walks you through deploying all privacy enhancements to your production environment.

## Pre-Deployment Checklist

- [ ] All tests pass locally (`npm run build`)
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] Cron job schedule planned
- [ ] Team notified of new features

## Step 1: Environment Variables

Add these to your `.env.local` (development) and Vercel (production):

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# New variables for privacy features
CRON_SECRET=generate-random-secure-string-here
PRIVACY_STRICT_LOGGING=true
```

Generate a secure CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Database Migrations

Run migrations in this exact order:

### Option A: Run Individually (Recommended for Production)

```bash
# 1. Data privacy enhancements (exports, deletions)
psql $DATABASE_URL -f sql/033_data_privacy_enhancements.sql

# 2. Consent management
psql $DATABASE_URL -f sql/034_privacy_consent.sql

# 3. Consignor privacy
psql $DATABASE_URL -f sql/035_consignor_privacy.sql

# 4. Tenant audit triggers
psql $DATABASE_URL -f sql/036_tenant_audit_triggers.sql

# 5. Automated retention
psql $DATABASE_URL -f sql/037_automated_retention.sql
```

### Option B: Use Supabase Dashboard

1. Go to your Supabase project → SQL Editor
2. Copy and paste each SQL file content
3. Execute them one by one in order

### Option C: Use Migration Script

```bash
npm run migrate:privacy
```

## Step 3: Verify Database Setup

Run verification queries:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'data_exports',
  'account_deletions',
  'consent_types',
  'user_consents',
  'retention_policies',
  'tenant_isolation_alerts'
);

-- Check retention policies
SELECT policy_name, table_name, retention_days, enabled 
FROM retention_policies;

-- Check consent types
SELECT code, name, category, is_required 
FROM consent_types;
```

Expected: 6 tables and default policies/consents should exist.

## Step 4: Deploy Application Code

### Development Testing

```bash
npm run dev
```

Test these features:
- [ ] `/account/privacy` - Privacy dashboard loads
- [ ] `/api/account/export-data` - Data export works
- [ ] `/api/account/consents` - Consent management works
- [ ] `/consignor/portal?token=test` - Portal accessible
- [ ] `/staff/location` - Location tracking works (if staff)

### Production Deployment

```bash
# Build and test
npm run build
npm start

# Deploy to Vercel
vercel --prod

# Or use Git push (if connected to Vercel)
git add .
git commit -m "Add privacy-first platform enhancements"
git push origin main
```

## Step 5: Configure Vercel Cron Jobs

### Update vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/data-retention/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/order-cleanup",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/staff-location/cleanup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Set Cron Secret in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = (your generated secret)
3. Redeploy for changes to take effect

### Test Cron Endpoints

```bash
# Get your cron secret
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)

# Test data retention cleanup
curl -X GET https://your-domain.com/api/cron/data-retention/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"

# Test order cleanup
curl -X GET https://your-domain.com/api/cron/order-cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Step 6: Run Tenant Isolation Tests

```bash
# Make script executable
chmod +x scripts/audit-tenant-isolation.ts

# Run tests
npm run audit:tenant-isolation
```

Expected output: All tests should pass ✅

## Step 7: Initialize Default Data

### Backfill Consent Records for Existing Users

```sql
-- Grant essential consent to all existing users
INSERT INTO user_consents (user_id, tenant_id, consent_type_code, consent_given, consent_version)
SELECT 
  p.id,
  p.tenant_id,
  'essential_service',
  TRUE,
  1
FROM "709_profiles" p
WHERE NOT EXISTS (
  SELECT 1 FROM user_consents uc
  WHERE uc.user_id = p.id
  AND uc.consent_type_code = 'essential_service'
);
```

### Verify Retention Policies are Enabled

```sql
UPDATE retention_policies 
SET enabled = TRUE 
WHERE policy_name IN (
  'staff_locations',
  'recently_viewed',
  'data_exports'
);
```

## Step 8: Update Documentation

### Add to README.md

```markdown
## Privacy Features

This platform is built with privacy-first principles:

- **GDPR Compliant**: Full data export and right to be forgotten
- **Consent Management**: Granular control over data usage
- **E2E Encryption**: Messages encrypted with perfect forward secrecy
- **Data Minimization**: Automated retention policies
- **Transparency**: Privacy dashboard shows all stored data

Visit `/account/privacy` to manage your privacy settings.
```

### Create Privacy Policy Page

Create `app/policies/privacy/page.tsx` linking to your legal privacy policy.

## Step 9: User Communication

### Email Template for Existing Users

```
Subject: New Privacy Controls Available

Hi [Name],

We've enhanced our platform with new privacy controls:

✓ View all your stored data
✓ Export your data anytime
✓ Manage consent preferences
✓ Request account deletion

Visit your Privacy Dashboard: [link]

Questions? Reply to this email.
```

### In-App Announcement

Add a banner to notify users about new privacy features.

## Step 10: Monitoring Setup

### Set Up Alerts

Monitor these tables for issues:
- `tenant_isolation_alerts` - Security issues
- `retention_executions` - Cleanup failures
- `account_deletions` - Deletion requests

### Create Dashboard Queries

```sql
-- Recent privacy actions
SELECT 
  action,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM activity_logs
WHERE action LIKE '%privacy%'
  OR action LIKE '%consent%'
  OR action LIKE '%export%'
  OR action LIKE '%deletion%'
GROUP BY action
ORDER BY last_occurrence DESC;

-- Tenant isolation health
SELECT 
  alert_type,
  severity,
  COUNT(*) as count
FROM tenant_isolation_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
AND resolved_at IS NULL
GROUP BY alert_type, severity;
```

## Post-Deployment Checklist

- [ ] All cron jobs running successfully
- [ ] Privacy dashboard accessible to users
- [ ] Data export tested end-to-end
- [ ] Consent management working
- [ ] Tenant isolation tests passing
- [ ] Retention policies executing daily
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Users notified of privacy enhancements

## Rollback Plan

If issues occur:

1. **Disable cron jobs** in Vercel
2. **Pause retention policies**:
   ```sql
   UPDATE retention_policies SET enabled = FALSE;
   ```
3. **Revert code deployment**:
   ```bash
   vercel rollback
   ```
4. Keep database migrations (they're additive and safe)

## Support

### Common Issues

**Issue**: Cron jobs not running
- Check `CRON_SECRET` is set correctly
- Verify cron schedule in vercel.json
- Check Vercel logs for errors

**Issue**: RLS policy blocks queries
- Ensure `tenant_id` is included in queries
- Check user has proper role permissions
- Review policy definitions

**Issue**: Export taking too long
- Add indexes to frequently queried tables
- Consider pagination for large datasets
- Cache results temporarily

### Getting Help

- Check Supabase logs for database errors
- Review Vercel function logs for API errors
- Test locally with `PRIVACY_STRICT_LOGGING=false` for detailed errors

## Next Steps

After successful deployment:

1. **Monitor usage** - Track privacy feature adoption
2. **Gather feedback** - Survey users about new features
3. **Iterate** - Enhance based on user needs
4. **Compliance** - Schedule regular privacy audits
5. **Documentation** - Keep privacy policy updated

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Version**: 1.0.0
