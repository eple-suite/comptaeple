// ⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS AUTORISATION EXPLICITE
import { useState, useCallback, useRef } from 'react';
import { store } from '../store/persistentStore';

// Hook principal : remplace useState pour toutes les données métier
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(
    () => store.get<T>(key, defaultValue)
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(
    () => store.getLastSaved(key)
  );

  const setPersistedState = useCallback((
    value: T | ((prev: T) => T)
  ) => {
    setState(prev => {
      const newValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      store.set(key, newValue);
      setLastSaved(new Date());
      return newValue;
    });
  }, [key]);

  return [state, setPersistedState, lastSaved] as const;
}

// Hook pour saisies longues : sauvegarde avec debounce 500ms
export function usePersistedText(key: string, defaultValue = '') {
  const [text, setText] = useState(
    () => store.get<string>(key, defaultValue)
  );
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(
    () => store.getLastSaved(key)
  );
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const setPersistedText = useCallback((value: string) => {
    setText(value);
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      store.set(key, value);
      setLastSaved(new Date());
      setStatus('saved');
    }, 500);
  }, [key]);

  return [text, setPersistedText, status, lastSaved] as const;
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

/**
 * Debounced save for textarea / long-text fields (legacy compat).
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
