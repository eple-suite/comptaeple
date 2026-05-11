// ═══════════════════════════════════════════════════════════════
// ExpectedFilesGuide — guide visuel "quel fichier importer ?"
// Affiche, pour chaque type attendu, un bloc clair :
// nom du fichier, à quoi il sert, où le trouver dans Op@le,
// format attendu, exemple de nom de fichier.
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet, BookOpen, Receipt, Users, HandCoins,
  Wallet, Briefcase, ListChecks, HelpCircle, MapPin, FileText,
} from 'lucide-react';
import type { ImportFileType } from '@/lib/import';

export interface ExpectedFileSpec {
  type: ImportFileType | 'ecbu' | 'siecle_voyages';
  titre: string;
  aQuoiCaSert: string;
  ouLeTrouver: string;
  formats: string[];
  exempleNom: string;
  obligatoire?: boolean;
  icon: React.ReactNode;
}

const SPECS: Record<string, ExpectedFileSpec> = {
  balance: {
    type: 'balance',
    titre: 'Balance comptable',
    aQuoiCaSert: "Photographie de tous les comptes (classes 1 à 7) à une date donnée. Indispensable pour le bilan, le FDR, la trésorerie et tous les indicateurs M9-6.",
    ouLeTrouver: "Op@le → Comptabilité générale → Éditions → Balance générale (export Excel).",
    formats: ['.xlsx', '.xls', '.csv'],
    exempleNom: 'Balance_0330089T_2024.xlsx',
    obligatoire: true,
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  sde: {
    type: 'sde',
    titre: 'SDE — Situation des dépenses',
    aQuoiCaSert: "Suivi des crédits, engagements et mandats par destination/domaine/activité. Sert au taux d'exécution des charges.",
    ouLeTrouver: "Op@le → Budget → Éditions → Situation des dépenses (export Excel).",
    formats: ['.xlsx', '.xls'],
    exempleNom: 'SDE_0330089T_2024.xlsx',
    obligatoire: true,
    icon: <Receipt className="h-5 w-5" />,
  },
  sdr: {
    type: 'sdr',
    titre: 'SDR — Situation des recettes',
    aQuoiCaSert: "Suivi des recettes notifiées, ordres de recettes et encaissements. Sert au taux d'exécution des produits et au RAR.",
    ouLeTrouver: "Op@le → Budget → Éditions → Situation des recettes (export Excel).",
    formats: ['.xlsx', '.xls'],
    exempleNom: 'SDR_0330089T_2024.xlsx',
    obligatoire: true,
    icon: <HandCoins className="h-5 w-5" />,
  },
  ecbu: {
    type: 'ecbu',
    titre: 'ECBU — État de consommation budgétaire',
    aQuoiCaSert: "État synthétique des consommations par service/domaine. Recommandé pour HYPER@LE (sert d'alternative au couple SDE+SDR).",
    ouLeTrouver: "Op@le → Budget → Éditions → ECBU (export Excel).",
    formats: ['.xlsx', '.xls'],
    exempleNom: 'ECBU_0330089T_2024.xlsx',
    icon: <ListChecks className="h-5 w-5" />,
  },
  grand_livre: {
    type: 'grand_livre',
    titre: 'Grand livre',
    aQuoiCaSert: "Détail de toutes les écritures comptables compte par compte. Utile pour audit, contrôle interne et justification des soldes.",
    ouLeTrouver: "Op@le → Comptabilité générale → Éditions → Grand livre (export Excel).",
    formats: ['.xlsx', '.xls', '.csv'],
    exempleNom: 'GrandLivre_0330089T_2024.xlsx',
    icon: <BookOpen className="h-5 w-5" />,
  },
  etat_tiers: {
    type: 'etat_tiers',
    titre: 'État des tiers (balance auxiliaire)',
    aQuoiCaSert: "Soldes par fournisseur, famille, élève débiteur. Sert au RAR détaillé et au pilotage des SATD.",
    ouLeTrouver: "Op@le → Tiers → Éditions → Balance auxiliaire (export Excel).",
    formats: ['.xlsx', '.xls'],
    exempleNom: 'EtatTiers_0330089T_2024.xlsx',
    icon: <Users className="h-5 w-5" />,
  },
  siecle_eleves: {
    type: 'siecle_eleves',
    titre: 'SIECLE — Liste des élèves',
    aQuoiCaSert: "Effectifs, classes, MEF, régime, responsables. Indispensable pour fonds sociaux, voyages, restauration.",
    ouLeTrouver: "SIECLE → BEE → Exploitation → Liste des élèves (export CSV/XLSX).",
    formats: ['.csv', '.xlsx'],
    exempleNom: 'ExportEleves_0330089T.csv',
    icon: <Users className="h-5 w-5" />,
  },
  siecle_bourses: {
    type: 'siecle_bourses',
    titre: 'État des bourses nationales',
    aQuoiCaSert: "Échelons, montants trimestriels, bénéficiaires. Sert au rapprochement avec C/443110 et aux fonds sociaux.",
    ouLeTrouver: "SIECLE → Bourses → Édition → État nominatif (export CSV/XLSX).",
    formats: ['.csv', '.xlsx'],
    exempleNom: 'Bourses_0330089T_T1.csv',
    icon: <Wallet className="h-5 w-5" />,
  },
  regies: {
    type: 'regies',
    titre: 'État des régies',
    aQuoiCaSert: "Mouvements de caisse, avances et encaissements régisseurs. Sert au contrôle interne comptable (CIC).",
    ouLeTrouver: "Op@le → Régies → Éditions → État de caisse (export Excel).",
    formats: ['.xlsx', '.xls'],
    exempleNom: 'Regies_0330089T_2024.xlsx',
    icon: <Wallet className="h-5 w-5" />,
  },
  paie: {
    type: 'paie',
    titre: 'Extraction paie / KX-Paie',
    aQuoiCaSert: "Brut, cotisations, net à payer par matricule. Utilisé pour les budgets annexes (CFA, GRETA) et la marge SRH.",
    ouLeTrouver: "Op@le → Paie → Éditions → Journal de paie (export Excel).",
    formats: ['.xlsx', '.xls', '.csv'],
    exempleNom: 'Paie_0330089T_202412.xlsx',
    icon: <Briefcase className="h-5 w-5" />,
  },
  siecle_voyages: {
    type: 'siecle_voyages',
    titre: 'SIECLE — Liste des participants au voyage',
    aQuoiCaSert: "Liste nominative des élèves inscrits au voyage. Sert au calcul du coût/élève et au rapprochement avec les familles.",
    ouLeTrouver: "SIECLE → BEE → Exploitation → Filtrer par classe puis exporter (CSV/XLSX).",
    formats: ['.csv', '.xlsx'],
    exempleNom: 'Voyage_Espagne_3eA.csv',
    icon: <MapPin className="h-5 w-5" />,
  },
  inconnu: {
    type: 'inconnu',
    titre: 'Autre fichier',
    aQuoiCaSert: "Type non reconnu automatiquement — vous pourrez le qualifier manuellement après dépôt.",
    ouLeTrouver: "—",
    formats: ['.xlsx', '.csv'],
    exempleNom: 'fichier.xlsx',
    icon: <HelpCircle className="h-5 w-5" />,
  },
};

interface Props {
  /** Liste des types attendus dans le contexte (HYPER@LE, COFI, voyages…). Si omis, affiche les principaux. */
  types?: Array<keyof typeof SPECS>;
  title?: string;
  description?: string;
  compact?: boolean;
}

export function ExpectedFilesGuide({
  types,
  title = "Quels fichiers importer ?",
  description = "Pour chaque type ci-dessous, vous trouverez où l'éditer dans Op@le / SIECLE et un exemple de nom de fichier.",
  compact = false,
}: Props) {
  const list = (types && types.length > 0 ? types : ['balance', 'sde', 'sdr', 'grand_livre', 'etat_tiers', 'siecle_eleves'])
    .map((t) => SPECS[t])
    .filter(Boolean);

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
          {list.map((spec) => (
            <div
              key={spec.type}
              className="rounded-lg border bg-background p-3 flex flex-col gap-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {spec.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold leading-tight">{spec.titre}</p>
                    {spec.obligatoire && (
                      <Badge variant="default" className="text-[9px] h-4 px-1.5">requis</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{spec.aQuoiCaSert}</p>
                </div>
              </div>

              <div className="text-[11px] space-y-1 mt-1">
                <div>
                  <span className="font-semibold text-foreground/80">Où le trouver : </span>
                  <span className="text-muted-foreground">{spec.ouLeTrouver}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-semibold text-foreground/80">Format :</span>
                  {spec.formats.map((f) => (
                    <Badge key={f} variant="outline" className="text-[9px] h-4 px-1">{f}</Badge>
                  ))}
                </div>
                <div className="text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Exemple : </span>
                  <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{spec.exempleNom}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}