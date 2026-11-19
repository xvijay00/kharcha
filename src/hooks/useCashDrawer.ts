import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { useBusiness } from './useBusiness';
import { startOfDay, endOfDay, todayISO } from '../lib/utils';
import type { CashDrawerSummary } from '../types';

export function useCashDrawer() {
  const { currentBusiness } = useBusiness();
  const [loading, setLoading] = useState<boolean>(true);
  const [closedRecord, setClosedRecord] = useState<{ actual: number; diff: number } | null>(null);

  const todayStr = useMemo(() => todayISO(), []);
  const storageKey = currentBusiness ? `kharcha_drawer_${currentBusiness.id}_${todayStr}` : '';

  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [cashIn, setCashIn] = useState<number>(0);
  const [cashOut, setCashOut] = useState<number>(0);

  const fetchSummary = useCallback(async () => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const start = startOfDay();
    const end = endOfDay();

    // Check localStorage for today's closed drawer state
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setClosedRecord({ actual: parsed.actual, diff: parsed.diff });
          if (parsed.opening !== undefined) setOpeningBalance(parsed.opening);
        }
      } catch (e) {
        console.error('Error reading drawer record from localStorage:', e);
      }
    }

    try {
      // Query transactions today where payment_mode = 'cash'
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .eq('payment_mode', 'cash')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      let inTotal = 0;
      let outTotal = 0;

      if (!error && data) {
        for (const tx of data) {
          if (tx.type === 'in') inTotal += Number(tx.amount);
          if (tx.type === 'out') outTotal += Number(tx.amount);
        }
      }

      // Also include offline pending cash transactions from Dexie
      const pending = await db.pendingTransactions
        .where('business_id')
        .equals(currentBusiness.id)
        .toArray();

      for (const p of pending) {
        if (p.payment_mode === 'cash') {
          const pTime = new Date(p.created_at).getTime();
          if (pTime >= start.getTime() && pTime <= end.getTime()) {
            if (p.type === 'in') inTotal += Number(p.amount);
            if (p.type === 'out') outTotal += Number(p.amount);
          }
        }
      }

      setCashIn(inTotal);
      setCashOut(outTotal);
    } catch (err) {
      console.warn('Error fetching cash drawer transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, storageKey]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const expectedBalance = openingBalance + cashIn - cashOut;

  const closeDrawer = (actualBalance: number) => {
    const diff = actualBalance - expectedBalance;
    const record = { actual: actualBalance, diff, opening: openingBalance };
    setClosedRecord({ actual: actualBalance, diff });

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(record));
    }
  };

  const summary: CashDrawerSummary = {
    opening_balance: openingBalance,
    cash_in: cashIn,
    cash_out: cashOut,
    expected_balance: expectedBalance,
    actual_balance: closedRecord ? closedRecord.actual : null,
    difference: closedRecord ? closedRecord.diff : null,
    date: todayStr,
  };

  return {
    summary,
    loading,
    closeDrawer,
    refreshDrawer: fetchSummary,
  };
}
