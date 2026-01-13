# 709exclusive
> Production-Grade Resale Commerce Platform

A complete e-commerce solution built with Next.js, Supabase, Stripe, and SendGrid. Features enterprise-grade inventory management, SKU intelligence, order lifecycle management, and Google image import.

## 🚀 Features

- **Complete E-commerce Stack**: User auth, products, cart, checkout, orders
- **Inventory Intelligence**: Real-time stock tracking with oversell protection
- **SKU System**: Deterministic product codes for resale operations
- **Admin Dashboard**: Product management, order fulfillment, analytics
- **Email System**: Professional transactional emails via SendGrid
- **Image Import**: Automated product photography via Google Search
- **Analytics**: Sell-through rates, time-to-sell, inventory insights

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Payments**: Stripe (with webhook handling)
- **Email**: SendGrid (transactional emails)
- **Images**: Google Programmable Search API
- **Database**: PostgreSQL with advanced functions and views

## 📋 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/709exclusive.git
   cd 709exclusive
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Edit with your API keys
   ```

3. **Database Setup**
   ```bash
   # Run the setup helper
   ./setup-db.sh
   
   # Or manually run SQL migrations in Supabase
   # Files: sql/001_init.sql through sql/015_model_images.sql
   ```

4. **Development**
   ```bash
   npm run dev
   ```

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete deployment instructions
- **[Database Schema](sql/)** - All SQL migrations with explanations
- **[API Reference](api/)** - Backend endpoint documentation
- **[Email Setup](EMAIL_SETUP.md)** - SendGrid configuration

## 🎯 Key Features

### Inventory Management
- Atomic inventory locking prevents overselling
- Reserved stock system for pending orders
- Complete audit trails for all changes
- Real-time availability calculations

### SKU Intelligence
- Deterministic SKU generation (BRAND-MODEL-SIZE-CONDITION-HASH)
- Professional resale categorization
- Automated variant management

### Order Lifecycle
- Complete fulfillment workflow
- Shipping integration with tracking
- Customer communication automation
- Admin controls with proper authorization

### Admin Analytics
- Sell-through rate calculations
- Time-to-sell metrics
- Inventory aging reports
- Performance dashboards

## 🔒 Enterprise Security

- Row-level security (RLS) on all database tables
- Server-authoritative validation (no client trust)
- TypeScript for type safety
- Comprehensive error handling
- Production-ready logging

## 🚀 Deployment

Ready for deployment on Vercel, Netlify, or Railway:

```bash
# Vercel (recommended)
npm install -g vercel
vercel --prod

# Set production environment variables
```

## 📞 Support

Built for production resale operations. Includes comprehensive setup guides, testing scripts, and production monitoring.

---

**This is a complete, enterprise-grade commerce platform ready for real business operations.**
# 709exclusive
