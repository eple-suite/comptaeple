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

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

export function generateRapportExecution({ etab, sdeRows, sdrRows, dateSituation }: RapportParams) {
  const date = dateSituation || new Date().toLocaleDateString('fr-FR');
  const exercice = etab.exercice || new Date().getFullYear();
  const nomEtab = etab.nom || 'Établissement';
  const hasSDE = sdeRows.length > 0;
  const hasSDR = sdrRows.length > 0;

  const doc = new jsPDF({ orientation: 'portrait' });
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
    '4. Contrôles réglementaires de l\'agent comptable',
    '5. Anomalies détectées',
    '6. Recommandations',
    '7. Signatures',
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
  drawSectionHeader(doc, '1. SITUATION DES DÉPENSES ENGAGÉES (SDE)', 'Ref. : M9-6 Tome 2 — §2.3');

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
  drawSectionHeader(doc, '2. SITUATION DES RECETTES (SDR)', 'Ref. : M9-6 Tome 2 — §2.2');

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
  doc.addPage();
  drawSectionHeader(doc, '3. COHÉRENCE BUDGÉTAIRE — CROISEMENT SDE / SDR', 'Ref. : M9-6 Tome 2 — §2.1.1 (équilibre, spécialité)');

  if (hasSDE && hasSDR) {
    const coherence = buildCoherence(sdeRows, sdrRows);
    const titres = coherence.filter(l => l.ecart > 0);

    autoTable(doc, {
      startY: 30,
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
    doc.text(`Crédits ouverts (dépenses) : ${fmt(totalDepBudget)}`, 14, yEq);
    doc.text(`Prévisions (recettes) : ${fmt(totalRecBudget)}`, 14, yEq + 7);
    doc.text(`Écart : ${fmt(ecartEq)} — ${ecartEq < 1 ? '✓ Équilibre respecté' : '⚠ Déséquilibre constaté'}`, 14, yEq + 14);
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Croisement impossible — SDE et/ou SDR non importé(s).', 14, 35);
  }

  // ════════════════════════════════════════════════════════════
  // 4. CONTRÔLES RÉGLEMENTAIRES
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  drawSectionHeader(doc, '4. CONTRÔLES RÉGLEMENTAIRES DE L\'AGENT COMPTABLE', 'Ref. : M9-6 Tome 2 — §2.3.4 (dépenses) / §2.2.4 (recettes)');

  const controles = buildControles(sdeRows, sdrRows, hasSDE, hasSDR);
  autoTable(doc, {
    startY: 30,
    head: [['ID', 'Contrôle', 'Référence M9-6', 'Statut', 'Détail']],
    body: controles.map(c => [
      c.id, c.controle, c.ref,
      c.statut === 'conforme' ? '✓ Conforme' : c.statut === 'anomalie' ? `⚠ Anomalie (${c.gravite || ''})` : '— Non vérifiable',
      c.detail,
    ]),
    headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 45 }, 2: { cellWidth: 32 }, 3: { cellWidth: 28 }, 4: { cellWidth: 60 } },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw);
        if (val.startsWith('⚠')) data.cell.styles.textColor = [200, 0, 0];
        else if (val.startsWith('✓')) data.cell.styles.textColor = [0, 128, 0];
        else data.cell.styles.textColor = [150, 150, 150];
      }
    },
  });

  // ════════════════════════════════════════════════════════════
  // 5. ANOMALIES DÉTECTÉES
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  drawSectionHeader(doc, '5. ANOMALIES RÉGLEMENTAIRES DÉTECTÉES', 'Liste des écarts constatés au regard de la M9-6');

  const anomalies = controles.filter(c => c.statut === 'anomalie');
  if (anomalies.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text('✓ Aucune anomalie réglementaire détectée.', 14, 35);
  } else {
    let yAno = 32;
    anomalies.forEach((a, i) => {
      if (yAno > ph - 40) { doc.addPage(); yAno = 20; }
      doc.setFontSize(9);
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${a.controle}`, 14, yAno);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.setFontSize(8);
      doc.text(`   Référence : ${a.ref}`, 14, yAno + 6);
      doc.text(`   Gravité : ${a.gravite || 'non qualifiée'}`, 14, yAno + 12);
      const detailLines = doc.splitTextToSize(`   Constatation : ${a.detail}`, pw - 28);
      doc.text(detailLines, 14, yAno + 18);
      yAno += 18 + detailLines.length * 4 + 8;
    });
  }

  // ════════════════════════════════════════════════════════════
  // 6. RECOMMANDATIONS
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  drawSectionHeader(doc, '6. RECOMMANDATIONS CONFORMES M9-6', '');

  let yReco = 32;
  doc.setFontSize(10);
  doc.setTextColor(37, 68, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('Actions demandées à l\'ordonnateur :', 14, yReco);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(9);

  const recosOrdo: string[] = [];
  const creditsDepasses = hasSDE ? sdeRows.filter(r => (r.disponible ?? 0) < 0) : [];
  if (creditsDepasses.length > 0) {
    recosOrdo.push(`Régulariser les ${creditsDepasses.length} dépassement(s) de crédits par délibération modificative du conseil d'administration.`);
  }
  const droitsSansTitre = hasSDR ? sdrRows.filter(r => (r.budget || 0) > 0 && (r.aor || 0) === 0 && (r.realise || 0) === 0) : [];
  if (droitsSansTitre.length > 0) {
    recosOrdo.push(`Émettre les titres de recettes pour les ${droitsSansTitre.length} ligne(s) avec prévisions sans titre (§2.2.2).`);
  }
  if (hasSDE && hasSDR) {
    const coherence = buildCoherence(sdeRows, sdrRows);
    const titres = coherence.filter(l => l.ecart > 0);
    if (titres.length > 0) {
      const total = titres.reduce((s, l) => s + l.ecart, 0);
      recosOrdo.push(`Émettre ${titres.length} titre(s) de recettes pour un total de ${fmt(total)} afin de rétablir l'équilibre par activité.`);
    }
  }
  if (recosOrdo.length === 0) recosOrdo.push('Aucune action corrective requise à ce stade.');

  recosOrdo.forEach((r, i) => {
    yReco += 8;
    doc.text(`${i + 1}. ${r}`, 18, yReco);
  });

  yReco += 18;
  doc.setTextColor(37, 68, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('Contrôles à réaliser par l\'agent comptable :', 14, yReco);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const recosAC = [
    'Vérifier la qualité de l\'ordonnateur pour chaque demande de paiement (§2.3.4).',
    'Contrôler la disponibilité des crédits avant prise en charge (§2.3.4).',
    'Vérifier l\'exacte imputation budgétaire et comptable (§2.3.4).',
    'S\'assurer de la validité de la créance : pièces justificatives et certification du service fait (§2.3.4).',
    'Poursuivre les diligences de recouvrement sur les restes à recouvrer (§2.2.5).',
  ];
  recosAC.forEach((r, i) => {
    yReco += 8;
    doc.text(`${i + 1}. ${r}`, 18, yReco);
  });

  // ════════════════════════════════════════════════════════════
  // 7. SIGNATURES
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  drawSectionHeader(doc, '7. SIGNATURES', '');

  let ySig = 40;
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(`Fait à ${etab.commune || '_______________'}, le ${date}`, 14, ySig);

  ySig += 20;
  // 3 colonnes de signatures
  const colW = (pw - 28) / 3;

  doc.setFont('helvetica', 'bold');
  doc.text("L'ordonnateur", 14, ySig);
  doc.text("L'agent comptable", 14 + colW, ySig);
  doc.text("Vu, le secrétaire général", 14 + colW * 2, ySig);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(etab.ordonnateur || '(Nom et prénom)', 14, ySig + 8);
  doc.text(etab.agentComptable || '(Nom et prénom)', 14 + colW, ySig + 8);
  doc.text('(Nom et prénom)', 14 + colW * 2, ySig + 8);

  // Signature lines
  ySig += 30;
  doc.setDrawColor(0);
  doc.line(14, ySig, 14 + colW - 10, ySig);
  doc.line(14 + colW, ySig, 14 + colW * 2 - 10, ySig);
  doc.line(14 + colW * 2, ySig, pw - 14, ySig);

  // Mention légale finale
  ySig += 30;
  doc.setFillColor(240, 243, 248);
  doc.rect(14, ySig, pw - 28, 24, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('MENTIONS LÉGALES OBLIGATOIRES', 18, ySig + 7);
  doc.text('Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).', 18, ySig + 13);
  doc.text('Aucun calcul prospectif, prévisionnel ou statistique n\'est effectué car non prévu par l\'instruction.', 18, ySig + 19);

  // Add footers and save
  addPDFFooters(doc, `Rapport d'exécution budgétaire — ${nomEtab} — Exercice ${exercice}`);
  doc.save(`rapport_execution_budgetaire_${exercice}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
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

function buildControles(sde: LigneSDE[], sdr: LigneSDR[], hasSDE: boolean, hasSDR: boolean) {
  const items: { id: string; controle: string; ref: string; statut: string; detail: string; gravite?: string }[] = [];

  if (hasSDE) {
    const cd = sde.filter(r => (r.disponible ?? 0) < 0);
    items.push({ id: 'dep-01', controle: 'Disponibilité des crédits', ref: '§2.3.4 / §2.1.1', statut: cd.length === 0 ? 'conforme' : 'anomalie', detail: cd.length === 0 ? 'Aucun dépassement.' : `${cd.length} ligne(s) en dépassement.`, gravite: cd.length > 0 ? 'majeure' : undefined });

    const iv = sde.filter(r => !r.compte || !r.service);
    items.push({ id: 'dep-02', controle: 'Exacte imputation budgétaire', ref: '§2.3.4', statut: iv.length === 0 ? 'conforme' : 'anomalie', detail: iv.length === 0 ? 'Imputations complètes.' : `${iv.length} ligne(s) incomplètes.`, gravite: iv.length > 0 ? 'significative' : undefined });

    const es = sde.filter(r => (r.engage || 0) > 0 && (r.realise || 0) === 0);
    items.push({ id: 'dep-03', controle: 'Engagements sans demande de paiement', ref: '§2.3.2', statut: es.length === 0 ? 'conforme' : 'anomalie', detail: es.length === 0 ? 'Tous les engagements ont une DP.' : `${es.length} engagement(s) sans DP.`, gravite: es.length > 0 ? 'mineure' : undefined });
  }

  if (hasSDR) {
    const ps = sdr.filter(r => (r.budget || 0) > 0 && (r.aor || 0) === 0 && (r.realise || 0) === 0);
    items.push({ id: 'rec-01', controle: 'Titres de recettes émis', ref: '§2.2.2', statut: ps.length === 0 ? 'conforme' : 'anomalie', detail: ps.length === 0 ? 'Tous les droits ont un titre.' : `${ps.length} ligne(s) sans titre.`, gravite: ps.length > 0 ? 'significative' : undefined });

    const tt = sdr.reduce((s, r) => s + (r.aor || 0), 0);
    const te = sdr.reduce((s, r) => s + (r.realise || 0), 0);
    const rar = tt - te;
    items.push({ id: 'rec-02', controle: 'Recouvrement', ref: '§2.2.5', statut: rar <= 0 ? 'conforme' : 'anomalie', detail: rar <= 0 ? 'Titres recouvrés.' : `Reste à recouvrer : ${fmt(rar)}.`, gravite: rar > 0 ? 'mineure' : undefined });
  }

  if (hasSDE && hasSDR) {
    const td = sde.reduce((s, r) => s + (r.budget || 0), 0);
    const tr = sdr.reduce((s, r) => s + (r.budget || 0), 0);
    const eq = Math.abs(td - tr);
    items.push({ id: 'prin-01', controle: 'Principe d\'équilibre', ref: '§2.1.1', statut: eq < 1 ? 'conforme' : 'anomalie', detail: eq < 1 ? 'Budget équilibré.' : `Écart de ${fmt(eq)}.`, gravite: eq >= 1 ? 'significative' : undefined });
  }

  return items;
}
