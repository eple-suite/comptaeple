// Génération du PDF magazine — page de garde tricolore + sections
// Utilise html2canvas + jsPDF pour rendre la page de garde + chaque section
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface MagazineExportOptions {
  filename?: string;
  coverElement: HTMLElement;
  contentElements?: HTMLElement[];
}

export async function exportMagazinePDF({ filename = 'compte-financier.pdf', coverElement, contentElements = [] }: MagazineExportOptions) {
  const toastId = toast.loading('Génération du PDF magazine…');
  try {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Page de garde
    const coverCanvas = await html2canvas(coverElement, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const coverImg = coverCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(coverImg, 'JPEG', 0, 0, pageW, pageH);

    // Sections suivantes
    for (const el of contentElements) {
      pdf.addPage('a4', 'landscape');
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const ratio = canvas.height / canvas.width;
      const imgH = pageW * ratio;
      if (imgH <= pageH) {
        pdf.addImage(img, 'JPEG', 0, (pageH - imgH) / 2, pageW, imgH);
      } else {
        // Fit to page height
        const imgW = pageH / ratio;
        pdf.addImage(img, 'JPEG', (pageW - imgW) / 2, 0, imgW, pageH);
      }
    }

    pdf.save(filename);
    toast.success('PDF magazine généré', { id: toastId });
  } catch (e: any) {
    console.error(e);
    toast.error('Erreur génération PDF : ' + (e?.message || ''), { id: toastId });
  }
}
