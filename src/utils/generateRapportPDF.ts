// ⚠️ FICHIER CRITIQUE — Générateur rapport ordonnateur
// Produit un document HTML autonome optimisé impression A4

interface DonneesRapport {
  etablissement: {
    nom: string;
    uai: string;
    adresse: string;
    commune: string;
    academie: string;
    annee: number;
    dateEdition: string;
    ordonnateur: string;
    agentComptable: string;
  };
  sde: {
    totalBudget: number;
    totalRealise: number;
    totalDisponible: number;
    sections: Array<{
      code: string;
      libelle: string;
      budget: number;
      realise: number;
      disponible: number;
      taux: number;
      sousLignes?: Array<{
        code: string;
        libelle: string;
        budget: number;
        realise: number;
        disponible: number;
        taux: number;
      }>;
    }>;
  };
  sdr: {
    totalBudget: number;
    totalRealise: number;
    totalEcart: number;
    sections: Array<{
      code: string;
      libelle: string;
      budget: number;
      realise: number;
      ecart: number;
    }>;
  };
  resultat: {
    recettesRealisees: number;
    depensesRealisees: number;
    resultatComptable: number;
    creditDisponible: number;
    ecartRecettes: number;
  };
  commentaires?: {
    contexte?: string;
    executionDepenses?: string;
    executionRecettes?: string;
    perspectivesFinancieres?: string;
  };
}

function fmt(val: number): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val) + ' €';
}

function pct(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(val) + ' %';
}

