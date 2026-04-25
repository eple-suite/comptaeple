// ═══════════════════════════════════════════════════════════════════
// COFI — Bouton export unifié 3 PDF + JSON + ZIP (chantiers 9-10)
// Affiche un menu déroulant : Ordonnateur · AC · Annexe · ZIP · JSON
// + toggle "Filigrane PROJET"
// ═══════════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import {
  generateOrdoPdf, generateAcPdf, generateAnnexePdf,
  generateIndicateursJson, generateZipBundle, downloadBlob,
  type CofiExportContext, type CofiExportPayload,
} from '@/lib/compteFinancier/exportTroisPdf';
import { Download, FileText, FileArchive, FileJson, Loader2, Stamp } from 'lucide-react';
import { toast } from 'sonner';

export function ExportTroisPdfBouton() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const [isProjet, setIsProjet] = useState(true);
  const [busy, setBusy] = useState(false);

  const buildCtx = (): CofiExportContext => ({
    uai: etab.uai || 'NA',
    nom: etab.nom || 'Établissement',
    exercice: etab.exercice ?? new Date().getFullYear() - 1,
    academie: etab.academie,
    commune: etab.commune,
    ordonnateur: (etab as any).ordonnateur,
    agentComptable: (etab as any).agentComptable,
    isProjet,
  });

  const buildPayload = (): CofiExportPayload => {
    const r = resultats[activeBudget] || resultats.principal || {};
    return {
      ordo: {
        resultatBudgetaire: r.resultatBudgetaire,
        totalChargesSde: r.totalChargesSde,
        totalProduitsSdr: r.totalProduitsSdr,
        services: r.services,
        domaines: r.domaines,
        operationsOrdre: r.operationsOrdre,
      },
      ac: {
        fdrComptable: r.fdrComptable,
        fdrHaut: r.fdrHaut,
        fdrBas: r.fdrBas,
        bfr: r.bfr,
        tresorerie: r.tresorerie,
        cafComptable: r.cafComptable,
        cafBudgetaire: r.cafBudgetaire,
        joursFdr: r.joursFdr,
        joursTresorerie: r.joursTresorerie,
        reserves: r.reserves,
        totalCreances: r.totalCreances,
        ratioLiquiditeGenerale: r.ratioLiquiditeGenerale,
        ratioAutonomieFinanciere: r.ratioAutonomieFinanciere,
        ratioEndettement: r.ratioEndettement,
      },
      annexe: {
        immobilisations: { total: r.totalImmo, amortissements: r.totalAmortissements, vnc: r.valeurNette },
        creances: {
          etat: r.creancesEtat, collectivite: r.creancesCollectivite,
          familles: r.creancesFamilles, autres: r.creancesAutres, total: r.totalCreances,
        },
        dettes: {
          fournisseurs: r.dettesFournisseurs, etat: r.dettesEtat,
          collectivite: r.dettesCollectivite, autres: r.dettesAutres, total: r.totalDettes,
        },
        reserves: { total: r.reserves, ssSpeciaux: r.reservesSsSpeciaux, srh: r.reservesSRH },
      },
    };
  };

  const handle = async (kind: 'ordo' | 'ac' | 'annexe' | 'zip' | 'json' | 'all') => {
    setBusy(true);
    try {
      const ctx = buildCtx();
      const payload = buildPayload();
      const base = `${ctx.uai}_${ctx.exercice}`;
      if (kind === 'ordo' || kind === 'all') {
        downloadBlob(generateOrdoPdf(ctx, payload), `Rapport_Ordonnateur_${base}.pdf`);
      }
      if (kind === 'ac' || kind === 'all') {
        downloadBlob(generateAcPdf(ctx, payload), `Rapport_Agent_Comptable_${base}.pdf`);
      }
      if (kind === 'annexe' || kind === 'all') {
        downloadBlob(generateAnnexePdf(ctx, payload), `Annexe_Comptable_${base}.pdf`);
      }
      if (kind === 'json') {
        downloadBlob(generateIndicateursJson(ctx, payload), `indicateurs_${base}.json`);
      }
      if (kind === 'zip') {
        const blob = await generateZipBundle(ctx, payload);
        downloadBlob(blob, `compte_financier_${base}.zip`);
      }
      toast.success('Export généré');
    } catch (e: any) {
      console.error('[ExportTroisPdf]', e);
      toast.error(`Échec de l'export : ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
          Export Compte Financier
          {isProjet && <Badge variant="outline" className="ml-2 text-[10px] border-warning text-warning">PROJET</Badge>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs">Documents officiels</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handle('ordo')}>
          <FileText className="h-4 w-4 mr-2" /> Rapport ordonnateur (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('ac')}>
          <FileText className="h-4 w-4 mr-2" /> Rapport agent comptable (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('annexe')}>
          <FileText className="h-4 w-4 mr-2" /> Annexe comptable (PDF)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handle('all')}>
          <Download className="h-4 w-4 mr-2" /> Les 3 PDF d'un coup
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('zip')}>
          <FileArchive className="h-4 w-4 mr-2" /> Bundle ZIP rectorat (3 PDF + JSON)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('json')}>
          <FileJson className="h-4 w-4 mr-2" /> Indicateurs JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={isProjet}
          onCheckedChange={(v) => setIsProjet(Boolean(v))}
        >
          <Stamp className="h-4 w-4 mr-2" /> Filigrane « PROJET »
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}