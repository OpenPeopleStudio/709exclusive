# Protected Pages - Encryption Lock Screen Coverage

## Overview

Pages containing personally identifiable information (PII) or sensitive customer/business data are now protected by encryption lock screens. When encryption keys are locked with a passphrase, users must unlock before accessing protected content.

## Protected Pages Matrix

### ✅ Fully Protected (Lock Screen Implemented)

#### Admin Pages

| Page | Route | Sensitive Data | Lock Status |
|------|-------|----------------|-------------|
| **Inbox** | `/admin/inbox` | Customer messages, team chats, attachments | ✅ Locked |
| **Customers** | `/admin/customers` | Email, phone, names, purchase history | ✅ Locked |
| **Orders** | `/admin/orders` | Shipping addresses, customer contact info | ✅ Locked |
| **Messages (Legacy)** | `/admin/messages` | Customer support messages | ⚠️ Should redirect to /admin/inbox |
| **Team Chat (Legacy)** | `/admin/team-chat` | Internal team communications | ⚠️ Should redirect to /admin/inbox |

#### Customer Pages

| Page | Route | Sensitive Data | Lock Status |
|------|-------|----------------|-------------|
| **Messages** | `/account/messages` | Encrypted support conversations | ✅ Locked |
| **Orders** | `/account/orders` | Order history, shipping addresses | ✅ Locked |
| **Order Details** | `/account/orders/[id]` | Detailed order info, tracking | 🔄 Inherits from parent |

### 🔒 Should Be Protected (Future Implementation)

#### Admin Pages

| Page | Route | Sensitive Data | Priority | Reason |
|------|-------|----------------|----------|--------|
| **Reports** | `/admin/reports` | Customer analytics, revenue data | Medium | Business intelligence, customer behavior patterns |
| **Consignments** | `/admin/orders/consignments` | Consignor contact info, terms | Medium | Third-party PII |
| **Returns** | `/admin/orders/returns` | Customer addresses, contact info | Medium | PII in return requests |

#### Customer Pages

| Page | Route | Sensitive Data | Priority | Reason |
|------|-------|----------------|----------|--------|
| **Order Tracking** | `/account/orders/[id]/tracking` | Shipping address, tracking details | High | Real-time location data |
| **Account Settings** | `/account/settings` | Email, phone (if editable) | Low | Mostly preferences, some PII |

### ❌ Not Protected (Public or Non-Sensitive Data)

| Page | Route | Content Type | Reason Not Protected |
|------|-------|--------------|---------------------|
| **Products** | `/admin/products` | Product catalog | Public-facing data |
| **Inventory** | `/admin/inventory` | Stock levels, SKUs | Business data but not PII |
| **Models** | `/admin/models` | Product models/categories | Public product information |
| **Settings** | `/admin/settings` | Store configuration | Business settings, not customer data |
| **Tenant Settings** | `/admin/tenant-settings` | Domain, billing settings | Account settings, not PII |
| **Wishlist** | `/account/wishlist` | Product preferences | Non-sensitive user preferences |
| **Shop** | `/shop` | Product browsing | Public catalog |

## Data Sensitivity Classification

### **Level 1: Critical PII (Always Lock)**
- Customer full names
- Email addresses
- Phone numbers
- Shipping addresses
- Billing addresses
- Payment information
- Encrypted messages
- Social security numbers (if collected)

**Protected Pages:** Inbox, Customers, Orders, Messages

### **Level 2: Business Sensitive (Lock Recommended)**
- Revenue data
- Customer purchase patterns
- Order fulfillment details
- Inventory costs/margins
- Consignor agreements
- Internal team discussions

**Protected Pages:** Reports, Consignments (future)

### **Level 3: Non-Sensitive (No Lock Needed)**
- Product names and descriptions
- SKUs
- Stock quantities
- Public pricing
- Category names
- Product images

**Unprotected Pages:** Products, Inventory, Models

## Implementation Pattern

### Standard Pattern for Admin Pages

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import EncryptionLockScreen from '@/components/EncryptionLockScreen'

export default function ProtectedPage() {
  const [adminId, setAdminId] = useState<string | null>(null)
  const { isLocked, unlockKeys, error: encryptionError } = useE2EEncryption(adminId)

  useEffect(() => {
    const getAdminId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
    }
    getAdminId()
  }, [])

  // Show lock screen if encryption is locked
  if (isLocked) {
    return <EncryptionLockScreen onUnlock={unlockKeys} error={encryptionError} />
  }

  return <div>{/* Normal page content */}</div>
}
```

### Pattern for Customer Pages

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import EncryptionLockScreen from '@/components/EncryptionLockScreen'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ProtectedCustomerPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const { isLocked, unlockKeys, error: encryptionError } = useE2EEncryption(userId)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUserId()
  }, [])

  // Show lock screen if encryption is locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
          <div className="container max-w-4xl">
            <EncryptionLockScreen onUnlock={unlockKeys} error={encryptionError} />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        {/* Normal page content */}
      </main>
      <Footer />
    </div>
  )
}
```

