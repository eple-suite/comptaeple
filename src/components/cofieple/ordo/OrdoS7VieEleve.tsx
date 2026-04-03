import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { KPICard, EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';

export function OrdoS7VieEleve() {
  const { etab, R, ind, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_vie_eleve`, '');

  if (!R) return <EmptyState msg="Données requises." />;

  const fonds = ind?.montant_fonds_social ?? 0;
  const boursiers = ind?.effectif_boursiers ?? 0;
  const eleves = ind?.effectif_eleves ?? 0;
  const tauxBoursiers = eleves > 0 ? ((boursiers / eleves) * 100).toFixed(1) : '—';

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S7" title="Vie de l'élève et action sociale" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Fonds sociaux" value={fonds > 0 ? formatEur(fonds) : '—'} color="blue" icon="🤝" sub="Volume global" />
          {eleves > 0 && fonds > 0 && (
            <KPICard label="Aide moy. / élève" value={formatEur(fonds / eleves)} color="blue" icon="👤" />
          )}
          <KPICard label="Boursiers" value={`${boursiers}`} color="green" icon="🎓" sub={`${tauxBoursiers} % des élèves`} />
          <KPICard label="Élèves" value={`${eleves || '—'}`} color="blue" icon="👨‍🎓" />
        </div>

        {!ind && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-xs text-warning">
            ℹ️ Les données extra-comptables (fonds sociaux, bourses) ne sont pas renseignées. Complétez-les dans l'onglet <strong>Indicateurs</strong>.
          </div>
        )}

        <CommentaireBox label="Action sociale" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
