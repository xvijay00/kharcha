import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../ui/Toast';
import { formatCurrency, formatTime, formatDate, startOfDay, endOfDay } from '../../lib/utils';
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Trash2,
  FileText,
} from 'lucide-react';
import type { PaymentMode } from '../../types';

type DateFilter = 'today' | 'week' | 'month' | 'all';

const PAYMENT_ICON_MAP: Record<PaymentMode, React.FC<{ className?: string }>> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank: Building2,
  wallet: Wallet,
};

export function TransactionList() {
  const [filter, setFilter] = useState<DateFilter>('today');
  const [search, setSearch] = useState<string>('');
  const { toast } = useToast();
  const { categories } = useCategories();

  // Compute date range according to selected filter
  const dateRange = useMemo(() => {
    if (filter === 'all') return undefined;

    const end = endOfDay();
    if (filter === 'today') {
      return { start: startOfDay(), end };
    }
    if (filter === 'week') {
      const start = startOfDay();
      start.setDate(start.getDate() - 6);
      return { start, end };
    }
    if (filter === 'month') {
      const start = new Date();
      start.setDate(1);
      return { start: startOfDay(start), end };
    }
    return undefined;
  }, [filter]);

  const { transactions, loading, deleteTransaction } = useTransactions(dateRange);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // Client-side search filtering
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const cat = (tx.category_id && categoryMap.get(tx.category_id)) || '';
      return (
        cat.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        tx.payment_mode.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q)
      );
    });
  }, [transactions, search, categoryMap]);

  // Aggregate totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'in') income += amt;
      else expense += amt;
    }
    return { income, expense, balance: income - expense };
  }, [filtered]);

  // Group by date string
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const tx of filtered) {
      const dateKey = formatDate(tx.created_at);
      const list = map.get(dateKey) || [];
      list.push(tx);
      map.set(dateKey, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction entry?')) {
      try {
        await deleteTransaction(id);
        toast.success('Transaction deleted');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Delete failed';
        toast.error(msg);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-xs text-gray-500">Day-book & Cash flow records</p>
        </div>
        <Link
          to="/transactions/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </Link>
      </div>

      {/* Date Filter Tabs */}
      <div className="grid grid-cols-4 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
        {(['today', 'week', 'month', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`py-2 rounded-lg capitalize transition-all ${
              filter === tab
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab === 'week' ? '7 Days' : tab === 'month' ? 'This Month' : tab}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by note, category, or amount..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
      </div>

      {/* Period Summary Banner */}
      <div className="grid grid-cols-3 gap-2 bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total In</p>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(totals.income)}</p>
        </div>
        <div className="border-x border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Out</p>
          <p className="text-sm font-bold text-rose-600 mt-0.5">{formatCurrency(totals.expense)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Net Flow</p>
          <p
            className={`text-sm font-bold mt-0.5 ${
              totals.balance >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(totals.balance)}
          </p>
        </div>
      </div>

      {/* Transaction List Grouped by Date */}
      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-gray-100 h-16" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">No transactions found</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">
            {search ? 'Try clearing your search query' : 'Record your first transaction for this period'}
          </p>
          <Link
            to="/transactions/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateTitle, items]) => (
            <div key={dateTitle} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {dateTitle}
                </span>
                <span className="text-[11px] text-gray-400">({items.length} entries)</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {items.map((tx) => {
                  const isIncome = tx.type === 'in';
                  const catName =
                    (tx.category_id && categoryMap.get(tx.category_id)) || (isIncome ? 'Income' : 'Expense');
                  const PaymentIcon = PAYMENT_ICON_MAP[tx.payment_mode] || Banknote;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
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
                            <span className="font-bold text-sm text-gray-900">{catName}</span>
                            {tx.sync_status === 'pending' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-800 rounded">
                                Offline
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <PaymentIcon className="w-3 h-3 text-gray-400" />
                              <span className="capitalize">{tx.payment_mode}</span>
                            </span>
                            <span>•</span>
                            <span>{formatTime(tx.created_at)}</span>
                            {tx.note && (
                              <>
                                <span>•</span>
                                <span className="max-w-[130px] truncate text-gray-600">{tx.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`font-extrabold text-sm ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