## Security Considerations

### What's Protected
- Viewing sensitive content requires unlocked encryption
- Page data isn't loaded until after unlock
- API calls are deferred until authentication + unlock
- Lock screen replaces entire page content

### What's Still Accessible When Locked
- Navigation menu (to access Privacy settings)
- Page routes (URL routing works)
- Header/Footer (for branding and logout)
- Non-sensitive pages (Products, Shop, etc.)

### Edge Cases

#### Shared Devices
- User A locks encryption and walks away
- User B logs in with their account
- User B's encryption state is separate (may be unlocked)
- Each user's lock state is independent

#### Multiple Tabs
- Lock state is in-memory per tab
- Locking in one tab doesn't lock others (browser limitation)
- Future: Use localStorage/BroadcastChannel to sync lock state

#### Session Timeout
- Browser session expires → requires login
- Encryption lock persists across browser sessions
- Must unlock after every login if passphrase is set

## Compliance Benefits

### GDPR (General Data Protection Regulation)
- **Article 32**: Technical measures to ensure security
- **Encryption at rest**: Private keys encrypted with passphrase
- **Access control**: Lock screen prevents unauthorized viewing
- **Audit trail**: Future logging of lock/unlock events

### HIPAA (Health Insurance Portability and Accountability Act)
- **164.312(a)(2)(iv)**: Encryption and decryption
- **164.312(d)**: Person or entity authentication
- **Protected Health Information (PHI)**: If storing medical data

### PCI-DSS (Payment Card Industry Data Security Standard)
- **Requirement 3**: Protect stored cardholder data
- **Requirement 8**: Identify and authenticate access
- Note: Actual payment data stored by Stripe, not in our DB

## User Education

### When Pages Get Locked

**Automatic Lock Scenarios:**
- User sets passphrase via Privacy tab → Keys lock on next page load
- User explicitly clicks "Lock" → Immediate lock
- Browser restart → Keys remain locked if passphrase was set

**Unlock Required:**
- Accessing Inbox, Customers, Orders pages
- Viewing encrypted messages
- Seeing customer contact information

### How to Unlock

1. Navigate to locked page
2. See lock screen with passphrase prompt
3. Enter passphrase
4. Click "Unlock Encryption" or press Enter
5. Page loads with full content access

### Recovery Options

**Forgot Passphrase:**
1. Use recovery code (from backup)
2. Restore keys from encrypted backup
3. Optionally set new passphrase

**No Recovery Code:**
- Must reset encryption keys
- Loses access to old encrypted messages
- Can start fresh with new keys

## Future Enhancements

### Auto-Lock Policies
```typescript
{
  "autoLockAfterMinutes": 30,        // Lock after inactivity
  "lockOnTabSwitch": false,          // Lock when switching tabs
  "lockOnBrowserClose": true,        // Clear keys on close
  "requirePassphraseForAdmin": true  // Enforce for admin users
}
```

### Granular Permissions
- Lock only specific data types (e.g., addresses but not emails)
- Role-based lock requirements (admins must lock, staff optional)
- Time-based unlocks (unlock for 8 hours, then re-lock)

### Enhanced Lock Screen
- "Unlock all protected pages" option
- Remember device for 30 days (trusted devices)
- Biometric unlock (WebAuthn integration)
- Security audit log (who unlocked when)

## Testing Checklist

- [ ] Lock screen appears on all protected pages
- [ ] Correct passphrase unlocks successfully
- [ ] Wrong passphrase shows error
- [ ] Navigation works while locked (can access Privacy to unlock)
- [ ] Non-protected pages accessible while locked
- [ ] Lock state persists across page navigation
- [ ] Lock state clears on logout
- [ ] Mobile responsive layout
- [ ] Keyboard accessibility (Enter to submit)
- [ ] Screen reader announces lock status

## Migration Notes

### Existing Users Without Passphrase
- Keys remain unlocked by default
- Can optionally set passphrase via Privacy tab
- Setting passphrase locks keys immediately

### Existing Users With Encrypted Messages
- Can still read old messages if unlocked
- If locked, must unlock to decrypt
- Recovery code can restore access

### New Users
- Keys generated automatically on first encryption action
- No passphrase by default (keys unlocked)
- Encouraged to set passphrase + create backup
