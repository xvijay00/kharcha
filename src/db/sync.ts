import { supabase } from '../config/supabase';
import { db } from './dexie';
import type { Transaction } from '../types';

/**
 * Queue a transaction for offline-first persistence.
 * Returns the generated UUID so callers can track it optimistically.
 */
export async function enqueueTransaction(
  tx: Omit<Transaction, 'id' | 'sync_status'>,
): Promise<string> {
  const id = crypto.randomUUID();

  await db.pendingTransactions.put({
    ...tx,
    id,
    sync_status: 'pending',
    retries: 0,
  });

  return id;
}

/**
 * Push every pending transaction to Supabase.
 * Successful rows are removed from IndexedDB; failures increment `retries`
 * and are marked 'failed' after 5 attempts.
 */
export async function syncPendingTransactions(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await db.pendingTransactions
    .where('sync_status')
    .equals('pending')
    .toArray();

  let synced = 0;
  let failed = 0;

  for (const tx of pending) {
    // Strip the local-only fields before sending to Supabase
    const { localId, retries, ...row } = tx;

    const { error } = await supabase
      .from('transactions')
      .insert({ ...row, sync_status: 'synced' as const });

    if (!error) {
      // Successfully synced — remove from local queue
      if (localId !== undefined) {
        await db.pendingTransactions.delete(localId);
      }
      synced++;
    } else {
      const newRetries = retries + 1;

      if (localId !== undefined) {
        await db.pendingTransactions.update(localId, {
          retries: newRetries,
          sync_status: newRetries >= 5 ? 'failed' : 'pending',
        });
      }

      if (newRetries >= 5) {
        failed++;
      }
    }
  }

  return { synced, failed };
}

// ─── Background sync lifecycle ───

let syncInterval: ReturnType<typeof setInterval> | null = null;
let onlineHandler: (() => void) | null = null;

/**
 * Start syncing: immediately if online, then every 30 s, and whenever
 * the browser regains connectivity.
 */
export function startBackgroundSync(): void {
  // Avoid duplicate listeners
  stopBackgroundSync();

  onlineHandler = () => {
    void syncPendingTransactions();
  };

  window.addEventListener('online', onlineHandler);

  if (navigator.onLine) {
    void syncPendingTransactions();
  }

  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      void syncPendingTransactions();
    }
  }, 30_000);
}

/**
 * Tear down the background sync listeners and timer.
 */
export function stopBackgroundSync(): void {
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * How many transactions are still waiting to be synced.
 */
export async function getPendingCount(): Promise<number> {
  return db.pendingTransactions
    .where('sync_status')
    .equals('pending')
    .count();
}
