import { useState, useEffect } from 'react';
import { getPendingCount, syncPendingTransactions } from '../db/sync';

/**
 * Reactive hook that exposes the browser's online/offline state and
 * the number of transactions still queued in IndexedDB.
 */
export function useOnlineStatus(): {
  isOnline: boolean;
  pendingCount: number;
} {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Track connectivity ──
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      void syncPendingTransactions();
    };

    const goOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Poll pending count every 5 s ──
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const count = await getPendingCount();
      if (!cancelled) setPendingCount(count);
    };

    void refresh();

    const id = setInterval(() => {
      void refresh();
    }, 5_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { isOnline, pendingCount };
}
