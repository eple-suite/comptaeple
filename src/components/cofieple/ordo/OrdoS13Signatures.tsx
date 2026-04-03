import { usePersistedState } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrdoData } from './useOrdoData';
import { SectionTitre } from './OrdoCommentaireBox';

export function OrdoS13Signatures() {
  const { etab, pKey } = useOrdoData();
  const [nomOrdo, setNomOrdo] = usePersistedState(`${pKey}_nom_ordo`, etab.ordonnateur || '');
  const [nomAC, setNomAC] = usePersistedState(`${pKey}_nom_ac`, etab.agentComptable || '');
  const [nomSG, setNomSG] = usePersistedState(`${pKey}_nom_sg`, etab.secretaireGeneral || '');
  const [dateCA, setDateCA] = usePersistedState(`${pKey}_date_ca`, '');

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <SectionTitre numero="S13" title="Signatures et certification" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold">Date d'arrêté du compte</Label>
            <Input type="date" value={etab.dateArrete} readOnly className="mt-1 bg-muted/30" />
          </div>
          <div>
            <Label className="text-xs font-bold">Date de délibération du CA</Label>
            <Input type="date" value={dateCA} onChange={e => setDateCA(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-bold">Nom de l'ordonnateur</Label>
            <Input value={nomOrdo} onChange={e => setNomOrdo(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-bold">Nom de l'agent comptable</Label>
            <Input value={nomAC} onChange={e => setNomAC(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-bold">Nom du secrétaire général</Label>
            <Input value={nomSG} onChange={e => setNomSG(e.target.value)} placeholder="Prénom NOM" className="mt-1" />
          </div>
        </div>

        {/* Bloc signatures */}
        <div className="border-t-2 pt-6 mt-6">
          <p className="text-xs text-muted-foreground text-center mb-6">
            Le présent compte financier a été arrêté au 31 décembre {etab.exercice} et soumis au vote du conseil d'administration.
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-xs font-bold mb-1">L'ordonnateur</p>
              <div className="h-20 border-b border-dashed border-muted-foreground/30" />
              <p className="text-xs mt-2 font-semibold">{nomOrdo || etab.ordonnateur || '……………………'}</p>
              <p className="text-[10px] text-muted-foreground">Signature et cachet</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold mb-1">L'agent comptable</p>
              <div className="h-20 border-b border-dashed border-muted-foreground/30" />
              <p className="text-xs mt-2 font-semibold">{nomAC || etab.agentComptable || '……………………'}</p>
              <p className="text-[10px] text-muted-foreground">Signature et cachet</p>
            </div>
          </div>

          {dateCA && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Avis du conseil d'administration en date du {new Date(dateCA).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
