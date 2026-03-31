// ═══════════════════════════════════════════════════════════════
// OfflineBanner — Persistent top banner when connection is lost
// ═══════════════════════════════════════════════════════════════

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOfflineQueue();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>
        Connexion perdue — vos données sont conservées localement
        {pendingCount > 0 && ` (${pendingCount} élément(s) en attente)`}
        {' '}et seront synchronisées dès la reconnexion.
      </span>
    </div>
  );
}
