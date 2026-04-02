// ⚠️ FICHIER CRITIQUE — Générateur rapport ordonnateur
// Produit un document HTML autonome optimisé impression A4
// NE PAS remplacer par html2canvas ou window.print() sur le DOM React

import { buildRapportHtml, type DonneesRapport } from './rapportPdfTemplate';

export type { DonneesRapport } from './rapportPdfTemplate';

export function generateRapportPDF(donnees: DonneesRapport): void {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Veuillez autoriser les popups pour générer le rapport.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildRapportHtml(donnees));
  printWindow.document.close();
  printWindow.focus();
}
