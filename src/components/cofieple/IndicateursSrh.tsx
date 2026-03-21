// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Indicateurs spécifiques SRH (Service de Restauration et d'Hébergement)
// 5 indicateurs M9-6 2026 §2.1.2.3.2
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
  TrendingUp, TrendingDown, DollarSign, Users,
  BarChart3, AlertTriangle, Save, CheckCircle2, Wallet,
  UtensilsCrossed, Building, BedDouble
} from 'lucide-react';
import { toast } from 'sonner';

interface SrhManualData {
  nbRepasServis: number;
  coutMoyenAcademique: number;
  nuitsDisponibles: number;
  nuitsOccupees: number;
}

const DEFAULTS: SrhManualData = {
  nbRepasServis: 0,
  coutMoyenAcademique: 0,
  nuitsDisponibles: 0,
  nuitsOccupees: 0,
};

const LS_KEY = 'cockpit_cf_srh_indicateurs';

export function IndicateursSrh() {
  const resultats = useCofiepleStore(s => s.resultats);
  const sdr = useCofiepleStore(s => s.sdr);
  const sdr1 = useCofiepleStore(s => s.sdr1);
  const sde = useCofiepleStore(s => s.sde);
  const balance = useCofiepleStore(s => s.balance);
  const etab = useCofiepleStore(s => s.etablissement);

  const r = resultats.annexe_autre;
  const bal = balance?.annexe_autre || [];
  const sdeRows = sde?.annexe_autre || [];
  const sdrRows = sdr?.annexe_autre || [];
  const sdrRows1 = sdr1?.annexe_autre || [];

  const [manual, setManual] = useState<SrhManualData>(DEFAULTS);
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
    toast.success('Indicateurs SRH enregistrés');
    setTimeout(() => setSaved(false), 2000);
  };

  const setField = (k: keyof SrhManualData, v: number) =>
    setManual(prev => ({ ...prev, [k]: v }));

  const computed = useMemo(() => {
    const totalCharges = r?.totalChargesSde ?? sdeRows.reduce((s, row) => s + row.realise, 0);
    const totalRecettes = r?.totalProduitsSdr ?? sdrRows.reduce((s, row) => s + row.realise, 0);

    // 1. Coût du repas
    const coutRepas = manual.nbRepasServis > 0 ? totalCharges / manual.nbRepasServis : 0;

    // 2. Taux d'occupation hébergement
    const tauxOccupation = manual.nuitsDisponibles > 0
      ? (manual.nuitsOccupees / manual.nuitsDisponibles) * 100
      : 0;

    // 3. Produits de restauration C/7066x — N et N-1
    const produitsRestauration = sdrRows
      .filter(row => row.compte.startsWith('7066'))
      .reduce((s, row) => s + row.realise, 0);
    const produitsRestaurationN1 = sdrRows1
      .filter(row => row.compte.startsWith('7066'))
      .reduce((s, row) => s + row.realise, 0);
    const evolutionProduits = produitsRestaurationN1 > 0
      ? ((produitsRestauration - produitsRestaurationN1) / produitsRestaurationN1) * 100
      : 0;

    // 4. Subvention CT dans le financement SRH (C/7471x, C/7472x, C/744x)
    const subventionCT = sdrRows
      .filter(row => row.compte.startsWith('7471') || row.compte.startsWith('7472') || row.compte.startsWith('744'))
      .reduce((s, row) => s + row.realise, 0);
    const partSubventionCT = totalRecettes > 0 ? (subventionCT / totalRecettes) * 100 : 0;

    // 5. Résultat SRH
    const resultatSRH = totalRecettes - totalCharges;

    // C/185
    const c185 = bal.filter(b => b.compte.startsWith('185'));
    const solde185Net = c185.reduce((s, b) => s + (b.solDbt || 0) - (b.solCrd || 0), 0);

    return {
      totalCharges, totalRecettes, coutRepas, tauxOccupation,
      produitsRestauration, produitsRestaurationN1, evolutionProduits,
      subventionCT, partSubventionCT, resultatSRH, solde185Net,
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
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune donnée SRH importée</p>
          <p className="text-sm mt-1">Importez les fichiers SDE et SDR du budget annexe SRH pour activer les indicateurs spécifiques.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UtensilsCrossed className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Indicateurs SRH</h2>
          <p className="text-sm text-muted-foreground">
            Service de Restauration et d'Hébergement — M9-6 §2.1.2.3.2 · Exercice {etab.exercice}
          </p>
        </div>
      </div>

      {/* ── Indicateurs automatiques ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={BarChart3}
          title="③ Produits de restauration (C/7066x)"
          value={formatEur(computed.produitsRestauration)}
          subtitle={computed.produitsRestaurationN1 > 0
            ? `N-1 : ${formatEur(computed.produitsRestaurationN1)} • Δ ${computed.evolutionProduits >= 0 ? '+' : ''}${computed.evolutionProduits.toFixed(1)}%`
            : 'Pas de données N-1'
          }
          alert={computed.evolutionProduits < -10}
          success={computed.evolutionProduits > 0}
        />
        <StatCard
          icon={Building}
          title="④ Part subvention CT"
          value={formatPct(computed.partSubventionCT / 100)}
          subtitle={`${formatEur(computed.subventionCT)} sur ${formatEur(computed.totalRecettes)} recettes`}
        />
        <StatCard
          icon={computed.resultatSRH >= 0 ? TrendingUp : TrendingDown}
          title="⑤ Résultat SRH"
          value={formatEur(computed.resultatSRH)}
          subtitle={
            Math.abs(computed.resultatSRH) < computed.totalRecettes * 0.02
              ? '✅ Équilibre atteint'
              : computed.resultatSRH < 0
              ? '⚠️ Déficit — Impact sur le budget principal (M9-6 §2.1.2.3.2)'
              : '🟠 Excédent significatif — Justifier ou ajuster les tarifs'
          }
          alert={computed.resultatSRH < 0}
          success={Math.abs(computed.resultatSRH) < computed.totalRecettes * 0.02}
        />
      </div>

      <Separator />

      {/* ── Saisies manuelles ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            ① Coût du repas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Nombre de repas servis (exercice)</Label>
              <Input type="number" value={manual.nbRepasServis || ''}
                onChange={e => setField('nbRepasServis', parseInt(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Coût moyen académique (€ / repas)</Label>
              <Input type="number" step="0.01" value={manual.coutMoyenAcademique || ''}
                onChange={e => setField('coutMoyenAcademique', parseFloat(e.target.value) || 0)}
                placeholder="0,00 €" />
            </div>
            <StatCard
              icon={DollarSign}
              title="Coût du repas calculé"
              value={computed.coutRepas > 0 ? formatEur(computed.coutRepas) : '—'}
              subtitle={
                manual.coutMoyenAcademique > 0 && computed.coutRepas > 0
                  ? `Réf. académique : ${formatEur(manual.coutMoyenAcademique)} • ${computed.coutRepas > manual.coutMoyenAcademique * 1.1 ? '🔴 Au-dessus (+10%)' : computed.coutRepas < manual.coutMoyenAcademique * 0.9 ? '🟠 En-dessous (−10%)' : '✅ Conforme'}`
                  : manual.nbRepasServis > 0
                  ? `${formatEur(computed.totalCharges)} / ${manual.nbRepasServis.toLocaleString('fr-FR')} repas`
                  : 'Saisir le nombre de repas'
              }
              alert={manual.coutMoyenAcademique > 0 && computed.coutRepas > manual.coutMoyenAcademique * 1.1}
              success={manual.coutMoyenAcademique > 0 && computed.coutRepas > 0 && computed.coutRepas <= manual.coutMoyenAcademique * 1.1}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            ② Taux d'occupation hébergement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Nuits disponibles (capacité × jours)</Label>
              <Input type="number" value={manual.nuitsDisponibles || ''}
                onChange={e => setField('nuitsDisponibles', parseInt(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Nuits occupées</Label>
              <Input type="number" value={manual.nuitsOccupees || ''}
                onChange={e => setField('nuitsOccupees', parseInt(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <StatCard
              icon={BedDouble}
              title="Taux d'occupation"
              value={computed.tauxOccupation > 0 ? `${computed.tauxOccupation.toFixed(1)}%` : '—'}
              subtitle={
                computed.tauxOccupation > 0
                  ? computed.tauxOccupation < 60
                    ? '🟠 Occupation faible — Analyser la capacité'
                    : computed.tauxOccupation > 95
                    ? '🔴 Surchargé — Capacité insuffisante'
                    : '✅ Occupation normale'
                  : 'Saisir les données d\'hébergement'
              }
              alert={computed.tauxOccupation > 95}
              success={computed.tauxOccupation >= 60 && computed.tauxOccupation <= 95}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Trésorerie C/185 ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={Wallet}
          title="Trésorerie SRH (C/185)"
          value={formatEur(computed.solde185Net)}
          subtitle={computed.solde185Net < 0
            ? '🔴 Solde créditeur anormal — Le SRH est débiteur envers le principal'
            : 'Fonds mis à disposition par le budget principal'
          }
          alert={computed.solde185Net < 0}
          success={computed.solde185Net > 0}
        />
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-medium text-sm">Synthèse financière SRH</p>
                <p><span className="text-muted-foreground">Charges totales :</span> <span className="font-mono font-semibold">{formatEur(computed.totalCharges)}</span></p>
                <p><span className="text-muted-foreground">Recettes totales :</span> <span className="font-mono font-semibold">{formatEur(computed.totalRecettes)}</span></p>
                <p><span className="text-muted-foreground">Résultat :</span> <span className={`font-mono font-semibold ${computed.resultatSRH >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{formatEur(computed.resultatSRH)}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alertes réglementaires ─────────────────────────────── */}
      {(computed.resultatSRH < 0 || computed.solde185Net < 0) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Alertes réglementaires SRH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {computed.resultatSRH < 0 && (
              <p>🔴 <strong>Déficit SRH</strong> de {formatEur(Math.abs(computed.resultatSRH))} — Le SRH doit tendre vers l'équilibre. Le déficit se reporte sur le budget principal (M9-6 §2.1.2.3.2).</p>
            )}
            {computed.solde185Net < 0 && (
              <p>🔴 <strong>C/185 en solde créditeur</strong> ({formatEur(Math.abs(computed.solde185Net))}) — Le SRH est débiteur envers le principal, situation anormale à justifier.</p>
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
