# Email Provider Setup Guide

## Current Provider: Resend

The system currently uses **Resend** for transactional emails. To switch providers, follow these steps:

---

## Option 1: SendGrid (Recommended Alternative)

### 1. Install SendGrid SDK
```bash
npm install @sendgrid/mail
```

### 2. Create SendGrid Account
- Go to [sendgrid.com](https://sendgrid.com)
- Sign up for account
- Verify your domain (`709exclusive.com`)
- Get API key from dashboard

### 3. Update Environment Variables
Add to `.env.local`:
```env
SENDGRID_API_KEY=SG.your-api-key-here
```

### 4. Switch Email Provider
In `lib/email/index.ts`, change:
```typescript
// Comment out Resend
// import { ... } from './resend'

// Uncomment SendGrid
import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded } from './sendgrid'
```

### 5. Update Admin Notifications
SendGrid doesn't have the same admin notification function. You'll need to implement it or use a different approach.

---

## Option 2: Postmark (Best for Transactional)

### 1. Install Postmark SDK
```bash
npm install postmark
```

### 2. Create Postmark Account
- Go to [postmarkapp.com](https://postmarkapp.com)
- Sign up for account
- Verify your domain (`709exclusive.com`)
- Get server API token

### 3. Update Environment Variables
Add to `.env.local`:
```env
POSTMARK_API_KEY=your-server-api-token
```

### 4. Switch Email Provider
In `lib/email/index.ts`, change:
```typescript
// Comment out Resend
// import { ... } from './resend'

// Uncomment Postmark
import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded } from './postmark'
```

---

## Option 3: AWS SES (Most Cost-Effective)

### 1. Install AWS SDK
```bash
npm install @aws-sdk/client-ses
```

### 2. Set Up AWS SES
- Go to AWS Console → SES
- Verify your domain
- Create SMTP credentials or use SDK
- Request production access if needed

### 3. Update Environment Variables
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### 4. Create SES Implementation
Create `lib/email/ses.ts` and implement the email functions using AWS SES SDK.

---

## Option 4: Mailgun

### 1. Install Mailgun SDK
```bash
npm install mailgun.js
```

### 2. Create Mailgun Account
- Go to [mailgun.com](https://mailgun.com)
- Sign up and verify domain
- Get API key and domain

### 3. Update Environment Variables
```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.mailgun.org
```

---

## Testing Email Setup

### 1. Test Individual Functions
Create a test script to verify each email type works:

```typescript
// test-email.ts
import { sendOrderConfirmation } from '@/lib/email'

const testData = {
  orderId: 'TEST-123',
  customerEmail: 'test@709exclusive.com',
  items: [{
    sku: 'TEST-SKU',
    name: 'Test Item',
    size: 'M',
    condition: 'DS',
    quantity: 1,
    price: 10000 // $100.00
  }],
  subtotal: 10000,
  shipping: 1500,
  total: 11500,
  shippingAddress: {
    name: 'Test User',
    line1: '123 Test St',
    city: 'Test City',
    province: 'ON',
    postal_code: 'M5V 1A1',
    country: 'CA'
  }
}

sendOrderConfirmation(testData).then(() => console.log('Email sent!'))
```

### 2. Verify Deliverability
- Check spam folder
- Verify sender reputation
- Monitor bounce rates
- Set up email analytics

---

## Email Best Practices

### 1. Domain Verification
Always verify your sending domain to improve deliverability.

### 2. SPF/DKIM/DMARC
Set up proper email authentication records.

### 3. Monitoring
Monitor bounce rates, open rates, and spam complaints.

### 4. Fallbacks
Consider implementing fallback to a secondary provider if primary fails.

---

## Cost Comparison (Approximate)

| Provider | Free Tier | Paid | Best For |
|----------|-----------|------|----------|
| Resend | 3,000/month | $20/50k | Developers |
| SendGrid | 100/day | $15/50k | General |
| Postmark | 100/month | $10/25k | Transactional |
| AWS SES | 62,000/month | $0.10/1k | High Volume |
| Mailgun | 5,000/month | $15/50k | Developers |

---

## Switching Providers Later

The modular design makes it easy to switch providers:

1. Implement new provider in `lib/email/[provider].ts`
2. Update imports in `lib/email/index.ts`
3. Update environment variables
4. Test thoroughly
5. Deploy

No code changes needed in the webhook or admin routes!