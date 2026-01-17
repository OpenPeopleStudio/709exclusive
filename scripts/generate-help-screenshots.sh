#!/bin/bash

# Help Screenshot Generation Guide
# This script provides instructions for capturing help system screenshots

cat << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║         Help System Screenshot Generation Guide                ║
╔════════════════════════════════════════════════════════════════╝

This guide helps you capture screenshots for the help documentation.

📋 PREREQUISITES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Browser: Chrome or Firefox
• Resolution: 1920x1080 or higher
• Test data: Use sample products and orders
• Clean state: No personal/customer data visible

📸 SCREENSHOT LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Getting Started (2 screenshots)
  □ dashboard-overview.png      → Admin dashboard main view
  □ sidebar-navigation.png      → Sidebar menu showing all sections

Products (5 screenshots)
  □ products-list.png           → Products list with "+ New Product" button
  □ create-product-form.png     → New product creation form
  □ upload-images.png           → Image upload interface
  □ add-variant.png             → Variant creation form
  □ product-status.png          → Product status dropdown/options

Inventory (3 screenshots)
  □ inventory-overview.png      → Inventory list with stock levels
  □ adjust-inventory-modal.png  → Stock adjustment dialog
  □ csv-import.png              → CSV upload interface

Orders (4 screenshots)
  □ orders-list.png             → Orders list filtered by status
  □ order-detail.png            → Single order detail page
  □ fulfillment-button.png      → Fulfillment action buttons
  □ shipping-label.png          → Shipping/tracking entry form

Messages (3 screenshots)
  □ messages-inbox.png          → Messages inbox list
  □ conversation-view.png       → Single conversation thread
  □ send-message.png            → Message compose interface

Analytics (3 screenshots)
  □ sales-report.png            → Sales dashboard/metrics
  □ generate-report.png         → Report generation form
  □ export-report.png           → Export options dialog

Settings (5 screenshots)
  □ tenant-settings.png         → Tenant settings overview
  □ logo-upload.png             → Logo upload interface
  □ theme-colors.png            → Color customization
  □ feature-flags.png           → Feature toggle switches
  □ encryption-settings.png     → E2E encryption setup

Troubleshooting (3 screenshots)
  □ product-not-showing.png     → Product visibility issue example
  □ order-stuck-pending.png     → Pending order status
  □ stock-not-updating.png      → Stock adjustment issue

📝 CAPTURE INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Start Development Server
   npm run dev

2. Login as Admin
   Navigate to /admin and authenticate

3. For Each Screenshot:
   
   a) Navigate to the relevant page
   b) Add sample data if needed
   c) Clean up the view (close notifications, etc.)
   d) Take screenshot (keyboard shortcuts):
      • macOS: Cmd+Shift+4 (selection)
      • Windows: Win+Shift+S
      • Linux: Flameshot
   
   e) Crop to relevant area (remove browser chrome if possible)
   f) Optimize file size:
      • Use TinyPNG.com OR
      • ImageOptim (macOS) OR
      • Squoosh.app (web-based)
   
   g) Save to correct folder:
      public/help/[category]/[filename].png

4. Verify Screenshot
   • File size < 500KB
   • Clear and readable
   • No personal data
   • Correct filename
   • Saved in correct folder

🎨 ANNOTATION (Optional but Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add helpful annotations:
  • Red arrows pointing to important buttons
  • Red boxes highlighting key areas
  • Numbers for step sequences
  
Tools:
  • macOS: Preview (Tools → Annotate)
  • Windows: Paint 3D, Snip & Sketch
  • Cross-platform: GIMP, Photopea (web)

Example annotations:
  1. → Arrow to "+ New Product" button
  2. → Box around form fields
  3. → Number sequence for multi-step processes

🔄 AFTER CAPTURING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Verify screenshots appear in help modal
   • Click Help (?) button in admin
   • Navigate to relevant article
   • Confirm images load

2. Check mobile responsiveness
   • Resize browser to mobile width
   • Verify images scale properly

3. Optimize if needed
   • If image > 500KB, compress more
   • If blurry, retake at higher resolution

📦 SAMPLE DATA SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use these for consistency:

Products:
  • Names: "Sample Sneaker", "Test Product"
  • Brands: "Nike", "Adidas", "Jordan"
  • Prices: $100, $150, $200
  • SKUs: "TEST-001", "SAMPLE-AJ1-10"

Orders:
  • Customer: "test@example.com"
  • Order IDs: #1001, #1002, #1003
  • Amounts: Round numbers

Messages:
  • Customer: "customer@example.com"
  • Content: "Sample message about order"

✅ QUICK START COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Start dev server
npm run dev

# Open admin (after logging in)
open http://localhost:3000/admin

# Take all screenshots, then:
# Optimize all PNGs in help directory
find public/help -name "*.png" -type f

# Check file sizes
find public/help -name "*.png" -exec ls -lh {} \; | awk '{print $5, $9}'

# Build and test
npm run build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 NOTES
• Screenshots show the actual UI, making help more intuitive
• Use real UI states (not mockups) for accuracy
• Update screenshots when UI changes significantly
• Consider adding GIFs for multi-step processes (future)

EOF
