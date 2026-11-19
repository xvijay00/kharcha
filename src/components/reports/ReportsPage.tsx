import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useBusiness } from '../../hooks/useBusiness';
import { formatCurrency, formatDate, startOfDay, endOfDay } from '../../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  PieChart,
  FileSpreadsheet,
  IndianRupee,
  Layers,
  CheckCircle,
} from 'lucide-react';

type ReportPeriod = 'today' | 'week' | 'month' | 'year';

export function ReportsPage() {
  const { currentBusiness } = useBusiness();
  const [period, setPeriod] = useState<ReportPeriod>('month');

  // Compute date range
  const dateRange = useMemo(() => {
    const end = endOfDay();
    if (period === 'today') {
      return { start: startOfDay(), end };
    }
    if (period === 'week') {
      const start = startOfDay();
      start.setDate(start.getDate() - 6);
      return { start, end };
    }
    if (period === 'month') {
      const start = new Date();
      start.setDate(1);
      return { start: startOfDay(start), end };
    }
    if (period === 'year') {
      const start = new Date();
      start.setMonth(0, 1);
      return { start: startOfDay(start), end };
    }
    return undefined;
  }, [period]);

  const { transactions, loading } = useTransactions(dateRange);
  const { categories } = useCategories();
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    const catExpenseMap: Record<string, number> = {};
    const catIncomeMap: Record<string, number> = {};
    const paymentModeMap: Record<string, number> = {
      cash: 0,
      upi: 0,
      card: 0,
      bank: 0,
      wallet: 0,
    };

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0;
      const catName = (tx.category_id && categoryMap.get(tx.category_id)) || 'General';

      if (tx.type === 'in') {
        income += amt;
        catIncomeMap[catName] = (catIncomeMap[catName] || 0) + amt;
      } else {
        expense += amt;
        catExpenseMap[catName] = (catExpenseMap[catName] || 0) + amt;
      }

      if (paymentModeMap[tx.payment_mode] !== undefined) {
        paymentModeMap[tx.payment_mode] += amt;
      }
    }

    const netProfit = income - expense;
    const profitMargin = income > 0 ? ((netProfit / income) * 100).toFixed(1) : '0';

    return {
      income,
      expense,
      netProfit,
      profitMargin,
      catExpenseMap,
      catIncomeMap,
      paymentModeMap,
    };
  }, [transactions, categoryMap]);

  // Download CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No data to export for this period');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Payment Mode', 'Category', 'Remark', 'Status'];
    const rows = transactions.map((t) => [
      formatDate(t.created_at),
      t.type.toUpperCase(),
      t.amount,
      t.payment_mode.toUpperCase(),
      (t.category_id && categoryMap.get(t.category_id)) || 'N/A',
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.sync_status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Kharcha_Report_${currentBusiness?.name || 'Shop'}_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topExpenseCategories = Object.entries(metrics.catExpenseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto">
      {/* Header & Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-xs text-gray-500">P&L statements & expense insights</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Period Tabs */}
      <div className="grid grid-cols-4 p-1 bg-gray-100 rounded-xl text-xs font-bold">
        {(['today', 'week', 'month', 'year'] as ReportPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`py-2 rounded-lg capitalize transition-all ${
              period === p
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {p === 'week' ? '7 Days' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Today'}
          </button>
        ))}
      </div>

      {/* Profit & Loss Statement Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-50">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Profit & Loss Summary
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Net earnings after deducting all recorded expenses
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              metrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {metrics.profitMargin}% Margin
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-700 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Gross Income / Sales</span>
            </span>
            <span className="font-bold text-emerald-600">{formatCurrency(metrics.income)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-700 font-medium">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Total Expenses & Purchases</span>
            </span>
            <span className="font-bold text-rose-600">{formatCurrency(metrics.expense)}</span>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="font-bold text-base text-gray-900">Net Profit / Munafa:</span>
            <span
              className={`text-xl font-extrabold ${
                metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(metrics.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Expense Breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-rose-500" />
          <span>Top Expense Categories</span>
        </h3>

        {topExpenseCategories.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No expenses in this period</p>
        ) : (
          <div className="space-y-3 pt-1">
            {topExpenseCategories.map(([catName, amt]) => {
              const pct = metrics.expense > 0 ? Math.round((amt / metrics.expense) * 100) : 0;
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-800">{catName}</span>
                    <span className="text-gray-500">
                      {formatCurrency(amt)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modes Distribution */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-900">Payment Collection Channels</h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Cash</span>
            <span className="font-bold text-gray-900 text-sm">
              {formatCurrency(metrics.paymentModeMap.cash || 0)}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-400 block mb-0.5">UPI / QR Code</span>
            <span className="font-bold text-blue-600 text-sm">
              {formatCurrency(metrics.paymentModeMap.upi || 0)}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Card / POS</span>
            <span className="font-bold text-gray-900 text-sm">
              {formatCurrency(metrics.paymentModeMap.card || 0)}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Bank Transfer</span>
            <span className="font-bold text-gray-900 text-sm">
              {formatCurrency(metrics.paymentModeMap.bank || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
