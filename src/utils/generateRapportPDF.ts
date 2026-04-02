// ⚠️ FICHIER CRITIQUE — Générateur rapport ordonnateur
// Produit un document HTML autonome optimisé impression A4
// NE PAS remplacer par html2canvas ou window.print() sur le DOM React

import { buildRapportHtml, type DonneesRapport } from './rapportPdfTemplate';

export type { DonneesRapport } from './rapportPdfTemplate';

export function generateRapportPDF(donnees: DonneesRapport): void {
  const html = buildRapportHtml(donnees);
  const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');

  if (!printWindow) {
    alert(
      'Les popups sont bloquées.\n\n' +
      'Pour générer le rapport :\n' +
      '→ Cliquez sur l\'icône de blocage de popup dans la barre d\'adresse\n' +
      '→ Autorisez les popups pour ce site\n' +
      '→ Réessayez',
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  function waitForPrint() {
    if (printWindow.document.readyState === 'complete') {
      printWindow.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      printWindow.setTimeout(waitForPrint, 100);
    }
  }

  printWindow.setTimeout(waitForPrint, 200);
}
