# Email Configuration Guide

This guide explains how to configure email services for sending invite emails and order notifications.

## Issue: "Error sending invite email"

This error occurs when the email service is not properly configured. User invites require a working email provider to send invitation links.

## Email Provider Options

Your application supports three email providers:

### 1. Resend (Recommended)
- Modern, developer-friendly API
- Easy setup and good deliverability
- **Setup:**
  1. Sign up at https://resend.com
  2. Create an API key
  3. Add to `.env.local`:
     ```
     RESEND_API_KEY=re_your_api_key_here
     RESEND_FROM_EMAIL=noreply@yourdomain.com
     ```
  4. Verify your domain in Resend dashboard
  5. Configure in Admin → Tenant Settings → Integrations → Email Provider: "Resend"

### 2. SendGrid
- Popular email service with free tier
- **Setup:**
  1. Sign up at https://sendgrid.com
  2. Create an API key with "Mail Send" permissions
  3. Add to `.env.local`:
     ```
     SENDGRID_API_KEY=SG.your_api_key_here
     ```
  4. Verify sender identity (email or domain) in SendGrid
  5. Configure in Admin → Tenant Settings → Integrations → Email Provider: "SendGrid"

### 3. Postmark
- Transactional email specialist
- **Setup:**
  1. Sign up at https://postmarkapp.com
  2. Create a server and get API token
  3. Add to `.env.local`:
     ```
     POSTMARK_API_KEY=your_postmark_token_here
     ```
  4. Verify your sender signature
  5. Configure in Admin → Tenant Settings → Integrations → Email Provider: "Postmark"

## Configuration Steps

### Step 1: Choose and Configure Provider
1. Select one email provider from the options above
2. Add the required environment variables to `.env.local`
3. Restart your development server: `npm run dev`

### Step 2: Verify Domain/Email
All email providers require you to verify your sending domain or email address to prevent spam:
- **For development:** Verify a single email address (e.g., `noreply@yourdomain.com`)
- **For production:** Verify your entire domain for better deliverability

### Step 3: Update Tenant Settings
1. Go to Admin → Tenant Settings → Integrations tab
2. Select your email provider from the dropdown
3. Click "Save Changes"

### Step 4: Test Invite Flow
1. Go to Admin → Settings → Users & Roles tab
2. Click "Invite User"
3. Enter an email and role
4. Click "Send Invite"
5. Check for detailed error messages if it fails

## Common Issues

### "Email provider is disabled"
**Solution:** Configure an email provider in Tenant Settings → Integrations → Email Provider

### "API key not configured"
**Solution:** Add the API key to your `.env.local` file and restart the server

### "Sender verification required"
**Solution:** Verify your sender email or domain in your email provider's dashboard

### "Error 401: Unauthorized"
**Solution:** Double-check your API key is correct and has the right permissions

### "Error 403: Forbidden"
**Solution:** Your sender email may not be verified. Check your email provider's dashboard

## Fallback Behavior

The invite flow uses this fallback chain:

1. **First attempt:** Supabase Auth sends the invite email (requires Supabase SMTP configuration)
2. **Fallback:** If Supabase fails, your configured email provider sends the email
3. **Error:** If both fail, you'll see a detailed error message

## Supabase Email Configuration (Optional)

If you want Supabase to handle invite emails directly:

1. Go to your Supabase project dashboard
2. Navigate to Project Settings → Auth
3. Configure SMTP settings with your email provider
4. Update email templates if desired

**Note:** Even without Supabase SMTP, invites will work via the fallback mechanism.

## Environment Variables Reference

```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Postmark
POSTMARK_API_KEY=xxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing Email Configuration

To test if your email configuration is working:

```bash
# 1. Check environment variables are loaded
node -e "console.log(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.POSTMARK_API_KEY || 'No email API key found')"

# 2. Try sending an invite through the UI
# - Go to Admin → Settings → Users
# - Click "Invite User"
# - Watch browser console and terminal for detailed error messages
```

## Need Help?

If you're still having issues:
1. Check the browser console for client-side errors
2. Check your terminal/server logs for detailed error messages
3. Verify your email provider dashboard for bounces or sending issues
4. Make sure your `.env.local` file is in the project root
5. Restart your development server after changing environment variables
