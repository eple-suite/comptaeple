// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Saisie des indicateurs hors-comptables
// Effectifs, boursiers, restauration, commentaires pour annexes
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Users, Utensils, BedDouble, MessageSquare, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExtraIndicators {
  effectif_eleves: number;
  effectif_internes: number;
  effectif_dp: number;
  effectif_boursiers: number;
  effectif_personnel: number;
  taux_reussite_bac: number;
  taux_passage: number;
  nb_repas_servis: number;
  cout_denrees_repas: number;
  prix_moyen_repas: number;
  tarif_internat: number;
  taux_occupation_internat: number;
  commentaire_fdr: string;
  commentaire_tresorerie: string;
  commentaire_caf: string;
  commentaire_general: string;
}

const DEFAULTS: ExtraIndicators = {
  effectif_eleves: 0, effectif_internes: 0, effectif_dp: 0,
  effectif_boursiers: 0, effectif_personnel: 0,
  taux_reussite_bac: 0, taux_passage: 0,
  nb_repas_servis: 0, cout_denrees_repas: 0, prix_moyen_repas: 0,
  tarif_internat: 0, taux_occupation_internat: 0,
  commentaire_fdr: '', commentaire_tresorerie: '',
  commentaire_caf: '', commentaire_general: '',
};

export function IndicateursHorsComptables() {
  const etab = useCofiepleStore(s => s.etablissement);
  const [data, setData] = useState<ExtraIndicators>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing data
  useEffect(() => {
    if (!etab.uai) { setLoading(false); return; }
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) { setLoading(false); return; }
        const { data: existing } = await supabase
          .from('cofieple_extra_indicators')
          .select('*')
          .eq('uai', etab.uai)
          .eq('exercice', etab.exercice)
          .eq('user_id', session.session.user.id)
          .maybeSingle();
        if (existing) {
          setData({
            effectif_eleves: existing.effectif_eleves || 0,
            effectif_internes: existing.effectif_internes || 0,
            effectif_dp: existing.effectif_dp || 0,
            effectif_boursiers: existing.effectif_boursiers || 0,
            effectif_personnel: existing.effectif_personnel || 0,
            taux_reussite_bac: existing.taux_reussite_bac || 0,
            taux_passage: existing.taux_passage || 0,
            nb_repas_servis: existing.nb_repas_servis || 0,
            cout_denrees_repas: existing.cout_denrees_repas || 0,
            prix_moyen_repas: existing.prix_moyen_repas || 0,
            tarif_internat: existing.tarif_internat || 0,
            taux_occupation_internat: existing.taux_occupation_internat || 0,
            commentaire_fdr: existing.commentaire_fdr || '',
            commentaire_tresorerie: existing.commentaire_tresorerie || '',
            commentaire_caf: existing.commentaire_caf || '',
            commentaire_general: existing.commentaire_general || '',
          });
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [etab.uai, etab.exercice]);

  async function handleSave() {
    if (!etab.uai) { toast.error('Identifiez d\'abord l\'établissement (code UAI)'); return; }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { toast.error('Connectez-vous pour sauvegarder'); return; }

      const payload = {
        user_id: session.session.user.id,
        uai: etab.uai,
        exercice: etab.exercice,
        ...data,
      };

      const { error } = await supabase.from('cofieple_extra_indicators').upsert(payload, {
        onConflict: 'user_id,uai,exercice',
      });
      if (error) throw error;
      setSaved(true);
      toast.success('Indicateurs sauvegardés');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de sauvegarde');
    } finally { setSaving(false); }
  }

  function setField<K extends keyof ExtraIndicators>(key: K, value: ExtraIndicators[K]) {
    setData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>;

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs">
          <strong>Indicateurs hors-comptables</strong> — Ces données complètent l'analyse financière avec des
          informations de contexte (effectifs, restauration, hébergement). Elles sont utilisées pour pré-remplir
          les annexes du rapport de gestion et permettent l'analyse pluriannuelle (M9-6 § V).
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Effectifs */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Effectifs — Exercice {etab.exercice}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <NumField label="Élèves" value={data.effectif_eleves} onChange={v => setField('effectif_eleves', v)} placeholder="Ex: 1200" />
            <NumField label="Internes" value={data.effectif_internes} onChange={v => setField('effectif_internes', v)} />
            <NumField label="Demi-pensionnaires" value={data.effectif_dp} onChange={v => setField('effectif_dp', v)} />
            <NumField label="Boursiers" value={data.effectif_boursiers} onChange={v => setField('effectif_boursiers', v)} />
            <NumField label="Personnel" value={data.effectif_personnel} onChange={v => setField('effectif_personnel', v)} />
            <NumField label="Taux réussite BAC (%)" value={data.taux_reussite_bac} onChange={v => setField('taux_reussite_bac', v)} step={0.1} />
          </CardContent>
        </Card>

        {/* Restauration / Hébergement */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Restauration & Hébergement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <NumField label="Repas servis (année)" value={data.nb_repas_servis} onChange={v => setField('nb_repas_servis', v)} />
            <NumField label="Coût denrées / repas (€)" value={data.cout_denrees_repas} onChange={v => setField('cout_denrees_repas', v)} step={0.01} />
            <NumField label="Prix moyen repas (€)" value={data.prix_moyen_repas} onChange={v => setField('prix_moyen_repas', v)} step={0.01} />
            <NumField label="Tarif internat (€)" value={data.tarif_internat} onChange={v => setField('tarif_internat', v)} step={0.01} />
            <NumField label="Taux occupation internat (%)" value={data.taux_occupation_internat} onChange={v => setField('taux_occupation_internat', v)} step={0.1} />
            <NumField label="Taux passage (%)" value={data.taux_passage} onChange={v => setField('taux_passage', v)} step={0.1} />
          </CardContent>
        </Card>
      </div>

      {/* Commentaires pour pré-remplissage des annexes */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Commentaires pour les annexes (M9-6 § V)
            <Badge variant="outline" className="ml-auto text-warning border-warning/50 text-xs">Pré-remplissage automatique</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Ces commentaires sont intégrés automatiquement dans les rapports de l'ordonnateur et de l'agent comptable.
            L'IA peut les compléter si une variation atypique est détectée.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TextAreaField label="Commentaire FDR" value={data.commentaire_fdr} onChange={v => setField('commentaire_fdr', v)}
              placeholder="Expliquez l'évolution du fonds de roulement…" />
            <TextAreaField label="Commentaire Trésorerie" value={data.commentaire_tresorerie} onChange={v => setField('commentaire_tresorerie', v)}
              placeholder="Expliquez la situation de trésorerie…" />
            <TextAreaField label="Commentaire CAF/IAF" value={data.commentaire_caf} onChange={v => setField('commentaire_caf', v)}
              placeholder="Expliquez l'autofinancement ou son insuffisance…" />
            <TextAreaField label="Commentaire général" value={data.commentaire_general} onChange={v => setField('commentaire_general', v)}
              placeholder="Observations générales pour le rapport de gestion…" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé ✓' : 'Sauvegarder les indicateurs'}
        </Button>
        {!etab.uai && <span className="text-xs text-destructive">⚠️ Identifiez l'établissement dans l'onglet Accueil</span>}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, placeholder = '', step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; placeholder?: string; step?: number;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder} step={step} className="mt-1 font-mono" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 text-xs min-h-[80px]" />
    </div>
  );
}
