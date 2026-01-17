# Logo Upload Feature

## Overview
Tenant admins can now upload custom logos directly through the admin interface, with files stored securely in Supabase Storage.

## Features

### File Upload
- **Drag & drop or click to upload**
- **Supported formats**: PNG, JPG, GIF, SVG, WebP
- **Max file size**: 5MB
- **Storage**: Supabase Storage (`assets` bucket)
- **Path structure**: `tenant-logos/{tenant_id}/{timestamp}.{ext}`

### URL Fallback
- Users can still paste a logo URL directly (e.g., from a CDN)
- Useful for logos hosted elsewhere

### Live Preview
- Shows current logo with preview
- Remove button to clear the logo
- Instant feedback on upload success/failure

## Implementation

### API Endpoint
`/api/admin/upload-logo`
- **POST**: Upload a new logo file
- **DELETE**: Remove an uploaded logo

### Database Migration
`sql/038_tenant_assets_storage.sql` or `supabase/migrations/20260117240000_tenant_assets_storage.sql`

Creates:
- `assets` storage bucket (public, 5MB limit)
- RLS policies for tenant-scoped uploads/deletes

### UI Location
Admin > Tenant Settings > Branding > Logo

### Security
- Only tenant admins (`admin` or `owner` role) can upload
- Files are scoped to tenant ID (isolation)
- Public read access (for displaying logos on storefront)
- File type and size validation

## Setup

### 1. Run the migration
```bash
# For Supabase CLI
npx supabase migration up

# Or manually in Supabase Dashboard
# Run sql/038_tenant_assets_storage.sql
```

### 2. Verify bucket creation
In Supabase Dashboard:
1. Go to Storage
2. Confirm `assets` bucket exists
3. Check policies are active

### 3. Test upload
1. Navigate to `/admin/tenant-settings`
2. Scroll to "Branding" section
3. Click "Upload logo" or drag a file
4. Verify preview appears
5. Save settings

## Usage

### For Developers
```typescript
// Upload logo programmatically
const formData = new FormData()
formData.append('file', file)

const res = await fetch('/api/admin/upload-logo', {
  method: 'POST',
  body: formData,
})

const { url } = await res.json()
```

### For Tenants
1. Go to Admin > Tenant Settings
2. Click "Upload logo" button
3. Select your logo file
4. Preview appears automatically
5. Click "Save settings" to apply

## Recommended Logo Specs
- **Dimensions**: 200x60px (or similar aspect ratio)
- **Format**: PNG with transparency
- **File size**: Under 500KB for fast loading
- **Color mode**: RGB

## Troubleshooting

### Upload fails with 413 error
- File too large (max 5MB)
- Compress your image

### Upload fails with 403 error
- User doesn't have admin role
- Check profile role in database

### Logo doesn't appear
- Check storage bucket is public
- Verify RLS policies are enabled
- Clear browser cache

### Old logo still shows
- Logo URL is cached in settings
- Click "Remove" and re-upload
- Hard refresh the page (Cmd+Shift+R)
