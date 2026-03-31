// ═══════════════════════════════════════════════════════════════
// useAutoSave — Periodic auto-save with retry, status tracking
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

interface UseAutoSaveOptions<T> {
  /** Data to watch for changes */
  data: T;
  /** Async function that persists the data */
  onSave: (data: T) => Promise<void>;
  /** Interval in ms (default 30000 = 30s) */
  interval?: number;
  /** Whether auto-save is enabled (default true) */
  enabled?: boolean;
  /** Max retries on failure (default 3) */
  maxRetries?: number;
  /** Unique key for offline queue (e.g. "voyage-123") */
  queueKey?: string;
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30_000,
  enabled = true,
  maxRetries = 3,
  queueKey,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const snapshotRef = useRef<string>('');

  // Track changes
  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized !== snapshotRef.current) {
      dirtyRef.current = true;
      dataRef.current = data;
      if (status === 'saved' || status === 'idle') {
        setStatus('unsaved');
      }
    }
  }, [data]);

  const save = useCallback(async (force = false) => {
    if (savingRef.current) return;
    if (!force && !dirtyRef.current) return;

    savingRef.current = true;
    setStatus('saving');
    const snapshot = dataRef.current;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await onSave(snapshot);
        dirtyRef.current = false;
        snapshotRef.current = JSON.stringify(snapshot);
        setLastSaved(new Date());
        setStatus('saved');
        savingRef.current = false;

        // Clear offline queue entry on success
        if (queueKey) {
          try {
            const queue = JSON.parse(localStorage.getItem('__offline_queue') || '{}');
            delete queue[queueKey];
            localStorage.setItem('__offline_queue', JSON.stringify(queue));
          } catch { /* ignore */ }
        }
        return;
      } catch (err) {
        attempt++;
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // All retries failed — queue offline
    setStatus('error');
    savingRef.current = false;
    if (queueKey) {
      try {
        const queue = JSON.parse(localStorage.getItem('__offline_queue') || '{}');
        queue[queueKey] = { data: snapshot, timestamp: Date.now() };
        localStorage.setItem('__offline_queue', JSON.stringify(queue));
      } catch { /* ignore */ }
    }
  }, [onSave, maxRetries, queueKey]);

  // Periodic auto-save
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (dirtyRef.current && !savingRef.current) {
        save();
      }
    }, interval);
    return () => clearInterval(timer);
  }, [enabled, interval, save]);

  return { status, lastSaved, save, isDirty: dirtyRef.current };
}
