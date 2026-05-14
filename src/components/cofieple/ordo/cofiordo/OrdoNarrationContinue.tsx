// ═══════════════════════════════════════════════════════════════════
// COFI ORDO — Mode Narration continue (rapport rédigé)
// Une page éditeur par section A/B/C/D avec assistance IA en marge.
// Sauvegarde locale auto par section + bouton « Générer / Enrichir ».
// ═══════════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextareaElastique } from '@/components/rapport/TextareaElastique';
import { SaveIndicator } from '@/components/SaveIndicator';
import { usePersistedText } from '@/hooks/usePersistedState';
import { ORDO_SECTIONS, ORDO_FICHES, OrdoSectionKey } from './catalog';
import { useOrdoData } from '../useOrdoData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2, BookOpen, Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const SECTION_PROMPTS: Record<OrdoSectionKey, string> = {
  A: "Rédige une analyse éditoriale (350-500 mots, 3-4 paragraphes) de la SECTION A — INDICATEURS STRUCTURELS du rapport ordonnateur. Présente la structure, l'organisation des services, la population scolaire et les dotations reçues. Mets en évidence les chiffres clés en gras. Style institutionnel mais accessible.",
  B: "Rédige une analyse éditoriale (350-500 mots, 3-4 paragraphes) de la SECTION B — BILAN BUDGÉTAIRE du rapport ordonnateur. Commente le pilotage du budget (DBM), les masses budgétaires par service, les taux de réalisation charges/produits et l'emploi des codes d'activité. Termine par une recommandation actionnable.",
  C: "Rédige une analyse éditoriale (350-500 mots, 3-4 paragraphes) de la SECTION C — EXÉCUTION BUDGÉTAIRE du rapport ordonnateur. Analyse l'exécution charges et produits par service général (AP, VE, ALO, SRH, OPC). Identifie les services en dépassement ou en sous-exécution.",
  D: "Rédige une analyse éditoriale (350-500 mots, 3-4 paragraphes) de la SECTION D — ANALYSE DE GESTION du rapport ordonnateur. Mets en perspective la structure des financements, les dépenses pédagogiques, les fonds sociaux, la viabilisation et la restauration. Propose 2 à 3 axes d'amélioration concrets.",
};

function SectionNarration({ skey }: { skey: OrdoSectionKey }) {
  const { etab, R, ind, pKey } = useOrdoData();
  const meta = ORDO_SECTIONS.find(s => s.key === skey)!;
  const fiches = ORDO_FICHES.filter(f => f.section === skey);
  const [text, setText, status, lastSaved] = usePersistedText(`${pKey}_narration_${skey}`, '');
  const [iaDraft, setIaDraft] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setIaDraft('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'narration_section',
          sectionId: `cofiordo_narration_${skey}_${etab.uai}_${etab.exercice}`,
          sectionKey: skey,
          context: {
            section: meta.label,
            etablissement: { nom: etab.nom, uai: etab.uai, exercice: etab.exercice, type: etab.type, commune: etab.commune },
            indicateurs_extra: ind ?? null,
            resultats: R ? {
              totalChargesPrev: R.totalChargesPrev, totalChargesSde: R.totalChargesSde,
              totalProduitsPrev: R.totalProduitsPrev, totalProduitsSdr: R.totalProduitsSdr,
              tauxExecCharges: R.tauxExecCharges, tauxExecProduits: R.tauxExecProduits,
              services: R.services,
            } : null,
            fiches_de_la_section: fiches.map(f => ({ numero: f.numero, titre: f.fullTitle, definition: f.definition })),
          },
        },
      });
      if (error) throw error;
      const result = data?.text || data?.content || '';
      setIaDraft(result);
      toast.success('Brouillon IA généré');
    } catch (e: any) {
      const msg = e?.message || 'inconnue';
      if (msg.includes('429')) toast.error('Limite de requêtes atteinte, réessayez dans un instant');
      else if (msg.includes('402')) toast.error('Crédits IA épuisés');
      else toast.error('Erreur IA : ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const insertDraft = () => {
    setText((text ? text + '\n\n' : '') + iaDraft);
    setIaDraft('');
    toast.success('Brouillon inséré');
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: meta.accent }}>
              {meta.label}
            </div>
            <h3 className="mt-1 text-lg font-bold text-foreground">{meta.subtitle}</h3>
          </div>
          {status && <SaveIndicator status={status} lastSaved={lastSaved ?? null} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Éditeur */}
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              ✎ Votre rédaction
            </div>
            <TextareaElastique
              value={text}
              onChange={setText}
              placeholder={`Rédigez librement votre analyse pour ${meta.label}.\n\nVous pouvez utiliser le bouton « Brouillon IA » dans la marge pour générer un premier jet à partir des données réelles, puis l'éditer et l'enrichir.`}
              minRows={18}
            />
          </div>

          {/* Marge IA */}
          <aside className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                <Sparkles className="h-3.5 w-3.5" /> Assistance IA
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                Génère un brouillon de 350 à 500 mots à partir des données importées et des indicateurs
                renseignés. À éditer ensuite librement.
              </p>
              <Button size="sm" className="w-full" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {loading ? 'Génération…' : 'Brouillon IA'}
              </Button>

              {iaDraft && (
                <div className="mt-3 space-y-2">
                  <div className="rounded border border-border bg-card p-3 max-h-72 overflow-y-auto prose prose-sm max-w-none text-[12px] leading-relaxed">
                    <ReactMarkdown>{iaDraft}</ReactMarkdown>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={insertDraft}>
                    Insérer dans l'éditeur
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Contenus de la section
              </div>
              <ul className="space-y-1">
                {fiches.map(f => (
                  <li key={f.id} className="text-[11px] text-foreground/80">
                    <span className="font-mono text-[10px] text-muted-foreground mr-1">{f.numero}</span>
                    {f.title}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrdoNarrationContinue() {
  const [active, setActive] = useState<OrdoSectionKey>('A');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <BookOpen className="h-3.5 w-3.5" /> Mode Narration continue
        </div>
        <h2 className="mt-2 text-xl font-bold text-foreground">Rapport ordonnateur rédigé</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Une page éditeur par grande section. L'IA peut générer un premier jet à partir des données réelles
          de l'établissement ; vous gardez la main pour éditer, enrichir et finaliser. Tout est sauvegardé en local.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ORDO_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold transition border',
                active === s.key
                  ? 'text-primary-foreground border-transparent shadow-sm'
                  : 'text-foreground border-border bg-card hover:bg-muted/40'
              )}
              style={active === s.key ? { background: s.accent, borderColor: s.accent } : undefined}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition"
          >
            <Printer className="h-3 w-3" /> Imprimer
          </button>
        </div>
      </div>

      <SectionNarration key={active} skey={active} />
    </div>
  );
}