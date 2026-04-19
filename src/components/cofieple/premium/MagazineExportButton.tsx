// Bouton d'export PDF magazine — déclenche la génération avec page de garde tricolore
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Printer, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MagazineCoverPDF } from './MagazineCoverPDF';
import { exportMagazinePDF } from '@/lib/cofiepleMagazinePdf';

interface MagazineExportButtonProps {
  etabNom: string;
  exercice: number;
  uai: string;
  commune?: string;
  academie?: string;
  resultatComptable?: number;
  fdr?: number;
  treso?: number;
  signataireOrdo?: string;
  signataireAC?: string;
}

export function MagazineExportButton(props: MagazineExportButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      // Render hidden cover
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = '1123px'; // A4 landscape @ 96dpi ≈ 1123×794
      wrapper.style.height = '794px';
      wrapper.style.background = 'white';
      document.body.appendChild(wrapper);

      const root = createRoot(wrapper);
      await new Promise<void>((resolve) => {
        root.render(<MagazineCoverPDF {...props} />);
        setTimeout(resolve, 300);
      });

      await exportMagazinePDF({
        filename: `compte-financier-${props.uai}-${props.exercice}.pdf`,
        coverElement: wrapper,
        contentElements: [], // future: append rendered sections
      });

      root.unmount();
      document.body.removeChild(wrapper);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={busy} size="sm" variant="outline" className="gap-2">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
      <span className="font-semibold">PDF Magazine</span>
    </Button>
  );
}
