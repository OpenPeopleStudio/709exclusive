# Customer Detail Page & External Messaging

## Customer Detail Page

### Overview
Clicking on a customer name in the Customers tab now opens a dedicated customer detail page with comprehensive order management and communication tools.

### Features

#### 1. Customer Profile Header
- **Back button** - Return to customers list
- **Customer name** and join date
- **Quick actions**: Email, Text, Message buttons

#### 2. Stats Dashboard
- **Total Orders** - Lifetime order count
- **Lifetime Value** - Total revenue from customer
- **Messages** - In-app message count

#### 3. Contact Information
- Email address
- Phone number (from order shipping addresses)

#### 4. Order History
- Expandable order cards
- Order status badges (delivered, shipped, processing, etc.)
- Order totals and dates
- **Shipping address** display
- **Tracking information** (carrier + tracking number)
- **Quick actions per order**:
  - Update Tracking
  - Mark as Shipped
  - Mark as Delivered

### Access
```
/admin/customers/[customerId]
```

Example: `/admin/customers/abc123-def456-ghi789`

---

## External Messaging (SMS & Email)

### Overview
Send SMS and Email messages to customers outside of the encrypted in-app messaging system.

### Inbox "New" Dropdown

The "New" button in the inbox header now opens a dropdown with three options:

1. **🔒 Encrypted Message**
   - Secure, end-to-end encrypted in-app messaging
   - Can send to any user (staff, customers, groups)
   - Opens the compose view

2. **📱 Text (SMS)**
   - Send SMS via Twilio
   - Currently: Select a customer first, use profile panel
   - Future: Custom phone number input in compose view

3. **📧 Email**
   - Send email via Resend/SendGrid/Postmark
   - Currently: Select a customer first, use profile panel
   - Future: Custom email address input in compose view

### How to Send SMS/Email

#### Method 1: From Customer Profile Panel (Inbox)
1. Go to `/admin/inbox`
2. Click on a conversation
3. Click the profile/info button
4. Use "Email" or "Text" quick action buttons
5. Fill out the message and send

#### Method 2: From Customer Detail Page
1. Go to `/admin/customers`
2. Click on a customer name
3. Use "Email" or "Text" buttons in header
4. Fill out the message and send

### API Endpoints

#### Send to Any Phone/Email
```typescript
POST /api/admin/send

Body:
{
  "channel": "sms" | "email",
  "to": "phone@example.com" or "+15551234567",
  "subject": "Email Subject" (email only),
  "body": "Message content"
}

Response:
{
  "ok": true,
  "message": "SMS sent" | "Email sent"
}
```

#### Send to Specific Customer
```typescript
POST /api/admin/customers/[customerId]/contact

Body:
{
  "channel": "sms" | "email",
  "subject": "Email Subject" (email only),
  "body": "Message content"
}

// Automatically resolves customer's email/phone
```

### Configuration

#### Required Environment Variables

**For SMS (Twilio):**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567
```

**For Email (Resend):**
```env
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=support@yourdomain.com
```

**Or (SendGrid):**
```env
SENDGRID_API_KEY=your_api_key
```

**Or (Postmark):**
```env
POSTMARK_API_KEY=your_api_key
```

#### Tenant Settings
Set the active provider in your tenant settings:

```sql
UPDATE tenants 
SET settings = jsonb_set(
  jsonb_set(
    settings, 
    '{integrations,email,provider}', 
    '"resend"'
  ),
  '{integrations,sms,provider}', 
  '"twilio"'
)
WHERE id = 'your-tenant-id';
```

### Future Enhancements

#### Custom Recipient Input (Coming Soon)
The compose view will be enhanced to support:
- Custom phone number input for SMS
- Custom email address input for emails
- No need to select an existing customer first

#### Planned Features
- Message templates
- Bulk messaging
- Scheduled sends
- Message history/logs
- Delivery status tracking
- Read receipts (where supported)

---

## File Structure

```
app/
├── admin/
│   ├── customers/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Customer detail page
│   │   └── page.tsx               # Customers list (updated with links)
│   └── inbox/
│       └── page.tsx                # Inbox with new dropdown
└── api/
    └── admin/
        ├── send/
        │   └── route.ts            # Generic send endpoint
        └── customers/
            └── [id]/
                └── contact/
                    └── route.ts    # Customer-specific send

lib/
├── sms.ts                          # Twilio integration
└── email/
    ├── resend.ts                   # Resend integration
    ├── sendgrid.ts                 # SendGrid integration
    └── support.ts                  # Unified email sender
```

---

## Testing

### Test Customer Detail Page
1. Go to `/admin/customers`
2. Click on any customer name
3. Verify:
   - Customer info displays
   - Orders are listed
   - Clicking an order expands details
   - Shipping/tracking info shows (if available)

### Test External Messaging
1. Configure Twilio and Resend credentials
2. Update tenant settings to enable providers
3. Go to inbox, click "New" dropdown
4. Select "Email" or "Text"
5. Follow prompts to send test message

---

## Troubleshooting

### "Email provider is disabled"
- Check tenant settings
- Ensure `email.provider` is set to `"resend"`, `"sendgrid"`, or `"postmark"`
- Verify API keys in environment variables

### "SMS provider is disabled"
- Check tenant settings
- Ensure `sms.provider` is set to `"twilio"`
- Verify Twilio credentials in environment variables

### Customer page shows no orders
- Check if `/api/admin/customers/[id]/profile` endpoint is working
- Verify customer has orders in Stripe
- Check tenant isolation (orders must belong to same tenant)

### Phone number not showing
- Phone numbers are extracted from order shipping addresses
- If no recent orders with shipping address, phone will be null
- Consider adding phone to user profile table
