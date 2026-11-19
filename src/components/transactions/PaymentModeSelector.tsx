import React from 'react';
import { PAYMENT_MODES } from '../../lib/constants';
import { Banknote, Smartphone, CreditCard, Building2, Wallet } from 'lucide-react';
import type { PaymentMode } from '../../types';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
};

interface PaymentModeSelectorProps {
  selected: PaymentMode;
  onChange: (mode: PaymentMode) => void;
}

export function PaymentModeSelector({ selected, onChange }: PaymentModeSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Payment Mode
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PAYMENT_MODES.map((pm) => {
          const IconComp = ICON_MAP[pm.icon] || Banknote;
          const isSelected = selected === pm.value;
          return (
            <button
              key={pm.value}
              type="button"
              onClick={() => onChange(pm.value as PaymentMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
              <span>{pm.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
