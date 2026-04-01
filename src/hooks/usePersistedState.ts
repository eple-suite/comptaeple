// ═══════════════════════════════════════════════════════════════
// usePersistedState — Replaces useState for business data
// Reads from localStorage on mount, saves on every change
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      console.error(`Erreur sauvegarde localStorage [${key}]`);
    }
  }, [key, state]);

  return [state, setState] as const;
}

/**
 * Debounced save for textarea / long-text fields.
 * Saves to localStorage after `delay` ms of inactivity.
 */
export function useDebouncedSave(key: string, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback((value: unknown) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Sauvegarde échouée', e);
      }
    }, delay);
  }, [key, delay]);

  return save;
}

/**
 * Check if any cofieple persisted data exists — for restoration banner.
 */
export function hasCofieplePersistedData(): boolean {
  return Object.keys(localStorage).some(k => k.startsWith('cofieple_'));
}

/**
 * Clear all cofieple persisted data (for reset button).
 */
export function clearAllCofiepleData() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cofieple_'));
  keys.forEach(k => localStorage.removeItem(k));
}
