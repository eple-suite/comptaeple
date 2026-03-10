// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Annexe Comptable Réglementaire (M9-6 § V.3)
// Pièce maîtresse : narratif IA, DataViz 5 ans, contexte quali
// Conformité : M9-6 2026 · Décret 2012-1246 · Code Éducation
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState, KPICard } from './SharedComponents';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import {
  Bot, Loader2, Printer, FileText, Users, Building, Sparkles,
  TrendingUp, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';

// ── Types ────────────────────────────────────────────────────
interface AnnexeTexts {
  presentation: string;
  execution: string;
  patrimoine: string;
  srh: string;
  perspectives: string;
}

interface ContexteQualif {
  changementOrdonnateur: string;
  changementGestionnaire: string;
  mouvementsAgence: string;
  evenementsMarquants: string;
  travauxImportants: string;
  reformesPedagogiques: string;
  difficultes: string;
}

const SECTIONS = [
  { id: 'presentation', label: 'I. Présentation générale', icon: <Building className="h-4 w-4" /> },
  { id: 'execution', label: 'II. Exécution budgétaire', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'patrimoine', label: 'III. Situation patrimoniale', icon: <FileText className="h-4 w-4" /> },
  { id: 'srh', label: 'IV. SRH & Viabilisation', icon: <Users className="h-4 w-4" /> },
  { id: 'perspectives', label: 'V. Perspectives', icon: <Sparkles className="h-4 w-4" /> },
] as const;

const CHART_COLORS = ['hsl(215, 70%, 45%)', 'hsl(160, 45%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 50%, 50%)', 'hsl(0, 70%, 50%)'];

export function AnnexeComptableSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const budgets = useCofiepleStore(s => s.budgets);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  const [texts, setTexts] = useState<AnnexeTexts>({
    presentation: '', execution: '', patrimoine: '', srh: '', perspectives: '',
  });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    presentation: true, execution: true, patrimoine: true, srh: true, perspectives: true,
  });
  const [contexte, setContexte] = useState<ContexteQualif>({
    changementOrdonnateur: '', changementGestionnaire: '', mouvementsAgence: '',
    evenementsMarquants: '', travauxImportants: '', reformesPedagogiques: '', difficultes: '',
  });
  const [indicators, setIndicators] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedEtab, setSelectedEtab] = useState<string>('principal');

  // Load indicators and history
  useEffect(() => {
    if (!etab.uai || !R) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const uid = session.session.user.id;

        const [indRes, histRes] = await Promise.all([
          supabase.from('cofieple_extra_indicators').select('*')
            .eq('uai', etab.uai).eq('exercice', etab.exercice).eq('user_id', uid).maybeSingle(),
          supabase.from('cofieple_exercises').select('*')
            .eq('uai', etab.uai).eq('user_id', uid)
            .order('exercice', { ascending: false }).limit(5),
        ]);

        if (indRes.data) setIndicators(indRes.data);
        if (histRes.data) setHistory(histRes.data);
      } catch {}
    })();
  }, [etab.uai, etab.exercice, R]);

  const buildContextString = useCallback(() => {
    const parts = Object.entries(contexte)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          changementOrdonnateur: 'Changement d\'ordonnateur',
          changementGestionnaire: 'Changement de gestionnaire',
          mouvementsAgence: 'Mouvements agence comptable',
          evenementsMarquants: 'Événements marquants',
          travauxImportants: 'Travaux importants',
          reformesPedagogiques: 'Réformes pédagogiques',
          difficultes: 'Difficultés logistiques',
        };
        return `${labels[k] || k} : ${v}`;
      });
    return parts.join(' | ');
  }, [contexte]);

  async function genererSection(sectionId: string) {
    if (!R) return;
    setLoadingSection(sectionId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-annexe', {
        body: {
          section: sectionId,
          etablissement: etab,
          resultats: {
            resultatBudgetaire: R.resultatBudgetaire,
            resultatComptable: R.resultatComptable,
            fdrComptable: R.fdrComptable,
            bfr: R.bfr,
            tresorerieNette: R.tresorerieNette,
            cafBudgetaire: R.cafBudgetaire,
            cafComptable: R.cafComptable,
            totalChargesReel: R.totalChargesReel,
            totalProduitsReel: R.totalProduitsReel,
            totalChargesPrev: R.totalChargesPrev,
            totalProduitsPrev: R.totalProduitsPrev,
            tauxExecCharges: R.tauxExecCharges,
            tauxExecProduits: R.tauxExecProduits,
            joursAutonomie: R.joursAutonomie,
            reserves: R.reserves,
          },
          indicateurs: indicators,
          historique: history,
          contexte: buildContextString(),
        },
      });
      if (error) throw error;
      setTexts(prev => ({ ...prev, [sectionId]: data?.text || '' }));
      toast.success(`Section "${SECTIONS.find(s => s.id === sectionId)?.label}" générée`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération IA');
    }
    setLoadingSection(null);
  }

  async function genererTout() {
    for (const s of SECTIONS) {
      await genererSection(s.id);
    }
  }

  function toggleSection(id: string) {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer l'annexe comptable réglementaire (M9-6 § V.3)." />;

  // Build chart data
  const recettesData = Object.entries(R.parService).map(([svc, d]: [string, any], i) => ({
    name: d.libelle || svc, value: d.produitsReel || 0, fill: CHART_COLORS[i % CHART_COLORS.length],
  })).filter(d => d.value > 0);

  const depensesData = Object.entries(R.parService).map(([svc, d]: [string, any]) => ({
    name: d.libelle || svc, charges: d.chargesReel || 0, previsions: d.chargesPrev || 0,
  }));

  const trendData = history.length > 0
    ? [...history].reverse().map(h => ({
        exercice: h.exercice,
        FDR: h.fdr, BFR: h.bfr, Trésorerie: h.tresorerie, CAF: h.caf,
      }))
    : [];

  const hasMultipleBudgets = budgets.length > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-warning" />
            Annexe Comptable — M9-6 § V.3
          </h2>
          <p className="text-xs text-muted-foreground">Document obligatoire — Exercice {etab.exercice}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={genererTout} disabled={!!loadingSection} className="gap-2">
            {loadingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            Générer toute l'annexe (IA)
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
        </div>
      </div>

      {/* Multi-establishment selector */}
      {hasMultipleBudgets && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold">Établissement / Budget :</span>
            {budgets.map(b => (
              <Button key={b.type} variant={selectedEtab === b.type ? 'default' : 'outline'} size="sm"
                onClick={() => setSelectedEtab(b.type)} className="text-xs">
                {b.libelle}
              </Button>
            ))}
            <Badge variant="outline" className="text-xs ml-auto">
              Groupement comptable — Annexe déclinée par établissement
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Contexte qualitatif */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3 cursor-pointer"
          onClick={() => toggleSection('contexte')}>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Contexte & Événements marquants
            <Badge variant="outline" className="ml-auto border-warning/50 text-warning text-xs">Saisie qualitative</Badge>
            {expandedSections['contexte'] !== false ? <ChevronDown className="h-4 w-4 text-white" /> : <ChevronRight className="h-4 w-4 text-white" />}
          </CardTitle>
        </CardHeader>
        {expandedSections['contexte'] !== false && (
          <CardContent className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Ces éléments qualitatifs sont intégrés par l'IA dans la rédaction narrative de chaque section.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ContextField label="Changement d'ordonnateur" value={contexte.changementOrdonnateur}
                onChange={v => setContexte(p => ({ ...p, changementOrdonnateur: v }))}
                placeholder="Ex: Mme Dupont a succédé à M. Martin le 01/09/2025…" />
              <ContextField label="Changement de gestionnaire" value={contexte.changementGestionnaire}
                onChange={v => setContexte(p => ({ ...p, changementGestionnaire: v }))}
                placeholder="Ex: Nouveau gestionnaire depuis la rentrée 2025…" />
              <ContextField label="Mouvements agence comptable" value={contexte.mouvementsAgence}
                onChange={v => setContexte(p => ({ ...p, mouvementsAgence: v }))}
                placeholder="Ex: Mutation d'un fondé de pouvoir, arrivée d'un adjoint…" />
              <ContextField label="Événements marquants" value={contexte.evenementsMarquants}
                onChange={v => setContexte(p => ({ ...p, evenementsMarquants: v }))}
                placeholder="Ex: Fusion de sections, ouverture BTS, fermeture internat…" />
              <ContextField label="Travaux importants" value={contexte.travauxImportants}
                onChange={v => setContexte(p => ({ ...p, travauxImportants: v }))}
                placeholder="Ex: Rénovation du self-service, mise aux normes PMR…" />
              <ContextField label="Réformes pédagogiques" value={contexte.reformesPedagogiques}
                onChange={v => setContexte(p => ({ ...p, reformesPedagogiques: v }))}
                placeholder="Ex: Réforme du lycée professionnel, nouveaux programmes…" />
              <ContextField label="Difficultés logistiques" value={contexte.difficultes}
                onChange={v => setContexte(p => ({ ...p, difficultes: v }))} className="lg:col-span-2"
                placeholder="Ex: Problème de chauffage, dégât des eaux, crise sanitaire…" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* ═══ CORPS DE L'ANNEXE ═══ */}
      <Card className="max-w-5xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 print:p-4">
          {/* En-tête */}
          <div className="text-center mb-8 pb-6 border-b-2 border-foreground">
            <h1 className="text-2xl font-black tracking-tight mb-1">ANNEXE AU COMPTE FINANCIER</h1>
            <p className="text-sm text-muted-foreground">
              {etab.nom} — RNE {etab.uai} — Exercice {etab.exercice}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Instruction codificatrice M9-6 du 12/02/2026 — Décret n°2012-1246 (RGCP)
            </p>
          </div>

          {/* Sections narratives */}
          {SECTIONS.map((section) => (
            <AnnexeSection
              key={section.id}
              id={section.id}
              label={section.label}
              icon={section.icon}
              text={texts[section.id as keyof AnnexeTexts]}
              onTextChange={(v) => setTexts(prev => ({ ...prev, [section.id]: v }))}
              onGenerate={() => genererSection(section.id)}
              loading={loadingSection === section.id}
              expanded={expandedSections[section.id] !== false}
              onToggle={() => toggleSection(section.id)}
            />
          ))}

          {/* ═══ DataViz intégrée ═══ */}
          <div className="mt-8 pt-6 border-t-2 border-foreground">
            <h2 className="text-lg font-black mb-6 text-center tracking-wide">VISUALISATION DES DONNÉES FINANCIÈRES</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Camembert : structure des recettes */}
              {recettesData.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Structure des recettes par service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={recettesData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                          outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={true} fontSize={10}>
                          {recettesData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatEur(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Histogramme : dépenses par service */}
              {depensesData.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Exécution des dépenses par service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={depensesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                        <YAxis type="category" dataKey="name" width={80} fontSize={10} />
                        <Tooltip formatter={(v: number) => formatEur(v)} />
                        <Legend />
                        <Bar dataKey="previsions" fill="hsl(215, 70%, 75%)" name="Prévisions" />
                        <Bar dataKey="charges" fill="hsl(215, 70%, 45%)" name="Réalisé" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tendances pluriannuelles */}
            {trendData.length > 1 && (
              <Card className="mb-8">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Évolution pluriannuelle — FRNG, BFR, Trésorerie, CAF
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exercice" fontSize={11} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={10} />
                      <Tooltip formatter={(v: number) => formatEur(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="FDR" stroke="hsl(215, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="BFR" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Trésorerie" stroke="hsl(160, 45%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="CAF" stroke="hsl(280, 50%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Jauges KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <KPICard label="FRNG" value={formatEur(R.fdrComptable)} color={R.fdrComptable >= 0 ? 'green' : 'red'} icon="🏦" sub="Fonds de roulement" isText />
              <KPICard label="Trésorerie" value={formatEur(R.tresorerieNette)} color={R.tresorerieNette >= 0 ? 'green' : 'red'} icon="💳" sub={`${Math.round(R.joursAutonomie)} jours`} isText />
              <KPICard label="CAF/IAF" value={formatEur(R.cafBudgetaire)} color={R.cafBudgetaire >= 0 ? 'green' : 'red'} icon="🔄" sub={R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance'} isText />
              <KPICard label="Réserves" value={formatEur(R.reserves)} color="blue" icon="🏛️" sub="Compte 1068" isText />
            </div>

            {/* Indicateurs hors-comptables intégrés */}
            {indicators && indicators.effectif_eleves > 0 && (
              <Card className="mb-6">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Données de contexte (indicateurs hors-comptables)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <ContextBadge label="Élèves" value={indicators.effectif_eleves} />
                    <ContextBadge label="DP" value={indicators.effectif_dp} />
                    <ContextBadge label="Internes" value={indicators.effectif_internes} />
                    <ContextBadge label="Boursiers" value={indicators.effectif_boursiers} suffix={indicators.effectif_eleves > 0 ? ` (${((indicators.effectif_boursiers / indicators.effectif_eleves) * 100).toFixed(1)}%)` : ''} />
                    {indicators.nb_repas_servis > 0 && <ContextBadge label="Repas/an" value={indicators.nb_repas_servis?.toLocaleString('fr-FR')} />}
                    {indicators.cout_denrees_repas > 0 && <ContextBadge label="Coût denrées/repas" value={`${indicators.cout_denrees_repas?.toFixed(2)} €`} />}
                    {indicators.surface_batiments > 0 && <ContextBadge label="Surface" value={`${indicators.surface_batiments?.toLocaleString('fr-FR')} m²`} />}
                    {indicators.etp_ressources_propres > 0 && <ContextBadge label="ETP ress. propres" value={indicators.etp_ressources_propres} />}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-10 pt-6 border-t-2 text-xs text-muted-foreground">
            <div>
              <strong className="block text-foreground text-sm">L'ordonnateur</strong>
              <div className="mt-10">{etab.ordonnateur || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Fait à {etab.commune || '………………'},</p>
              <p>le ……… / ……… / {etab.exercice + 1}</p>
            </div>
            <div className="text-right">
              <strong className="block text-foreground text-sm">L'agent comptable</strong>
              <div className="mt-10">{etab.agentComptable || '……………………'}</div>
              <span>Signature et cachet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══ Section individuelle de l'annexe ═══
function AnnexeSection({ id, label, icon, text, onTextChange, onGenerate, loading, expanded, onToggle }: {
  id: string; label: string; icon: React.ReactNode;
  text: string; onTextChange: (v: string) => void;
  onGenerate: () => void; loading: boolean;
  expanded: boolean; onToggle: () => void;
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 cursor-pointer group mb-3" onClick={onToggle}>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-sm font-black uppercase tracking-wide border-l-4 border-warning pl-3 flex items-center gap-2 group-hover:text-primary transition-colors">
          {icon} {label}
        </h3>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onGenerate(); }} disabled={loading} className="text-xs h-7">
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Bot className="h-3 w-3 mr-1" />}
            {loading ? 'IA…' : 'Générer'}
          </Button>
          {text && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); }} className="text-xs h-7">
              {editMode ? 'Aperçu' : 'Modifier'}
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="pl-7">
          {text ? (
            editMode ? (
              <Textarea value={text} onChange={e => onTextChange(e.target.value)}
                className="text-sm min-h-[120px] bg-muted/20 leading-relaxed" />
            ) : (
              <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            )
          ) : (
            <div className="bg-muted/20 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Cliquez sur <strong>Générer</strong> pour que l'IA rédige cette section à partir des données du moteur m9-6engine.ts.
              </p>
              <p className="text-xs text-muted-foreground">
                Vous pourrez ensuite modifier le texte librement.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────
function ContextField({ label, value, onChange, placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 text-sm" />
    </div>
  );
}

function ContextBadge({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2.5">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
      <div className="font-bold font-mono">{value}{suffix}</div>
    </div>
  );
}
