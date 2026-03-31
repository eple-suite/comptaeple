// ═══════════════════════════════════════════════════════════════
// useOfflineQueue — Detect connectivity, sync queued writes
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface QueueEntry {
  data: any;
  timestamp: number;
}

const QUEUE_KEY = '__offline_queue';

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const getQueue = (): Record<string, QueueEntry> => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const updateCount = useCallback(() => {
    setPendingCount(Object.keys(getQueue()).length);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: '🟢 Connexion rétablie',
        description: 'Synchronisation des données en attente...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '⚠️ Connexion perdue',
        description: 'Vos données sont conservées localement et seront synchronisées dès la reconnexion.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateCount();

    // Poll queue count
    const interval = setInterval(updateCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateCount]);

  /** Process all queued entries with a resolver function */
  const processQueue = useCallback(async (
    resolver: (key: string, data: any) => Promise<void>
  ) => {
    const queue = getQueue();
    const keys = Object.keys(queue);
    if (keys.length === 0) return;

    let successCount = 0;
    for (const key of keys) {
      try {
        await resolver(key, queue[key].data);
        delete queue[key];
        successCount++;
      } catch {
        // Keep in queue for next attempt
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    updateCount();

    if (successCount > 0) {
      toast({
        title: '✅ Synchronisation réussie',
        description: `${successCount} élément(s) synchronisé(s).`,
      });
    }
  }, [updateCount]);

  const clearQueue = useCallback(() => {
    localStorage.removeItem(QUEUE_KEY);
    updateCount();
  }, [updateCount]);

  return { isOnline, pendingCount, processQueue, clearQueue };
}