export function generateRapportPDF(donnees: DonneesRapport): void {
  const { etablissement, sde, sdr, resultat, commentaires } = donnees;

  const lignesDepenses = sde.sections.map(s => `
    <tr style="background:${s.taux > 100 ? '#f8d7da' : s.taux >= 90 ? '#fff3cd' : 'transparent'}">
      <td class="lib">${s.libelle}</td>
      <td class="num">${fmt(s.budget)}</td>
      <td class="num">${fmt(s.realise)}</td>
      <td class="num">${fmt(s.disponible)}</td>
      <td class="num ${s.taux > 100 ? 'rouge' : s.taux >= 90 ? 'orange' : ''}">${pct(s.taux)}</td>
    </tr>
    ${(s.sousLignes || []).map(sl => `
    <tr class="sous-ligne">
      <td class="lib sous-lib">&nbsp;&nbsp;↳ ${sl.libelle}</td>
      <td class="num">${fmt(sl.budget)}</td>
      <td class="num">${fmt(sl.realise)}</td>
      <td class="num">${fmt(sl.disponible)}</td>
      <td class="num">${pct(sl.taux)}</td>
    </tr>`).join('')}
  `).join('');

  const lignesRecettes = sdr.sections.map(s => `
    <tr>
      <td class="lib">${s.libelle}</td>
      <td class="num">${fmt(s.budget)}</td>
      <td class="num">${fmt(s.realise)}</td>
      <td class="num ${s.ecart < 0 ? 'rouge' : 'vert'}">${fmt(s.ecart)}</td>
      <td class="num">${pct(s.budget > 0 ? s.realise / s.budget * 100 : 0)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Ordonnateur — ${etablissement.nom} — ${etablissement.annee}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; }
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    .page {
      width: 186mm; min-height: 267mm; margin: 0 auto 20mm auto;
      padding: 0; page-break-after: always; page-break-inside: avoid;
    }
    .page:last-child { page-break-after: auto; }
    .entete {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #003366; padding-bottom: 8px; margin-bottom: 14px;
    }
    .ministere { font-size: 8pt; color: #555; text-transform: uppercase; }
    .nom-etab { font-size: 13pt; font-weight: bold; color: #003366; margin: 3px 0; }
    .uai { font-size: 8.5pt; color: #555; }
    .titre-rapport { font-size: 12pt; font-weight: bold; color: #003366; text-transform: uppercase; text-align: right; }
    .annee { font-size: 10pt; font-weight: bold; text-align: right; }
    .date-edition { font-size: 8pt; color: #777; text-align: right; }
    h2.section-titre {
      font-size: 11pt; font-weight: bold; color: #fff; background: #003366;
      padding: 5px 10px; margin: 16px 0 8px 0; text-transform: uppercase; page-break-after: avoid;
    }
    h3.sous-titre {
      font-size: 10pt; font-weight: bold; color: #003366;
      border-bottom: 1px solid #003366; padding-bottom: 3px;
      margin: 12px 0 6px 0; page-break-after: avoid;
    }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; page-break-inside: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    thead tr { background: #003366; color: #fff; }
    thead th { padding: 5px 6px; text-align: right; font-weight: bold; white-space: nowrap; border: 1px solid #002244; }
    thead th.lib { text-align: left; }
    tbody tr { border-bottom: 1px solid #ddd; }
    tbody tr:nth-child(even) { background: #f7f9fc; }
    tbody td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: middle; }
    td.lib { text-align: left; font-weight: 500; }
    td.num { text-align: right; font-family: 'Courier New', monospace; font-size: 8.5pt; }
    td.sous-lib { padding-left: 18px; font-weight: normal; font-style: italic; font-size: 8.5pt; color: #444; }
    tfoot tr { background: #e8edf4; font-weight: bold; }
    tfoot td { padding: 5px 6px; border: 1px solid #bbb; }
    .rouge { color: #c0392b; font-weight: bold; }
    .orange { color: #e67e22; }
    .vert { color: #27ae60; }
    .synthese-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
    .synthese-bloc { border: 1px solid #003366; border-radius: 4px; padding: 8px 12px; }
    .synthese-bloc .label { font-size: 8pt; color: #555; text-transform: uppercase; }
    .synthese-bloc .valeur { font-size: 14pt; font-weight: bold; color: #003366; font-family: 'Courier New', monospace; }
    .synthese-bloc.excedent .valeur { color: #27ae60; }
    .synthese-bloc.deficit .valeur { color: #c0392b; }
    .synthese-bloc.alerte { border-color: #c0392b; background: #fdf0f0; }
    .commentaire-bloc {
      border-left: 3px solid #003366; padding: 8px 12px; margin: 8px 0;
      background: #f7f9fc; font-size: 9.5pt; line-height: 1.5; page-break-inside: avoid;
    }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
    .signature-bloc { border-top: 1px solid #000; padding-top: 8px; text-align: center; }
    .signature-bloc .titre { font-size: 9pt; font-weight: bold; }
    .signature-bloc .nom { font-size: 9pt; margin-top: 4px; }
    .signature-bloc .espace { height: 25mm; }
    @media screen {
      body { background: #f0f2f5; padding: 20px; }
      .page { background: white; box-shadow: 0 2px 12px rgba(0,0,0,.15); padding: 15mm 12mm; margin: 0 auto 20px auto; }
      .btn-imprimer { display: flex; justify-content: center; margin: 20px auto; gap: 12px; }
      .btn-imprimer button { padding: 10px 24px; background: #003366; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; }
      .btn-imprimer button:hover { background: #00254d; }
    }
    @media print {
      body { background: white; padding: 0; }
      .btn-imprimer { display: none !important; }
      .page { box-shadow: none; padding: 0; margin: 0; }
      div:empty, section:empty { display: none !important; height: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="btn-imprimer">
    <button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    <button onclick="window.close()">✕ Fermer</button>
  </div>

  <!-- PAGE 1 — COUVERTURE + SYNTHÈSE -->
  <div class="page">
    <div class="entete">
      <div>
        <div class="ministere">Ministère de l'Éducation Nationale</div>
        <div class="ministere">Académie de ${etablissement.academie}</div>
        <div class="nom-etab">${etablissement.nom}</div>
        <div class="uai">${etablissement.adresse} — ${etablissement.commune}</div>
        <div class="uai">UAI : ${etablissement.uai}</div>
      </div>
      <div>
        <div class="titre-rapport">Rapport de l'Ordonnateur</div>
        <div class="annee">Compte Financier ${etablissement.annee}</div>
        <div class="date-edition">Édité le : ${etablissement.dateEdition}</div>
      </div>
    </div>

    <h2 class="section-titre">Synthèse financière — Exercice ${etablissement.annee}</h2>

    <div class="synthese-grid">
      <div class="synthese-bloc">
        <div class="label">Budget voté</div>
        <div class="valeur">${fmt(sde.totalBudget)}</div>
      </div>
      <div class="synthese-bloc ${resultat.resultatComptable >= 0 ? 'excedent' : 'deficit'}">
        <div class="label">Résultat comptable</div>
        <div class="valeur">${resultat.resultatComptable >= 0 ? '+' : ''}${fmt(resultat.resultatComptable)}</div>
      </div>
      <div class="synthese-bloc">
        <div class="label">Dépenses mandatées</div>
        <div class="valeur">${fmt(resultat.depensesRealisees)}</div>
      </div>
      <div class="synthese-bloc">
        <div class="label">Recettes encaissées</div>
        <div class="valeur">${fmt(resultat.recettesRealisees)}</div>
      </div>
      <div class="synthese-bloc">
        <div class="label">Crédits disponibles</div>
        <div class="valeur">${fmt(resultat.creditDisponible)}</div>
      </div>
      <div class="synthese-bloc ${resultat.ecartRecettes < 0 ? 'alerte' : ''}">
        <div class="label">Écart recettes / prévisions</div>
        <div class="valeur">${fmt(resultat.ecartRecettes)}</div>
      </div>
    </div>

    ${commentaires?.contexte ? `
    <h3 class="sous-titre">Présentation de l'exercice</h3>
    <div class="commentaire-bloc">${(commentaires.contexte ?? '').replace(/\n/g, '<br>')}</div>` : ''}
  </div>

  <!-- PAGE 2 — DÉPENSES -->
  <div class="page">
    <div class="entete">
      <div><div class="nom-etab">${etablissement.nom}</div><div class="uai">UAI : ${etablissement.uai}</div></div>
      <div><div class="titre-rapport">Rapport de l'Ordonnateur</div><div class="annee">Exercice ${etablissement.annee}</div></div>
    </div>

    <h2 class="section-titre">Exécution budgétaire — Dépenses</h2>

    <table>
      <thead>
        <tr>
          <th class="lib">Section / Service</th>
          <th>Budget voté</th>
          <th>Mandaté</th>
          <th>Disponible</th>
          <th>Taux exec.</th>
        </tr>
      </thead>
      <tbody>
      ${lignesDepenses}
      </tbody>
      <tfoot>
        <tr>
          <td class="lib">TOTAL GÉNÉRAL</td>
          <td class="num">${fmt(sde.totalBudget)}</td>
          <td class="num">${fmt(sde.totalRealise)}</td>
          <td class="num">${fmt(sde.totalDisponible)}</td>
          <td class="num">${pct(sde.totalBudget > 0 ? sde.totalRealise / sde.totalBudget * 100 : 0)}</td>
        </tr>
      </tfoot>
    </table>

    ${commentaires?.executionDepenses ? `
    <h3 class="sous-titre">Commentaires sur les dépenses</h3>
    <div class="commentaire-bloc">${(commentaires.executionDepenses ?? '').replace(/\n/g, '<br>')}</div>` : ''}
  </div>

  <!-- PAGE 3 — RECETTES -->
  <div class="page">
    <div class="entete">
      <div><div class="nom-etab">${etablissement.nom}</div><div class="uai">UAI : ${etablissement.uai}</div></div>
      <div><div class="titre-rapport">Rapport de l'Ordonnateur</div><div class="annee">Exercice ${etablissement.annee}</div></div>
    </div>

    <h2 class="section-titre">Exécution budgétaire — Recettes</h2>

    <table>
      <thead>
        <tr>
          <th class="lib">Section / Service</th>
          <th>Budget voté</th>
          <th>Encaissé</th>
          <th>Écart</th>
          <th>Taux réal.</th>
        </tr>
      </thead>
      <tbody>
      ${lignesRecettes}
      </tbody>
      <tfoot>
        <tr>
          <td class="lib">TOTAL GÉNÉRAL</td>
          <td class="num">${fmt(sdr.totalBudget)}</td>
          <td class="num">${fmt(sdr.totalRealise)}</td>
          <td class="num">${fmt(sdr.totalEcart)}</td>
          <td class="num">${pct(sdr.totalBudget > 0 ? sdr.totalRealise / sdr.totalBudget * 100 : 0)}</td>
        </tr>
      </tfoot>
    </table>

    ${commentaires?.executionRecettes ? `
    <h3 class="sous-titre">Commentaires sur les recettes</h3>
    <div class="commentaire-bloc">${(commentaires.executionRecettes ?? '').replace(/\n/g, '<br>')}</div>` : ''}
  </div>

  <!-- PAGE 4 — SIGNATURES -->
  <div class="page">
    <div class="entete">
      <div><div class="nom-etab">${etablissement.nom}</div><div class="uai">UAI : ${etablissement.uai}</div></div>
      <div><div class="titre-rapport">Rapport de l'Ordonnateur</div><div class="annee">Exercice ${etablissement.annee}</div></div>
    </div>

    ${commentaires?.perspectivesFinancieres ? `
    <h2 class="section-titre">Perspectives financières</h2>
    <div class="commentaire-bloc">${(commentaires.perspectivesFinancieres ?? '').replace(/\n/g, '<br>')}</div>` : ''}

    <div class="signatures">
      <div class="signature-bloc">
        <div class="titre">L'Ordonnateur</div>
        <div class="nom">${etablissement.ordonnateur}</div>
        <div class="espace"></div>
        <div>Signature et cachet</div>
      </div>
      <div class="signature-bloc">
        <div class="titre">L'Agent Comptable</div>
        <div class="nom">${etablissement.agentComptable}</div>
        <div class="espace"></div>
        <div>Signature et cachet</div>
      </div>
    </div>

    <div style="text-align:center; font-size:7pt; color:#999; margin-top:40px; border-top:1px solid #ddd; padding-top:8px;">
      Document généré le ${etablissement.dateEdition} —
      ${etablissement.nom} (${etablissement.uai}) —
      Compte Financier ${etablissement.annee} —
      Académie de ${etablissement.academie}
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour générer le rapport.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };
}
