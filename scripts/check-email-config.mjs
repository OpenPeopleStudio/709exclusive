#!/usr/bin/env node

/**
 * Email Configuration Checker
 * 
 * This script helps diagnose email configuration issues.
 * Run: node scripts/check-email-config.mjs
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🔍 Checking email configuration...\n')

// Check for .env.local
const envPath = join(rootDir, '.env.local')
if (!existsSync(envPath)) {
  console.log('❌ .env.local file not found!')
  console.log('   Create a .env.local file in the project root\n')
  process.exit(1)
}

console.log('✅ .env.local file found\n')

// Load environment variables
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
  }
})

// Check email providers
console.log('📧 Email Provider Configuration:\n')

let hasEmailProvider = false

// Check Resend
if (envVars.RESEND_API_KEY) {
  console.log('✅ Resend API Key found')
  if (envVars.RESEND_API_KEY.startsWith('re_')) {
    console.log('   Format looks correct (starts with re_)')
  } else {
    console.log('   ⚠️  Warning: Resend keys usually start with "re_"')
  }
  if (envVars.RESEND_FROM_EMAIL) {
    console.log(`   From email: ${envVars.RESEND_FROM_EMAIL}`)
  } else {
    console.log('   ⚠️  RESEND_FROM_EMAIL not set (will use default)')
  }
  hasEmailProvider = true
  console.log()
}

// Check SendGrid
if (envVars.SENDGRID_API_KEY) {
  console.log('✅ SendGrid API Key found')
  if (envVars.SENDGRID_API_KEY.startsWith('SG.')) {
    console.log('   Format looks correct (starts with SG.)')
  } else {
    console.log('   ⚠️  Warning: SendGrid keys usually start with "SG."')
  }
  hasEmailProvider = true
  console.log()
}

// Check Postmark
if (envVars.POSTMARK_API_KEY) {
  console.log('✅ Postmark API Key found')
  hasEmailProvider = true
  console.log()
}

if (!hasEmailProvider) {
  console.log('❌ No email provider configured!')
  console.log('   Add one of the following to .env.local:')
  console.log('   - RESEND_API_KEY=re_xxxxxxxxxxxx')
  console.log('   - SENDGRID_API_KEY=SG.xxxxxxxxxxxx')
  console.log('   - POSTMARK_API_KEY=xxxxxxxxxxxx')
  console.log()
  console.log('   See docs/email-configuration.md for setup instructions\n')
  process.exit(1)
}

// Check Supabase configuration
console.log('🔐 Supabase Configuration:\n')

if (envVars.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('✅ Supabase URL found')
  console.log(`   ${envVars.NEXT_PUBLIC_SUPABASE_URL}`)
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL not found')
}

if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('✅ Supabase Anon Key found')
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found')
}

if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Supabase Service Role Key found')
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found')
  console.log('   Required for inviting users!')
}

console.log()

// Summary
console.log('📋 Summary:\n')
if (hasEmailProvider && envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Configuration looks good!')
  console.log()
  console.log('Next steps:')
  console.log('1. Verify your sender email/domain in your email provider dashboard')
  console.log('2. Configure email provider in Admin → Tenant Settings → Integrations')
  console.log('3. Try inviting a user from Admin → Settings → Users')
  console.log()
  console.log('If you still get errors:')
  console.log('- Check browser console and server logs for detailed error messages')
  console.log('- See docs/email-configuration.md for troubleshooting')
} else {
  console.log('❌ Configuration incomplete')
  console.log('   Review the errors above and see docs/email-configuration.md')
}

console.log()
