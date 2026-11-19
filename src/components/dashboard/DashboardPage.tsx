import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../hooks/useBusiness';
import { useTransactions } from '../../hooks/useTransactions';
import { StatCard } from './StatCard';
import { RecentTransactions } from './RecentTransactions';
import { formatCurrency, startOfDay, endOfDay, formatDate } from '../../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();

  // Filter transactions for today
  const todayRange = useMemo(() => ({
    start: startOfDay(),
    end: endOfDay(),
  }), []);

  const { transactions, loading, refreshTransactions } = useTransactions(todayRange);

  // Calculate today's stats
  const stats = useMemo(() => {
    let todayIn = 0;
    let todayOut = 0;
    let count = transactions.length;

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'in') todayIn += amt;
      if (tx.type === 'out') todayOut += amt;
    }

    const net = todayIn - todayOut;

    return {
      todayIn,
      todayOut,
      net,
      count,
    };
  }, [transactions]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';

  return (
    <div className="space-y-5 pb-8">
      {/* Top Greeting & Business Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {greeting}, {userName}! 👋
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(new Date())} • {currentBusiness?.name}
          </p>
        </div>
        <button
          onClick={() => refreshTransactions()}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          title="Refresh dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Quick Action Buttons (Cash In / Cash Out) */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/transactions/new?type=in"
          className="flex items-center justify-center gap-2 p-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-2xl shadow-sm transition-all active:scale-[0.98]"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span>Quick Cash In</span>
        </Link>
        <Link
          to="/transactions/new?type=out"
          className="flex items-center justify-center gap-2 p-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-2xl shadow-sm transition-all active:scale-[0.98]"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Quick Cash Out</span>
        </Link>
      </div>

      {/* 4 Stat Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Today's Income"
          value={formatCurrency(stats.todayIn)}
          icon={<TrendingUp className="w-4 h-4" />}
          color="green"
          trend="up"
        />
        <StatCard
          title="Today's Expense"
          value={formatCurrency(stats.todayOut)}
          icon={<TrendingDown className="w-4 h-4" />}
          color="red"
          trend="down"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(stats.net)}
          icon={<Wallet className="w-4 h-4" />}
          color="blue"
          subtitle="Income - Expense"
        />
        <StatCard
          title="Transactions"
          value={stats.count.toString()}
          icon={<ArrowLeftRight className="w-4 h-4" />}
          color="orange"
          subtitle="Today's entries"
        />
      </div>

      {/* Recent Transactions List */}
      <RecentTransactions />

      {/* Floating Action Button (FAB) */}
      <Link
        to="/transactions/new"
        className="fixed right-5 bottom-20 w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-600/30 transition-transform active:scale-95 z-30"
        title="Add Transaction"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  );
}
