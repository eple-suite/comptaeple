// ═══════════════════════════════════════════════════════════════
// RAPPORT D'EXÉCUTION BUDGÉTAIRE — PDF consolidé
// À destination du secrétaire général et de l'ordonnateur
// Ref. : M9-6 Tome 2 — §2.1.1, §2.2, §2.3
// ═══════════════════════════════════════════════════════════════

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createStyledPDF, addPDFFooters } from '@/lib/pdfUtils';
import { formatCurrency } from '@/lib/mockData';
import type { LigneSDE, LigneSDR } from '@/lib/cofieple_types';
import type { EtablissementUI } from '@/lib/cofieple_storeTypes';

interface RapportParams {
  etab: EtablissementUI;
  sdeRows: LigneSDE[];
  sdrRows: LigneSDR[];
  dateSituation?: string;
  nomOrdonnateur?: string;
  nomSecretaireGeneral?: string;
}

/** Strip exotic Unicode that jsPDF cannot render */
function sanitize(s: string): string {
  return s
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/[═╔╗╚╝║╠╣╬─│┌┐└┘├┤┬┴┼☐☑☒Ø×÷←→↑↓≤≥≠≈∞∑∏√∫∂∆∇⊕⊗⊘⊙⊚⊛⊜⊝]/g, '')
    .replace(/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞ]/g, (c) => {
      const map: Record<string, string> = { 'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I','Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH' };
      return map[c] ?? c;
    })
    .replace(/[àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿ]/g, (c) => {
      const map: Record<string, string> = { 'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ù':'u','ú':'u','û':'u','ü':'u','ý':'y','þ':'th','ÿ':'y' };
      return map[c] ?? c;
    });
}

function fmt(n: number): string {
  return sanitize(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n));
}

