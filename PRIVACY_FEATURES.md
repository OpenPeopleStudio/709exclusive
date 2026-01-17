# Privacy Features Documentation

## Overview

This platform is built with privacy-first principles, implementing GDPR, CCPA, and PIPEDA compliance features.

## Customer-Facing Features

### 1. Privacy Dashboard (`/account/privacy`)

A centralized hub where users can:
- View all stored personal data
- See account statistics and data usage
- Manage privacy consents
- Export their data
- Request account deletion

**Tech Stack**: React, TypeScript, Supabase RLS

### 2. Data Export

**Endpoint**: `GET /api/account/export-data`

Downloads a comprehensive JSON file containing:
- Profile information
- Order history (all details)
- Messages (encrypted)
- Wishlist items
- Recently viewed products
- Staff location data (if applicable)
- Consignment records (if applicable)
- Activity logs (recent 500)

**Format**: JSON with metadata
**Compliance**: GDPR Article 20 (Data Portability)

### 3. Right to Be Forgotten

**Endpoint**: `POST /api/account/delete-account`

Features:
- 30-day grace period (configurable)
- Order anonymization (preserves business records)
- Complete personal data deletion
- Cancellable before execution
- Activity logging

**Process**:
1. User requests deletion
2. System schedules deletion in 30 days
3. User can cancel anytime before deletion date
4. On deletion date:
   - Orders: Anonymize shipping addresses
   - Messages: Delete all messages
   - Personal data: Remove wishlist, preferences, locations
   - Profile: Anonymize name, remove encryption keys

**Compliance**: GDPR Article 17

### 4. Consent Management

**Endpoint**: `GET/POST /api/account/consents`

Consent Types:
- **Essential Service** (required): Account, orders, checkout
- **Marketing Communications** (optional): Promotional emails
- **Analytics Tracking** (optional): Usage data for platform improvement
- **Personalization** (optional): Browsing history, recommendations
- **Location Sharing** (optional): Delivery tracking
- **Message Storage** (optional): Indefinite vs auto-delete

Features:
- Granular control per consent type
- Version tracking
- Audit trail (all changes logged)
- Expiration support
- RLS-protected storage

**Compliance**: GDPR Article 7, CCPA

## Staff Features

### 5. Location History Viewer

**Page**: `/staff/location` (enhanced)
**Export**: `GET /api/staff/location/export`

Features:
- View personal location history
- Daily statistics (points, hours, accuracy)
- Export formats: JSON, CSV, GeoJSON
- Privacy controls
- Auto-deletion after 48 hours

### 6. Consignor Portal

**Page**: `/consignor/portal`
**Auth**: Token-based (24-hour validity)

Features:
- Secure access without account
- View consignment items and status
- Sales history
- Payout tracking
- Data export capability
- Encrypted payment information

**Privacy**: No passwords stored, time-limited access tokens

## Admin Features

### 7. Privacy-Preserving Analytics

**Endpoint**: `GET /api/admin/analytics/anonymized`

Metrics:
- Customer LTV (email hashing)
- Geographic sales (city-level only)
- Staff efficiency (anonymized IDs)
- Inventory turnover (by brand)

Privacy Techniques:
- Differential privacy (noise addition)
- Email hashing (SHA-256)
- IP anonymization
- Geographic aggregation
- K-anonymity checking

### 8. Tenant Isolation Auditing

**Tests**: `npm run audit:tenant-isolation`
**Alerts**: `tenant_isolation_alerts` table

Features:
- Automated RLS policy testing
- Cross-tenant access detection
- Service role usage logging
- Regular compliance checks
- Alert notifications

**Runs**: Automatically via CI/CD

## Automation

### 9. Data Retention Policies

**Cron**: Daily at 2 AM
**Endpoint**: `GET /api/cron/data-retention/cleanup`

Default Policies:
- Message attachments: 90 days
- Staff locations: 2 days (48 hours)
- Recently viewed: 90 days
- Activity logs: 365 days
- Data exports: 90 days
- Portal access tokens: 30 days

**Configurable**: Admin can adjust retention periods in `retention_policies` table

### 10. Order Lifecycle Automation

**Cron**: Hourly
**Endpoint**: `GET /api/cron/order-cleanup`

Features:
- Auto-cancel stale pending orders (24 hours)
- Release reserved inventory
- Notify customers
- Log all actions

## Technical Implementation

### PII Detection & Redaction

**Module**: `lib/privacy.ts`

Auto-detects and redacts:
- Email addresses
- Phone numbers
- Credit card numbers
- IP addresses
- API keys/tokens
- Passwords
- Social Insurance Numbers

