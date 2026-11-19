import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { enqueueTransaction } from '../db/sync';
import { useBusiness } from './useBusiness';
import { useAuth } from './useAuth';
import { useOnlineStatus } from './useOnlineStatus';
import type { Transaction, TransactionFormData } from '../types';

export interface DateRange {
  start: Date;
  end: Date;
}

export function useTransactions(dateRange?: DateRange) {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!currentBusiness) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      query = query.limit(150);

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        console.warn('Network error loading transactions from Supabase:', fetchErr);
        // Load pending transactions from Dexie
        const pending = await db.pendingTransactions
          .where('business_id')
          .equals(currentBusiness.id)
          .toArray();

        const pendingMapped: Transaction[] = pending.map((p) => ({
          id: p.id,
          business_id: p.business_id,
          type: p.type,
          amount: p.amount,
          payment_mode: p.payment_mode,
          category_id: p.category_id,
          party_id: p.party_id,
          receipt_url: p.receipt_url,
          note: p.note,
          created_by: p.created_by,
          created_at: p.created_at,
          sync_status: p.sync_status,
        }));

        setTransactions(pendingMapped);
      } else if (data) {
        // Also fetch any offline pending transactions from Dexie and combine
        const pending = await db.pendingTransactions
          .where('business_id')
          .equals(currentBusiness.id)
          .toArray();

        const pendingMapped: Transaction[] = pending.map((p) => ({
          id: p.id,
          business_id: p.business_id,
          type: p.type,
          amount: p.amount,
          payment_mode: p.payment_mode,
          category_id: p.category_id,
          party_id: p.party_id,
          receipt_url: p.receipt_url,
          note: p.note,
          created_by: p.created_by,
          created_at: p.created_at,
          sync_status: p.sync_status,
        }));

        // Deduplicate and combine (pending at the top)
        const combined = [...pendingMapped, ...data.filter((d) => !pendingMapped.some((p) => p.id === d.id))];
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTransactions(combined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error fetching transactions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (data: TransactionFormData): Promise<Transaction> => {
    if (!currentBusiness) throw new Error('No active business selected');
    const parsedAmount = parseFloat(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Please enter a valid amount greater than 0');
    }

    const userId = user?.id || 'offline-user';
    const nowISO = new Date().toISOString();

    const txPayload: Omit<Transaction, 'id' | 'sync_status'> = {
      business_id: currentBusiness.id,
      type: data.type,
      amount: parsedAmount,
      payment_mode: data.payment_mode,
      category_id: data.category_id || null,
      party_id: data.party_id || null,
      receipt_url: null,
      note: data.note?.trim() || null,
      created_by: userId,
      created_at: nowISO,
    };

    if (!isOnline) {
      // Save offline in Dexie queue
      const offlineId = await enqueueTransaction(txPayload);
      const offlineTx: Transaction = {
        ...txPayload,
        id: offlineId,
        sync_status: 'pending',
      };
      setTransactions((prev) => [offlineTx, ...prev]);
      return offlineTx;
    }

    // Online: attempt Supabase insert
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('transactions')
        .insert({
          ...txPayload,
          sync_status: 'synced',
        })
        .select()
        .single();

      if (insertErr) {
        console.warn('Supabase insert failed, enqueuing offline transaction:', insertErr);
        const offlineId = await enqueueTransaction(txPayload);
        const offlineTx: Transaction = {
          ...txPayload,
          id: offlineId,
          sync_status: 'pending',
        };
        setTransactions((prev) => [offlineTx, ...prev]);
        return offlineTx;
      }

      setTransactions((prev) => [inserted, ...prev]);
      return inserted;
    } catch (err) {
      console.warn('Network exception, enqueuing offline:', err);
      const offlineId = await enqueueTransaction(txPayload);
      const offlineTx: Transaction = {
        ...txPayload,
        id: offlineId,
        sync_status: 'pending',
      };
      setTransactions((prev) => [offlineTx, ...prev]);
      return offlineTx;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentBusiness) throw new Error('No active business');

    // Remove from Dexie if pending
    await db.pendingTransactions.where('id').equals(id).delete();

    // Remove from Supabase
    const { error: delErr } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.warn('Error deleting from Supabase:', delErr);
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
  };
}
