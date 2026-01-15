#!/bin/bash

# 709exclusive Database Setup Script
# Run this after creating your Supabase project

echo "🚀 Setting up 709exclusive database..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

echo "📋 Available SQL migration files:"
ls -1 sql/*.sql

echo ""
echo "⚠️  IMPORTANT: Run these SQL files in your Supabase SQL Editor in this exact order:"
echo ""

files=(
    "001_init.sql"
    "002_rls.sql"
    "003_product_images.sql"
    "004_inventory_locking.sql"
    "005_reserve_inventory.sql"
    "006_finalize_inventory.sql"
    "007_sku_semantics.sql"
    "008_generate_sku.sql"
    "009_inventory_audit.sql"
    "010_admin_adjust_inventory.sql"
    "011_variant_first_sold.sql"
    "012_order_status.sql"
    "013_shipping.sql"
    "014_create_variant_with_sku.sql"
    "024_maintenance_mode.sql"
)

for file in "${files[@]}"; do
    echo "  → sql/$file"
done

echo ""
echo "📝 Copy and paste each file's contents into Supabase SQL Editor"
echo "⏳ Wait for each migration to complete before proceeding"
echo ""
echo "✅ After running all migrations:"
echo "  1. Create 'product-images' storage bucket (public)"
echo "  2. Set up your .env.local file"
echo "  3. Run: npm run dev"
echo ""
echo "🎯 Ready to build a resale empire!"
