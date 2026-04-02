// ⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS AUTORISATION EXPLICITE
interface Props {
  status?: 'saved' | 'saving';
  lastSaved?: Date | null;
}

export function SaveIndicator({ status = 'saved', lastSaved }: Props) {
  if (status === 'saving') {
    return (
      <span className="text-xs text-amber-600 flex items-center gap-1">
        ✏️ Sauvegarde en cours...
      </span>
    );
  }
  return (
    <span className="text-xs text-emerald-600 flex items-center gap-1">
      💾 {lastSaved
        ? `Sauvegardé à ${lastSaved.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
          })}`
        : 'Données sauvegardées'
      }
    </span>
  );
}
