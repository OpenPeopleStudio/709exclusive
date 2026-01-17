# Key Verification System

## Overview

The key verification system allows users to confirm that they're communicating with the right person and that their end-to-end encrypted messages haven't been intercepted. It combines cryptographic fingerprints with user-friendly QR codes and persistent verification storage.

## How It Works

### 1. **Fingerprint Generation**

Every user's encryption key generates a unique cryptographic fingerprint:

- **Short Fingerprint**: A 16-character code (e.g., `A7B2-9F3E-K8L4-P1Q6`)
  - Easy to read aloud over phone/video
  - Displayed in QR codes for scanning
  
- **Full Fingerprint**: A complete SHA-256 hash
  - More secure for critical verifications
  - Can be copied and shared via secure channels

### 2. **QR Code Sharing**

Each user has a personal QR code containing:
```json
{
  "type": "709e2e",
  "version": 1,
  "publicKey": "...",
  "fingerprint": "A7B2-9F3E-K8L4-P1Q6"
}
```

**Benefits:**
- Quick verification in person
- No typing errors
- Instant confirmation

### 3. **Verification Methods**

#### Method A: QR Code Scan (Recommended)
1. Person A opens Key Verification → "My Key" tab
2. Person B opens Key Verification → "Scan QR" tab
3. Person B scans Person A's QR code with camera
4. System automatically:
   - Extracts public key and fingerprint
   - Looks up Person A in the database
   - Stores verification in `709_verified_contacts`
   - Shows success confirmation

#### Method B: Manual Verification
1. Both people open their verification screens
2. Compare fingerprints via trusted channel:
   - In person (most secure)
   - Video call (very secure)
   - Phone call (secure)
   - Encrypted chat on another platform (less secure)
3. If fingerprints match, click "Mark as Verified"
4. Verification is saved to database

#### Method C: Cross-Device Verification
1. User logs in on new device
2. Creates backup/recovery on old device
3. Restores backup on new device
4. Both devices now have same keys
5. Fingerprints match across devices

### 4. **Verification Storage**

Verified contacts are stored in the `709_verified_contacts` table:

| Field | Description |
|-------|-------------|
| `user_id` | Who performed the verification |
| `verified_user_id` | Who was verified |
| `verified_public_key` | Their public key at time of verification |
| `verified_fingerprint` | Full fingerprint (for re-verification) |
| `verified_short_fingerprint` | Short fingerprint (display) |
| `verified_at` | Timestamp of verification |
| `verified_method` | How verified: `qr_scan`, `manual`, `in_person` |
| `notes` | Optional notes about verification |

**Key Features:**
- Syncs across user's devices (tied to user account)
- Persists through key rotations (old verification stays)
- Can be reset if suspicious activity detected
- RLS policies ensure users only see their own verifications

### 5. **Security Properties**

✅ **What Verification Guarantees:**
- The public key matches the person you verified with
- Messages encrypted to this key can only be read by them
- No man-in-the-middle attack has replaced their key

❌ **What Verification Doesn't Guarantee:**
- Their device hasn't been compromised after verification
- They haven't shared their private key
- Their account credentials are secure

### 6. **When to Re-Verify**

You should verify again if:
- A contact rotates their encryption keys
- You suspect a security breach
- A contact logs in from a suspicious location
- A contact's fingerprint changes (shows as "unverified" again)

## Technical Implementation

### Database Schema

```sql
CREATE TABLE "709_verified_contacts" (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  verified_user_id uuid REFERENCES auth.users(id),
  verified_public_key text,
  verified_fingerprint text,
  verified_short_fingerprint text,
  verified_at timestamp,
  verified_method text,
  notes text,
  UNIQUE(user_id, verified_user_id)
);
```

### API Integration

The `KeyVerification` component automatically:
1. Queries `709_profiles` to find users by public key
2. Inserts/updates `709_verified_contacts` on verification
3. Checks verification status when loading conversations
4. Shows verified badge in message UI

### Frontend Components

**KeyVerification Modal** (`components/KeyVerification.tsx`)
- 3 tabs: "My Key", "Scan QR", "Verify [Name]"
- QR code generation with `qrcode.react`
- QR code scanning with `html5-qrcode`
- Direct database integration for storing verifications

### Encryption Hook Integration

The `useE2EEncryption` hook provides:
- `fingerprint`: Full SHA-256 fingerprint
- `shortFingerprint`: Short 16-char code
- `verifyUserKey()`: Fetch another user's fingerprint
- `getVerificationData()`: Generate QR code data

## User Workflows

### First-Time Setup
1. Enable encryption in Privacy settings
2. Generate recovery backup
3. Verify with at least one teammate
4. Mark verification date for auditing

### Daily Use
1. Send/receive encrypted messages
2. See verification badges in inbox
3. Click to view/update verification status

### Key Rotation
1. Click "Rotate Keys" in Privacy tab
2. All verifications remain (tied to user ID, not key)
3. Contacts see "Re-verify needed" badge
4. Re-verify using any method above

### New Device Setup
1. Generate new keys OR restore from backup
2. If restoring: Fingerprints match automatically
3. If new keys: Re-verify with all contacts
4. Old device can verify new device's fingerprint

## Security Best Practices

### For Users
1. **Always verify in person or video** for sensitive contacts
2. **Check fingerprints regularly** (monthly for critical contacts)
3. **Never share fingerprints over unsecured channels** (SMS, email)
4. **Rotate keys annually** or after suspected compromise
5. **Keep backup recovery codes secure** (offline, encrypted storage)

### For Admins
1. **Enforce verification policies** for internal team
2. **Monitor verification rates** (low rate = low trust)
3. **Audit verification methods** (prefer `qr_scan` and `in_person`)
4. **Track key rotation frequency** (store in localStorage + logs)
5. **Provide verification training** to team members

## Comparison with Other Systems

### Signal
- **Similarity**: Safety numbers (fingerprints)
- **Difference**: Signal uses phone numbers; we use email/user IDs
- **Advantage**: We have QR scanning built-in

### WhatsApp
- **Similarity**: QR code verification
- **Difference**: WhatsApp doesn't persist verification status
- **Advantage**: We store verification in database (cross-device sync)

### PGP/GPG
- **Similarity**: Key fingerprints and web-of-trust
- **Difference**: PGP requires manual key management
- **Advantage**: We auto-sync public keys via database

## Troubleshooting

### "Could not access camera"
- Check browser permissions (Settings → Privacy → Camera)
- Try different browser (Chrome/Safari/Firefox)
- Ensure HTTPS connection (required for camera access)

### "Could not find user with this public key"
- Their encryption may not be initialized yet
- Ask them to open Privacy tab and enable encryption
- Refresh and try again

### "Verification failed"
- Fingerprints don't match (possible MITM attack!)
- Verify through alternate channel (phone call)
- Consider key rotation if suspicious

### QR code won't scan
- Increase screen brightness
- Hold camera 6-12 inches away
- Ensure good lighting
- Try manual fingerprint comparison instead

## Future Enhancements

Potential additions:
- [ ] Verification expiry (require re-verification after 6 months)
- [ ] Verification notifications (alert when contact rotates keys)
- [ ] Group verification (verify all team members at once)
- [ ] Verification export (share verification status between orgs)
- [ ] Trust score (based on verification method + recency)
