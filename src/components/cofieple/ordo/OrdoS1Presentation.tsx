import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { GraduationCap, Utensils, Building2, Users, Wallet } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';

function IndicatorBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
      {icon}
      <div><div className="text-[10px] text-muted-foreground uppercase">{label}</div><div className="text-sm font-bold">{value}</div></div>
    </div>
  );
}

export function OrdoS1Presentation() {
  const { etab, ind, pKey } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_presentation`, '');
  
  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : '—';
  const tauxBoursiers = ind && ind.effectif_eleves > 0 ? ((ind.effectif_boursiers / ind.effectif_eleves) * 100).toFixed(1) : null;
  const tauxInternes = ind && ind.effectif_eleves > 0 ? ((ind.effectif_internes / ind.effectif_eleves) * 100).toFixed(1) : null;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S1" title="Présentation de l'établissement" withNarration />
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div><span className="text-muted-foreground">Établissement</span><p className="font-bold">{etab.nom || '—'}</p></div>
          <div><span className="text-muted-foreground">UAI (RNE)</span><p className="font-bold font-mono">{etab.uai || '—'}</p></div>
          <div><span className="text-muted-foreground">Commune</span><p className="font-bold">{etab.commune || '—'}</p></div>
          <div><span className="text-muted-foreground">Académie</span><p className="font-bold">{etab.academie || '—'}</p></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div><span className="text-muted-foreground">Ordonnateur</span><p className="font-bold">{etab.ordonnateur || '—'}</p></div>
          <div><span className="text-muted-foreground">Date d'arrêté</span><p className="font-bold">{dateArrete}</p></div>
          <div><span className="text-muted-foreground">Exercice</span><p className="font-bold">{etab.exercice}</p></div>
        </div>

        {ind && ind.effectif_eleves > 0 && (
          <>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mt-4">Effectifs</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <IndicatorBadge icon={<GraduationCap className="h-4 w-4 text-primary" />} label="Élèves inscrits" value={`${ind.effectif_eleves}`} />
              <IndicatorBadge icon={<Utensils className="h-4 w-4 text-warning" />} label="Demi-pensionnaires" value={`${ind.effectif_dp}`} />
              <IndicatorBadge icon={<Building2 className="h-4 w-4 text-muted-foreground" />} label="Internes" value={`${ind.effectif_internes}${tauxInternes ? ` (${tauxInternes}%)` : ''}`} />
              <IndicatorBadge icon={<Users className="h-4 w-4 text-emerald-600" />} label="Boursiers" value={`${ind.effectif_boursiers}${tauxBoursiers ? ` (${tauxBoursiers}%)` : ''}`} />
              {ind.effectif_personnel > 0 && <IndicatorBadge icon={<Users className="h-4 w-4 text-primary" />} label="Personnel" value={`${ind.effectif_personnel} ETP`} />}
              {ind.surface_batiments && ind.surface_batiments > 0 && <IndicatorBadge icon={<Building2 className="h-4 w-4 text-muted-foreground" />} label="Surface" value={`${ind.surface_batiments.toLocaleString('fr-FR')} m²`} />}
              {ind.etp_ressources_propres && ind.etp_ressources_propres > 0 && <IndicatorBadge icon={<Wallet className="h-4 w-4 text-emerald-600" />} label="ETP ress. propres" value={`${ind.etp_ressources_propres}`} />}
            </div>
          </>
        )}

        {!ind && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-xs text-warning">
            ℹ️ Renseignez les effectifs et indicateurs extra-comptables dans l'onglet <strong>Indicateurs</strong> pour enrichir cette section.
          </div>
        )}

        <CommentaireBox label="Présentation de l'exercice" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
