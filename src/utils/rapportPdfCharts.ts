type BarChartSection = {
  libelle: string;
  budget: number;
  realise: number;
  taux: number;
};

type PieChartSection = {
  libelle: string;
  budget: number;
  totalBudget: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(val: number): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)} €`;
}

export function buildBarChart(sections: BarChartSection[]): string {
  const normalizedSections = sections.filter((section) => Number.isFinite(section.budget) || Number.isFinite(section.realise));

  if (!normalizedSections.length) {
    return '<div class="chart-empty">Aucune donnée disponible pour afficher le graphique d’exécution.</div>';
  }

  const lignes = normalizedSections
    .map((section) => {
      const budgetReference = section.budget > 0 ? section.budget : Math.max(section.realise, 0);
      const largeurRealise = budgetReference > 0 ? Math.min((section.realise / budgetReference) * 100, 100) : 0;
      const couleur = section.taux > 100
        ? 'hsl(6 55% 48%)'
        : section.taux >= 90
          ? 'hsl(35 100% 45%)'
          : 'hsl(154 64% 34%)';

      return `
        <div class="bar-chart-row">
          <div class="bar-chart-label">${escapeHtml(section.libelle)}</div>
          <div class="bar-chart-value">${Number.isFinite(section.taux) ? section.taux.toFixed(1) : '0.0'} %</div>
          <div class="bar-chart-container">
            <div class="bar-chart-bar" style="width: ${largeurRealise}%; background-color: ${couleur};"></div>
          </div>
          <div class="bar-chart-details">
            <span>Mandaté : ${fmt(section.realise)}</span>
            <span>Budget : ${fmt(section.budget)}</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="bar-chart-wrapper">
      <div class="bar-chart-title">Taux d'exécution budgétaire par section</div>
      ${lignes}
    </div>
  `;
}

export function buildPieChart(sections: PieChartSection[]): string {
  const normalizedSections = sections.filter((section) => section.budget > 0);
  const totalBudget = normalizedSections.reduce((sum, section) => sum + section.budget, 0);

  if (!normalizedSections.length || totalBudget <= 0) {
    return '<div class="chart-empty">Aucune donnée disponible pour afficher la répartition budgétaire.</div>';
  }

  const couleurs = [
    'hsl(212 100% 20%)',
    'hsl(211 100% 40%)',
    'hsl(207 100% 60%)',
    'hsl(203 100% 72%)',
    'hsl(201 100% 82%)',
  ];

  const segments = normalizedSections.map((section, index) => ({
    ...section,
    pct: (section.budget / totalBudget) * 100,
    couleur: couleurs[index % couleurs.length],
  }));

  const barreParts = segments
    .map(
      (section) => `
        <div class="pie-chart-segment-bar" style="width: ${section.pct}%; background-color: ${section.couleur};"></div>
      `,
    )
    .join('');

  const legendeItems = segments
    .map(
      (section) => `
        <div class="pie-chart-legend-item">
          <span class="pie-chart-legend-color" style="background-color: ${section.couleur};"></span>
          <span class="pie-chart-legend-label">${escapeHtml(section.libelle)}</span>
          <span class="pie-chart-legend-pct">${section.pct.toFixed(1)} %</span>
        </div>
      `,
    )
    .join('');

  return `
    <div class="pie-chart-wrapper">
      <div class="pie-chart-title">Répartition du budget par section</div>
      <div class="pie-chart-bar-container">
        ${barreParts}
      </div>
      <div class="pie-chart-legend">
        ${legendeItems}
      </div>
    </div>
  `;
}