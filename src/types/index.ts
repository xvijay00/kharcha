// ─── Enums / Union Types ────────────────────────────────────────────

export type BusinessType =
  | 'grocery'
  | 'medical'
  | 'hotel'
  | 'restaurant'
  | 'sweet_shop'
  | 'mobile_shop';

export type TransactionType = 'in' | 'out';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank' | 'wallet';

export type MemberRole = 'owner' | 'manager' | 'cashier';

export type PartyType = 'customer' | 'supplier';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export type CategoryType = 'income' | 'expense';

export type BatchStatus = 'in_stock' | 'sold' | 'wasted';

export type OrderStatus = 'open' | 'kot_sent' | 'billed';

// ─── Core Interfaces ────────────────────────────────────────────────

export interface BusinessSettings {
  modules: {
    inventory: boolean;
    weight_billing: boolean;
    wastage: boolean;
    tables: boolean;
    rooms: boolean;
    kot: boolean;
    imei: boolean;
    repair_jobs: boolean;
    batches: boolean;
    schedule_h: boolean;
    salt_composition: boolean;
  };
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  business_type: BusinessType;
  gstin: string | null;
  address: string | null;
  settings: BusinessSettings;
  created_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: MemberRole;
  permissions: Record<string, boolean>;
}

export interface Category {
  id: string;
  business_id: string;
  parent_id: string | null;
  name: string;
  type: CategoryType;
}

export interface Party {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  type: PartyType;
  current_balance: number;
}

export interface Transaction {
  id: string;
  business_id: string;
  type: TransactionType;
  amount: number;
  payment_mode: PaymentMode;
  category_id: string | null;
  party_id: string | null;
  receipt_url: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
  sync_status: SyncStatus;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  hsn_code: string | null;
  gst_rate: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  stock_qty: number;
  min_stock_alert: number;
  track_batches: boolean;
  track_imei: boolean;
  salt_composition: string | null;
  is_schedule_h: boolean;
}

export interface ProductBatchSerial {
  id: string;
  business_id: string;
  product_id: string;
  batch_or_imei: string;
  mfg_date: string | null;
  expiry_date: string | null;
  status: BatchStatus;
}

export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  amount: number;
  gst_rate: number;
}

export interface OrderBooking {
  id: string;
  business_id: string;
  table_or_room_no: string | null;
  customer_name: string | null;
  doctor_name: string | null;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_amount: number;
  created_at: string;
}

// ─── Form Data ──────────────────────────────────────────────────────

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  payment_mode: PaymentMode;
  category_id: string;
  party_id?: string;
  note?: string;
}

export interface BusinessFormData {
  name: string;
  business_type: BusinessType;
  gstin?: string;
  address?: string;
}

// ─── Summaries ──────────────────────────────────────────────────────

export interface CashDrawerSummary {
  opening_balance: number;
  cash_in: number;
  cash_out: number;
  expected_balance: number;
  actual_balance: number | null;
  difference: number | null;
  date: string;
}
