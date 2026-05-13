import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Presentation, Sparkles, Download, Loader2, CheckCircle2,
  BarChart3, MessagesSquare, Brain, Wallet, Copy, ExternalLink, Wand2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useHyperaleData } from './useHyperaleData';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import {
  formatEurPdf, formatPctPdf, sanitizePdf,
  PDF_COLORS, drawRfHeader, drawInstitutionalFooter,
  drawKpiCard, drawBarChart, drawParagraph, drawCallout,
} from '@/lib/pdfHelpers';

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
  const { selectedEstablishment } = useEstablishment();
  const etabNom = selectedEstablishment?.name || 'EPLE';
  const uai = selectedEstablishment?.uai || '';

  const [selected, setSelected] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaut }), {} as Record<string, boolean>)
  );
  const [generating, setGenerating] = useState<'pdf' | null>(null);
  const [done, setDone] = useState<'pdf' | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState('');

  const toggle = (id: string) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const count = Object.values(selected).filter(Boolean).length;

  const fmtEur = (v: number) => formatEurPdf(v);

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

  // ─────────────────────────────────────────────────────────────────
  // Diagnostic vulgarisé (commentaires automatiques)
  // ─────────────────────────────────────────────────────────────────
  const diagnostic = () => {
    const fdrStatus: 'good' | 'warn' | 'bad' = data.fdrJours >= 60 ? 'good' : data.fdrJours >= 30 ? 'warn' : 'bad';
    const tresoStatus: 'good' | 'warn' | 'bad' = data.tresorerieJours >= 30 ? 'good' : data.tresorerieJours >= 15 ? 'warn' : 'bad';
    const cafStatus: 'good' | 'warn' | 'bad' = data.caf > 0 ? 'good' : data.caf === 0 ? 'warn' : 'bad';
    const resultStatus: 'good' | 'warn' | 'bad' = data.resultatComptable > 0 ? 'good' : data.resultatComptable === 0 ? 'warn' : 'bad';
    const tendance =
      data.fdrJours >= 60 ? 'confortable' :
      data.fdrJours >= 30 ? 'satisfaisante' :
      data.fdrJours >= 15 ? 'fragile' : 'préoccupante';
    return { fdrStatus, tresoStatus, cafStatus, resultStatus, tendance };
  };

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const M = 14;
    const D = diagnostic();

    // ───────── PAGE 1 — COUVERTURE ─────────
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(0, 0, pw, ph, 'F');
    // Bandeau supérieur
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RÉPUBLIQUE FRANÇAISE', pw / 2, 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('MINISTÈRE DE L\'ÉDUCATION NATIONALE', pw / 2, 24, { align: 'center' });
    // Filet doré
    doc.setDrawColor(...PDF_COLORS.accent);
    doc.setLineWidth(0.6);
    doc.line(pw / 2 - 30, 32, pw / 2 + 30, 32);
    // Titre principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('Rapport au Conseil', pw / 2, 80, { align: 'center' });
    doc.text("d'Administration", pw / 2, 92, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(202, 220, 252);
    doc.text(`Exercice ${exercice} — Analyse financière et orientations`, pw / 2, 106, { align: 'center' });
    // Bloc EPLE
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pw / 2 - 70, 130, 140, 32, 3, 3, 'F');
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(sanitizePdf(etabNom), pw / 2, 142, { align: 'center' });
    if (uai) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.text(`UAI ${uai}`, pw / 2, 150, { align: 'center' });
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} par HYPER@LE`, pw / 2, 158, { align: 'center' });
    // Pied couverture
    doc.setTextColor(202, 220, 252);
    doc.setFontSize(8);
    doc.text('Conformité M9-6 (tomes 1 à 4) · GBCP — Décret n° 2012-1246 · Code de l\'éducation', pw / 2, ph - 14, { align: 'center' });

    // ───────── PAGE 2 — SYNTHÈSE EXÉCUTIVE + KPI ─────────
    if (selected.synth) {
      doc.addPage();
      drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`);
      let y = 22;
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Synthèse exécutive', M, y);
      y += 8;
      // 4 KPI cards en ligne
      const cardW = (pw - 2 * M - 9) / 4;
      const cardH = 22;
      drawKpiCard(doc, M, y, cardW, cardH,
        'Fonds de roulement', fmtEur(data.fdr), D.fdrStatus,
        `${data.fdrJours.toFixed(0)} jours de fonctionnement`);
      drawKpiCard(doc, M + (cardW + 3), y, cardW, cardH,
        'Trésorerie nette', fmtEur(data.tresorerie), D.tresoStatus,
        `${data.tresorerieJours.toFixed(0)} jours de couverture`);
      drawKpiCard(doc, M + 2 * (cardW + 3), y, cardW, cardH,
        'Capacité d\'autofinancement', fmtEur(data.caf), D.cafStatus,
        data.caf >= 0 ? 'Positive' : 'Négative — vigilance');
      drawKpiCard(doc, M + 3 * (cardW + 3), y, cardW, cardH,
        'Résultat de l\'exercice', fmtEur(data.resultatComptable), D.resultStatus,
        data.resultatComptable >= 0 ? 'Excédent' : 'Déficit');
      y += cardH + 8;

      // Paragraphe vulgarisé
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Lecture vulgarisée pour le Conseil d\'Administration', M, y);
      y += 5;
      const intro =
        `La situation financière de l'établissement au titre de l'exercice ${exercice} est ${D.tendance}. ` +
        `Le fonds de roulement (${fmtEur(data.fdr)}) couvre ${data.fdrJours.toFixed(0)} jours de fonctionnement, ` +
        `la trésorerie nette (${fmtEur(data.tresorerie)}) représente ${data.tresorerieJours.toFixed(0)} jours d'autonomie. ` +
        `La capacité d'autofinancement s'établit à ${fmtEur(data.caf)} et le résultat comptable à ${fmtEur(data.resultatComptable)}. ` +
        `Les réserves disponibles atteignent ${fmtEur(data.reserves)}.`;
      y = drawParagraph(doc, M, y, pw - 2 * M, intro, 9.5);
      y += 4;

      // Callouts conclusion
      const calloutW = (pw - 2 * M - 6) / 2;
      let yLeft = y, yRight = y;
      yLeft = drawCallout(doc, M, yLeft, calloutW,
        D.fdrStatus === 'good' ? 'Fonds de roulement confortable' :
        D.fdrStatus === 'warn' ? 'Fonds de roulement à surveiller' : 'Fonds de roulement insuffisant',
        D.fdrStatus === 'good'
          ? `Au-dessus du seuil M9-6 de 30 jours. Marge de manœuvre disponible pour investir ou faire face à un imprévu.`
          : D.fdrStatus === 'warn'
          ? `Entre 30 et 60 jours. Suivi rapproché recommandé, prudence sur les engagements pluriannuels.`
          : `Sous le seuil de 30 jours fixé par la M9-6. Plan de redressement à présenter au CA et à l'autorité académique.`,
        D.fdrStatus,
      );
      yRight = drawCallout(doc, M + calloutW + 6, yRight, calloutW,
        D.cafStatus === 'good' ? 'Capacité d\'autofinancement positive' :
        D.cafStatus === 'warn' ? 'CAF à l\'équilibre' : 'CAF négative',
        D.cafStatus === 'good'
          ? `L'établissement dégage de la ressource pour autofinancer ses investissements sans recourir à des prélèvements.`
          : D.cafStatus === 'warn'
          ? `L'exploitation s'équilibre tout juste. Toute dégradation conjoncturelle pèserait sur le FDR.`
          : `L'exploitation consomme du fonds de roulement. Identifier les leviers : recettes propres, maîtrise SRH, énergie.`,
        D.cafStatus,
      );
    }

    // ───────── PAGE 3 — FDR & TRÉSORERIE ─────────
    if (selected.fdr) {
      doc.addPage();
      drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`);
      let y = 22;
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('1. Fonds de roulement et trésorerie', M, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur', 'Référence M9-6', 'Statut']],
        body: [
          ['Fonds de roulement (FDR)', fmtEur(data.fdr), '> 30 jours', D.fdrStatus === 'good' ? 'Confortable' : D.fdrStatus === 'warn' ? 'À surveiller' : 'Insuffisant'],
          ['FDR en jours', `${data.fdrJours.toFixed(0)} j`, '30 j minimum', D.fdrStatus === 'good' ? 'Conforme' : 'Vigilance'],
          ['Trésorerie nette', fmtEur(data.tresorerie), 'Positive', data.tresorerie >= 0 ? 'Conforme' : 'Alerte'],
          ['Trésorerie en jours', `${data.tresorerieJours.toFixed(0)} j`, '15 j minimum', D.tresoStatus === 'good' ? 'Conforme' : 'Vigilance'],
          ['DRFN (dépenses réelles de fonctionnement nettes)', fmtEur(data.drfn), 'Référence calcul', '—'],
        ],
        headStyles: { fillColor: PDF_COLORS.primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        margin: { left: M, right: M },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      const fdrComment =
        `Le fonds de roulement constitue la première marge de sécurité de l'établissement. ` +
        `Avec ${data.fdrJours.toFixed(0)} jours de fonctionnement, l'EPLE se situe ` +
        (D.fdrStatus === 'good'
          ? `au-dessus du seuil prudentiel de 30 jours fixé par l'instruction M9-6, ce qui autorise des engagements pluriannuels maîtrisés.`
          : D.fdrStatus === 'warn'
          ? `dans la zone de surveillance (30-60 jours). Une attention particulière sera portée aux DBM de l'exercice à venir.`
          : `sous le seuil de 30 jours. Un plan d'action chiffré sera présenté au prochain CA.`);
      drawParagraph(doc, M, y, pw - 2 * M, fdrComment, 9.5);
    }

    // ───────── PAGE 4 — CAF & ÉQUILIBRE ─────────
    if (selected.caf) {
      doc.addPage();
      drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`);
      let y = 22;
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('2. Capacité d\'autofinancement et équilibre', M, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur', 'Lecture']],
        body: [
          ['Capacité d\'autofinancement (CAF)', fmtEur(data.caf), data.caf >= 0 ? 'Ressource dégagée par l\'exploitation' : 'Insuffisance d\'autofinancement'],
          ['Résultat comptable', fmtEur(data.resultatComptable), data.resultatComptable >= 0 ? 'Excédent venant abonder les réserves' : 'Déficit prélevé sur les réserves'],
          ['Réserves disponibles', fmtEur(data.reserves), 'Cumul des résultats antérieurs'],
          ['TNR (taux de couverture des charges)', fmtEur(data.tnr), '—'],
          ['Taux d\'exécution des charges', formatPctPdf(data.tauxExecCharges), data.tauxExecCharges > 95 ? 'Très bonne sincérité' : 'À analyser par chapitre'],
          ['Taux d\'exécution des produits', formatPctPdf(data.tauxExecProduits), data.tauxExecProduits > 95 ? 'Recettes conformes aux prévisions' : 'Écart prévision/réalisation'],
        ],
        headStyles: { fillColor: PDF_COLORS.primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        margin: { left: M, right: M },
        columnStyles: { 1: { halign: 'right' } },
      });
    }

    // ───────── PAGE 5 — HISTORIQUE PLURIANNUEL avec mini-charts ─────────
    if (selected.hist && data.historique.length > 0) {
      doc.addPage();
      drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`);
      let y = 22;
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('3. Évolution pluriannuelle', M, y);
      y += 8;

      const labels = data.historique.map(h => String(h.exercice));
      const chartW = (pw - 2 * M - 6) / 2;
      const chartH = 50;
      drawBarChart(doc, M, y + 4, chartW, chartH, labels, data.historique.map(h => h.fdr), 'Fonds de roulement (€)');
      drawBarChart(doc, M + chartW + 6, y + 4, chartW, chartH, labels, data.historique.map(h => h.caf), 'CAF (€)');
      y += chartH + 14;
      drawBarChart(doc, M, y + 4, chartW, chartH, labels, data.historique.map(h => h.tresorerie), 'Trésorerie nette (€)');
      drawBarChart(doc, M + chartW + 6, y + 4, chartW, chartH, labels, data.historique.map(h => h.reserves), 'Réserves (€)');
      y += chartH + 14;

      autoTable(doc, {
        startY: y,
        head: [['Exercice', 'FDR', 'CAF', 'Trésorerie', 'Réserves']],
        body: data.historique.map(h => [String(h.exercice), fmtEur(h.fdr), fmtEur(h.caf), fmtEur(h.tresorerie), fmtEur(h.reserves)]),
        headStyles: { fillColor: PDF_COLORS.primary, textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        margin: { left: M, right: M },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      });
    }

    // ───────── PAGE — BENCHMARK ─────────
    if (selected.bench) {
      doc.addPage();
      drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`);
      let y = 22;
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('4. Positionnement (benchmark anonymisé)', M, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'EPLE', 'Moy. nationale', 'Moy. collectivité', 'Écart national']],
        body: [
          ['FDR (jours)', data.fdrJours.toFixed(0), data.moyenneNationale.fdrJours.toFixed(0), data.moyenneCollectivite.fdrJours.toFixed(0),
            `${(data.fdrJours - data.moyenneNationale.fdrJours).toFixed(0)} j`],
          ['Trésorerie (jours)', data.tresorerieJours.toFixed(0), data.moyenneNationale.tresorerieJours.toFixed(0), data.moyenneCollectivite.tresorerieJours.toFixed(0),
            `${(data.tresorerieJours - data.moyenneNationale.tresorerieJours).toFixed(0)} j`],
          ['Taux exéc. charges', formatPctPdf(data.tauxExecCharges), formatPctPdf(data.moyenneNationale.tauxExecCharges), formatPctPdf(data.moyenneCollectivite.tauxExecCharges),
            formatPctPdf(data.tauxExecCharges - data.moyenneNationale.tauxExecCharges)],
        ],
        headStyles: { fillColor: PDF_COLORS.primary, textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        margin: { left: M, right: M },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
      drawParagraph(doc, M, y, pw - 2 * M,
        `Le benchmark est calculé sur un échantillon anonymisé d'EPLE comparables (catégorie, effectif, présence d'un internat). ` +
        `Il constitue un repère, non une norme : les spécificités locales (projet d'établissement, contraintes immobilières) doivent être prises en compte dans la lecture.`,
        9.5,
      );
    }

    // ───────── PAGE — COMMENTAIRE CA + DÉCISIONS ─────────
    if (selected.comm || selected.deci) {
      doc.addPage();
      drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`);
      let y = 22;

      if (selected.comm) {
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('5. Commentaire à lire en séance', M, y);
        y += 7;
        const commentaire =
          `Mesdames, Messieurs les membres du Conseil d'Administration,\n\n` +
          `Je vous présente la situation financière de l'établissement au titre de l'exercice ${exercice}. ` +
          `Cette situation peut être qualifiée de ${D.tendance}.\n\n` +
          `Le fonds de roulement, qui mesure notre marge de sécurité financière, atteint ${fmtEur(data.fdr)}, ` +
          `soit l'équivalent de ${data.fdrJours.toFixed(0)} jours de fonctionnement courant. ` +
          `L'instruction M9-6 fixe un seuil prudentiel de 30 jours : nous nous situons ` +
          `${D.fdrStatus === 'good' ? 'confortablement au-dessus' : D.fdrStatus === 'warn' ? 'dans la zone de vigilance' : 'sous ce seuil, ce qui appelle un plan d\'action'}.\n\n` +
          `La trésorerie nette s'élève à ${fmtEur(data.tresorerie)}, garantissant ${data.tresorerieJours.toFixed(0)} jours d'autonomie de paiement. ` +
          `Le résultat de l'exercice est ${data.resultatComptable >= 0 ? 'excédentaire' : 'déficitaire'} de ${fmtEur(Math.abs(data.resultatComptable))}, ` +
          `et viendra ${data.resultatComptable >= 0 ? 'abonder' : 'prélever sur'} les réserves de l'établissement.\n\n` +
          `Je reste à votre disposition pour toute question complémentaire.`;
        y = drawParagraph(doc, M, y, pw - 2 * M, commentaire, 10);
        y += 6;
      }

      if (selected.deci) {
        if (y > ph - 50) { doc.addPage(); drawRfHeader(doc, `Rapport CA ${exercice} — ${etabNom}`); y = 22; }
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('6. Décisions soumises au vote', M, y);
        y += 7;
        autoTable(doc, {
          startY: y,
          head: [['N°', 'Acte', 'Objet', 'Avis du chef d\'établissement']],
          body: [
            ['1', 'DBM', 'Décision budgétaire modificative — ajustements de crédits', 'Favorable'],
            ['2', 'Tarifs', 'Tarification hébergement, location de salles, photocopies', 'Favorable'],
            ['3', 'Conventions', 'Conventions de partenariat et de location', 'Favorable'],
          ],
          headStyles: { fillColor: PDF_COLORS.primary, textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [248, 250, 253] },
          margin: { left: M, right: M },
        });
      }
    }

    // ───────── PIED DE PAGE ─────────
    drawInstitutionalFooter(doc, `HYPER@LE — Rapport CA — ${sanitizePdf(etabNom)} — Exercice ${exercice}`);
    doc.save(`HYPERALE_RapportCA_${uai || 'EPLE'}_${exercice}.pdf`);
  };

  // ─────────────────────────────────────────────────────────────────
  // Génération du prompt structuré pour NotebookLM / Gamma.ai
  // ─────────────────────────────────────────────────────────────────
  const buildAiPrompt = () => {
    const D = diagnostic();
    const sections = sectionsContenu();
    const lignes: string[] = [];
    lignes.push(`# Rapport au Conseil d'Administration — ${etabNom}${uai ? ` (UAI ${uai})` : ''}`);
    lignes.push(`Exercice : ${exercice}`);
    lignes.push('');
    lignes.push(`## Mission`);
    lignes.push(`Tu es expert-comptable des EPLE (instruction M9-6). Produis une présentation professionnelle de 8 à 12 diapositives, sobre, charte Éducation nationale, destinée au Conseil d'Administration. Vulgarise les notions techniques pour des membres non-spécialistes.`);
    lignes.push('');
    lignes.push(`## Situation synthétique`);
    lignes.push(`- Tendance générale : ${D.tendance}`);
    lignes.push(`- Fonds de roulement : ${fmtEur(data.fdr)} (${data.fdrJours.toFixed(0)} jours) — ${D.fdrStatus}`);
    lignes.push(`- Trésorerie nette : ${fmtEur(data.tresorerie)} (${data.tresorerieJours.toFixed(0)} jours) — ${D.tresoStatus}`);
    lignes.push(`- CAF : ${fmtEur(data.caf)} — ${D.cafStatus}`);
    lignes.push(`- Résultat comptable : ${fmtEur(data.resultatComptable)} — ${D.resultStatus}`);
    lignes.push(`- Réserves : ${fmtEur(data.reserves)}`);
    lignes.push(`- Taux exécution charges : ${formatPctPdf(data.tauxExecCharges)}`);
    lignes.push(`- Taux exécution produits : ${formatPctPdf(data.tauxExecProduits)}`);
    lignes.push('');
    if (data.historique.length > 0) {
      lignes.push(`## Historique pluriannuel`);
      lignes.push(`| Exercice | FDR | CAF | Trésorerie | Réserves |`);
      lignes.push(`|---|---|---|---|---|`);
      data.historique.forEach(h => {
        lignes.push(`| ${h.exercice} | ${fmtEur(h.fdr)} | ${fmtEur(h.caf)} | ${fmtEur(h.tresorerie)} | ${fmtEur(h.reserves)} |`);
      });
      lignes.push('');
    }
    lignes.push(`## Sections demandées`);
    sections.forEach(s => {
      lignes.push(`### ${s.titre}`);
      s.lignes.forEach(l => lignes.push(`- ${l.join(' : ')}`));
      lignes.push('');
    });
    lignes.push(`## Plan demandé`);
    lignes.push(`1. Diapo de garde (titre, EPLE, exercice)`);
    lignes.push(`2. Synthèse exécutive en 4 KPI (FDR, Trésorerie, CAF, Résultat)`);
    lignes.push(`3. Lecture vulgarisée pour non-spécialistes`);
    lignes.push(`4. Fonds de roulement et trésorerie (avec graphique)`);
    lignes.push(`5. CAF et équilibre (avec graphique)`);
    lignes.push(`6. Évolution pluriannuelle (graphique en barres)`);
    if (selected.bench) lignes.push(`7. Benchmark anonymisé`);
    lignes.push(`8. Décisions soumises au vote`);
    lignes.push(`9. Diapo de clôture (questions / vote)`);
    lignes.push('');
    lignes.push(`## Charte`);
    lignes.push(`- Couleur primaire : bleu République (#254478)`);
    lignes.push(`- Couleur d'accent : or institutionnel (#BF994C)`);
    lignes.push(`- Police : sobre, sans-serif (Calibri ou Inter)`);
    lignes.push(`- Pas d'emoji, pas de gradient flashy. Style officiel Éducation nationale.`);
    return lignes.join('\n');
  };

  const openAiPrompt = () => {
    setPromptText(buildAiPrompt());
    setPromptOpen(true);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      toast({ title: 'Prompt copié', description: 'Collez-le dans NotebookLM ou Gamma.ai pour générer la présentation.' });
    } catch {
      toast({ title: 'Copie impossible', description: 'Sélectionnez le texte manuellement.', variant: 'destructive' });
    }
  };

  const generate = async (kind: 'pdf') => {
    setGenerating(kind);
    setDone(null);
    try {
      await generatePDF();
      setDone(kind);
      toast({
        title: 'Rapport PDF généré',
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
              Document institutionnel : couverture République Française, KPI visuels, graphiques en barres,
              commentaires vulgarisés, callouts colorés selon le statut, conformité M9-6. 6 à 8 pages.
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
            <CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Présentation IA (NotebookLM / Gamma)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              HYPER@LE prépare un prompt structuré (données + plan + charte). Vous le collez dans
              <strong> NotebookLM</strong> ou <strong>Gamma.ai</strong> pour obtenir une présentation
              richement illustrée, bien plus professionnelle qu'un PPTX généré localement.
            </p>
            <Button onClick={openAiPrompt} disabled={count === 0} className="w-full gap-2">
              <Sparkles className="h-4 w-4" /> Préparer le prompt IA
            </Button>
            <div className="flex gap-2 pt-1">
              <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                <a href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3" /> NotebookLM
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                <a href="https://gamma.app/create" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3" /> Gamma.ai
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">PDF généré localement.</strong> Aucune donnée ne quitte le poste.
            Le prompt IA, lui, est destiné à être copié vers <strong>NotebookLM</strong> (Google) ou
            <strong> Gamma.ai</strong> pour produire une présentation enrichie. Vérifiez la politique RGPD
            de votre établissement avant d'y coller des données nominatives.
          </div>
        </CardContent>
      </Card>

      {/* Modal prompt IA */}
      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> Prompt prêt pour NotebookLM / Gamma.ai
            </DialogTitle>
            <DialogDescription>
              Copiez ce prompt, ouvrez NotebookLM ou Gamma, créez un nouveau document et collez-le.
              L'IA produira une présentation structurée à partir des données réelles de votre EPLE.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="min-h-[420px] font-mono text-xs"
          />
          <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
            <Button onClick={copyPrompt} className="gap-2">
              <Copy className="h-4 w-4" /> Copier le prompt
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Ouvrir NotebookLM
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://gamma.app/create" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Ouvrir Gamma.ai
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
