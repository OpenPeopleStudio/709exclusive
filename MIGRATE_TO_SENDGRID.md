# Quick Migration: Resend → SendGrid

## Why Switch?
- **Better Deliverability**: SendGrid has excellent sender reputation
- **More Features**: Advanced analytics, templates, IP warming
- **Enterprise Ready**: Used by millions of businesses
- **Cost Effective**: Competitive pricing for transactional email

## Step-by-Step Migration

### 1. Create SendGrid Account (5 minutes)
```bash
# Go to: https://sendgrid.com
# Sign up → Verify email → Create API key
```

### 2. Update Environment Variables
In `.env.local`, replace:
```env
# Remove this:
RESEND_API_KEY=re_...

# Add this:
SENDGRID_API_KEY=SG.your-api-key-here
```

### 3. Switch Email Provider (1 minute)
In `lib/email/index.ts`, change:
```typescript
// Comment out Resend imports:
// import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded, sendAdminOrderNotification } from './resend'

// Uncomment SendGrid imports:
import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded } from './sendgrid'
// Note: SendGrid doesn't have admin notifications built-in, you'll need to implement separately
```

### 4. Update Sender Email (Important!)
In SendGrid dashboard:
- Go to **Settings** → **Sender Authentication**
- Verify your domain (`709exclusive.com`)
- Add sender: `orders@709exclusive.com`

Update `lib/email/sendgrid.ts` if needed.

### 5. Test (2 minutes)
```typescript
// Run your app and place a test order
npm run dev
# Complete checkout flow
# Check email arrives
```

### 6. Monitor Deliverability
- Check SendGrid dashboard for delivery stats
- Monitor bounce rates (< 2% is good)
- Set up alerts for issues

## SendGrid Benefits vs Resend

| Feature | Resend | SendGrid |
|---------|--------|----------|
| Free Tier | 3,000/month | 100/day |
| Paid | $20/50k | $15/50k |
| Templates | Basic | Advanced |
| Analytics | Good | Excellent |
| IP Warming | Manual | Automatic |
| Support | Good | Enterprise |

## Rollback (If Needed)

To switch back to Resend:

1. Comment out SendGrid imports in `lib/email/index.ts`
2. Uncomment Resend imports
3. Update `.env.local` with Resend key
4. Test again

## SendGrid Tips

### 1. IP Warming
SendGrid automatically warms up your IP. Don't send large volumes immediately.

### 2. Domain Authentication
**Critical**: Authenticate your domain to avoid spam folders.

### 3. Monitoring
Set up webhooks for bounce, spam, unsubscribe events.

### 4. Templates
Consider using SendGrid's dynamic templates for more professional emails.

---

**Ready to migrate?** SendGrid is a solid choice for growing e-commerce businesses! 🚀