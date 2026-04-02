import { buildBarChart, buildPieChart } from './rapportPdfCharts';

export interface DonneesRapport {
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
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)} €`;
}

function pct(val: number): string {
  if (!Number.isFinite(val) || Number.isNaN(val)) return '—';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val)} %`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRichText(content?: string): string {
  const normalized = (content ?? '').trim();
  if (!normalized) return '';

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function renderCommentBlock(title: string, content?: string): string {
  if (!content?.trim()) return '';
  return `
    <section class="comment-panel">
      <h3>${escapeHtml(title)}</h3>
      <div class="comment-content">${renderRichText(content)}</div>
    </section>
  `;
}

function renderHeader(etablissement: DonneesRapport['etablissement'], compact = false): string {
  return `
    <header class="report-header ${compact ? 'report-header--compact' : ''}">
      <div>
        <div class="ministere">Ministère de l'Éducation Nationale</div>
        <div class="ministere">Académie de ${escapeHtml(etablissement.academie)}</div>
        <div class="etablissement-nom">${escapeHtml(etablissement.nom)}</div>
        <div class="etablissement-meta">${escapeHtml(etablissement.adresse)} — ${escapeHtml(etablissement.commune)}</div>
        <div class="etablissement-meta">UAI : ${escapeHtml(etablissement.uai)}</div>
      </div>
      <div class="report-header-side">
        <div class="report-kicker">Rapport de l'ordonnateur</div>
        <div class="report-title">Compte financier ${escapeHtml(String(etablissement.annee))}</div>
        <div class="report-date">Édité le ${escapeHtml(etablissement.dateEdition)}</div>
      </div>
    </header>
  `;
}

function renderDepensesRows(sections: DonneesRapport['sde']['sections']): string {
  return sections
    .map((section) => {
      const rowClass = section.taux > 100 ? 'is-danger' : section.taux >= 90 ? 'is-warning' : '';
      const subRows = (section.sousLignes ?? [])
        .map(
          (ligne) => `
            <tr class="sub-row">
              <td class="col-lib">${escapeHtml(ligne.code)} — ${escapeHtml(ligne.libelle)}</td>
              <td class="col-num">${fmt(ligne.budget)}</td>
              <td class="col-num">${fmt(ligne.realise)}</td>
              <td class="col-num">${fmt(ligne.disponible)}</td>
              <td class="col-num ${ligne.taux > 100 ? 'text-danger' : ligne.taux >= 90 ? 'text-warning' : ''}">${pct(ligne.taux)}</td>
            </tr>
          `,
        )
        .join('');

      return `
        <tr class="${rowClass}">
          <td class="col-lib">${escapeHtml(section.code)} — ${escapeHtml(section.libelle)}</td>
          <td class="col-num">${fmt(section.budget)}</td>
          <td class="col-num">${fmt(section.realise)}</td>
          <td class="col-num">${fmt(section.disponible)}</td>
          <td class="col-num ${section.taux > 100 ? 'text-danger' : section.taux >= 90 ? 'text-warning' : ''}">${pct(section.taux)}</td>
        </tr>
        ${subRows}
      `;
    })
    .join('');
}

function renderRecettesRows(sections: DonneesRapport['sdr']['sections']): string {
  return sections
    .map(
      (section) => `
        <tr>
          <td class="col-lib">${escapeHtml(section.code)} — ${escapeHtml(section.libelle)}</td>
          <td class="col-num">${fmt(section.budget)}</td>
          <td class="col-num">${fmt(section.realise)}</td>
          <td class="col-num ${section.ecart < 0 ? 'text-danger' : 'text-success'}">${fmt(section.ecart)}</td>
          <td class="col-num">${pct(section.budget > 0 ? (section.realise / section.budget) * 100 : 0)}</td>
        </tr>
      `,
    )
    .join('');
}

export function buildRapportHtml(donnees: DonneesRapport): string {
  const { etablissement, sde, sdr, resultat, commentaires } = donnees;
  const graphiqueBarres = buildBarChart(sde.sections.map((section) => ({
    libelle: section.libelle,
    budget: section.budget,
    realise: section.realise,
    taux: section.taux,
  })));
  const graphiqueRepartition = buildPieChart(sde.sections.map((section) => ({
    libelle: section.libelle,
    budget: section.budget,
    totalBudget: sde.totalBudget,
  })));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport Ordonnateur — ${escapeHtml(etablissement.nom)} — ${escapeHtml(String(etablissement.annee))}</title>
  <style>
    :root {
      --ink: 214 47% 15%;
      --muted: 214 17% 45%;
      --line: 216 26% 84%;
      --surface: 0 0% 100%;
      --surface-alt: 214 38% 97%;
      --brand: 212 63% 24%;
      --brand-soft: 214 45% 94%;
      --success: 158 63% 31%;
      --warning: 35 100% 38%;
      --danger: 6 53% 42%;
      --shadow: 0 18px 40px hsl(214 47% 15% / 0.12);
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: hsl(var(--ink));
      background: hsl(214 25% 94%);
      font-size: 10.5pt;
      line-height: 1.45;
    }

    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }

    .screen-toolbar {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 20px 20px 0;
    }

    .screen-toolbar button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 11px 18px;
      background: hsl(var(--brand));
      color: hsl(var(--surface));
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: var(--shadow);
    }

    .screen-toolbar button:last-child {
      background: hsl(var(--muted));
    }

    .document {
      padding: 20px 0 28px;
    }

    .page {
      width: 186mm;
      min-height: 268mm;
      margin: 0 auto 18px;
      background: hsl(var(--surface));
      padding: 14mm 12mm;
      box-shadow: var(--shadow);
      position: relative;
      break-after: page;
      page-break-after: always;
      break-inside: avoid;
      page-break-inside: avoid;
      orphans: 3;
      widows: 3;
    }

    .page:last-of-type {
      break-after: auto;
      page-break-after: auto;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      gap: 14mm;
      align-items: flex-start;
      padding-bottom: 8mm;
      border-bottom: 2px solid hsl(var(--brand));
      margin-bottom: 7mm;
    }

    .report-header--compact {
      margin-bottom: 6mm;
      padding-bottom: 5mm;
    }

    .ministere {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: hsl(var(--muted));
      font-size: 7.8pt;
    }

    .etablissement-nom {
      margin-top: 2mm;
      font-size: 14pt;
      font-weight: 700;
      color: hsl(var(--brand));
    }

    .etablissement-meta,
    .report-date {
      color: hsl(var(--muted));
      font-size: 8.4pt;
    }

    .report-header-side {
      text-align: right;
      max-width: 62mm;
    }

    .report-kicker {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: hsl(var(--brand));
      font-size: 8.4pt;
    }

    .report-title {
      margin-top: 1.5mm;
      font-size: 12.5pt;
      font-weight: 700;
    }

    .section-titre {
      background: hsl(var(--brand));
      color: hsl(var(--surface));
      padding: 3mm 4mm;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 10pt;
      font-weight: 700;
      margin: 0 0 5mm;
      break-after: avoid;
      page-break-after: avoid;
    }

    .intro-note {
      margin: 0 0 5mm;
      font-size: 9pt;
      color: hsl(var(--muted));
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4mm;
      margin-bottom: 5mm;
    }

    .metric-card {
      border: 1px solid hsl(var(--line));
      background: hsl(var(--surface-alt));
      padding: 4mm;
      border-radius: 3mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .metric-card--alert {
      border-color: hsl(var(--danger) / 0.35);
      background: hsl(6 60% 97%);
    }

    .metric-label {
      font-size: 7.8pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: hsl(var(--muted));
      margin-bottom: 1mm;
    }

    .metric-value {
      font-size: 15pt;
      font-weight: 700;
      color: hsl(var(--brand));
      font-family: 'Courier New', Courier, monospace;
    }

    .metric-value.is-success { color: hsl(var(--success)); }
    .metric-value.is-danger { color: hsl(var(--danger)); }

    .chart-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
      gap: 4mm;
      margin-bottom: 5mm;
    }

    .chart-panel {
      border: 1px solid hsl(var(--line));
      background: hsl(var(--surface-alt));
      border-radius: 3mm;
      padding: 4mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .sous-titre {
      margin: 0 0 3mm;
      color: hsl(var(--brand));
      font-size: 8.8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      break-after: avoid;
      page-break-after: avoid;
    }

    .bar-chart-wrapper,
    .pie-chart-wrapper {
      display: flex;
      flex-direction: column;
      gap: 2.4mm;
    }

    .bar-chart-title,
    .pie-chart-title {
      font-size: 8pt;
      font-weight: 700;
      color: hsl(var(--muted));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .bar-chart-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 16mm;
      gap: 1.6mm 2.2mm;
      align-items: center;
    }

    .bar-chart-label,
    .bar-chart-value,
    .bar-chart-details,
    .pie-chart-legend-item {
      font-size: 7.8pt;
    }

    .bar-chart-label {
      font-weight: 700;
    }

    .bar-chart-value {
      text-align: right;
      font-weight: 700;
      color: hsl(var(--brand));
      font-family: 'Courier New', Courier, monospace;
    }

    .bar-chart-container {
      grid-column: 1 / -1;
      height: 6mm;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid hsl(var(--line));
      background: hsl(var(--brand-soft));
      box-shadow: inset 0 1px 1px hsl(var(--ink) / 0.08);
    }

    .bar-chart-bar {
      height: 100%;
      min-width: 4px;
      border-radius: 999px;
    }

    .bar-chart-details {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      gap: 3mm;
      color: hsl(var(--muted));
    }

    .pie-chart-bar-container {
      display: flex;
      width: 100%;
      height: 11mm;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid hsl(var(--line));
      background: hsl(var(--brand-soft));
    }

    .pie-chart-segment-bar {
      height: 100%;
    }

    .pie-chart-legend {
      display: grid;
      gap: 1.8mm;
    }

    .pie-chart-legend-item {
      display: grid;
      grid-template-columns: 4mm minmax(0, 1fr) auto;
      gap: 2mm;
      align-items: center;
    }

    .pie-chart-legend-color {
      width: 3.5mm;
      height: 3.5mm;
      border-radius: 999px;
      display: inline-block;
    }

    .pie-chart-legend-label {
      color: hsl(var(--ink));
    }

    .pie-chart-legend-pct {
      color: hsl(var(--brand));
      font-weight: 700;
      font-family: 'Courier New', Courier, monospace;
    }

    .chart-empty {
      padding: 3mm;
      border: 1px dashed hsl(var(--line));
      border-radius: 2.5mm;
      color: hsl(var(--muted));
      font-size: 8pt;
      background: hsl(var(--surface));
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.8pt;
      margin-bottom: 5mm;
    }

    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }

    thead th {
      background: hsl(var(--brand));
      color: hsl(var(--surface));
      padding: 2.4mm 2.8mm;
      border: 1px solid hsl(212 64% 18%);
      text-align: right;
      white-space: nowrap;
      font-size: 8.1pt;
    }

    thead th:first-child,
    tbody td:first-child,
    tfoot td:first-child {
      text-align: left;
    }

    tbody td,
    tfoot td {
      padding: 2.3mm 2.8mm;
      border: 1px solid hsl(var(--line));
      vertical-align: top;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    tbody tr:nth-child(even) {
      background: hsl(214 40% 99%);
    }

    tbody tr.is-warning {
      background: hsl(44 100% 96%);
    }

    tbody tr.is-danger {
      background: hsl(8 60% 96%);
    }

    .sub-row td:first-child {
      padding-left: 7mm;
      color: hsl(215 25% 35%);
      font-style: italic;
    }

    .col-num {
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
      white-space: nowrap;
    }

    .text-success { color: hsl(var(--success)); font-weight: 700; }
    .text-warning { color: hsl(var(--warning)); font-weight: 700; }
    .text-danger { color: hsl(var(--danger)); font-weight: 700; }

    tfoot td {
      background: hsl(var(--brand-soft));
      font-weight: 700;
    }

    .comment-panel {
      border: 1px solid hsl(var(--line));
      border-left: 4px solid hsl(var(--brand));
      background: hsl(var(--surface-alt));
      border-radius: 3mm;
      padding: 4mm 4.5mm;
      margin-top: 4mm;
      break-inside: avoid;
      page-break-inside: avoid;
      orphans: 3;
      widows: 3;
    }

    .comment-panel h3 {
      margin: 0 0 2mm;
      font-size: 9.2pt;
      color: hsl(var(--brand));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .comment-content p {
      margin: 0 0 2.4mm;
      font-size: 9.2pt;
    }

    .comment-content p:last-child { margin-bottom: 0; }

    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10mm;
      margin-top: 14mm;
    }

    .signature-box {
      border-top: 1px solid hsl(var(--ink));
      padding-top: 3mm;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .signature-title {
      font-size: 9pt;
      font-weight: 700;
    }

    .signature-name {
      margin-top: 2mm;
      font-size: 9pt;
    }

    .signature-space {
      height: 26mm;
    }

    .footer-note {
      margin-top: 8mm;
      padding-top: 3mm;
      border-top: 1px solid hsl(var(--line));
      text-align: center;
      font-size: 7.6pt;
      color: hsl(var(--muted));
    }

    .page-marker {
      position: absolute;
      bottom: 8mm;
      right: 12mm;
      color: hsl(var(--muted));
      font-size: 7.6pt;
    }

    @media print {
      .page {
        page-break-after: always !important;
        page-break-inside: avoid !important;
        break-after: page !important;
        break-inside: avoid !important;
        orphans: 3;
        widows: 3;
      }

      .page:last-of-type {
        page-break-after: auto !important;
        break-after: auto !important;
      }

      h2.section-titre, h3.sous-titre {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }
      tr { page-break-inside: avoid !important; break-inside: avoid !important; }

      *:empty:not(.bar-chart-bar):not(.pie-chart-segment-bar):not(.pie-chart-legend-color) {
        display: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .btn-imprimer,
      button,
      .no-print {
        display: none !important;
      }

      body {
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      .screen-toolbar {
        display: none !important;
      }

      .document {
        padding: 0;
      }

      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }

      .metric-card,
      .comment-panel,
      thead tr,
      tfoot tr,
      h2.section-titre {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <button type="button" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    <button type="button" onclick="window.close()">✕ Fermer</button>
  </div>

  <main class="document">
    <section class="page">
      ${renderHeader(etablissement)}
      <h2 class="section-titre">Synthèse financière — Exercice ${escapeHtml(String(etablissement.annee))}</h2>
      <p class="intro-note">Document de synthèse destiné à la présentation du compte financier devant les instances de gouvernance de l'établissement.</p>

      <div class="metrics-grid">
        <article class="metric-card">
          <div class="metric-label">Budget voté</div>
          <div class="metric-value">${fmt(sde.totalBudget)}</div>
        </article>
        <article class="metric-card ${resultat.resultatComptable < 0 ? 'metric-card--alert' : ''}">
          <div class="metric-label">Résultat comptable</div>
          <div class="metric-value ${resultat.resultatComptable >= 0 ? 'is-success' : 'is-danger'}">${resultat.resultatComptable >= 0 ? '+' : ''}${fmt(resultat.resultatComptable)}</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Dépenses mandatées</div>
          <div class="metric-value">${fmt(resultat.depensesRealisees)}</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Recettes encaissées</div>
          <div class="metric-value">${fmt(resultat.recettesRealisees)}</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Crédits disponibles</div>
          <div class="metric-value">${fmt(resultat.creditDisponible)}</div>
        </article>
        <article class="metric-card ${resultat.ecartRecettes < 0 ? 'metric-card--alert' : ''}">
          <div class="metric-label">Écart recettes / prévisions</div>
          <div class="metric-value ${resultat.ecartRecettes >= 0 ? 'is-success' : 'is-danger'}">${fmt(resultat.ecartRecettes)}</div>
        </article>
      </div>

      <div class="chart-grid">
        <section class="chart-panel">
          <h3 class="sous-titre">Exécution budgétaire — Vue graphique</h3>
          ${graphiqueBarres}
        </section>
        <section class="chart-panel">
          <h3 class="sous-titre">Répartition du budget</h3>
          ${graphiqueRepartition}
        </section>
      </div>

      ${renderCommentBlock("Présentation de l'exercice", commentaires?.contexte)}
      <div class="page-marker">Page 1 / 4</div>
    </section>

    <section class="page">
      ${renderHeader(etablissement, true)}
      <h2 class="section-titre">Exécution budgétaire — Dépenses</h2>
      <table>
        <thead>
          <tr>
            <th>Section / Service</th>
            <th>Budget voté</th>
            <th>Mandaté</th>
            <th>Disponible</th>
            <th>Taux d'exécution</th>
          </tr>
        </thead>
        <tbody>
          ${renderDepensesRows(sde.sections)}
        </tbody>
        <tfoot>
          <tr>
            <td>Total général</td>
            <td class="col-num">${fmt(sde.totalBudget)}</td>
            <td class="col-num">${fmt(sde.totalRealise)}</td>
            <td class="col-num">${fmt(sde.totalDisponible)}</td>
            <td class="col-num">${pct(sde.totalBudget > 0 ? (sde.totalRealise / sde.totalBudget) * 100 : 0)}</td>
          </tr>
        </tfoot>
      </table>

      ${renderCommentBlock('Analyse des dépenses', commentaires?.executionDepenses)}
      <div class="page-marker">Page 2 / 4</div>
    </section>

    <section class="page">
      ${renderHeader(etablissement, true)}
      <h2 class="section-titre">Exécution budgétaire — Recettes</h2>
      <table>
        <thead>
          <tr>
            <th>Section / Service</th>
            <th>Budget voté</th>
            <th>Encaissé</th>
            <th>Écart</th>
            <th>Taux de réalisation</th>
          </tr>
        </thead>
        <tbody>
          ${renderRecettesRows(sdr.sections)}
        </tbody>
        <tfoot>
          <tr>
            <td>Total général</td>
            <td class="col-num">${fmt(sdr.totalBudget)}</td>
            <td class="col-num">${fmt(sdr.totalRealise)}</td>
            <td class="col-num">${fmt(sdr.totalEcart)}</td>
            <td class="col-num">${pct(sdr.totalBudget > 0 ? (sdr.totalRealise / sdr.totalBudget) * 100 : 0)}</td>
          </tr>
        </tfoot>
      </table>

      ${renderCommentBlock('Analyse des recettes', commentaires?.executionRecettes)}
      <div class="page-marker">Page 3 / 4</div>
    </section>

    <section class="page">
      ${renderHeader(etablissement, true)}
      <h2 class="section-titre">Perspectives financières et signatures</h2>
      ${renderCommentBlock('Perspectives financières', commentaires?.perspectivesFinancieres)}

      <div class="signature-grid">
        <div class="signature-box">
          <div class="signature-title">L'Ordonnateur</div>
          <div class="signature-name">${escapeHtml(etablissement.ordonnateur)}</div>
          <div class="signature-space"></div>
          <div>Signature et cachet</div>
        </div>
        <div class="signature-box">
          <div class="signature-title">L'Agent Comptable</div>
          <div class="signature-name">${escapeHtml(etablissement.agentComptable)}</div>
          <div class="signature-space"></div>
          <div>Signature et cachet</div>
        </div>
      </div>

      <div class="footer-note">
        Document généré le ${escapeHtml(etablissement.dateEdition)} — ${escapeHtml(etablissement.nom)} (${escapeHtml(etablissement.uai)}) — Compte Financier ${escapeHtml(String(etablissement.annee))} — Académie de ${escapeHtml(etablissement.academie)}
      </div>
      <div class="page-marker">Page 4 / 4</div>
    </section>
  </main>
</body>
</html>`;
}
