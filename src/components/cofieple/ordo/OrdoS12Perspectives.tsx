import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';

export function OrdoS12Perspectives() {
  const { pKey } = useOrdoData();
  const [projets, setProjets, statusP, lastSavedP] = usePersistedText(`${pKey}_perspectives_projets`, '');
  const [risques, setRisques, statusR, lastSavedR] = usePersistedText(`${pKey}_perspectives_risques`, '');
  const [orientations, setOrientations, statusO, lastSavedO] = usePersistedText(`${pKey}_perspectives_orientations`, '');

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S12" title="Perspectives financières" />

        <CommentaireBox label="Projets d'investissement envisagés" value={projets} onChange={setProjets} status={statusP} lastSaved={lastSavedP} />
        <CommentaireBox label="Risques financiers identifiés" value={risques} onChange={setRisques} status={statusR} lastSaved={lastSavedR} />
        <CommentaireBox label="Orientations budgétaires pour l'exercice suivant" value={orientations} onChange={setOrientations} status={statusO} lastSaved={lastSavedO} />
      </CardContent>
    </Card>
  );
}
