// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Saisie des indicateurs hors-comptables
// Effectifs, boursiers, restauration, RH, patrimoine, commentaires
// Conformité M9-6 2026 § V — Décret 2012-1246
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { idbStorage } from '@/lib/idbStorage';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Users, Utensils, MessageSquare, Save, Loader2, CheckCircle2, Building, Briefcase, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface ExtraIndicators {
  effectif_eleves: number;
  effectif_internes: number;
  effectif_dp: number;
  effectif_externes: number;
  effectif_boursiers: number;
  effectif_personnel: number;
  taux_reussite_bac: number;
  taux_passage: number;
  montant_fonds_social: number;
  nb_repas_servis: number;
  nb_repas_commensaux: number;
  cout_denrees_repas: number;
  prix_moyen_repas: number;
  tarif_internat: number;
  taux_occupation_internat: number;
  etp_ressources_propres: number;
  surface_batiments: number;
  conso_eau: number;
  conso_gaz: number;
  conso_electricite: number;
  commentaire_fdr: string;
  commentaire_tresorerie: string;
  commentaire_caf: string;
  commentaire_general: string;
}

const DEFAULTS: ExtraIndicators = {
  effectif_eleves: 0, effectif_internes: 0, effectif_dp: 0, effectif_externes: 0,
  effectif_boursiers: 0, effectif_personnel: 0,
  taux_reussite_bac: 0, taux_passage: 0,
  montant_fonds_social: 0,
  nb_repas_servis: 0, nb_repas_commensaux: 0,
  cout_denrees_repas: 0, prix_moyen_repas: 0,
  tarif_internat: 0, taux_occupation_internat: 0,
  etp_ressources_propres: 0,
  surface_batiments: 0, conso_eau: 0, conso_gaz: 0, conso_electricite: 0,
  commentaire_fdr: '', commentaire_tresorerie: '',
  commentaire_caf: '', commentaire_general: '',
};

const DRAFT_PREFIX = 'cofieple_extra_indicators_draft_';

function getDraftKey(establishmentId: string | null, uai: string, exercice: number) {
  if (establishmentId) return `${DRAFT_PREFIX}${establishmentId}_${exercice}`;
  if (uai) return `${DRAFT_PREFIX}uai_${uai}_${exercice}`;
  return null;
}

function normalizeExtraIndicators(source: Partial<ExtraIndicators> | null | undefined): ExtraIndicators {
  return {
    ...DEFAULTS,
    ...source,
  };
}

async function loadDraft(key: string): Promise<ExtraIndicators | null> {
  try {
    const raw = localStorage.getItem(key) ?? await idbStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    const draftData = parsed && typeof parsed === 'object' && 'data' in parsed
      ? (parsed as { data?: Partial<ExtraIndicators> }).data
      : (parsed as Partial<ExtraIndicators>);
    return normalizeExtraIndicators(draftData);
  } catch {
    return null;
  }
}

function persistDraft(key: string, data: ExtraIndicators) {
  const payload = JSON.stringify({ data, updatedAt: new Date().toISOString() });

  try {
    localStorage.setItem(key, payload);
  } catch {
    // ignore localStorage quota/availability issues
  }

  void idbStorage.setItem(key, payload).catch(() => {
    // ignore IndexedDB write errors, localStorage remains fallback
  });
}

async function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore localStorage availability issues
  }

  try {
    await idbStorage.removeItem(key);
  } catch {
    // ignore IndexedDB cleanup issues
  }
}