**Functions**:
```typescript
redactPII(text, options)          // Redact PII from string
redactObjectPII(obj)              // Recursive object redaction
containsPII(text)                 // Check if contains PII
safeLog(message, data)            // Safe logging utility
hashEmail(email)                  // SHA-256 email hashing
anonymizeIP(ip)                   // IP anonymization
```

### Differential Privacy

**Module**: `lib/privacy.ts`

```typescript
addDifferentialPrivacyNoise(value, epsilon = 0.1)
```

Adds Laplace noise to numeric data for privacy protection.

### Consent Versioning

**Schema**: `consent_types` table

- Each consent type has a version number
- User consents track which version was accepted
- Changes to consent text increment version
- Audit trail logs all changes

### Encryption

**Existing**: End-to-end encryption for messages
- Algorithm: AES-256-GCM
- Key exchange: ECDH P-256
- Perfect forward secrecy: HKDF message keys
- Client-side encryption/decryption

**New**: Consignor payment information encryption
- Symmetric encryption for payment notes
- Tokens stored (not raw account numbers)
- Stripe Connect integration

## Compliance Matrix

| Requirement | Feature | Status |
|-------------|---------|--------|
| **GDPR Article 15** (Access) | Data export API | ✅ |
| **GDPR Article 17** (Erasure) | Account deletion | ✅ |
| **GDPR Article 20** (Portability) | JSON export | ✅ |
| **GDPR Article 7** (Consent) | Consent management | ✅ |
| **GDPR Article 32** (Security) | E2E encryption | ✅ |
| **CCPA Section 1798.100** (Notice) | Privacy dashboard | ✅ |
| **CCPA Section 1798.110** (Access) | Data export | ✅ |
| **CCPA Section 1798.105** (Deletion) | Account deletion | ✅ |
| **PIPEDA Principle 4.9** (Consent) | Consent system | ✅ |
| **PIPEDA Principle 4.5** (Retention) | Automated cleanup | ✅ |

## Security Considerations

### Row Level Security (RLS)

All privacy-related tables use RLS:
- `data_exports`: Users see only their exports
- `account_deletions`: Users see only their requests
- `user_consents`: Users manage only their consents
- `consent_audit`: Users view only their audit trail
- `retention_policies`: Admin-only access
- `tenant_isolation_alerts`: Admin-only access

### API Authentication

- All endpoints require valid session
- Role-based access control (RBAC)
- Tenant isolation enforced
- Rate limiting recommended (add via middleware)

### Audit Logging

All privacy actions are logged:
- Data exports
- Account deletions
- Consent changes
- Admin access to user data
- Retention policy executions

**Table**: `activity_logs` (365-day retention)

## Testing

### Manual Testing Checklist

- [ ] Create account
- [ ] Visit privacy dashboard
- [ ] Update consents
- [ ] Export data (verify completeness)
- [ ] Request account deletion
- [ ] Cancel deletion
- [ ] Verify data deletion (after 30 days)
- [ ] Test consignor portal access
- [ ] Test staff location export

### Automated Tests

```bash
# Tenant isolation
npm run audit:tenant-isolation

# Deployment verification
npm run verify:deployment

# Build test
npm run build
```

## Monitoring

### Key Metrics

- Data export requests per day
- Account deletion requests per month
- Consent opt-in rates by type
- Privacy dashboard traffic
- Retention policy execution success rate
- Tenant isolation alerts

### Alerts to Set Up

1. **Critical**: Tenant isolation alert created
2. **High**: Account deletion > 10/day
3. **Medium**: Retention policy failure
4. **Low**: New consent type added

## User Documentation

### For Customers

Create a help article at `/help/privacy`:
- How to export your data
- How to delete your account
- Understanding consent options
- Privacy policy (link)
- Contact for privacy questions

### For Staff

Internal documentation:
- Location sharing best practices
- Data handling guidelines
- Privacy incident response
- GDPR request procedures

## Future Enhancements

Potential additions:
- [ ] Privacy impact assessments (PIA) workflow
- [ ] Automated DPIA generation
- [ ] Cookie consent banner
- [ ] Data processing agreements (DPA) generator
- [ ] Privacy policy version management
- [ ] User-friendly privacy reports
- [ ] Third-party data sharing registry
- [ ] Data retention policy UI

## Support

For privacy-related questions:
- Email: privacy@709exclusive.com
- Documentation: /help/privacy
- Emergency: Use data deletion API immediately

---

Last Updated: 2026-01-17
Version: 1.0.0
