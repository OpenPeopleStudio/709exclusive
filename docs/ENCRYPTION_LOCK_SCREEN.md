# Encryption Lock Screen - Access Control

## Overview

When encryption is locked (passphrase-protected), access to sensitive data is restricted. Users must unlock their encryption keys before viewing encrypted messages, customer profiles, and other protected information.

## What's Protected When Locked

### 1. **Encrypted Messages**
- All E2E encrypted customer messages
- Internal team communications
- Message attachments (files, images)
- Location data shared in messages

### 2. **Customer Profiles** (Future Enhancement)
- Contact information
- Order history
- Activity timeline
- Personal notes

### 3. **Sensitive Data Access** (Future Enhancement)
- Payment information
- Customer addresses
- Phone numbers
- Email addresses

## User Experience

### Lock Screen UI

**Components:**
- Large lock icon with warning color
- Clear heading: "Encryption Locked"
- Explanation text about passphrase protection
- Password input field
- "Unlock Encryption" button
- List of what's protected
- Security tip about recovery codes

**Design:**
- Centered modal-style layout
- Non-intrusive but clear messaging
- Responsive on mobile and desktop
- Consistent with app theme

### Pages with Lock Screen

1. **Admin Inbox** (`/admin/inbox`)
   - Replaces entire inbox view
   - Shows lock screen instead of conversations
   - After unlock, seamlessly loads inbox

2. **Customer Messages** (`/account/messages`)
   - Replaces message thread
   - Maintains header and navigation
   - Shows lock screen in main content area

3. **Future: Customer Profiles, Orders, Analytics**

## Implementation Details

### Component: `EncryptionLockScreen`

**Props:**
```typescript
interface EncryptionLockScreenProps {
  onUnlock: (password: string) => Promise<void>
  error?: string | null
}
```

**Features:**
- Password input with autoFocus
- Loading state during unlock
- Error display (wrong password, etc.)
- Enter key support for quick unlock
- Disable button during unlock attempt

### Integration Pattern

```typescript
// In page component
const { isLocked, unlockKeys, error } = useE2EEncryption(userId)

// Before main content render
if (isLocked) {
  return (
    <div>
      <Header />
      <EncryptionLockScreen
        onUnlock={unlockKeys}
        error={error}
      />
      <Footer />
    </div>
  )
}

// Normal content here
return <MainContent />
```

### State Management

**Encryption Hook Provides:**
- `isLocked`: Boolean indicating lock status
- `unlockKeys(password)`: Async function to unlock
- `lockKeys(password)`: Async function to lock
- `error`: Any encryption-related errors

**Lock State Persistence:**
- Keys stored in IndexedDB
- Private key encrypted with passphrase
- Encrypted key + IV + salt stored
- On unlock: decrypt private key in memory
- On lock: clear private key from memory

## Security Benefits

### 1. **Zero-Knowledge Protection**
- Even if device is stolen, keys remain encrypted
- Passphrase never leaves the device
- Server never sees unencrypted private keys

### 2. **Shared Device Safety**
- Lock encryption when stepping away
- Co-workers can't read encrypted messages
- Protected from shoulder surfing

### 3. **Compliance**
- GDPR: Encryption at rest requirement
- HIPAA: Protected health information (if applicable)
- PCI-DSS: Sensitive authentication data

### 4. **Defense in Depth**
- Layer 1: Browser session authentication
- Layer 2: Encryption key passphrase
- Layer 3: E2E encryption itself

## User Workflows

### First-Time Setup
1. Enable encryption in Privacy settings
2. Generate keys (automatically)
3. Set passphrase via Lock action
4. Keys now encrypted at rest

### Daily Use - Auto-Lock
1. User opens inbox (keys unlocked)
2. User leaves computer for meeting
3. Admin can manually lock via Privacy tab
4. Next access requires passphrase

### Daily Use - After Restart
1. User closes browser/restarts computer
2. Private keys remain in IndexedDB (encrypted)
3. On next visit, keys auto-unlock if no passphrase
4. If passphrase set, lock screen appears

### Unlock Flow
1. User sees lock screen
2. Enters passphrase
3. System attempts decrypt with PBKDF2
4. If correct: private key loaded into memory
5. If wrong: error shown, try again
6. Page seamlessly transitions to content

### Recovery Flow
1. User forgets passphrase
2. Uses recovery code (from backup)
3. Restores keys from encrypted backup
4. Optionally sets new passphrase

## Auto-Lock Policies (Future Enhancement)

### Time-Based Auto-Lock
```javascript
// Lock after 30 minutes of inactivity
const AUTO_LOCK_TIMEOUT = 30 * 60 * 1000

// Lock when browser tab inactive for 5 minutes
const IDLE_LOCK_TIMEOUT = 5 * 60 * 1000
```

### Event-Based Auto-Lock
- Lock on browser close (clear memory)
- Lock on session end
- Lock when switching tenant accounts
- Lock on explicit user action

## Admin Configuration (Future)

Admins could enforce lock policies:
```typescript
{
  "encryptionLockPolicy": {
    "requirePassphrase": true,  // Force all users to set passphrase
    "autoLockAfterMinutes": 30, // Auto-lock after inactivity
    "lockOnTabHide": true,      // Lock when switching tabs
    "maxUnlockAttempts": 5      // Lock out after failed attempts
  }
}
```

## Privacy Considerations

### What's Still Visible When Locked
- Navigation menu
- Page structure
- Non-encrypted content (product catalog, public pages)
- User's own profile name/email

### What's Hidden
- Encrypted message content
- Customer personal information
- Sensitive business data
- Encryption keys and fingerprints

### Metadata Leakage Prevention
- Don't show message count when locked
- Don't show "last message from X" previews
- Don't show customer names in conversation list
- Generic placeholder: "Unlock to view messages"

## Testing Checklist

- [ ] Lock screen appears when `isLocked === true`
- [ ] Correct passphrase unlocks successfully
- [ ] Wrong passphrase shows error message
- [ ] Enter key submits unlock form
- [ ] Loading state displays during unlock
- [ ] After unlock, content loads properly
- [ ] Error state clears after successful unlock
- [ ] Mobile responsive layout works
- [ ] Screen reader accessible
- [ ] Focus management (autoFocus on input)

## Future Enhancements

### Biometric Unlock
- Touch ID / Face ID support
- WebAuthn integration
- Fallback to passphrase

### Session Management
- "Remember for 24 hours" checkbox
- Device fingerprinting for trusted devices
- Revoke trusted devices remotely

### Enhanced Lock Screen
- Show unread count (non-encrypted metadata only)
- Quick actions: Lock other devices, View security logs
- Educational tips about encryption

### Audit Logging
- Log unlock attempts (timestamp, success/fail)
- Log lock events (manual, auto, timeout)
- Admin dashboard for security monitoring
