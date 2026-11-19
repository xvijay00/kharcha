import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../ui/Toast';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { PaymentModeSelector } from './PaymentModeSelector';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Tag,
  FileText,
} from 'lucide-react';
import type { TransactionType, PaymentMode } from '../../types';

export function QuickCashInOut() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addTransaction } = useTransactions();
  const { incomeCategories, expenseCategories } = useCategories();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();

  // Initial type from URL param ?type=in or out, defaults to 'in'
  const initialType = searchParams.get('type') === 'out' ? 'out' : 'in';
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const activeCategories = type === 'in' ? incomeCategories : expenseCategories;

  // Auto-select first category when categories load or type changes
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.id === categoryId)) {
      setCategoryId(activeCategories[0].id);
    }
  }, [type, activeCategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await addTransaction({
        type,
        amount,
        payment_mode: paymentMode,
        category_id: categoryId,
        note,
      });

      if (!isOnline) {
        toast.info('Saved locally! Will sync automatically when online.');
      } else {
        toast.success(`${type === 'in' ? 'Cash In' : 'Cash Out'} recorded successfully`);
      }

      navigate(-1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save transaction';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === 'in';

  return (
    <div className="max-w-md mx-auto space-y-5 pb-10">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Record Transaction</h2>
          <p className="text-xs text-gray-500">Quick cash entry with multi-payment mode</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('in')}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isIncome
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Cash In (Income)</span>
          </button>
          <button
            type="button"
            onClick={() => setType('out')}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              !isIncome
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Cash Out (Expense)</span>
          </button>
        </div>

        {/* Big Amount Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Amount
          </label>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-extrabold text-gray-400">₹</span>
            <input
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full max-w-[240px] text-4xl sm:text-5xl font-extrabold text-center bg-transparent focus:outline-none tracking-tight ${
                isIncome ? 'text-emerald-600' : 'text-rose-600'
              }`}
              autoFocus
              required
            />
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <PaymentModeSelector selected={paymentMode} onChange={setPaymentMode} />
        </div>

        {/* Category & Note Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span>Category</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {activeCategories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Remark / Note (Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Bill #1042, Customer Ramesh, Delivery charges"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !amount}
          className={`w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
            isIncome
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Entry...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Save {isIncome ? 'Cash In' : 'Cash Out'} (₹{amount || '0'})</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
