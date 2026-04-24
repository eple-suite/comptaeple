// =====================================================================
// Section « Diagnostic Financier EPLE » — Compte financier
// ---------------------------------------------------------------------
// Affiche les 10 indicateurs réglementaires calculés par le moteur
// d'analyse à partir de la balance active du store COFIEPLE,
// plus le bloc des 5 réserves (M9-6 tome 4 art. 43231).
// Chaque indicateur : code couleur par niveau + explication contextuelle.
// =====================================================================

import { useMemo } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adapterBalanceVersEngine } from '@/lib/compteFinancier/balanceAdapter';
import { calculerBilanComplet } from '@/lib/compteFinancier/bilanFinancierEngine';
import {
  calculerTousIndicateursReprofi,
  type IndicateurReprofi,
  type Niveau,
  type DetailReserves,
} from '@/lib/compteFinancier/reprofiIndicateursEngine';
import {
  AlertTriangle, AlertCircle, CheckCircle2, ShieldCheck, Sparkles,
  Info, Wallet, Building2, Receipt, Banknote, TrendingDown,
  PiggyBank, Scale, FileWarning, Clock,
} from 'lucide-react';

// ─── Style par niveau ────────────────────────────────────────────────
const NIVEAU_STYLE: Record<Niveau, {
  label: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  icon: React.ReactNode;
}> = {
  critique: {
    label: '🔴 Critique',
    badgeClass: 'bg-destructive text-destructive-foreground',
    borderClass: 'border-destructive',
    bgClass: 'bg-destructive/5',
    textClass: 'text-destructive',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  fragile: {
    label: '🟠 Fragile',
    badgeClass: 'bg-warning text-warning-foreground',
    borderClass: 'border-warning',
    bgClass: 'bg-warning/5',
    textClass: 'text-warning',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  normal: {
    label: '🟡 Normal',
    badgeClass: 'bg-amber-500 text-white',
    borderClass: 'border-amber-500',
    bgClass: 'bg-amber-500/5',
    textClass: 'text-amber-600 dark:text-amber-400',
    icon: <Info className="h-4 w-4" />,
  },
  confortable: {
    label: '🟢 Confortable',
    badgeClass: 'bg-emerald-600 text-white',
    borderClass: 'border-emerald-600',
    bgClass: 'bg-emerald-600/5',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  excellent: {
    label: '✨ Excellent',
    badgeClass: 'bg-emerald-700 text-white',
    borderClass: 'border-emerald-700',
    bgClass: 'bg-emerald-700/5',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    icon: <Sparkles className="h-4 w-4" />,
  },
};

// ─── Explication contextuelle par indicateur × niveau ────────────────
// Les textes proviennent des seuils réglementaires (M9-6 tome 4
// art. 43231 et grilles d'analyse usuelles des EPLE).
const EXPLICATIONS: Record<string, Partial<Record<Niveau, string>>> = {
  NR: {
    excellent: "Recouvrement quasi-parfait : moins de 2 % des créances sont douteuses. Bonne santé du suivi des familles.",
    normal: "Taux de non-recouvrement contenu (2-5 %). Pratique conforme aux usages EPLE.",
    fragile: "Entre 5 et 10 % de créances douteuses : intensifier les relances et la coordination avec l'AC.",
    critique: "Plus de 10 % de créances douteuses : risque de provisionnement massif. Action SATD prioritaire.",
  },
  CONT: {
    excellent: "Aucune provision pour litige : pas de contentieux significatif identifié.",
    normal: "Provisions contentieux marginales (<2 % des charges).",
    fragile: "Provisions contentieux entre 2 et 5 % des charges : surveiller l'évolution des litiges.",
    critique: "Provisions contentieux > 5 % des charges : risque juridique élevé, vérifier la couverture.",
  },
  CAP: {
    excellent: "Comptes 47 quasi-soldés : excellente discipline de clôture.",
    normal: "Solde 47 < 10 k€ : à apurer en clôture mais sans gravité.",
    fragile: "Solde 47 entre 10 k€ et 50 k€ : opérations en attente à régulariser avant la clôture.",
    critique: "Solde 47 > 50 k€ : risque de masquer des erreurs comptables. Apurement obligatoire (M9-6).",
  },
  VETU: {
    excellent: "Parc neuf (<30 % amortis) : capacité d'investissement préservée.",
    normal: "Parc en bon état (30-60 %). Anticiper le renouvellement des équipements lourds.",
    fragile: "Parc vieillissant (60-80 %) : programmer un plan pluriannuel d'investissement.",
    critique: "Parc obsolète (>80 % amortis) : risques d'arrêt et coûts de maintenance croissants.",
  },
  DGP: {
    normal: "Dépendance modérée aux subventions (<60 %) : autonomie de gestion préservée.",
    fragile: "Dépendance forte aux subventions (60-80 %) : marge de manœuvre limitée.",
    critique: "Très forte dépendance (>80 %) : la collectivité de rattachement pèse de manière déterminante.",
  },
  CHFIX: {
    normal: "Charges fixes <60 % : structure souple, capacité à absorber les chocs.",
    fragile: "Charges fixes 60-75 % : flexibilité réduite face aux variations de recettes.",
    critique: "Charges fixes >75 % : structure très rigide, faible marge de pilotage budgétaire.",
  },
  ENDET: {
    excellent: "Capacité de désendettement <2 ans : excellent profil financier.",
    normal: "Capacité de désendettement 2-5 ans : profil sain, conforme aux normes EPLE.",
    fragile: "Capacité de désendettement 5-8 ans : à surveiller, limiter les nouveaux emprunts.",
    critique: "Capacité de désendettement >8 ans : surendettement potentiel, plan d'apurement requis.",
  },
  LIQ: {
    excellent: "Liquidité immédiate >2 : très bonne capacité à honorer les dettes court-terme.",
    normal: "Liquidité 1,2-2 : niveau confortable, conforme aux pratiques EPLE.",
    fragile: "Liquidité 0,8-1,2 : tension de trésorerie ponctuelle possible.",
    critique: "Liquidité <0,8 : risque immédiat d'incident de paiement, action urgente.",
  },
  INDEP: {
    excellent: "Indépendance financière >90 % : autonomie quasi-totale, structure très saine.",
    normal: "Indépendance financière 70-90 % : profil EPLE classique et sain.",
    fragile: "Indépendance financière 50-70 % : poids significatif de l'endettement.",
    critique: "Indépendance financière <50 % : structure dominée par les dettes, risque structurel.",
  },
};

// ─── Icône métier par code indicateur ────────────────────────────────
const ICONES_INDIC: Record<string, React.ReactNode> = {
  NR: <Receipt className="h-5 w-5" />,
  CONT: <FileWarning className="h-5 w-5" />,
  CAP: <Clock className="h-5 w-5" />,
  VETU: <Building2 className="h-5 w-5" />,
  DGP: <Banknote className="h-5 w-5" />,
  CHFIX: <TrendingDown className="h-5 w-5" />,
  ENDET: <Scale className="h-5 w-5" />,
  LIQ: <Wallet className="h-5 w-5" />,
  INDEP: <ShieldCheck className="h-5 w-5" />,
};

const fmtNombre = (v: number, unite: string) => {
  if (unite === '€') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  }
  if (unite === '%') return `${v.toFixed(1)} %`;
  if (unite === 'années') return `${v.toFixed(1)} ans`;
  return `${v.toFixed(2)}`;
};

// ─── Composant carte indicateur ──────────────────────────────────────
function IndicateurCard({ ind }: { ind: IndicateurReprofi }) {
  const style = NIVEAU_STYLE[ind.niveau];
  const explication =
    EXPLICATIONS[ind.code]?.[ind.niveau] ?? ind.commentaire;
  const icone = ICONES_INDIC[ind.code] ?? <Info className="h-5 w-5" />;

  return (
    <Card className={`border-l-4 ${style.borderClass} ${style.bgClass} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={style.textClass}>{icone}</span>
            <CardTitle className="text-base font-bold leading-tight truncate">
              {ind.libelle}
            </CardTitle>
          </div>
          <Badge className={`${style.badgeClass} shrink-0 text-[10px] font-bold uppercase tracking-wide`}>
            {style.label}
          </Badge>
        </div>
        <CardDescription className="text-[11px] font-mono uppercase opacity-70 mt-1">
          Code indicateur : {ind.code}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={`text-3xl font-extrabold ${style.textClass} tabular-nums`}>
          {fmtNombre(ind.valeur, ind.unite)}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {explication}
        </p>
        {ind.commentaire && (
          <p className="text-[11px] text-muted-foreground/80 italic border-t border-border/50 pt-2">
            {ind.commentaire}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Composant détail des 5 réserves ─────────────────────────────────
function ReservesPanel({ r }: { r: DetailReserves }) {
  const lignes: { libelle: string; cpt: string; montant: number; note: string }[] = [
    { libelle: 'Réserves générales', cpt: '10682', montant: r.reservesGenerales, note: 'Disponibles — mobilisables sans contrainte' },
    { libelle: 'Réserves SRH (hébergement)', cpt: '10681', montant: r.reservesSRH, note: 'Grevées d\'affectation — service annexe' },
    { libelle: 'Réserves taxe d\'apprentissage', cpt: '10683', montant: r.reservesTaxeApprent, note: 'Fléchées — usage pédagogique exclusif' },
    { libelle: 'Réserves affectées', cpt: '10687', montant: r.reservesAffectees, note: 'Affectées — manuels, équipements spécifiques' },
    { libelle: 'Autres réserves (1068x)', cpt: '1068x', montant: r.reservesAutres, note: 'Autres réserves contractuelles' },
  ];
  const fmtEur = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <Card className="border-l-4 border-primary bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-bold">Réserves — détail réglementaire</CardTitle>
        </div>
        <CardDescription className="text-[11px]">
          M9-6 tome 4 — article 43231 · 5 rubriques distinctes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lignes.map(l => (
            <div key={l.cpt} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{l.libelle}</div>
                <div className="text-[11px] text-muted-foreground italic">{l.note}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold tabular-nums">{fmtEur(l.montant)}</div>
                <div className="text-[10px] font-mono opacity-70">cpt {l.cpt}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-primary/30">
            <span className="text-sm font-extrabold uppercase tracking-wide text-primary">Total réserves</span>
            <span className="text-lg font-extrabold tabular-nums text-primary">{fmtEur(r.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section principale ──────────────────────────────────────────────
export function IndicateursReprofiSection() {
  const balance = useCofiepleStore(s => s.balance);
  const activeBudget = useCofiepleStore(s => s.activeBudget);

  const data = useMemo(() => {
    const rows = (balance?.[activeBudget] || balance?.principal || []) as any[];
    if (!rows || rows.length === 0) return null;
    const bal = adapterBalanceVersEngine(rows);
    const bilan = calculerBilanComplet(bal);
    const panier = calculerTousIndicateursReprofi(bal, bilan.caf.caf_additive);
    return { panier, caf: bilan.caf.caf_additive };
  }, [balance, activeBudget]);

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="font-semibold">Aucune balance disponible</p>
        <p className="text-sm mt-1">Importez une balance générale Op@le pour calculer les 10 indicateurs de diagnostic.</p>
      </div>
    );
  }

  const { panier, caf } = data;

  // Synthèse rapide : compte par niveau
  const counts = panier.indicateurs.reduce<Record<Niveau, number>>(
    (acc, i) => ({ ...acc, [i.niveau]: (acc[i.niveau] || 0) + 1 }),
    { critique: 0, fragile: 0, normal: 0, confortable: 0, excellent: 0 },
  );

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Diagnostic Financier EPLE — 10 indicateurs réglementaires
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Analyse exhaustive en complément du triptyque FR / BFR / Trésorerie — calculée à partir de la balance générale et de la CAF
              ({new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(caf)}).
              Sources réglementaires : Instruction M9-6 (tomes 3 & 4, art. 43231) et pièce 14 du compte financier.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['critique', 'fragile', 'normal', 'confortable', 'excellent'] as Niveau[]).map(n => (
              counts[n] > 0 && (
                <Badge key={n} className={`${NIVEAU_STYLE[n].badgeClass} text-[10px] font-bold`}>
                  {NIVEAU_STYLE[n].label} · {counts[n]}
                </Badge>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Bloc Réserves (M9-6) */}
      <ReservesPanel r={panier.reserves} />

      {/* Grille des 9 indicateurs */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Indicateurs de pilotage REPROFI ({panier.indicateurs.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {panier.indicateurs.map(ind => (
            <IndicateurCard key={ind.code} ind={ind} />
          ))}
        </div>
      </div>

      {/* Légende */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Lecture des niveaux REPROFI
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['critique', 'fragile', 'normal', 'confortable', 'excellent'] as Niveau[]).map(n => {
            const s = NIVEAU_STYLE[n];
            return (
              <div key={n} className={`rounded-lg border-l-4 ${s.borderClass} ${s.bgClass} p-2`}>
                <Badge className={`${s.badgeClass} text-[10px] mb-1`}>{s.label}</Badge>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {n === 'critique' && 'Action immédiate requise — risque structurel.'}
                  {n === 'fragile' && 'Vigilance — anticiper les actions correctrices.'}
                  {n === 'normal' && 'Conforme aux pratiques EPLE — surveiller la tendance.'}
                  {n === 'confortable' && 'Bonne santé — marge de manœuvre disponible.'}
                  {n === 'excellent' && 'Profil exemplaire — référence à valoriser.'}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default IndicateursReprofiSection;