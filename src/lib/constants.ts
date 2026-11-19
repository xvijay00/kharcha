import type { BusinessType, PaymentMode, TransactionType } from '@/types';

// ─── Business Types ─────────────────────────────────────────────────

export const BUSINESS_TYPES: {
  value: BusinessType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: 'grocery',
    label: 'Grocery',
    icon: 'ShoppingCart',
    description: 'General/Kirana store',
  },
  {
    value: 'medical',
    label: 'Medical',
    icon: 'Pill',
    description: 'Chemist, pharmacy',
  },
  {
    value: 'hotel',
    label: 'Hotel',
    icon: 'Hotel',
    description: 'Hotels, lodges',
  },
  {
    value: 'restaurant',
    label: 'Restaurant',
    icon: 'UtensilsCrossed',
    description: 'Restaurants, cafes',
  },
  {
    value: 'sweet_shop',
    label: 'Sweet Shop',
    icon: 'Cake',
    description: 'Mithai, bakery',
  },
  {
    value: 'mobile_shop',
    label: 'Mobile Shop',
    icon: 'Smartphone',
    description: 'Mobile sales & repair',
  },
];

// ─── Payment Modes ──────────────────────────────────────────────────

export const PAYMENT_MODES: {
  value: PaymentMode;
  label: string;
  icon: string;
}[] = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'upi', label: 'UPI', icon: 'Smartphone' },
  { value: 'card', label: 'Card', icon: 'CreditCard' },
  { value: 'bank', label: 'Bank', icon: 'Building2' },
  { value: 'wallet', label: 'Wallet', icon: 'Wallet' },
];

// ─── Transaction Types ──────────────────────────────────────────────

export const TRANSACTION_TYPES: {
  value: TransactionType;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'in',
    label: 'Cash In',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    value: 'out',
    label: 'Cash Out',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];
