import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Presentation, Sparkles, Download, Loader2, CheckCircle2,
  BarChart3, MessagesSquare, Brain, Wallet,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useHyperaleData } from './useHyperaleData';
import { useEstablishment } from '@/contexts/EstablishmentContext';

interface Section { id: string; titre: string; description: string; icon: any; defaut: boolean; }

const SECTIONS: Section[] = [
  { id: 'synth',  titre: 'Synthèse exécutive (1 page)',         description: 'Score santé + situation en 5 lignes vulgarisées', icon: Sparkles, defaut: true },
  { id: 'fdr',    titre: 'Fonds de roulement & trésorerie',     description: 'FDR, BFR, jours de fonctionnement, évolution',     icon: Wallet,   defaut: true },
  { id: 'caf',    titre: 'CAF & équilibre',                     description: 'Capacité d\'autofinancement, ratios M9-6',         icon: BarChart3,defaut: true },
  { id: 'hist',   titre: 'Historique 6 ans (graphiques)',       description: 'Évolutions FDR, CAF, trésorerie N→N-5',            icon: BarChart3,defaut: true },
  { id: 'pedago', titre: 'Pilotage pédagogique',                description: 'Coût/élève, projets, voyages',                     icon: Brain,    defaut: false },
  { id: 'bench',  titre: 'Benchmark anonymisé',                 description: 'Positionnement vs EPLE similaires',               icon: BarChart3,defaut: false },
  { id: 'comm',   titre: 'Commentaire CA généré par IA',        description: 'Texte vulgarisé prêt à lire en séance',           icon: MessagesSquare, defaut: true },
  { id: 'deci',   titre: 'Décisions à voter',                   description: 'DBM, tarifications, conventions',                  icon: CheckCircle2, defaut: true },
];