export function IndicateursHorsComptables() {
  const etab = useCofiepleStore(s => s.etablissement);
  const currentEstablishmentId = useCofiepleStore(s => s.currentEstablishmentId);
  const [data, setData] = useState<ExtraIndicators>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const draftKey = getDraftKey(currentEstablishmentId, etab.uai, etab.exercice);

  useEffect(() => {
    let active = true;

    if (!draftKey && !etab.uai) {
      setData(DEFAULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSaved(false);

    (async () => {
      try {
        if (draftKey) {
          const draft = await loadDraft(draftKey);
          if (draft) {
            if (active) {
              setData(draft);
              setLoading(false);
            }
            return;
          }
        }

        if (!etab.uai) {
          if (active) setData(DEFAULTS);
          return;
        }

        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          if (active) setData(DEFAULTS);
          return;
        }

        const { data: existing } = await supabase
          .from('cofieple_extra_indicators')
          .select('*')
          .eq('uai', etab.uai)
          .eq('exercice', etab.exercice)
          .eq('user_id', session.session.user.id)
          .maybeSingle();

        if (!active) return;

        if (existing) {
          const normalized = normalizeExtraIndicators(existing as Partial<ExtraIndicators>);
          setData(normalized);
        } else {
          setData(DEFAULTS);
        }
      } catch {
        if (active) setData(DEFAULTS);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [draftKey, etab.uai, etab.exercice]);

  async function handleSave() {
    if (!etab.uai) { toast.error("Identifiez d'abord l'établissement (code UAI)"); return; }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { toast.error('Connectez-vous pour sauvegarder'); return; }
      const payload = { user_id: session.session.user.id, uai: etab.uai, exercice: etab.exercice, ...data };
      const { error } = await supabase.from('cofieple_extra_indicators').upsert(payload, { onConflict: 'user_id,uai,exercice' });
      if (error) throw error;
      if (draftKey) await clearDraft(draftKey);
      setSaved(true);
      toast.success('Indicateurs sauvegardés');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { toast.error(e.message || 'Erreur de sauvegarde'); }
    finally { setSaving(false); }
  }

  function setField<K extends keyof ExtraIndicators>(key: K, value: ExtraIndicators[K]) {
    let nextData: ExtraIndicators | null = null;
    setData(prev => {
      nextData = { ...prev, [key]: value };
      return nextData;
    });

    if (draftKey && nextData) {
      persistDraft(draftKey, nextData);
    }

    setSaved(false);
  }

  // Calculs automatiques
  const tauxBoursiers = data.effectif_eleves > 0 ? ((data.effectif_boursiers / data.effectif_eleves) * 100).toFixed(1) : '—';
  const ratioEau = data.surface_batiments > 0 ? (data.conso_eau / data.surface_batiments).toFixed(2) : '—';
  const ratioElec = data.surface_batiments > 0 ? (data.conso_electricite / data.surface_batiments).toFixed(2) : '—';
  const ratioGaz = data.surface_batiments > 0 ? (data.conso_gaz / data.surface_batiments).toFixed(2) : '—';

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>;

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-xs">
          <strong>Indicateurs hors-comptables</strong> — Ces données complètent l'analyse financière avec des
          informations de contexte (effectifs, SRH, patrimoine, RH). Elles sont utilisées pour pré-remplir
          les annexes du rapport de gestion et permettent l'analyse pluriannuelle (M9-6 § V).
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Démographie scolaire */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Démographie scolaire — Ex. {etab.exercice}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <NumField label="Élèves (total)" value={data.effectif_eleves} onChange={v => setField('effectif_eleves', v)} placeholder="Ex: 1200" />
            <NumField label="Demi-pensionnaires" value={data.effectif_dp} onChange={v => setField('effectif_dp', v)} />
            <NumField label="Internes" value={data.effectif_internes} onChange={v => setField('effectif_internes', v)} />
            <NumField label="Externes" value={data.effectif_externes} onChange={v => setField('effectif_externes', v)} />
            <NumField label="Personnel (ETP total)" value={data.effectif_personnel} onChange={v => setField('effectif_personnel', v)} />
            <NumField label="Taux réussite BAC (%)" value={data.taux_reussite_bac} onChange={v => setField('taux_reussite_bac', v)} step={0.1} />
            <NumField label="Taux passage (%)" value={data.taux_passage} onChange={v => setField('taux_passage', v)} step={0.1} />
          </CardContent>
        </Card>

        {/* Aide sociale */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Heart className="h-4 w-4" /> Aide sociale & Boursiers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <NumField label="Boursiers" value={data.effectif_boursiers} onChange={v => setField('effectif_boursiers', v)} />
            <div>
              <Label className="text-xs text-muted-foreground">Taux de boursiers</Label>
              <div className="mt-1 h-10 flex items-center px-3 bg-muted rounded-md font-mono text-sm">{tauxBoursiers} %</div>
            </div>
            <NumField label="Fonds social mobilisé (€)" value={data.montant_fonds_social} onChange={v => setField('montant_fonds_social', v)} step={0.01} />
          </CardContent>
        </Card>

        {/* SRH */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Utensils className="h-4 w-4" /> SRH — Restauration & Hébergement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <NumField label="Repas servis élèves (année)" value={data.nb_repas_servis} onChange={v => setField('nb_repas_servis', v)} />
            <NumField label="Repas commensaux (année)" value={data.nb_repas_commensaux} onChange={v => setField('nb_repas_commensaux', v)} />
            <NumField label="Coût denrées / repas (€)" value={data.cout_denrees_repas} onChange={v => setField('cout_denrees_repas', v)} step={0.01} />
            <NumField label="Prix moyen repas (€)" value={data.prix_moyen_repas} onChange={v => setField('prix_moyen_repas', v)} step={0.01} />
            <NumField label="Tarif internat (€/an)" value={data.tarif_internat} onChange={v => setField('tarif_internat', v)} step={0.01} />
            <NumField label="Taux occupation internat (%)" value={data.taux_occupation_internat} onChange={v => setField('taux_occupation_internat', v)} step={0.1} />
          </CardContent>
        </Card>

        {/* RH Ressources propres */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Ressources Humaines (ressources propres)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <NumField label="ETP sur ressources propres" value={data.etp_ressources_propres} onChange={v => setField('etp_ressources_propres', v)} step={0.5} />
            <div className="col-span-2 text-xs text-muted-foreground bg-muted/30 rounded p-2">
              Contrats aidés, AED sur fonds propres, assistants d'éducation, personnels GRETA/CFA financés sur budget annexe.
            </div>
          </CardContent>
        </Card>

        {/* Patrimoine & Viabilisation */}
        <Card className="lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Building className="h-4 w-4" /> Patrimoine & Viabilisation
              <Badge variant="outline" className="ml-auto text-warning border-warning/50 text-xs">Ratios automatiques</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <NumField label="Surface bâtiments (m²)" value={data.surface_batiments} onChange={v => setField('surface_batiments', v)} />
              <NumField label="Eau (m³/an)" value={data.conso_eau} onChange={v => setField('conso_eau', v)} />
              <NumField label="Gaz (kWh/an)" value={data.conso_gaz} onChange={v => setField('conso_gaz', v)} />
              <NumField label="Électricité (kWh/an)" value={data.conso_electricite} onChange={v => setField('conso_electricite', v)} />
            </div>
            {data.surface_batiments > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <RatioDisplay label="Eau / m²" value={`${ratioEau} m³/m²`} />
                <RatioDisplay label="Gaz / m²" value={`${ratioGaz} kWh/m²`} />
                <RatioDisplay label="Électricité / m²" value={`${ratioElec} kWh/m²`} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commentaires */}
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

// ── Sous-composants ─────────────────────────────────────────

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

function RatioDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}
