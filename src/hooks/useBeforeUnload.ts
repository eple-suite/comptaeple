// ═══════════════════════════════════════════════════════════════
// useBeforeUnload — Warn user before leaving with unsaved data
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';

/**
 * Shows browser confirmation dialog when user tries to close/reload
 * the page while there are unsaved changes.
 * @param isDirty - Whether there are unsaved modifications
 */
export function useBeforeUnload(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own message, but returnValue is still needed
      e.returnValue = 'Des modifications non sauvegardées seront perdues. Quitter quand même ?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