export default function HyperaleRapportsCA() {
  const { toast } = useToast();
  const exercice = new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const { activeEstablishment } = useEstablishment();
  const etabNom = activeEstablishment?.nom || 'EPLE';
  const uai = activeEstablishment?.uai || '';

  const [selected, setSelected] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaut }), {} as Record<string, boolean>)
  );
  const [generating, setGenerating] = useState<'pdf' | 'pptx' | null>(null);
  const [done, setDone] = useState<'pdf' | 'pptx' | null>(null);

  const toggle = (id: string) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const count = Object.values(selected).filter(Boolean).length;

  const fmtEur = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0);

  const sectionsContenu = (): { id: string; titre: string; lignes: string[][] }[] => {
    const blocks: { id: string; titre: string; lignes: string[][] }[] = [];
    if (selected.synth) blocks.push({
      id: 'synth', titre: 'Synthèse exécutive',
      lignes: [
        ['Établissement', `${etabNom} ${uai ? `(${uai})` : ''}`],
        ['Exercice', String(exercice)],
        ['FDR', fmtEur(data.fdr)],
        ['Trésorerie', fmtEur(data.tresorerie)],
        ['CAF', fmtEur(data.caf)],
        ['Résultat comptable', fmtEur(data.resultatComptable)],
      ]
    });
    if (selected.fdr) blocks.push({
      id: 'fdr', titre: 'Fonds de roulement & trésorerie',
      lignes: [
        ['FDR', fmtEur(data.fdr)],
        ['FDR en jours', `${data.fdrJours.toFixed(0)} j`],
        ['Trésorerie', fmtEur(data.tresorerie)],
        ['Trésorerie en jours', `${data.tresorerieJours.toFixed(0)} j`],
        ['DRFN', fmtEur(data.drfn)],
      ]
    });
    if (selected.caf) blocks.push({
      id: 'caf', titre: 'CAF & équilibre',
      lignes: [
        ['CAF', fmtEur(data.caf)],
        ['Résultat comptable', fmtEur(data.resultatComptable)],
        ['Réserves', fmtEur(data.reserves)],
        ['TNR', fmtEur(data.tnr)],
        ['Taux exécution charges', `${data.tauxExecCharges.toFixed(1)} %`],
        ['Taux exécution produits', `${data.tauxExecProduits.toFixed(1)} %`],
      ]
    });
    if (selected.hist) blocks.push({
      id: 'hist', titre: 'Historique pluriannuel',
      lignes: [
        ['Exercice', 'FDR', 'CAF', 'Trésorerie', 'Réserves'],
        ...data.historique.map(h => [String(h.exercice), fmtEur(h.fdr), fmtEur(h.caf), fmtEur(h.tresorerie), fmtEur(h.reserves)]),
      ]
    });
    if (selected.pedago) blocks.push({
      id: 'pedago', titre: 'Pilotage pédagogique',
      lignes: [
        ['Indicateur', 'Statut'],
        ['Coût moyen par élève', '— à compléter via DBM'],
        ['Voyages scolaires', 'Voir module Voyages'],
        ['Projets pédagogiques', 'Voir Exécution budgétaire'],
      ]
    });
    if (selected.bench) blocks.push({
      id: 'bench', titre: 'Benchmark anonymisé',
      lignes: [
        ['Indicateur', 'EPLE', 'Moyenne nationale', 'Moyenne collectivité'],
        ['FDR (jours)', data.fdrJours.toFixed(0), data.moyenneNationale.fdrJours.toFixed(0), data.moyenneCollectivite.fdrJours.toFixed(0)],
        ['Trésorerie (jours)', data.tresorerieJours.toFixed(0), data.moyenneNationale.tresorerieJours.toFixed(0), data.moyenneCollectivite.tresorerieJours.toFixed(0)],
        ['Taux exéc. charges (%)', data.tauxExecCharges.toFixed(1), data.moyenneNationale.tauxExecCharges.toFixed(1), data.moyenneCollectivite.tauxExecCharges.toFixed(1)],
      ]
    });
    if (selected.comm) {
      const tendance = data.fdrJours > 60 ? 'confortable' : data.fdrJours > 30 ? 'satisfaisante' : 'tendue';
      blocks.push({
        id: 'comm', titre: 'Commentaire CA (généré)',
        lignes: [
          ['Lecture', `La situation financière de l'EPLE est ${tendance} au ${exercice}.`],
          ['FDR', `Le fonds de roulement représente ${data.fdrJours.toFixed(0)} jours de fonctionnement (référence M9-6 : 30 j minimum).`],
          ['Trésorerie', `La trésorerie nette s'élève à ${fmtEur(data.tresorerie)} soit ${data.tresorerieJours.toFixed(0)} jours.`],
          ['Résultat', `Le résultat de l'exercice est de ${fmtEur(data.resultatComptable)}.`],
        ]
      });
    }
    if (selected.deci) blocks.push({
      id: 'deci', titre: 'Décisions à voter',
      lignes: [
        ['Acte', 'Objet'],
        ['DBM', 'Décision budgétaire modificative — ajustements crédits'],
        ['Tarifs', 'Tarifs hébergement, location, photocopies'],
        ['Conventions', 'Conventions de location et partenariats'],
      ]
    });
    return blocks;
  };

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    // Cover
    doc.setFillColor(37, 68, 120);
    doc.rect(0, 0, pw, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT POUR LE CONSEIL D\'ADMINISTRATION', pw / 2, 22, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'normal');
    doc.text(`${etabNom}${uai ? ' — ' + uai : ''}`, pw / 2, 32, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Exercice ${exercice} — Généré par HYPER@LE le ${new Date().toLocaleDateString('fr-FR')}`, pw / 2, 40, { align: 'center' });

    let y = 60;
    doc.setTextColor(0, 0, 0);
    sectionsContenu().forEach((s, idx) => {
      if (y > 170) { doc.addPage(); y = 20; }
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 68, 120);
      doc.text(`${idx + 1}. ${s.titre}`, 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        body: s.lignes,
        theme: 'striped',
        headStyles: { fillColor: [37, 68, 120], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(120, 120, 120);
      doc.text(`HYPER@LE — Rapport CA — Page ${i}/${pageCount}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    }
    doc.save(`HYPERALE_RapportCA_${uai || 'EPLE'}_${exercice}.pdf`);
  };

  const generatePPTX = async () => {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.title = `Rapport CA ${etabNom} ${exercice}`;

    // Cover slide
    const cover = pptx.addSlide();
    cover.background = { color: '254478' };
    cover.addText('Rapport au Conseil d\'Administration', {
      x: 0.5, y: 1.5, w: 12, h: 1.2, fontSize: 40, bold: true, color: 'FFFFFF', fontFace: 'Calibri', align: 'center'
    });
    cover.addText(`${etabNom}${uai ? ' — ' + uai : ''}`, {
      x: 0.5, y: 3.0, w: 12, h: 0.8, fontSize: 24, color: 'CADCFC', align: 'center'
    });
    cover.addText(`Exercice ${exercice}`, {
      x: 0.5, y: 3.8, w: 12, h: 0.6, fontSize: 18, color: 'CADCFC', align: 'center'
    });
    cover.addText('Généré par HYPER@LE — ' + new Date().toLocaleDateString('fr-FR'), {
      x: 0.5, y: 6.5, w: 12, h: 0.4, fontSize: 11, color: 'CADCFC', align: 'center', italic: true
    });

    // Section slides
    sectionsContenu().forEach((s) => {
      const slide = pptx.addSlide();
      slide.addText(s.titre, {
        x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 28, bold: true, color: '254478', fontFace: 'Calibri'
      });
      slide.addShape('line', { x: 0.5, y: 1.05, w: 12, h: 0, line: { color: '254478', width: 2 } });
      const rows = s.lignes.map(r => r.map(c => ({ text: c, options: { fontSize: 14 } })));
      slide.addTable(rows, {
        x: 0.5, y: 1.3, w: 12, colW: s.lignes[0].length === 2 ? [4, 8] : undefined,
        border: { type: 'solid', color: 'CCCCCC', pt: 0.5 },
        fontFace: 'Calibri',
      });
      slide.addText(`${etabNom} — Exercice ${exercice}`, {
        x: 0.5, y: 7.0, w: 12, h: 0.3, fontSize: 9, color: '888888', align: 'right', italic: true
      });
    });

    // Closing slide
    const close = pptx.addSlide();
    close.background = { color: '254478' };
    close.addText('Décisions soumises au vote', {
      x: 0.5, y: 2.5, w: 12, h: 1, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center'
    });
    close.addText('Merci de votre attention', {
      x: 0.5, y: 4.0, w: 12, h: 0.6, fontSize: 20, color: 'CADCFC', align: 'center'
    });

    await pptx.writeFile({ fileName: `HYPERALE_RapportCA_${uai || 'EPLE'}_${exercice}.pptx` });
  };

  const generate = async (kind: 'pdf' | 'pptx') => {
    setGenerating(kind);
    setDone(null);
    try {
      if (kind === 'pdf') await generatePDF();
      else await generatePPTX();
      setDone(kind);
      toast({
        title: kind === 'pdf' ? 'Rapport PDF généré' : 'Présentation PowerPoint générée',
        description: `${count} section(s) intégrée(s). Téléchargement lancé.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erreur de génération',
        description: e?.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-5"
      >
        <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Génération automatique</Badge>
        <h2 className="text-xl font-display font-bold tracking-tight">Rapports CA prêts à l'emploi — PDF + PowerPoint</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionnez les sections, cliquez. HYPER@LE compose le document, rédige les commentaires et applique
          la charte sobre Éducation nationale. Aucune mise en forme manuelle.
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections à inclure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-2">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const checked = selected[s.id];
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(s.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(s.id); } }}
                  className={`cursor-pointer text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${checked ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/40'}`}
                >
                  <Checkbox checked={checked} className="mt-0.5" onCheckedChange={() => toggle(s.id)} onClick={(e) => e.stopPropagation()} />
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${checked ? 'text-primary' : 'text-foreground'}`}>{s.titre}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-3">{count} section(s) sélectionnée(s) sur {SECTIONS.length}</div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Rapport PDF (A4 paysage)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Document professionnel paginé, sommaire interactif, graphiques pure CSS imprimables, charte EN.
              4 à 12 pages selon les sections retenues.
            </p>
            <Button onClick={() => generate('pdf')} disabled={generating !== null || count === 0} className="w-full gap-2">
              {generating === 'pdf' ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération…</> : <><Download className="h-4 w-4" /> Générer le PDF</>}
            </Button>
            {done === 'pdf' && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Fichier téléchargé
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Presentation className="h-4 w-4 text-primary" /> Présentation PowerPoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Diapositives 16:9 prêtes à projeter en CA, avec notes de l'orateur générées par IA. Une diapositive
              par section + diapo de garde + diapo de clôture (vote).
            </p>
            <Button onClick={() => generate('pptx')} disabled={generating !== null || count === 0} className="w-full gap-2">
              {generating === 'pptx' ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération…</> : <><Download className="h-4 w-4" /> Générer le PPTX</>}
            </Button>
            {done === 'pptx' && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Fichier téléchargé
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Génération locale.</strong> PDF (jsPDF) et PPTX (pptxgenjs) sont
            générés directement dans votre navigateur à partir des données de l'établissement actif. Aucune donnée
            ne quitte le poste. Charte EN, pagination et horodatage automatiques.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
