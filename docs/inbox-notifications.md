## Inbox: email + SMS notifications

The admin inbox (`/admin/inbox`) supports sending **external** notifications to a customer:

- **Email**: uses the tenant’s configured email provider
- **SMS**: uses the tenant’s configured SMS provider

These are meant for “out-of-band” messages (e.g. “we tried reaching you”, “your order is ready”, etc.).

### UI

Open a customer conversation → open **Profile** → use **Email** or **Text**.

### API

`POST /api/admin/customers/:id/contact`

Body:

```json
{
  "channel": "email",
  "to": "customer@example.com",
  "subject": "Quick update from support",
  "body": "Your order is ready for pickup."
}
```

For `channel: "sms"`, `subject` is ignored.

### Tenant settings

The provider is resolved from `tenant.settings.integrations`:

```json
{
  "integrations": {
    "email": { "provider": "resend" },
    "sms": { "provider": "twilio" }
  }
}
```

If SMS provider is unset, it defaults to **disabled**.

### Required environment variables

- **Email (Resend)**:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` (or set `SUPPORT_FROM_EMAIL`)
- **SMS (Twilio)**:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
- **Optional**: `SUPPORT_FROM_EMAIL` (defaults to `support@709exclusive.com`)

