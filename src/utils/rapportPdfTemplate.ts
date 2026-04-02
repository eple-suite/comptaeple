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

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport Ordonnateur — ${escapeHtml(etablissement.nom)} — ${escapeHtml(String(etablissement.annee))}</title>
  <style>
    :root {
      --ink: #132238;
      --muted: #5f6f85;
      --line: #cfd7e3;
      --surface: #ffffff;
      --surface-alt: #f4f7fb;
      --brand: #163a63;
      --brand-soft: #eaf0f8;
      --success: #1d7f5f;
      --warning: #aa6c00;
      --danger: #a43a32;
      --shadow: 0 18px 40px rgba(19, 34, 56, 0.12);
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: var(--ink);
      background: #eef2f7;
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
      background: var(--brand);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: var(--shadow);
    }

    .screen-toolbar button:last-child {
      background: #44556d;
    }

    .document {
      padding: 20px 0 28px;
    }

    .sheet {
      width: 186mm;
      min-height: 268mm;
      margin: 0 auto 18px;
      background: var(--surface);
      padding: 14mm 12mm;
      box-shadow: var(--shadow);
      position: relative;
      break-after: page;
      page-break-after: always;
    }

    .sheet:last-of-type {
      break-after: auto;
      page-break-after: auto;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      gap: 14mm;
      align-items: flex-start;
      padding-bottom: 8mm;
      border-bottom: 2px solid var(--brand);
      margin-bottom: 7mm;
    }

    .report-header--compact {
      margin-bottom: 6mm;
      padding-bottom: 5mm;
    }

    .ministere {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-size: 7.8pt;
    }

    .etablissement-nom {
      margin-top: 2mm;
      font-size: 14pt;
      font-weight: 700;
      color: var(--brand);
    }

    .etablissement-meta,
    .report-date {
      color: var(--muted);
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
      color: var(--brand);
      font-size: 8.4pt;
    }

    .report-title {
      margin-top: 1.5mm;
      font-size: 12.5pt;
      font-weight: 700;
    }

    .band-title {
      background: var(--brand);
      color: #fff;
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
      color: var(--muted);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4mm;
      margin-bottom: 5mm;
    }

    .metric-card {
      border: 1px solid var(--line);
      background: var(--surface-alt);
      padding: 4mm;
      border-radius: 3mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .metric-card--alert {
      border-color: rgba(164, 58, 50, 0.35);
      background: #fcf2f1;
    }

    .metric-label {
      font-size: 7.8pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 1mm;
    }

    .metric-value {
      font-size: 15pt;
      font-weight: 700;
      color: var(--brand);
      font-family: 'Courier New', Courier, monospace;
    }

    .metric-value.is-success { color: var(--success); }
    .metric-value.is-danger { color: var(--danger); }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.8pt;
      margin-bottom: 5mm;
    }

    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }

    thead th {
      background: var(--brand);
      color: #fff;
      padding: 2.4mm 2.8mm;
      border: 1px solid #0f2b49;
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
      border: 1px solid var(--line);
      vertical-align: top;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    tbody tr:nth-child(even) {
      background: #fafbfd;
    }

    tbody tr.is-warning {
      background: #fff8e8;
    }

    tbody tr.is-danger {
      background: #fdf0ef;
    }

    .sub-row td:first-child {
      padding-left: 7mm;
      color: #42546d;
      font-style: italic;
    }

    .col-num {
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
      white-space: nowrap;
    }

    .text-success { color: var(--success); font-weight: 700; }
    .text-warning { color: var(--warning); font-weight: 700; }
    .text-danger { color: var(--danger); font-weight: 700; }

    tfoot td {
      background: var(--brand-soft);
      font-weight: 700;
    }

    .comment-panel {
      border: 1px solid var(--line);
      border-left: 4px solid var(--brand);
      background: var(--surface-alt);
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
      color: var(--brand);
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
      border-top: 1px solid var(--ink);
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
      border-top: 1px solid var(--line);
      text-align: center;
      font-size: 7.6pt;
      color: var(--muted);
    }

    .page-marker {
      position: absolute;
      bottom: 8mm;
      right: 12mm;
      color: var(--muted);
      font-size: 7.6pt;
    }

    @media print {
      body {
        background: #fff;
      }

      .screen-toolbar {
        display: none !important;
      }

      .document {
        padding: 0;
      }

      .sheet {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
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
    <section class="sheet">
      ${renderHeader(etablissement)}
      <div class="band-title">Synthèse financière — Exercice ${escapeHtml(String(etablissement.annee))}</div>
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

      ${renderCommentBlock("Présentation de l'exercice", commentaires?.contexte)}
      <div class="page-marker">Page 1 / 4</div>
    </section>

    <section class="sheet">
      ${renderHeader(etablissement, true)}
      <div class="band-title">Exécution budgétaire — Dépenses</div>
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

    <section class="sheet">
      ${renderHeader(etablissement, true)}
      <div class="band-title">Exécution budgétaire — Recettes</div>
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

    <section class="sheet">
      ${renderHeader(etablissement, true)}
      <div class="band-title">Perspectives financières et signatures</div>
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
