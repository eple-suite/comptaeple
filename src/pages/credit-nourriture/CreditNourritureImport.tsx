import { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Info, Loader2, Trash2,
  Calendar, TrendingUp, TrendingDown, UtensilsCrossed, Printer, Download, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { analyserFichierSrh, calculerCreditNourriture, type BilanSrhImport } from '@/lib/creditNourritureEngine';
import { bilanJoursService, CALENDRIERS_GUADELOUPE, detecterAnneeScolaire } from '@/lib/calendrierGuadeloupe';
import { formatCurrency } from '@/lib/mockData';
import { createStyledPDF, savePDF, printPDF } from '@/lib/pdfUtils';
import autoTable from 'jspdf-autotable';

type Status = 'idle' | 'parsing' | 'ready' | 'error';

const TYPE_LABELS: Record<string, string> = {
  charge_denree: '🥖 Denrées (charge)',
  recette_dp: '🍽️ Recettes DP',
  recette_interne: '🛏️ Recettes Internes',
  recette_commensal: '👥 Recettes Commensaux',
  stock_denree: '📦 Stock denrées',
};

export default function CreditNourritureImport() {
  const [status, setStatus] = useState<Status>('idle');
  const [bilan, setBilan] = useState<BilanSrhImport | null>(null);
  const [fileName, setFileName] = useState('');
  const [stockInitial, setStockInitial] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const calendrier = useMemo(() => bilanJoursService(new Date()), []);

  const calcul = useMemo(() => {
    if (!bilan) return null;
    return calculerCreditNourriture({
      recettesEligibles: bilan.recettesEligiblesRealise,
      chargesDenrees: bilan.chargesDenreesRealise,
      stockInitial,
      joursEcoules: calendrier.joursEcoules,
      joursRestants: calendrier.joursRestants,
    });
  }, [bilan, stockInitial, calendrier]);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus('parsing');
    setBilan(null);
    const result = await analyserFichierSrh(file);
    setBilan(result);
    if (result.success) {
      // Pré-remplir le stock si détecté
      if (result.stockDenreesDetecte > 0) setStockInitial(result.stockDenreesDetecte);
      setStatus('ready');
      toast.success(`${result.lignes.length} ligne(s) SRH détectée(s) sur ${result.feuillesAnalysees.length} onglet(s).`);
    } else {
      setStatus('error');
    }
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const reset = () => {
    setStatus('idle');
    setBilan(null);
    setFileName('');
    setStockInitial(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportPDF = (print = false) => {
    if (!bilan || !calcul) return;
    const doc = createStyledPDF({
      orientation: 'portrait',
      title: 'Crédit Nourriture — Projection annuelle',
      subtitle: `Année scolaire ${calendrier.anneeScolaire} • Guadeloupe • ${new Date().toLocaleDateString('fr-FR')}`,
    });
    let y = 48;
    const margin = 14;

    doc.setTextColor(37, 68, 120);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    const verdict = {
      excedent: '✅ EXCÉDENT — Marge confortable',
      equilibre: '✅ ÉQUILIBRE — Trajectoire saine',
      tension: '⚠️ TENSION — Vigilance requise',
      deficit: '⛔ DÉFICIT PRÉVISIONNEL — Action urgente',
    }[calcul.statut];
    doc.text(verdict, margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Période analysée', `${calendrier.dateRentree} → ${calendrier.dateFin}`],
        ['Jours de service total', `${calendrier.joursTotalAnnee} j`],
        ['Jours écoulés', `${calendrier.joursEcoules} j (${calendrier.pourcentageEcoule.toFixed(1)}%)`],
        ['Jours restants', `${calendrier.joursRestants} j`],
        [' ', ' '],
        ['Recettes éligibles encaissées (706x)', formatCurrency(calcul.recettesEligibles)],
        ['  • dont Demi-pension (7066)', formatCurrency(bilan.recettesDpRealise)],
        ['  • dont Internat (7067)', formatCurrency(bilan.recettesInternesRealise)],
        ['  • dont Commensaux (7068)', formatCurrency(bilan.recettesCommensauxRealise)],
        ['Stock initial denrées (cpt 31)', formatCurrency(calcul.stockInitial)],
        ['Charges denrées réalisées (6011)', formatCurrency(calcul.chargesDenrees)],
        [' ', ' '],
        ['CRÉDIT NOURRITURE DISPONIBLE', formatCurrency(calcul.creditDisponible)],
        ['Coût moyen / jour de service', formatCurrency(calcul.coutMoyenJour)],
        ['Projection charges restantes', formatCurrency(calcul.projectionChargesRestantes)],
        ['Solde projeté en fin d’année', formatCurrency(calcul.soldeProjeteFin)],
      ],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: 'right' } },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Formule M9-6 : Crédit = (Recettes éligibles + Stock initial) − Charges denrées', margin, finalY);
    doc.text(`Source : ${fileName} — Calendrier zone Caraïbes (académie de Guadeloupe).`, margin, finalY + 5);

    if (print) printPDF(doc);
    else savePDF(doc, `credit_nourriture_${calendrier.anneeScolaire}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête calendrier */}
      <Card className="shadow-card">
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Année scolaire {calendrier.anneeScolaire} • Académie de Guadeloupe
              </p>
              <h2 className="text-lg font-bold font-display tracking-tight">
                {calendrier.joursRestants} jours de service restants
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {calendrier.joursEcoules} jours écoulés sur {calendrier.joursTotalAnnee} • Calcul à la date du {new Date().toLocaleDateString('fr-FR')}
                {calendrier.prochaineVacances && ` • Prochaines vacances : ${calendrier.prochaineVacances.nom} (${calendrier.prochaineVacances.debut})`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <Progress value={calendrier.pourcentageEcoule} className="h-2 w-32" />
              <p className="text-[10px] text-muted-foreground mt-1">{calendrier.pourcentageEcoule.toFixed(1)}% écoulé</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      {(status === 'idle' || status === 'error') && (
        <Card
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
          }`}
          onClick={() => fileRef.current?.click()}
        >
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Importez votre situation des dépenses & recettes Op@le
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                L’application détecte automatiquement les comptes 6011 (denrées) et 7066/7067/7068 (recettes SRH)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">.xlsx</Badge>
              <Badge variant="outline" className="text-[10px]">.xls</Badge>
              <Badge variant="outline" className="text-[10px]">.csv</Badge>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFile}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {status === 'parsing' && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium">Analyse de {fileName}…</p>
          </CardContent>
        </Card>
      )}

      {status === 'error' && bilan && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-sm">Import impossible</span>
            </div>
            {bilan.errors.map((e, i) => (
              <p key={i} className="text-sm text-destructive/80">{e}</p>
            ))}
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Recommencer
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'ready' && bilan && calcul && (
        <>
          {/* Verdict */}
          <Card className={`shadow-card border-l-4 ${
            calcul.statut === 'excedent' ? 'border-l-success' :
            calcul.statut === 'equilibre' ? 'border-l-primary' :
            calcul.statut === 'tension' ? 'border-l-warning' :
            'border-l-destructive'
          }`}>
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                {calcul.statut === 'deficit' ? (
                  <AlertTriangle className="h-10 w-10 text-destructive shrink-0" />
                ) : calcul.statut === 'tension' ? (
                  <AlertTriangle className="h-10 w-10 text-warning shrink-0" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-success shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold font-display">
                    {calcul.statut === 'excedent' && '✅ Excédent prévisionnel — Marge confortable'}
                    {calcul.statut === 'equilibre' && '✅ Équilibre — Trajectoire saine'}
                    {calcul.statut === 'tension' && '⚠️ Tension — Surveiller les commandes'}
                    {calcul.statut === 'deficit' && '⛔ Déficit prévisionnel — Action requise'}
                  </h3>
                  <div className="space-y-1 mt-2">
                    {calcul.alertes.map((a, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{a}</p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => exportPDF(true)}>
                    <Printer className="h-4 w-4 mr-1" /> Imprimer
                  </Button>
                  <Button size="sm" className="gradient-primary border-0" onClick={() => exportPDF(false)}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiTile
              label="Recettes éligibles"
              value={formatCurrency(calcul.recettesEligibles)}
              hint="DP + Internat + Commensaux"
              icon={TrendingUp}
              tone="primary"
            />
            <KpiTile
              label="Charges denrées"
              value={formatCurrency(calcul.chargesDenrees)}
              hint="Compte 6011 réalisé"
              icon={UtensilsCrossed}
              tone="warning"
            />
            <KpiTile
              label="Crédit disponible"
              value={formatCurrency(calcul.creditDisponible)}
              hint="(Recettes + Stock) − Charges"
              icon={CheckCircle2}
              tone={calcul.creditDisponible >= 0 ? 'success' : 'destructive'}
            />
            <KpiTile
              label="Solde fin d’année"
              value={formatCurrency(calcul.soldeProjeteFin)}
              hint={`Au rythme de ${formatCurrency(calcul.coutMoyenJour)}/j sur ${calendrier.joursRestants} j`}
              icon={calcul.soldeProjeteFin >= 0 ? TrendingUp : TrendingDown}
              tone={calcul.soldeProjeteFin >= 0 ? 'success' : 'destructive'}
            />
          </div>

          {/* Saisie stock initial */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Stock initial de denrées (compte 31 au 1er sept)
              </CardTitle>
              <CardDescription className="text-xs">
                {bilan.stockDenreesDetecte > 0
                  ? `Détecté automatiquement depuis l’import : ${formatCurrency(bilan.stockDenreesDetecte)}. Vous pouvez l’ajuster.`
                  : "Le stock n’a pas été trouvé dans le fichier (généralement absent des SDE/SDR). Saisissez-le depuis votre balance ou inventaire."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 max-w-md">
                <Label htmlFor="stockInit" className="text-sm shrink-0">Stock denrées (€)</Label>
                <Input
                  id="stockInit"
                  type="number"
                  value={stockInitial}
                  onChange={(e) => setStockInitial(Number(e.target.value) || 0)}
                  step="100"
                />
              </div>
            </CardContent>
          </Card>

          {/* Détail par compte */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Lignes détectées — {bilan.lignes.length} compte(s) sur {bilan.feuillesAnalysees.length} onglet(s)
              </CardTitle>
              <CardDescription className="text-xs">
                Source : {fileName} • Onglets : {bilan.feuillesAnalysees.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Type</TableHead>
                      <TableHead>Compte</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Réalisé</TableHead>
                      <TableHead className="text-right">Reste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bilan.lignes.slice(0, 30).map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{TYPE_LABELS[l.type]}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">{l.compte}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[260px]">{l.libelle || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(l.budget)}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(l.realise)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatCurrency(l.reste)}</TableCell>
                      </TableRow>
                    ))}
                    {bilan.lignes.length > 30 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs italic text-muted-foreground">
                          … et {bilan.lignes.length - 30} ligne(s) supplémentaire(s)
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {bilan.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {bilan.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded p-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {w}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Méthodologie */}
          <Card className="shadow-card border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Méthodologie M9-6 / Calendrier Guadeloupe
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p><strong className="text-foreground">Formule :</strong> Crédit nourriture = (Recettes éligibles encaissées + Stock initial denrées) − Charges denrées réalisées</p>
              <p><strong className="text-foreground">Comptes détectés :</strong> 6011* (denrées) côté charges ; 7066* (DP), 7067* (internat), 7068* (commensaux) côté recettes ; 31* pour le stock.</p>
              <p><strong className="text-foreground">Jours de service :</strong> Lundi–vendredi hors vacances zone Caraïbes et fériés Guadeloupe (Abolition esclavage 27 mai inclus).</p>
              <p><strong className="text-foreground">Projection :</strong> Coût/jour = Charges réalisées ÷ Jours écoulés. Projection = Coût/jour × Jours restants.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'primary' | 'success' | 'warning' | 'destructive';
}

function KpiTile({ label, value, hint, icon: Icon, tone }: KpiTileProps) {
  const toneClasses = {
    primary: 'border-l-primary bg-primary/5',
    success: 'border-l-success bg-success/5',
    warning: 'border-l-warning bg-warning/5',
    destructive: 'border-l-destructive bg-destructive/5',
  }[tone];
  const iconClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone];

  return (
    <Card className={`shadow-card border-l-4 ${toneClasses}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold font-mono mt-1 truncate">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</p>
          </div>
          <Icon className={`h-5 w-5 shrink-0 ${iconClasses}`} />
        </div>
      </CardContent>
    </Card>
  );
}
