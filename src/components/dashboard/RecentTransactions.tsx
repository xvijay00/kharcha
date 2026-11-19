import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Banknote, Smartphone, CreditCard, Building2, Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency, formatTime } from '../../lib/utils';
import type { PaymentMode } from '../../types';

const PAYMENT_ICON_MAP: Record<PaymentMode, React.FC<{ className?: string }>> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank: Building2,
  wallet: Wallet,
};

export function RecentTransactions() {
  const { transactions, loading } = useTransactions();
  const { categories } = useCategories();

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const recent = transactions.slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900 text-base">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="w-24 h-4 bg-gray-100 rounded" />
                  <div className="w-16 h-3 bg-gray-50 rounded" />
                </div>
              </div>
              <div className="w-16 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-gray-700">No transactions recorded yet</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Record your first cash in or expense out</p>
          <Link
            to="/transactions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {recent.map((tx) => {
            const isIncome = tx.type === 'in';
            const catName = (tx.category_id && categoryMap.get(tx.category_id)) || (isIncome ? 'Income' : 'Expense');
            const PaymentIcon = PAYMENT_ICON_MAP[tx.payment_mode] || Banknote;

            return (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-gray-900">{catName}</p>
                      {tx.sync_status === 'pending' && (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-800 rounded">
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <PaymentIcon className="w-3 h-3 text-gray-400" />
                        <span className="capitalize">{tx.payment_mode}</span>
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="max-w-[120px] truncate text-gray-500">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-bold text-sm tracking-tight ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(tx.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
