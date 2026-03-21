// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Indicateurs spécifiques CFA
// 8 indicateurs M9-6 2026 §2.1.2.3.2 — Apprentissage
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur, formatPct } from '@/lib/cofieple_calculations';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Clock,
  BarChart3, AlertTriangle, Save, CheckCircle2, Wallet,
  GraduationCap, Building, Briefcase, PieChart, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface CfaManualData {
  nbApprentisN: number;
  nbApprentisN1: number;
  coutRefFranceCompetences: number;
  recettesCapBep: number;
  recettesBacPro: number;
  recettesBtsLicence: number;
  recettesMasterIng: number;
}

const DEFAULTS: CfaManualData = {
  nbApprentisN: 0,
  nbApprentisN1: 0,
  coutRefFranceCompetences: 0,
  recettesCapBep: 0,
  recettesBacPro: 0,
  recettesBtsLicence: 0,
  recettesMasterIng: 0,
};

const LS_KEY = 'cockpit_cf_cfa_indicateurs';

export function IndicateursCfa() {
  const resultats = useCofiepleStore(s => s.resultats);
  const sdr = useCofiepleStore(s => s.sdr);
  const sdr1 = useCofiepleStore(s => s.sdr1);
  const sde = useCofiepleStore(s => s.sde);
  const balance = useCofiepleStore(s => s.balance);
  const etab = useCofiepleStore(s => s.etablissement);

  const r = resultats.annexe_cfa;
  const bal = balance?.annexe_cfa || [];
  const sdeRows = sde?.annexe_cfa || [];
  const sdrRows = sdr?.annexe_cfa || [];
  const sdrRows1 = sdr1?.annexe_cfa || [];

  const [manual, setManual] = useState<CfaManualData>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setManual({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(manual));
    setSaved(true);
    toast.success('Indicateurs CFA enregistrés');
    setTimeout(() => setSaved(false), 2000);
  };

  const setField = (k: keyof CfaManualData, v: number) =>
    setManual(prev => ({ ...prev, [k]: v }));

  const computed = useMemo(() => {
    const totalCharges = r?.totalChargesSde ?? sdeRows.reduce((s, row) => s + row.realise, 0);
    const totalRecettes = r?.totalProduitsSdr ?? sdrRows.reduce((s, row) => s + row.realise, 0);

    // Subventions Région / France Compétences (C/7471x, C/7472x)
    const subventionsRegionFC = sdrRows
      .filter(row => row.compte.startsWith('7471') || row.compte.startsWith('7472'))
      .reduce((s, row) => s + row.realise, 0);

    // Recettes propres hors subventions CT
    const recettesPropres = totalRecettes - subventionsRegionFC;

    // Charges personnel formateurs vacataires C/6413x
    const chargesVacataires = sdeRows
      .filter(row => row.compte.startsWith('6413'))
      .reduce((s, row) => s + row.realise, 0);

    // Produits à recevoir C/4111x ou C/4118x
    const produitsARecevoir = bal
      .filter(b => b.compte.startsWith('4111') || b.compte.startsWith('4118'))
      .reduce((s, b) => s + (b.solDbt || 0), 0);

    // Prévisions recettes (budget)
    const prevRecettes = r?.totalProduitsPrev ?? sdrRows.reduce((s, row) => s + row.budget, 0);

    // C/185
    const c185 = bal.filter(b => b.compte.startsWith('185'));
    const solde185Net = c185.reduce((s, b) => s + (b.solDbt || 0) - (b.solCrd || 0), 0);

    // 1. Taux financement Région/FC
    const tauxFinancementRegion = totalRecettes > 0 ? (subventionsRegionFC / totalRecettes) * 100 : 0;

    // 2. Taux couverture charges par recettes propres
    const tauxCouverture = totalCharges > 0 ? (recettesPropres / totalCharges) * 100 : 0;

    // 3. Coût formation par apprenti
    const coutParApprenti = manual.nbApprentisN > 0 ? totalCharges / manual.nbApprentisN : 0;

    // 4. Variation effectifs
    const variationApprentis = manual.nbApprentisN - manual.nbApprentisN1;
    const variationApprentisPct = manual.nbApprentisN1 > 0 ? (variationApprentis / manual.nbApprentisN1) * 100 : 0;

    // 5. Total recettes par niveau
    const totalRecettesNiveau = manual.recettesCapBep + manual.recettesBacPro + manual.recettesBtsLicence + manual.recettesMasterIng;

    // 6. Résultat exploitation
    const resultatExploitation = totalRecettes - totalCharges;

    // 7. Écart prévisions/réalisations recettes
    const ecartPrevReal = prevRecettes > 0 ? Math.abs(totalRecettes - prevRecettes) / prevRecettes * 100 : 0;

    // 8. Part charges vacataires
    const partChargesVacataires = totalCharges > 0 ? (chargesVacataires / totalCharges) * 100 : 0;

    return {
      totalCharges, totalRecettes, subventionsRegionFC, recettesPropres,
      chargesVacataires, produitsARecevoir, prevRecettes, solde185Net,
      tauxFinancementRegion, tauxCouverture, coutParApprenti,
      variationApprentis, variationApprentisPct, totalRecettesNiveau,
      resultatExploitation, ecartPrevReal, partChargesVacataires,
    };
  }, [r, sdeRows, sdrRows, bal, manual]);

  const StatCard = ({ icon: Icon, title, value, subtitle, alert, success }: {
    icon: any; title: string; value: string; subtitle?: string;
    alert?: boolean; success?: boolean;
  }) => (
    <Card className={`border ${alert ? 'border-destructive/40 bg-destructive/5' : success ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${alert ? 'bg-destructive/10 text-destructive' : success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!r && sdeRows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune donnée CFA importée</p>
          <p className="text-sm mt-1">Importez les fichiers SDE et SDR du budget annexe CFA pour activer les indicateurs spécifiques.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Indicateurs CFA</h2>
          <p className="text-sm text-muted-foreground">
            Apprentissage — M9-6 §2.1.2.3.2 · Exercice {etab.exercice}
          </p>
        </div>
      </div>

      {/* ── Indicateurs automatiques ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building}
          title="① Taux de financement Région/FC"
          value={formatPct(computed.tauxFinancementRegion / 100)}
          subtitle={`${formatEur(computed.subventionsRegionFC)} sur ${formatEur(computed.totalRecettes)} recettes`}
        />
        <StatCard
          icon={PieChart}
          title="② Taux couverture (recettes propres)"
          value={formatPct(computed.tauxCouverture / 100)}
          subtitle={`Recettes propres : ${formatEur(computed.recettesPropres)} / Charges : ${formatEur(computed.totalCharges)}`}
          alert={computed.tauxCouverture > 0 && computed.tauxCouverture < 50}
        />
        <StatCard
          icon={computed.resultatExploitation >= 0 ? TrendingUp : TrendingDown}
          title="⑥ Résultat d'exploitation CFA"
          value={formatEur(computed.resultatExploitation)}
          subtitle={computed.resultatExploitation < 0
            ? '⚠️ Déficit — Impact sur le budget principal (M9-6 §2.1.2.3.2)'
            : '✅ Excédent d\'exploitation'
          }
          alert={computed.resultatExploitation < 0}
          success={computed.resultatExploitation >= 0}
        />
        <StatCard
          icon={Users}
          title="⑧ Part charges vacataires (C/6413x)"
          value={formatPct(computed.partChargesVacataires / 100)}
          subtitle={`${formatEur(computed.chargesVacataires)} sur ${formatEur(computed.totalCharges)}`}
        />
      </div>

      {/* ── Vérification financement ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={AlertTriangle}
          title="⑦ Écart prévisions/réalisations recettes"
          value={computed.ecartPrevReal > 0 ? `${computed.ecartPrevReal.toFixed(1)}%` : '—'}
          subtitle={computed.ecartPrevReal > 10
            ? `🔴 Écart > 10% — Justifier (prévu ${formatEur(computed.prevRecettes)} / réalisé ${formatEur(computed.totalRecettes)})`
            : computed.prevRecettes > 0
              ? `✅ Écart maîtrisé (prévu ${formatEur(computed.prevRecettes)})`
              : 'Pas de prévisions budgétaires'
          }
          alert={computed.ecartPrevReal > 10}
          success={computed.ecartPrevReal > 0 && computed.ecartPrevReal <= 10}
        />
        <StatCard
          icon={Wallet}
          title="Produits à recevoir (C/4111-4118)"
          value={formatEur(computed.produitsARecevoir)}
          subtitle="Créances sur conventions de financement"
          alert={computed.produitsARecevoir > computed.subventionsRegionFC * 0.3}
        />
        <StatCard
          icon={Wallet}
          title="Trésorerie CFA (C/185)"
          value={formatEur(computed.solde185Net)}
          subtitle={computed.solde185Net < 0 ? '🔴 Solde créditeur anormal' : 'Fonds via le principal'}
          alert={computed.solde185Net < 0}
          success={computed.solde185Net > 0}
        />
      </div>

      <Separator />

      {/* ── Saisies manuelles ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            ③④ Effectifs et coût par apprenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Nombre d'apprentis N (au 1er janvier)</Label>
              <Input type="number" value={manual.nbApprentisN || ''}
                onChange={e => setField('nbApprentisN', parseInt(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Nombre d'apprentis N-1</Label>
              <Input type="number" value={manual.nbApprentisN1 || ''}
                onChange={e => setField('nbApprentisN1', parseInt(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Coût de référence France Compétences (€)</Label>
              <Input type="number" value={manual.coutRefFranceCompetences || ''}
                onChange={e => setField('coutRefFranceCompetences', parseFloat(e.target.value) || 0)}
                placeholder="0 €" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              icon={DollarSign}
              title="③ Coût de formation par apprenti"
              value={computed.coutParApprenti > 0 ? formatEur(computed.coutParApprenti) : '—'}
              subtitle={manual.coutRefFranceCompetences > 0 && computed.coutParApprenti > 0
                ? `Réf. FC : ${formatEur(manual.coutRefFranceCompetences)} • ${computed.coutParApprenti > manual.coutRefFranceCompetences ? '🔴 Au-dessus du référentiel' : '✅ Conforme'}`
                : manual.nbApprentisN > 0 ? `${formatEur(computed.totalCharges)} / ${manual.nbApprentisN} apprentis` : 'Saisir le nombre d\'apprentis'
              }
              alert={manual.coutRefFranceCompetences > 0 && computed.coutParApprenti > manual.coutRefFranceCompetences}
              success={manual.coutRefFranceCompetences > 0 && computed.coutParApprenti > 0 && computed.coutParApprenti <= manual.coutRefFranceCompetences}
            />
            <StatCard
              icon={Users}
              title="④ Effectif apprentis N vs N-1"
              value={manual.nbApprentisN > 0 ? `${manual.nbApprentisN}` : '—'}
              subtitle={manual.nbApprentisN1 > 0
                ? `N-1 : ${manual.nbApprentisN1} • Δ ${computed.variationApprentis >= 0 ? '+' : ''}${computed.variationApprentis} (${computed.variationApprentisPct >= 0 ? '+' : ''}${computed.variationApprentisPct.toFixed(1)}%)`
                : 'Saisir l\'effectif N-1'
              }
              alert={computed.variationApprentis < 0}
              success={computed.variationApprentis > 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Recettes par niveau de formation ───────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            ⑤ Recettes par niveau de formation (saisie manuelle)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {([
              ['recettesCapBep', 'CAP / BEP'],
              ['recettesBacPro', 'Bac Pro / MC'],
              ['recettesBtsLicence', 'BTS / Licence Pro'],
              ['recettesMasterIng', 'Master / Ingénieur'],
            ] as [keyof CfaManualData, string][]).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input type="number" value={manual[key] || ''}
                  onChange={e => setField(key, parseFloat(e.target.value) || 0)}
                  placeholder="0 €" />
              </div>
            ))}
          </div>

          {computed.totalRecettesNiveau > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-2">Répartition saisie : {formatEur(computed.totalRecettesNiveau)}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  ['CAP/BEP', manual.recettesCapBep],
                  ['Bac Pro/MC', manual.recettesBacPro],
                  ['BTS/Licence', manual.recettesBtsLicence],
                  ['Master/Ingé', manual.recettesMasterIng],
                ] as [string, number][])
                  .filter(([, v]) => v > 0)
                  .map(([label, v]) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label} : {formatEur(v)} ({((v / computed.totalRecettesNiveau) * 100).toFixed(1)}%)
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Alertes réglementaires ─────────────────────────────── */}
      {(computed.resultatExploitation < 0 || computed.solde185Net < 0 || computed.ecartPrevReal > 10) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Alertes réglementaires CFA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {computed.resultatExploitation < 0 && (
              <p>🔴 <strong>Déficit d'exploitation</strong> de {formatEur(Math.abs(computed.resultatExploitation))} — Report sur le budget principal (M9-6 §2.1.2.3.2).</p>
            )}
            {computed.solde185Net < 0 && (
              <p>🔴 <strong>C/185 en solde créditeur</strong> ({formatEur(Math.abs(computed.solde185Net))}) — Le CFA est débiteur envers le principal.</p>
            )}
            {computed.ecartPrevReal > 10 && (
              <p>🟠 <strong>Écart prévisions/réalisations &gt; 10%</strong> ({computed.ecartPrevReal.toFixed(1)}%) — Justifier l'écart avec les conventions France Compétences.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={save} className="gap-2">
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Enregistré' : 'Enregistrer les saisies manuelles'}
        </Button>
      </div>
    </div>
  );
}
