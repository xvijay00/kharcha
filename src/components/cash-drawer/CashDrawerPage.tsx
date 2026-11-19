import React, { useState } from 'react';
import { useCashDrawer } from '../../hooks/useCashDrawer';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function CashDrawerPage() {
  const { summary, loading, closeDrawer, refreshDrawer } = useCashDrawer();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actualInput, setActualInput] = useState<string>('');

  const handleOpenCloseModal = () => {
    setActualInput(summary.actual_balance !== null ? summary.actual_balance.toString() : '');
    setModalOpen(true);
  };

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(actualInput);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid cash balance');
      return;
    }
    closeDrawer(val);
    setModalOpen(false);
    toast.success('Cash drawer reconciled successfully!');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cash Drawer (Galla)</h2>
          <p className="text-xs text-gray-500">Daily physical cash reconciliation</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
            {formatDate(new Date())}
          </span>
        </div>
      </div>

      {/* Main Reconciliation Status Card */}
      {summary.actual_balance !== null ? (
        <div
          className={`p-5 rounded-2xl border ${
            summary.difference === 0
              ? 'bg-emerald-50/70 border-emerald-200'
              : summary.difference! > 0
              ? 'bg-blue-50/70 border-blue-200'
              : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                summary.difference === 0
                  ? 'bg-emerald-600 text-white'
                  : summary.difference! > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {summary.difference === 0 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {summary.difference === 0
                  ? 'Drawer Balanced Perfectly! 🎉'
                  : summary.difference! > 0
                  ? 'Drawer Has Excess Cash (Over)'
                  : 'Drawer Is Short of Cash (Short)'}
              </h3>
              <p className="text-xs text-gray-600">
                Counted: {formatCurrency(summary.actual_balance)} • Expected: {formatCurrency(summary.expected_balance)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
            <span className="text-xs font-semibold text-gray-600">Net Difference:</span>
            <span
              className={`font-extrabold text-base ${
                summary.difference === 0
                  ? 'text-emerald-700'
                  : summary.difference! > 0
                  ? 'text-blue-700'
                  : 'text-rose-700'
              }`}
            >
              {summary.difference! >= 0 ? '+' : ''}
              {formatCurrency(summary.difference!)}
            </span>
          </div>

          <button
            onClick={handleOpenCloseModal}
            className="w-full mt-3 py-2 bg-white/80 hover:bg-white text-gray-800 rounded-xl border border-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recount / Update Actual Cash</span>
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl text-white shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200 bg-white/10 px-2.5 py-1 rounded-full mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Active Register Session</span>
              </span>
              <h3 className="text-lg font-bold">Ready for Day-End Closing</h3>
              <p className="text-xs text-blue-100 mt-1 max-w-xs">
                Count the physical rupee notes & coins in your cash drawer and match against book records.
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-white" />
            </div>
          </div>

          <button
            onClick={handleOpenCloseModal}
            className="mt-4 w-full h-12 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Close & Reconcile Cash Drawer</span>
          </button>
        </div>
      )}

      {/* Cash Flow Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Today's Cash Ledger Details
        </h3>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Opening Cash Balance</p>
                <p className="text-[11px] text-gray-400">Cash carried forward from start of day</p>
              </div>
            </div>
            <p className="font-bold text-sm text-gray-800">{formatCurrency(summary.opening_balance)}</p>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Today's Cash Sales / In</p>
                <p className="text-[11px] text-gray-400">Cash received during the day</p>
              </div>
            </div>
            <p className="font-bold text-sm text-emerald-600">+{formatCurrency(summary.cash_in)}</p>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Today's Cash Expenses / Out</p>
                <p className="text-[11px] text-gray-400">Cash paid out for purchases & expenses</p>
              </div>
            </div>
            <p className="font-bold text-sm text-rose-600">-{formatCurrency(summary.cash_out)}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-gray-900">Expected Closing Balance</p>
                <p className="text-[11px] text-gray-400">Opening + Cash In - Cash Out</p>
              </div>
            </div>
            <p className="font-extrabold text-base text-blue-700">{formatCurrency(summary.expected_balance)}</p>
          </div>
        </div>
      </div>

      {/* Reconciliation Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Cash Drawer Reconciliation">
        <form onSubmit={handleConfirmClose} className="space-y-4">
          <p className="text-xs text-gray-500">
            Enter the exact physical cash amount present in your drawer right now.
          </p>

          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Expected in Register
            </span>
            <span className="text-2xl font-extrabold text-blue-600">
              {formatCurrency(summary.expected_balance)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Physical Cash Counted (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={actualInput}
              onChange={(e) => setActualInput(e.target.value)}
              placeholder="e.g., 14500"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Record Closing</span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