export function generateRapportExecution({ etab, sdeRows, sdrRows, dateSituation, nomOrdonnateur, nomSecretaireGeneral }: RapportParams) {
  const date = dateSituation || new Date().toLocaleDateString('fr-FR');
  const exercice = etab.exercice || new Date().getFullYear();
  const nomEtab = etab.nom || 'Établissement';
  const hasSDE = sdeRows.length > 0;
  const hasSDR = sdrRows.length > 0;

  const doc = new jsPDF({ orientation: 'landscape' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // ════════════════════════════════════════════════════════════
  // PAGE DE GARDE
  // ════════════════════════════════════════════════════════════
  doc.setFillColor(37, 68, 120);
  doc.rect(0, 0, pw, 60, 'F');
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'EXÉCUTION BUDGÉTAIRE", pw / 2, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exercice ${exercice} — Situation au ${date}`, pw / 2, 34, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomEtab.toUpperCase(), pw / 2, 46, { align: 'center' });
  if (etab.uai) doc.text(`UAI : ${etab.uai}`, pw / 2, 53, { align: 'center' });

  // Destinataires
  doc.setTextColor(0);
  doc.setFontSize(10);
  let y = 75;
  doc.setFont('helvetica', 'bold');
  doc.text('Destinataires :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Le secrétaire général — ${etab.academie || 'Académie'}`, 20, y + 8);
  doc.text(`• L'ordonnateur — ${etab.ordonnateur || 'Chef d\'établissement'}`, 20, y + 16);
  doc.text(`• L'agent comptable — ${etab.agentComptable || ''}`, 20, y + 24);

  // Cadre réglementaire
  y += 42;
  doc.setFillColor(240, 243, 248);
  doc.rect(14, y, pw - 28, 36, 'F');
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'bold');
  doc.text('Cadre réglementaire', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text('Instruction codificatrice M9-6 — OP@LE du 19 janvier 2026', 18, y + 14);
  doc.text('Tome 2 — §2.1.1 Principes budgétaires (annualité, unité, universalité, spécialité, sincérité, équilibre)', 18, y + 21);
  doc.text('Tome 2 — §2.2 Exécution des recettes / §2.3 Exécution des dépenses', 18, y + 28);

  // Sommaire
  y += 48;
  doc.setTextColor(37, 68, 120);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SOMMAIRE', 14, y);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const sommaire = [
    '1. Situation des dépenses engagées (SDE)',
    '2. Situation des recettes (SDR)',
    '3. Cohérence budgétaire — Croisement SDE / SDR',
    '4. Taux d\'exécution par service',
    '5. Synthèse et faits caractéristiques',
    '6. Signatures',
  ];
  sommaire.forEach((item, i) => {
    doc.text(item, 20, y + 10 + i * 7);
  });

  // Mention
  y += 10 + sommaire.length * 7 + 10;
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text('Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).', 14, y);
  doc.text('Aucun calcul prospectif, prévisionnel ou statistique n\'est effectué car non prévu par l\'instruction.', 14, y + 5);

  // ════════════════════════════════════════════════════════════
  // 1. SITUATION DES DÉPENSES (SDE)
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  let yPos = drawSectionHeader(doc, '1. SITUATION DES DEPENSES ENGAGEES (SDE)', 'Ref. : M9-6 Tome 2 -- §2.3');

  if (hasSDE) {
    // Aggregate by service
    const depServices = aggregateDepByService(sdeRows);
    const totDep = { co: 0, eng: 0, dp: 0, dispo: 0 };
    depServices.forEach(s => { totDep.co += s.co; totDep.eng += s.eng; totDep.dp += s.dp; totDep.dispo += s.dispo; });

    autoTable(doc, {
      startY: 30,
      head: [['Service', 'Crédits ouverts', 'Engagements', 'Demandes de paiement', 'Disponible']],
      body: depServices.map(s => [s.service, fmt(s.co), fmt(s.eng), fmt(s.dp), fmt(s.dispo)]),
      foot: [['TOTAL', fmt(totDep.co), fmt(totDep.eng), fmt(totDep.dp), fmt(totDep.dispo)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    // Credits dépassés
    const creditsDepasses = sdeRows.filter(r => (r.disponible ?? 0) < 0);
    const yAfter = (doc as any).lastAutoTable.finalY + 8;
    if (creditsDepasses.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`⚠ ${creditsDepasses.length} ligne(s) en dépassement de crédits (violation du principe de spécialité — §2.1.1)`, 14, yAfter);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);

      autoTable(doc, {
        startY: yAfter + 5,
        head: [['Service', 'Activité', 'Compte', 'Crédits ouverts', 'Engagements', 'Disponible']],
        body: creditsDepasses.slice(0, 20).map(r => [
          r.service, r.activite, r.compte, fmt(r.budget), fmt(r.engage), fmt(r.disponible),
        ]),
        headStyles: { fillColor: [180, 40, 40], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        styles: { fontSize: 7 },
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(0, 128, 0);
      doc.text('✓ Aucun dépassement de crédits constaté — principe de spécialité respecté.', 14, yAfter);
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Situation des dépenses engagées (SDE) non importée — section non disponible.', 14, 35);
  }

  // ════════════════════════════════════════════════════════════
  // 2. SITUATION DES RECETTES (SDR)
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = drawSectionHeader(doc, '2. SITUATION DES RECETTES (SDR)', 'Ref. : M9-6 Tome 2 -- §2.2');

  if (hasSDR) {
    const recServices = aggregateRecByService(sdrRows);
    const totRec = { prev: 0, aor: 0, enc: 0, ec: 0, pv: 0 };
    recServices.forEach(s => { totRec.prev += s.prev; totRec.aor += s.aor; totRec.enc += s.enc; totRec.ec += s.ec; totRec.pv += s.pv; });

    autoTable(doc, {
      startY: 30,
      head: [['Service', 'Prévisions', 'Titres émis (AOR)', 'Encaissé', 'En cours', 'Plus-values']],
      body: recServices.map(s => [s.service, fmt(s.prev), fmt(s.aor), fmt(s.enc), fmt(s.ec), fmt(s.pv)]),
      foot: [['TOTAL', fmt(totRec.prev), fmt(totRec.aor), fmt(totRec.enc), fmt(totRec.ec), fmt(totRec.pv)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    const droitsSansTitre = sdrRows.filter(r => (r.budget || 0) > 0 && (r.aor || 0) === 0 && (r.realise || 0) === 0);
    const yAfter = (doc as any).lastAutoTable.finalY + 8;
    if (droitsSansTitre.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(200, 120, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`⚠ ${droitsSansTitre.length} ligne(s) avec prévisions sans titre de recettes émis (§2.2.2)`, 14, yAfter);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setFontSize(9);
      doc.setTextColor(0, 128, 0);
      doc.text('✓ Toutes les prévisions de recettes ont fait l\'objet d\'un titre de recettes.', 14, yAfter);
    }

    // Recouvrement
    const totalTitre = sdrRows.reduce((s, r) => s + (r.aor || 0), 0);
    const totalEncaisse = sdrRows.reduce((s, r) => s + (r.realise || 0), 0);
    const rar = totalTitre - totalEncaisse;
    const yRec = yAfter + 12;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(`Taux de recouvrement : ${totalTitre > 0 ? ((totalEncaisse / totalTitre) * 100).toFixed(1) : '0'}%`, 14, yRec);
    if (rar > 0) {
      doc.text(`Restes à recouvrer : ${fmt(rar)} — Diligences à vérifier (§2.2.5)`, 14, yRec + 7);
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Situation des recettes (SDR) non importée — section non disponible.', 14, 35);
  }

  // ════════════════════════════════════════════════════════════
  // 3. COHÉRENCE BUDGÉTAIRE
  // ════════════════════════════════════════════════════════════
  yPos = drawSectionHeader(doc, '3. COHERENCE BUDGETAIRE -- CROISEMENT SDE / SDR', 'Ref. : M9-6 Tome 2 -- §2.1.1 (equilibre, specialite)');

  if (hasSDE && hasSDR) {
    const coherence = buildCoherence(sdeRows, sdrRows);
    const titres = coherence.filter(l => l.ecart > 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Service', 'Activité', 'Dépenses engagées', 'Recettes titrées', 'Écart', 'Constatation']],
      body: coherence.map(l => [
        l.service, l.activite,
        fmt(l.dep), fmt(l.rec),
        l.ecart !== 0 ? fmt(l.ecart) : '—',
        l.ecart > 0 ? 'Titre de recettes à émettre' : 'Équilibré',
      ]),
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      styles: { fontSize: 7 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 5 && String(data.cell.raw).startsWith('Titre')) {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const yAfter = (doc as any).lastAutoTable.finalY + 8;
    if (titres.length > 0) {
      const totalTitres = titres.reduce((s, l) => s + l.ecart, 0);
      doc.setFontSize(9);
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${titres.length} titre(s) de recettes à émettre pour un total de ${fmt(totalTitres)}`, 14, yAfter);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setFontSize(9);
      doc.setTextColor(0, 128, 0);
      doc.text('✓ Dépenses et recettes équilibrées par service et activité.', 14, yAfter);
    }

    // Equilibre global
    const totalDepBudget = sdeRows.reduce((s, r) => s + (r.budget || 0), 0);
    const totalRecBudget = sdrRows.reduce((s, r) => s + (r.budget || 0), 0);
    const ecartEq = Math.abs(totalDepBudget - totalRecBudget);
    const yEq = yAfter + 12;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(`Credits ouverts (depenses) : ${fmt(totalDepBudget)}`, 14, yEq);
    doc.text(`Previsions (recettes) : ${fmt(totalRecBudget)}`, 14, yEq + 7);
    doc.text(`Ecart : ${fmt(ecartEq)} -- ${ecartEq < 1 ? '✓ Equilibre respecte' : '⚠ Desequilibre constate'}`, 14, yEq + 14);
    yPos = yEq + 22;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Croisement impossible -- SDE et/ou SDR non importe(s).', 14, yPos + 5);
    yPos += 15;
  }

  // ════════════════════════════════════════════════════════════
  // 4. TAUX D'EXÉCUTION PAR SERVICE
  // ════════════════════════════════════════════════════════════
  yPos = drawSectionHeader(doc, '4. TAUX D\'EXECUTION PAR SERVICE', 'Pilotage budgetaire -- Budget initial vs Budget execute', yPos);

  if (hasSDE) {
    const depServices = aggregateDepByService(sdeRows);
    const totalCO = depServices.reduce((s, d) => s + d.co, 0);
    const totalDP = depServices.reduce((s, d) => s + d.dp, 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Service', 'Crédits ouverts', 'Réalisé', 'Taux exéc.', 'Disponible']],
      body: depServices.map(s => [
        s.service,
        fmt(s.co),
        fmt(s.dp),
        s.co > 0 ? `${((s.dp / s.co) * 100).toFixed(1)} %` : '—',
        fmt(s.dispo),
      ]),
      foot: [['TOTAL', fmt(totalCO), fmt(totalDP), totalCO > 0 ? `${((totalDP / totalCO) * 100).toFixed(1)} %` : '—', fmt(totalCO - totalDP)]],
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [230, 236, 245], textColor: [37, 68, 120], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    // Graphique barres taux d'exécution par service
    let yGraph = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 68, 120);
    doc.text('Taux d\'exécution des dépenses par service :', 14, yGraph);
    yGraph += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    for (const s of depServices) {
      if (yGraph > ph - 30) { doc.addPage(); yGraph = 20; }
      const taux = s.co > 0 ? (s.dp / s.co) : 0;
      const barWidth = 100;
      const barHeight = 5;
      // Background
      doc.setFillColor(230, 236, 245);
      doc.roundedRect(40, yGraph, barWidth, barHeight, 1, 1, 'F');
      // Fill
      const fillW = barWidth * Math.min(taux, 1);
      if (fillW > 1) {
        const barColor = taux >= 0.85 ? [34, 139, 34] : taux >= 0.5 ? [230, 126, 34] : [200, 0, 0];
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.roundedRect(40, yGraph, fillW, barHeight, 1, 1, 'F');
      }
      doc.setFontSize(7);
      doc.text(s.service, 14, yGraph + 4);
      doc.text(`${(taux * 100).toFixed(1)} %`, 145, yGraph + 4);
      yGraph += 9;
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Données SDE non importées — section non disponible.', 14, 35);
  }

  // ════════════════════════════════════════════════════════════
  // 5. SYNTHÈSE ET FAITS CARACTÉRISTIQUES
  // ════════════════════════════════════════════════════════════
  yPos = drawSectionHeader(doc, '5. SYNTHESE ET FAITS CARACTERISTIQUES', 'Points d\'attention pour l\'ordonnateur', yPos);

  let ySynth = yPos;
  doc.setFontSize(9);
  doc.setTextColor(0);

  // Key budget metrics
  if (hasSDE && hasSDR) {
    const totalDepBudget = sdeRows.reduce((s, r) => s + (r.budget || 0), 0);
    const totalDepRealise = sdeRows.reduce((s, r) => s + (r.realise || 0), 0);
    const totalRecBudget = sdrRows.reduce((s, r) => s + (r.budget || 0), 0);
    const totalRecRealise = sdrRows.reduce((s, r) => s + (r.realise || 0), 0);
    const ecartEq = Math.abs(totalDepBudget - totalRecBudget);

    doc.setFont('helvetica', 'bold');
    doc.text('Indicateurs budgétaires clés :', 14, ySynth);
    doc.setFont('helvetica', 'normal');
    ySynth += 8;
    const metrics = [
      [`Crédits ouverts (dépenses)`, fmt(totalDepBudget)],
      [`Dépenses réalisées`, fmt(totalDepRealise)],
      [`Taux d'exécution dépenses`, totalDepBudget > 0 ? `${((totalDepRealise / totalDepBudget) * 100).toFixed(1)} %` : '—'],
      [`Prévisions de recettes`, fmt(totalRecBudget)],
      [`Recettes réalisées`, fmt(totalRecRealise)],
      [`Taux d'exécution recettes`, totalRecBudget > 0 ? `${((totalRecRealise / totalRecBudget) * 100).toFixed(1)} %` : '—'],
      [`Équilibre budgétaire`, ecartEq < 1 ? '✓ Respecté' : `Écart : ${fmt(ecartEq)}`],
    ];
    metrics.forEach(([label, value]) => {
      doc.text(`• ${label} : ${value}`, 18, ySynth);
      ySynth += 6;
    });

    // Alerts
    ySynth += 5;
    const creditsDepasses = sdeRows.filter(r => (r.disponible ?? 0) < 0);
    const droitsSansTitre = sdrRows.filter(r => (r.budget || 0) > 100 && (r.aor || 0) === 0 && (r.realise || 0) === 0);

    if (creditsDepasses.length > 0 || droitsSansTitre.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      doc.text('Points d\'attention :', 14, ySynth);
      doc.setFont('helvetica', 'normal');
      ySynth += 7;
      if (creditsDepasses.length > 0) {
        doc.text(`⚠ ${creditsDepasses.length} ligne(s) en dépassement de crédits — régularisation par DBM nécessaire`, 18, ySynth);
        ySynth += 6;
      }
      if (droitsSansTitre.length > 0) {
        doc.text(`⚠ ${droitsSansTitre.length} ligne(s) avec prévisions sans titre de recettes émis`, 18, ySynth);
        ySynth += 6;
      }
    } else {
      doc.setTextColor(0, 128, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ Aucune anomalie budgétaire significative constatée.', 14, ySynth);
      ySynth += 8;
    }
  }

  // Faits caractéristiques (espace pour commentaires)
  ySynth += 10;
  doc.setTextColor(37, 68, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FAITS CARACTÉRISTIQUES DE L\'EXERCICE', 14, ySynth);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120);
  ySynth += 7;
  doc.text('(À compléter par l\'ordonnateur — commentaires libres sur l\'exécution budgétaire)', 14, ySynth);

  // Box for comments
  ySynth += 5;
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(14, ySynth, pw - 28, 60);

  // ════════════════════════════════════════════════════════════
  // 6. SIGNATURES — Ordonnateur + Secrétaire Général uniquement
  // ════════════════════════════════════════════════════════════
  yPos = drawSectionHeader(doc, '6. SIGNATURES', '', yPos);

  let ySig = yPos + 10;
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(`Fait à ${etab.commune || '_______________'}, le ${date}`, 14, ySig);

  ySig += 20;
  const colW = (pw - 28) / 2;

  doc.setFont('helvetica', 'bold');
  doc.text("L'ordonnateur", 14, ySig);
  doc.text("Vu, le secrétaire général", 14 + colW, ySig);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const ordoName = nomOrdonnateur || etab.ordonnateur || '(Nom et prénom)';
  const sgName = nomSecretaireGeneral || etab.secretaireGeneral || '(Nom et prénom)';
  doc.text(ordoName, 14, ySig + 8);
  doc.text(sgName, 14 + colW, ySig + 8);

  ySig += 30;
  doc.setDrawColor(0);
  doc.line(14, ySig, 14 + colW - 10, ySig);
  doc.line(14 + colW, ySig, pw - 14, ySig);

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Signature et cachet', 14, ySig + 5);
  doc.text('Signature et cachet', 14 + colW, ySig + 5);

  ySig += 25;
  doc.setFillColor(240, 243, 248);
  doc.rect(14, ySig, pw - 28, 18, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('Rapport d\'exécution budgétaire — à destination du conseil d\'administration', 18, ySig + 7);
  doc.text('Strictement limité au périmètre budgétaire de l\'ordonnateur (M9-6 Tome 2)', 18, ySig + 13);

  // Add footers and save
  addPDFFooters(doc, `Rapport d'exécution budgétaire — ${nomEtab} — Exercice ${exercice}`);
  doc.save(`rapport_execution_budgetaire_${exercice}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, subtitle: string, currentY?: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  // If currentY provided and enough room (>70mm), draw inline; otherwise new page
  if (currentY != null && currentY < ph - 70) {
    const y0 = currentY + 4;
    doc.setFillColor(37, 68, 120);
    doc.rect(14, y0, pw - 28, 16, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y0 + 10);
    if (subtitle) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, pw - 20, y0 + 10, { align: 'right' });
    }
    doc.setTextColor(0);
    return y0 + 22;
  }
  doc.addPage();
  doc.setFillColor(37, 68, 120);
  doc.rect(0, 0, pw, 22, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 14);
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pw - 14, 14, { align: 'right' });
  }
  doc.setTextColor(0);
  return 30;
}

function aggregateDepByService(rows: LigneSDE[]) {
  const map = new Map<string, { service: string; co: number; eng: number; dp: number; dispo: number }>();
  for (const r of rows) {
    const svc = r.service || 'INCONNU';
    const agg = map.get(svc) || { service: svc, co: 0, eng: 0, dp: 0, dispo: 0 };
    agg.co += r.budget || 0;
    agg.eng += r.engage || 0;
    agg.dp += r.realise || 0;
    agg.dispo += r.disponible || 0;
    map.set(svc, agg);
  }
  return Array.from(map.values());
}

function aggregateRecByService(rows: LigneSDR[]) {
  const map = new Map<string, { service: string; prev: number; aor: number; enc: number; ec: number; pv: number }>();
  for (const r of rows) {
    const svc = r.service || 'INCONNU';
    const agg = map.get(svc) || { service: svc, prev: 0, aor: 0, enc: 0, ec: 0, pv: 0 };
    agg.prev += r.budget || 0;
    agg.aor += r.aor || 0;
    agg.enc += r.realise || 0;
    agg.ec += r.encours || 0;
    agg.pv += r.plusValues || 0;
    map.set(svc, agg);
  }
  return Array.from(map.values());
}

function buildCoherence(sde: LigneSDE[], sdr: LigneSDR[]) {
  const depMap = new Map<string, { service: string; activite: string; total: number }>();
  for (const r of sde) {
    const key = `${r.service}|${r.activite}`;
    const ex = depMap.get(key);
    if (ex) ex.total += r.engage || 0;
    else depMap.set(key, { service: r.service, activite: r.activite, total: r.engage || 0 });
  }
  const recMap = new Map<string, number>();
  for (const r of sdr) {
    const key = `${r.service}|${r.activite}`;
    recMap.set(key, (recMap.get(key) || 0) + (r.aor || 0));
  }
  const result: { service: string; activite: string; dep: number; rec: number; ecart: number }[] = [];
  for (const [key, dep] of depMap.entries()) {
    const rec = recMap.get(key) || 0;
    result.push({ service: dep.service, activite: dep.activite, dep: dep.total, rec, ecart: dep.total - rec });
  }
  return result.sort((a, b) => a.service.localeCompare(b.service) || b.ecart - a.ecart);
}

