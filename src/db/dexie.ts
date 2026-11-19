import Dexie, { type Table } from 'dexie';
import type { Transaction, Party, Product } from '../types';

// ─── Offline table interfaces ───

export interface PendingTransaction extends Omit<Transaction, 'sync_status'> {
  localId?: number;
  retries: number;
  sync_status: 'pending' | 'failed';
}

export interface CachedBusiness {
  id: string;
  owner_id: string;
  name: string;
  business_type: string;
}

export interface CachedCategory {
  id: string;
  business_id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
}

export interface CachedParty {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  type: 'customer' | 'supplier';
  current_balance: number;
}

export interface CachedProduct {
  id: string;
  business_id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  selling_price: number;
  stock_qty: number;
  unit: string;
}

// ─── Dexie database ───

class KharchaOfflineDB extends Dexie {
  pendingTransactions!: Table<PendingTransaction, number>;
  cachedBusinesses!: Table<CachedBusiness, string>;
  cachedCategories!: Table<CachedCategory, string>;
  cachedParties!: Table<CachedParty, string>;
  cachedProducts!: Table<CachedProduct, string>;

  constructor() {
    super('KharchaOfflineDB');

    this.version(1).stores({
      pendingTransactions:
        '++localId, id, business_id, type, amount, payment_mode, category_id, party_id, receipt_url, note, created_by, created_at, sync_status, retries',
      cachedBusinesses: 'id, owner_id, name, business_type',
      cachedCategories: 'id, business_id, name, type, parent_id',
    });

    this.version(2).stores({
      cachedParties: 'id, business_id, name, phone, type',
      cachedProducts: 'id, business_id, name, barcode, sku',
    });
  }
}

export const db = new KharchaOfflineDB();
