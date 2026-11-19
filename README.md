# Kharcha (खर्चा) — Smart Multi-Business Manager & POS

A production-ready, mobile-first Progressive Web App (PWA) built for Indian micro, small & medium enterprises (MSMEs) to manage daily income/expenses, Khata (credit ledger), multi-branch retail & pharmacy inventory, and POS billing.

## 🚀 Key Features

- **Multi-Business & Multi-Branch**: Manage multiple shops (Grocery, Medical / Chemist, Hotel, Restaurant / Dhaba, Sweet Shop / Bakery, Mobile Sales & Repair) under one account.
- **Offline-First with Dexie.js**: Seamless operations during internet outages; automatic background sync when connectivity resumes.
- **Khata / Credit Ledger**: Customer & supplier Udhaar-Jama tracking, running balances, and 1-click formatted WhatsApp payment reminders.
- **Trade-Specific Inventory**:
  - Medical: Drug salt composition, Schedule H prescription alerts, Batch & Expiry tracking.
  - Mobile Shop: 15-digit IMEI & serial number tracking.
  - Grocery & Sweets: Weight units (`kg`, `g`, `ltr`) and Spoilage / Wastage recording.
- **POS & Billing**:
  - Counter billing with real-time GST (CGST/SGST/IGST).
  - Restaurant & Hotel table/room order management with KOT (Kitchen Order Ticket).
  - Printable thermal (58mm/80mm) and A4 GST invoice receipts.
- **Daily Cash Drawer ("Galla") Reconciliation**: Day-end cash drawer closure matching physical cash count against expected book balance (Over / Short balance detection).
- **Reports & Analytics**: Daily/Weekly/Monthly Profit & Loss (P&L) statements, category expense distributions, and 1-click CSV export for CA accounting.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **PWA & Offline Storage**: `vite-plugin-pwa`, `Dexie.js` (IndexedDB)
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Supabase Auth)

## 📦 Setup Instructions

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/xvijay00/kharcha.git
cd kharcha
npm install
```

### 2. Configure Supabase Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Supabase Project URL and Anon Public Key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply PostgreSQL Database Migration
Open your Supabase project's **SQL Editor** and run the contents of `supabase/migrations/00001_initial_schema.sql`.

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Build for Production
```bash
npm run build
```

## 📄 License
MIT
