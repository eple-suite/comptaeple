// ═══════════════════════════════════════════════════════════════
// SaveStatusBadge — Visual indicator for auto-save status
// ═══════════════════════════════════════════════════════════════

import { Loader2, Check, AlertTriangle, CloudOff, Cloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusBadgeProps {
  status: SaveStatus;
  lastSaved: Date | null;
  isOnline?: boolean;
  pendingCount?: number;
  className?: string;
}

export function SaveStatusBadge({
  status,
  lastSaved,
  isOnline = true,
  pendingCount = 0,
  className = '',
}: SaveStatusBadgeProps) {
  const time = lastSaved
    ? lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (!isOnline) {
    return (
      <Badge variant="destructive" className={`gap-1 text-xs ${className}`}>
        <CloudOff className="h-3 w-3" />
        Hors ligne{pendingCount > 0 && ` (${pendingCount} en attente)`}
      </Badge>
    );
  }

  switch (status) {
    case 'saving':
      return (
        <Badge variant="secondary" className={`gap-1 text-xs ${className}`}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Sauvegarde...
        </Badge>
      );
    case 'saved':
      return (
        <Badge variant="outline" className={`gap-1 text-xs border-green-500/50 text-green-400 ${className}`}>
          <Check className="h-3 w-3" />
          Sauvegardé{time && ` à ${time}`}
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className={`gap-1 text-xs ${className}`}>
          <AlertTriangle className="h-3 w-3" />
          Erreur — Réessai...
        </Badge>
      );
    case 'unsaved':
      return (
        <Badge variant="secondary" className={`gap-1 text-xs text-yellow-400 ${className}`}>
          <Cloud className="h-3 w-3" />
          Modifications non sauvegardées
        </Badge>
      );
    default:
      return null;
  }
}
