// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Indicateurs spécifiques GRETA
// 8 indicateurs M9-6 2026 §2.1.2.3.2 — Formation continue
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
  GraduationCap, Building, Briefcase, PieChart
} from 'lucide-react';
import { toast } from 'sonner';

interface GretaManualData {
  heuresStaPrevues: number;
  heuresStaRealisees: number;
  heuresFormationRealisees: number;
  recettesEntreprises: number;
  recettesOpco: number;
  recettesFranceTravail: number;
  recettesRegion: number;
  recettesParticuliers: number;
  recettesCpfAutre: number;
}

const DEFAULTS: GretaManualData = {
  heuresStaPrevues: 0,
  heuresStaRealisees: 0,
  heuresFormationRealisees: 0,
  recettesEntreprises: 0,
  recettesOpco: 0,
  recettesFranceTravail: 0,
  recettesRegion: 0,
  recettesParticuliers: 0,
  recettesCpfAutre: 0,
};

const LS_KEY = 'cockpit_cf_greta_indicateurs';

export function IndicateursGreta() {
  const resultats = useCofiepleStore(s => s.resultats);
  const sdr = useCofiepleStore(s => s.sdr);
  const sdr1 = useCofiepleStore(s => s.sdr1);
  const sde = useCofiepleStore(s => s.sde);
  const balance = useCofiepleStore(s => s.balance);
  const etab = useCofiepleStore(s => s.etablissement);

  const r = resultats.annexe_greta;
  const bal = balance?.annexe_greta || [];
  const sdeRows = sde?.annexe_greta || [];
  const sdrRows = sdr?.annexe_greta || [];
  const sdrRows1 = sdr1?.annexe_greta || [];

  const [manual, setManual] = useState<GretaManualData>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setManual({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(manual));
    setSaved(true);
    toast.success('Indicateurs GRETA enregistrés');
    setTimeout(() => setSaved(false), 2000);
  };

  const setField = (k: keyof GretaManualData, v: number) =>
    setManual(prev => ({ ...prev, [k]: v }));

  // ── Computed indicators ──────────────────────────────────────
  const computed = useMemo(() => {
    // Total charges GRETA (from SDE)
    const totalCharges = r?.totalChargesSde ?? sdeRows.reduce((s, row) => s + row.realise, 0);
    // Recettes formation = comptes 7067x
    const recettesFormation = sdrRows
      .filter(row => row.compte.startsWith('7067'))
      .reduce((s, row) => s + row.realise, 0);
    // CA = total produits réels (titres D3)
    const ca = r?.totalProduitsSdr ?? sdrRows.reduce((s, row) => s + row.realise, 0);
    // CA N-1
    const caN1 = sdrRows1.reduce((s, row) => s + row.realise, 0);
    // Charges personnel 641x
    const chargesPersonnel = sdeRows
      .filter(row => row.compte.startsWith('641'))
      .reduce((s, row) => s + row.realise, 0);
    // C/185 solde
    const c185 = bal.filter(b => b.compte.startsWith('185'));
    const solde185Dbt = c185.reduce((s, b) => s + (b.solDbt || 0), 0);
    const solde185Crd = c185.reduce((s, b) => s + (b.solCrd || 0), 0);
    const solde185Net = solde185Dbt - solde185Crd;

    // 1. Taux de couverture
    const tauxCouverture = totalCharges > 0 ? (recettesFormation / totalCharges) * 100 : 0;

    // 2. Évolution CA
    const variationCA = ca - caN1;
    const variationCAPct = caN1 > 0 ? (variationCA / caN1) * 100 : 0;

    // 3. Total recettes saisies par financeur
    const totalRecettesFinanceur =
      manual.recettesEntreprises + manual.recettesOpco + manual.recettesFranceTravail +
      manual.recettesRegion + manual.recettesParticuliers + manual.recettesCpfAutre;

    // 4. Taux de remplissage
    const tauxRemplissage = manual.heuresStaPrevues > 0
      ? (manual.heuresStaRealisees / manual.heuresStaPrevues) * 100 : 0;

    // 5. Coût horaire moyen
    const coutHoraire = manual.heuresFormationRealisees > 0
      ? totalCharges / manual.heuresFormationRealisees : 0;

    // 6. Résultat exploitation
    const resultatExploitation = ca - totalCharges;

    // 8. Part charges personnel
    const partChargesPersonnel = totalCharges > 0
      ? (chargesPersonnel / totalCharges) * 100 : 0;

    return {
      totalCharges, recettesFormation, ca, caN1, chargesPersonnel,
      solde185Net, solde185Dbt, solde185Crd,
      tauxCouverture, variationCA, variationCAPct,
      totalRecettesFinanceur, tauxRemplissage, coutHoraire,
      resultatExploitation, partChargesPersonnel,
    };
  }, [r, sdeRows, sdrRows, sdrRows1, bal, manual]);

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
          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune donnée GRETA importée</p>
          <p className="text-sm mt-1">Importez les fichiers SDE et SDR du budget annexe GRETA pour activer les indicateurs spécifiques.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Indicateurs GRETA</h2>
          <p className="text-sm text-muted-foreground">
            Formation continue — M9-6 §2.1.2.3.2 · Exercice {etab.exercice}
          </p>
        </div>
      </div>

      {/* ── Indicateurs automatiques (calculés) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Taux de couverture */}
        <StatCard
          icon={PieChart}
          title="① Taux de couverture charges/recettes"
          value={formatPct(computed.tauxCouverture / 100)}
          subtitle={`Seuil M9-6 : ≥ 100% • ${computed.tauxCouverture >= 100 ? '✅ Autofinancement atteint' : '⚠️ Sous le seuil d\'équilibre'}`}
          alert={computed.tauxCouverture < 100 && computed.tauxCouverture > 0}
          success={computed.tauxCouverture >= 100}
        />

        {/* 2. Chiffre d'affaires */}
        <StatCard
          icon={DollarSign}
          title="② Chiffre d'affaires formation (CA)"
          value={formatEur(computed.ca)}
          subtitle={computed.caN1 > 0
            ? `N-1 : ${formatEur(computed.caN1)} • Δ ${computed.variationCA >= 0 ? '+' : ''}${formatEur(computed.variationCA)} (${computed.variationCAPct >= 0 ? '+' : ''}${computed.variationCAPct.toFixed(1)}%)`
            : 'Pas de données N-1'
          }
          alert={computed.variationCA < 0}
          success={computed.variationCA > 0}
        />

        {/* 6. Résultat d'exploitation */}
        <StatCard
          icon={computed.resultatExploitation >= 0 ? TrendingUp : TrendingDown}
          title="⑥ Résultat d'exploitation GRETA"
          value={formatEur(computed.resultatExploitation)}
          subtitle={computed.resultatExploitation < 0
            ? '⚠️ Déficit — Impact sur le budget principal (M9-6 §2.1.2.3.2)'
            : '✅ Excédent d\'exploitation'
          }
          alert={computed.resultatExploitation < 0}
          success={computed.resultatExploitation >= 0}
        />

        {/* 7. FDR via C/185 */}
        <StatCard
          icon={Wallet}
          title="⑦ Trésorerie GRETA (C/185)"
          value={formatEur(computed.solde185Net)}
          subtitle={computed.solde185Net < 0
            ? '🔴 Solde créditeur — Le GRETA est débiteur envers le principal'
            : `Dbt ${formatEur(computed.solde185Dbt)} / Crd ${formatEur(computed.solde185Crd)}`
          }
          alert={computed.solde185Net < 0}
          success={computed.solde185Net > 0}
        />
      </div>

      {/* ── Indicateurs automatiques (2e ligne) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 8. Part charges personnel */}
        <StatCard
          icon={Users}
          title="⑧ Part des charges de personnel (C/641x)"
          value={formatPct(computed.partChargesPersonnel / 100)}
          subtitle={`${formatEur(computed.chargesPersonnel)} sur ${formatEur(computed.totalCharges)} total`}
        />

        {/* Total charges */}
        <StatCard
          icon={BarChart3}
          title="Total charges GRETA"
          value={formatEur(computed.totalCharges)}
          subtitle="Base de calcul des ratios"
        />

        {/* Recettes formation */}
        <StatCard
          icon={DollarSign}
          title="Recettes formation (C/7067x)"
          value={formatEur(computed.recettesFormation)}
          subtitle="Recettes propres de formation continue"
        />
      </div>

      <Separator />

      {/* ── Saisie manuelle ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Saisies manuelles — Heures et remplissage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Heures stagiaires prévues</Label>
              <Input type="number" value={manual.heuresStaPrevues || ''}
                onChange={e => setField('heuresStaPrevues', parseFloat(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Heures stagiaires réalisées</Label>
              <Input type="number" value={manual.heuresStaRealisees || ''}
                onChange={e => setField('heuresStaRealisees', parseFloat(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Heures de formation réalisées</Label>
              <Input type="number" value={manual.heuresFormationRealisees || ''}
                onChange={e => setField('heuresFormationRealisees', parseFloat(e.target.value) || 0)}
                placeholder="0" />
            </div>
          </div>

          {/* Computed from manual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              icon={BarChart3}
              title="④ Taux de remplissage des formations"
              value={computed.tauxRemplissage > 0 ? formatPct(computed.tauxRemplissage / 100) : '—'}
              subtitle={manual.heuresStaPrevues > 0
                ? `${manual.heuresStaRealisees.toLocaleString('fr-FR')}h / ${manual.heuresStaPrevues.toLocaleString('fr-FR')}h prévues`
                : 'Saisir les heures prévues et réalisées'
              }
              alert={computed.tauxRemplissage > 0 && computed.tauxRemplissage < 80}
              success={computed.tauxRemplissage >= 80}
            />
            <StatCard
              icon={DollarSign}
              title="⑤ Coût horaire moyen de formation"
              value={computed.coutHoraire > 0 ? formatEur(computed.coutHoraire) + '/h' : '—'}
              subtitle={manual.heuresFormationRealisees > 0
                ? `${formatEur(computed.totalCharges)} / ${manual.heuresFormationRealisees.toLocaleString('fr-FR')}h`
                : 'Saisir les heures de formation réalisées'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Recettes par type de financeur (saisie manuelle) ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            ③ Recettes par type de financeur (saisie manuelle)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              ['recettesEntreprises', 'Entreprises (Plan de Formation)', Building],
              ['recettesOpco', 'OPCO (ex-OPCA)', Briefcase],
              ['recettesFranceTravail', 'France Travail (Pôle Emploi)', Users],
              ['recettesRegion', 'Conseil Régional', Building],
              ['recettesParticuliers', 'Particuliers (fonds propres)', Wallet],
              ['recettesCpfAutre', 'CPF / FIFPL / Autres', GraduationCap],
            ] as [keyof GretaManualData, string, any][]).map(([key, label, Icon]) => (
              <div key={key}>
                <Label className="text-xs flex items-center gap-1">
                  <Icon className="h-3 w-3" /> {label}
                </Label>
                <Input type="number" value={manual[key] || ''}
                  onChange={e => setField(key, parseFloat(e.target.value) || 0)}
                  placeholder="0 €" />
              </div>
            ))}
          </div>

          {computed.totalRecettesFinanceur > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-2">Répartition saisie : {formatEur(computed.totalRecettesFinanceur)}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  ['Entreprises', manual.recettesEntreprises],
                  ['OPCO', manual.recettesOpco],
                  ['France Travail', manual.recettesFranceTravail],
                  ['Région', manual.recettesRegion],
                  ['Particuliers', manual.recettesParticuliers],
                  ['CPF/Autre', manual.recettesCpfAutre],
                ] as [string, number][])
                  .filter(([, v]) => v > 0)
                  .map(([label, v]) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label} : {formatEur(v)} ({((v / computed.totalRecettesFinanceur) * 100).toFixed(1)}%)
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Alertes réglementaires ─────────────────────────────── */}
      {(computed.resultatExploitation < 0 || computed.solde185Net < 0 || (computed.tauxCouverture > 0 && computed.tauxCouverture < 100)) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Alertes réglementaires GRETA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {computed.resultatExploitation < 0 && (
              <p>🔴 <strong>Déficit d'exploitation</strong> de {formatEur(Math.abs(computed.resultatExploitation))} — Le déficit du budget annexe se reporte sur le budget principal conformément à la M9-6 §2.1.2.3.2.</p>
            )}
            {computed.solde185Net < 0 && (
              <p>🔴 <strong>C/185 en solde créditeur</strong> ({formatEur(Math.abs(computed.solde185Net))}) — Le GRETA est débiteur envers le budget principal. Situation anormale à justifier avant l'arrêté.</p>
            )}
            {computed.tauxCouverture > 0 && computed.tauxCouverture < 100 && (
              <p>🟠 <strong>Taux de couverture insuffisant</strong> ({formatPct(computed.tauxCouverture / 100)}) — Le GRETA ne s'autofinance pas (seuil M9-6 ≥ 100%). Risque de ponction sur les réserves du principal.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={save} className="gap-2">
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Enregistré' : 'Enregistrer les saisies manuelles'}
        </Button>
      </div>
    </div>
  );
}
