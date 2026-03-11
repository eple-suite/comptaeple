import { useState, useMemo } from "react";
import { Plus, Trash2, FileText, CheckCircle2, AlertTriangle, Landmark, BookOpen, Download, ShieldAlert, HeartHandshake } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/mockData";
import { Voyage } from "./types";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import { z } from "zod";

// ─── Plan Comptable M9-6 — Classe 7 (Recettes) ───

export const COMPTES_RECETTES_M96 = {
  familles: [
    { compte: "706700", libelle: "Participation des familles (compte pivot)", categorie: "familles" },
    { compte: "706880", libelle: "Autres prestations de services", categorie: "familles" },
  ],
  public: [
    { compte: "741100", libelle: "Subventions de l'État", categorie: "public" },
    { compte: "744200", libelle: "Subventions de la Région", categorie: "public" },
    { compte: "744300", libelle: "Subventions du Département", categorie: "public" },
    { compte: "744400", libelle: "Subventions des Communes", categorie: "public" },
    { compte: "747800", libelle: "Autres organismes publics", categorie: "public" },
  ],
  prive: [
    { compte: "754000", libelle: "Dons privés", categorie: "prive" },
    { compte: "754110", libelle: "Versements FSE / AS", categorie: "prive" },
    { compte: "748100", libelle: "Taxe d'apprentissage", categorie: "prive" },
    { compte: "758000", libelle: "Produits divers de gestion courante", categorie: "prive" },
  ],
} as const;

const ALL_COMPTES = [
  ...COMPTES_RECETTES_M96.familles,
  ...COMPTES_RECETTES_M96.public,
  ...COMPTES_RECETTES_M96.prive,
];

type CategorieCompte = "familles" | "public" | "prive";

const CATEGORIE_LABELS: Record<CategorieCompte, string> = {
  familles: "Familles",
  public: "Subventions publiques",
  prive: "Privé / Propre",
};

// ─── Code Activité : validation 9 caractères ───

const CODE_ACTIVITE_PREFIXES: Record<string, string> = {
  "0": "Sommes acquises (Dons, Taxe d'apprentissage)",
  "1": "Subventions de l'État",
  "2": "Subventions de la Collectivité (Région/Département)",
};

function validateCodeActivite(code: string, compteNum: string): { valid: boolean; message: string } {
  if (code.length !== 9) return { valid: false, message: "Le code activité doit comporter exactement 9 caractères." };
  const prefix = code.charAt(0);
  const compte = ALL_COMPTES.find(c => c.compte === compteNum);
  if (!compte) return { valid: true, message: "" };

  if (compte.categorie === "public" || compte.categorie === "prive") {
    if (!["0", "1", "2"].includes(prefix)) {
      return { valid: false, message: `Pour un compte ${compte.categorie === "public" ? "de subvention" : "privé/don"}, le code activité doit commencer par 0, 1 ou 2.` };
    }
    if (compte.categorie === "public" && compteNum === "741100" && prefix !== "1") {
      return { valid: false, message: "Subvention État : le code activité doit commencer par 1." };
    }
    if (compte.categorie === "public" && ["744200", "744300"].includes(compteNum) && prefix !== "2") {
      return { valid: false, message: "Subvention Collectivité : le code activité doit commencer par 2." };
    }
    if (compte.categorie === "prive" && ["754000", "748100"].includes(compteNum) && prefix !== "0") {
      return { valid: false, message: "Dons/Taxe d'apprentissage : le code activité doit commencer par 0." };
    }
  }
  return { valid: true, message: "" };
}

// ─── Mapping comptable M9-6 (Recettes) ───

const MAPPING_DEBIT_RECETTES: Record<string, { code4: string; libelle: string }> = {
  "706700": { code4: "411100", libelle: "Familles — Créances sur élèves" },
  "706880": { code4: "411100", libelle: "Familles — Créances sur élèves" },
  "741100": { code4: "441100", libelle: "État — Subventions à recevoir" },
  "744200": { code4: "441900", libelle: "Collectivités — Subventions à recevoir" },
  "744300": { code4: "441900", libelle: "Collectivités — Subventions à recevoir" },
  "744400": { code4: "441900", libelle: "Collectivités — Subventions à recevoir" },
  "747800": { code4: "441900", libelle: "Collectivités — Autres organismes à recevoir" },
  "754110": { code4: "467100", libelle: "FSE/AS — Autres comptes débiteurs" },
  "754000": { code4: "467100", libelle: "Dons — Autres comptes débiteurs" },
  "748100": { code4: "467100", libelle: "Taxe d'apprentissage — Débiteurs divers" },
  "758000": { code4: "467100", libelle: "Produits divers — Débiteurs divers" },
};

export const MAPPING_DEPENSES_M96 = {
  acompte: { code4: "409100", libelle: "Fournisseurs — Avances et acomptes versés", ctrl: "check_delib_CA" },
  solde: { code4: "401100", libelle: "Fournisseurs — Dettes fournisseurs", comptes6: ["604", "624"] },
} as const;

// ─── Écriture comptable automatique ───

function genererEcritureComptable(ligne: LigneRecette): EcritureComptable {
  const compte = ALL_COMPTES.find(c => c.compte === ligne.compteComptable);
  const mapping = MAPPING_DEBIT_RECETTES[ligne.compteComptable];
  const compteDebit = mapping?.code4 || "411100";
  const libelleDebit = mapping?.libelle || "Créances — Tiers";

  // ─── VERROU MÉTIER : Fonds Social → réduction automatique du montant à titrer sur 411100 ───
  let montantNet = ligne.montant;
  if (ligne.fondsSocial && ligne.montantFondsSocial > 0 && compteDebit === "411100") {
    montantNet = Math.max(0, ligne.montant - ligne.montantFondsSocial);
  }

  return {
    id: `ecr-${ligne.id}`,
    dateEcriture: new Date().toISOString().split("T")[0],
    compteDebit,
    libelleDebit,
    compteCredit: ligne.compteComptable,
    libelleCredit: compte?.libelle || "",
    montant: montantNet,
    montantBrut: ligne.montant,
    deductionFondsSocial: ligne.fondsSocial ? ligne.montantFondsSocial : 0,
    serviceAP: "AP",
    domaine: ligne.domaine,
    codeActivite: ligne.codeActivite,
    statut: ligne.etape,
  };
}

// ─── Types ───

export interface LigneRecette {
  id: string;
  tiers: string;
  compteComptable: string;
  montant: number;
  domaine: string;
  codeActivite: string;
  etape: "ordonnateur" | "comptable";
  dateCreation: string;
  observations: string;
  /** Fonds Social : si true, une aide sociale vient en déduction du titre 411100 */
  fondsSocial: boolean;
  montantFondsSocial: number;
}

interface EcritureComptable {
  id: string;
  dateEcriture: string;
  compteDebit: string;
  libelleDebit: string;
  compteCredit: string;
  libelleCredit: string;
  montant: number;
  montantBrut: number;
  deductionFondsSocial: number;
  serviceAP: string;
  domaine: string;
  codeActivite: string;
  statut: "ordonnateur" | "comptable";
}

// ─── Schema validation ───
const ligneRecetteSchema = z.object({
  tiers: z.string().trim().min(1, "Le tiers est obligatoire").max(200),
  compteComptable: z.string().min(6).max(6),
  montant: z.number().positive("Le montant doit être positif"),
  domaine: z.string().trim().min(1, "Le domaine est obligatoire").max(50),
  codeActivite: z.string().length(9, "Le code activité doit comporter 9 caractères"),
});

// ─── Bordereau de Liquidation PDF ───

function genererBordereauPDF(voyage: Voyage, lignes: LigneRecette[], ecritures: EcritureComptable[]) {
  const doc = createStyledPDF({
    title: "BORDEREAU DE LIQUIDATION — ORDRES DE RECETTES",
    subtitle: `Voyage : ${voyage.intitule || voyage.destination} — ${voyage.pays}`,
    establishment: "Cockpit Comptable EPLE",
  });

  const pw = doc.internal.pageSize.getWidth();
  let y = 45;

  // Cartouche identifiant
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS POUR SAISIE OP@LE", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const infos = [
    ["Service", "AP (Activités Pédagogiques)"],
    ["Destination", `${voyage.destination} — ${voyage.pays}`],
    ["Dates", `${voyage.dateDepart} au ${voyage.dateRetour}`],
    ["Professeur référent", voyage.professeur],
    ["Nb élèves / accompagnateurs", `${voyage.nbEleves} / ${voyage.nbAccompagnateurs}`],
  ];

  infos.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 60, y);
    y += 5;
  });

  y += 4;

  // Tableau des ordres de recette
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DÉTAIL DES ORDRES DE RECETTES", 14, y);
  y += 4;

  const tableData = lignes.map((l, i) => {
    const mapping = MAPPING_DEBIT_RECETTES[l.compteComptable];
    const deduction = l.fondsSocial && l.montantFondsSocial > 0 ? l.montantFondsSocial : 0;
    const net = Math.max(0, l.montant - deduction);
    return [
      String(i + 1),
      l.tiers,
      mapping?.code4 || "411100",
      l.compteComptable,
      l.domaine,
      l.codeActivite,
      formatCurrency(l.montant),
      deduction > 0 ? `-${formatCurrency(deduction)}` : "",
      formatCurrency(net),
      l.etape === "comptable" ? "✓ PEC" : "En attente",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["N°", "Code Tiers", "Cpte Débit (4)", "Cpte Crédit (7)", "Domaine", "Code Activité", "Brut", "Fonds Social", "Net à titrer", "Statut"]],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 68, 120], textColor: [255, 255, 255], fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 8 },
      6: { halign: "right" },
      7: { halign: "right", textColor: [200, 50, 50] },
      8: { halign: "right", fontStyle: "bold" },
    },
    theme: "grid",
  });

  // Totaux
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  const totalBrut = lignes.reduce((s, l) => s + l.montant, 0);
  const totalFS = lignes.reduce((s, l) => s + (l.fondsSocial ? l.montantFondsSocial : 0), 0);
  const totalNet = totalBrut - totalFS;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL BRUT : ${formatCurrency(totalBrut)}`, 14, finalY + 8);
  if (totalFS > 0) {
    doc.setTextColor(200, 50, 50);
    doc.text(`DÉDUCTION FONDS SOCIAL : -${formatCurrency(totalFS)}`, 14, finalY + 14);
    doc.setTextColor(0, 0, 0);
    doc.text(`NET À TITRER (411100) : ${formatCurrency(totalNet)}`, 14, finalY + 20);
  }

  // Écritures comptables section
  if (ecritures.length > 0) {
    doc.addPage();
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ÉCRITURES DE PRISE EN CHARGE — AGENT COMPTABLE", 14, 20);

    autoTable(doc, {
      startY: 26,
      head: [["Date", "Débit", "Lib. Débit", "Crédit", "Lib. Crédit", "Montant", "Service", "Domaine", "Activité"]],
      body: ecritures.map(e => [
        e.dateEcriture,
        e.compteDebit,
        e.libelleDebit,
        e.compteCredit,
        e.libelleCredit,
        formatCurrency(e.montant),
        e.serviceAP,
        e.domaine,
        e.codeActivite,
      ]),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [37, 68, 120], textColor: [255, 255, 255], fontSize: 7 },
      theme: "grid",
    });
  }

  // Visa
  const visaY = doc.internal.pageSize.getHeight() - 40;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Visa de l'Ordonnateur :", 14, visaY);
  doc.text("Date : ___/___/______", 14, visaY + 6);
  doc.text("Signature :", 14, visaY + 12);
  doc.text("Visa de l'Agent Comptable :", pw / 2 + 10, visaY);
  doc.text("Date : ___/___/______", pw / 2 + 10, visaY + 6);
  doc.text("Signature :", pw / 2 + 10, visaY + 12);

  savePDF(doc, `bordereau_liquidation_${voyage.destination}_${new Date().toISOString().split("T")[0]}.pdf`);
  toast.success("Bordereau de liquidation généré — Format Op@le");
}

// ─── Composant principal ───

interface Props {
  voyage: Voyage;
  onUpdateVoyage?: (v: Voyage) => void;
}

export function VoyageRecettesTab({ voyage }: Props) {
  const [lignes, setLignes] = useState<LigneRecette[]>([]);
  const [subTab, setSubTab] = useState<"saisie" | "ecritures" | "dashboard">("saisie");

  // Form state
  const [tiers, setTiers] = useState("");
  const [compte, setCompte] = useState("");
  const [montant, setMontant] = useState("");
  const [domaine, setDomaine] = useState("");
  const [codeActivite, setCodeActivite] = useState("");
  const [observations, setObservations] = useState("");
  const [fondsSocial, setFondsSocial] = useState(false);
  const [montantFondsSocial, setMontantFondsSocial] = useState("");

  const codeValidation = useMemo(
    () => codeActivite.length > 0 ? validateCodeActivite(codeActivite, compte) : { valid: true, message: "" },
    [codeActivite, compte]
  );

  // ─── VERROU MÉTIER : zero_profit — recettes ne doivent pas dépasser dépenses ───
  const budgetCheck = useMemo(() => {
    const totalDepenses = voyage.transport + voyage.hebergement + voyage.restauration +
      voyage.activites + voyage.assurance + voyage.divers;
    const totalRecettesExistantes = lignes.reduce((s, l) => s + l.montant, 0);
    const nouveauMontant = parseFloat(montant) || 0;
    const totalApresAjout = totalRecettesExistantes + nouveauMontant;
    const estFamille = ["706700", "706880"].includes(compte);

    // Pour les comptes familles, vérifier que le total ne dépasse pas les dépenses
    if (estFamille && totalApresAjout > totalDepenses && totalDepenses > 0) {
      return {
        bloque: true,
        message: `Verrou M9-6 zero_profit : la participation familles (${formatCurrency(totalApresAjout)}) dépasserait le coût réel du voyage (${formatCurrency(totalDepenses)}). L'enregistrement est bloqué.`,
      };
    }
    return { bloque: false, message: "" };
  }, [voyage, lignes, montant, compte]);

  const handleAddLigne = () => {
    const parsed = ligneRecetteSchema.safeParse({
      tiers: tiers.trim(),
      compteComptable: compte,
      montant: parseFloat(montant) || 0,
      domaine: domaine.trim(),
      codeActivite: codeActivite.trim(),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors.map(e => e.message).join(", "));
      return;
    }
    if (!codeValidation.valid) {
      toast.error(codeValidation.message);
      return;
    }
    // ─── VERROU MÉTIER : Bloquer si profit sur familles ───
    if (budgetCheck.bloque) {
      toast.error(budgetCheck.message);
      return;
    }

    // ─── VERROU MÉTIER : Fonds Social — valider le montant de déduction ───
    const fs = fondsSocial && ["706700", "706880"].includes(compte);
    const fsAmount = fs ? (parseFloat(montantFondsSocial) || 0) : 0;
    if (fs && fsAmount <= 0) {
      toast.error("Le montant de l'aide Fonds Social doit être positif.");
      return;
    }
    if (fs && fsAmount > (parseFloat(montant) || 0)) {
      toast.error("L'aide Fonds Social ne peut pas excéder le montant brut du titre.");
      return;
    }

    const nouvelle: LigneRecette = {
      id: `rec-${Date.now()}`,
      tiers: tiers.trim(),
      compteComptable: compte,
      montant: parseFloat(montant),
      domaine: domaine.trim(),
      codeActivite: codeActivite.trim(),
      etape: "ordonnateur",
      dateCreation: new Date().toISOString().split("T")[0],
      observations: observations.trim(),
      fondsSocial: fs,
      montantFondsSocial: fsAmount,
    };
    setLignes([...lignes, nouvelle]);
    setTiers(""); setCompte(""); setMontant(""); setDomaine(""); setCodeActivite(""); setObservations("");
    setFondsSocial(false); setMontantFondsSocial("");
    toast.success("Titre de recette créé (étape Ordonnateur)");
  };

  const handleValiderComptable = (id: string) => {
    setLignes(lignes.map(l => l.id === id ? { ...l, etape: "comptable" as const } : l));
    toast.success("Prise en charge comptable validée — Écriture générée");
  };

  const handleSupprimer = (id: string) => {
    setLignes(lignes.filter(l => l.id !== id));
    toast.info("Ligne supprimée");
  };

  // Ecritures comptables
  const ecritures = useMemo(() => lignes.filter(l => l.etape === "comptable").map(genererEcritureComptable), [lignes]);

  // Dashboard par domaine
  const dashboardDomaines = useMemo(() => {
    const map = new Map<string, { prevu: number; encaisse: number; lignes: number; fondsSocial: number }>();
    lignes.forEach(l => {
      const entry = map.get(l.domaine) || { prevu: 0, encaisse: 0, lignes: 0, fondsSocial: 0 };
      entry.prevu += l.montant;
      if (l.etape === "comptable") entry.encaisse += l.montant;
      if (l.fondsSocial) entry.fondsSocial += l.montantFondsSocial;
      entry.lignes++;
      map.set(l.domaine, entry);
    });
    return Array.from(map.entries()).map(([domaine, data]) => ({ domaine, ...data }));
  }, [lignes]);

  const totalRecettes = lignes.reduce((s, l) => s + l.montant, 0);
  const totalEncaisse = lignes.filter(l => l.etape === "comptable").reduce((s, l) => s + l.montant, 0);
  const totalFondsSocial = lignes.reduce((s, l) => s + (l.fondsSocial ? l.montantFondsSocial : 0), 0);
  const totalNetATitrer = totalRecettes - totalFondsSocial;
  const compteInfo = ALL_COMPTES.find(c => c.compte === compte);
  const isFamilleCompte = ["706700", "706880"].includes(compte);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Gestion des Recettes — M9-6 / Op@le</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => genererBordereauPDF(voyage, lignes, ecritures)}
              disabled={lignes.length === 0}
            >
              <Download className="h-3 w-3 mr-1" /> Bordereau de liquidation
            </Button>
          </div>
          <CardDescription>
            Saisie des titres de recette pour le voyage «&nbsp;{voyage.intitule || voyage.destination}&nbsp;» — Service AP (Activités Pédagogiques)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total titres émis</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalRecettes)}</p>
              <p className="text-[10px] text-muted-foreground">{lignes.length} titre(s)</p>
            </div>
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Pris en charge (AC)</p>
              <p className="text-lg font-bold text-success">{formatCurrency(totalEncaisse)}</p>
            </div>
            <div className="bg-warning/10 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">En attente liquidation</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(totalRecettes - totalEncaisse)}</p>
            </div>
            {totalFondsSocial > 0 && (
              <div className="bg-accent/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Déductions Fonds Social</p>
                <p className="text-lg font-bold text-accent-foreground">-{formatCurrency(totalFondsSocial)}</p>
                <p className="text-[10px] text-muted-foreground">Net 411100 : {formatCurrency(totalNetATitrer)}</p>
              </div>
            )}
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Domaines actifs</p>
              <p className="text-lg font-bold">{dashboardDomaines.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sous-onglets */}
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)}>
        <TabsList>
          <TabsTrigger value="saisie">📝 Saisie Ordonnateur</TabsTrigger>
          <TabsTrigger value="ecritures">📖 Écritures comptables</TabsTrigger>
          <TabsTrigger value="dashboard">📊 Tableau de bord par domaine</TabsTrigger>
        </TabsList>

        {/* ═══ SAISIE ORDONNATEUR ═══ */}
        <TabsContent value="saisie" className="space-y-4">
          {/* Verrou zero_profit */}
          {budgetCheck.bloque && (
            <Alert variant="destructive" className="py-2">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Verrou métier M9-6 — Enregistrement bloqué</AlertTitle>
              <AlertDescription className="text-xs">{budgetCheck.message}</AlertDescription>
            </Alert>
          )}

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Nouveau titre de recette — Étape Ordonnateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tiers */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tiers (famille ou partenaire) *</Label>
                  <Input
                    value={tiers}
                    onChange={(e) => setTiers(e.target.value)}
                    placeholder="Ex: Famille DUPONT, Conseil Régional IDF"
                    maxLength={200}
                  />
                </div>

                {/* Compte de produit */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Compte de produit (Classe 7) *</Label>
                  <Select value={compte} onValueChange={setCompte}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un compte M9-6" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-bold text-primary">— Familles —</div>
                      {COMPTES_RECETTES_M96.familles.map(c => (
                        <SelectItem key={c.compte} value={c.compte}>
                          {c.compte} — {c.libelle}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-bold text-primary mt-1">— Subventions publiques —</div>
                      {COMPTES_RECETTES_M96.public.map(c => (
                        <SelectItem key={c.compte} value={c.compte}>
                          {c.compte} — {c.libelle}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-bold text-primary mt-1">— Privé / Propre —</div>
                      {COMPTES_RECETTES_M96.prive.map(c => (
                        <SelectItem key={c.compte} value={c.compte}>
                          {c.compte} — {c.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {compteInfo && (
                    <p className="text-[10px] text-muted-foreground">
                      Catégorie : {CATEGORIE_LABELS[compteInfo.categorie as CategorieCompte]}
                      {" — "}Débit : <span className="font-mono font-semibold">{MAPPING_DEBIT_RECETTES[compte]?.code4 || "411100"}</span>
                    </p>
                  )}
                </div>

                {/* Montant */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Montant (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="0,00"
                  />
                </div>

                {/* Domaine */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Domaine (défini par le SG) *</Label>
                  <Input
                    value={domaine}
                    onChange={(e) => setDomaine(e.target.value.toUpperCase())}
                    placeholder="Ex: VOY_ALL, VOY_ESP, VOY_SKI"
                    maxLength={50}
                  />
                  <p className="text-[10px] text-muted-foreground">Champ libre — lettres majuscules recommandées</p>
                </div>

                {/* Code Activité */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Code Activité (9 caractères) *</Label>
                  <Input
                    value={codeActivite}
                    onChange={(e) => setCodeActivite(e.target.value.toUpperCase().slice(0, 9))}
                    placeholder="Ex: 2VOY00001"
                    maxLength={9}
                    className={codeActivite.length > 0 && !codeValidation.valid ? "border-destructive" : ""}
                  />
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px]">{codeActivite.length}/9</Badge>
                    {codeActivite.length > 0 && CODE_ACTIVITE_PREFIXES[codeActivite.charAt(0)] && (
                      <span className="text-[10px] text-muted-foreground">
                        → {CODE_ACTIVITE_PREFIXES[codeActivite.charAt(0)]}
                      </span>
                    )}
                  </div>
                  {!codeValidation.valid && codeActivite.length > 0 && (
                    <p className="text-[10px] text-destructive font-medium">{codeValidation.message}</p>
                  )}
                </div>

                {/* Observations */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Observations</Label>
                  <Input
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Référence, n° de facture…"
                    maxLength={200}
                  />
                </div>
              </div>

              {/* ─── FONDS SOCIAL — Interopérabilité aide → réduction 411100 ─── */}
              {isFamilleCompte && (
                <div className="border border-accent/30 rounded-lg p-3 bg-accent/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-accent-foreground" />
                      <Label className="text-xs font-semibold">Aide Fonds Social applicable ?</Label>
                    </div>
                    <Switch checked={fondsSocial} onCheckedChange={setFondsSocial} />
                  </div>
                  {fondsSocial && (
                    <div className="space-y-1">
                      <Label className="text-xs">Montant de l'aide Fonds Social (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={montantFondsSocial}
                        onChange={(e) => setMontantFondsSocial(e.target.value)}
                        placeholder="Ex: 50,00"
                        className="max-w-[200px]"
                      />
                      {parseFloat(montantFondsSocial) > 0 && parseFloat(montant) > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Net à titrer sur 411100 : <span className="font-mono font-bold">{formatCurrency(Math.max(0, (parseFloat(montant) || 0) - (parseFloat(montantFondsSocial) || 0)))}</span>
                          {" "}(au lieu de {formatCurrency(parseFloat(montant) || 0)})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Info analytique */}
              <Alert className="bg-muted/50">
                <BookOpen className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold">Marqueurs analytiques Op@le — Triplet obligatoire</AlertTitle>
                <AlertDescription className="text-[10px]">
                  Service : <Badge variant="secondary" className="text-[9px]">AP</Badge>{" "}
                  Domaine : <Badge variant={domaine ? "secondary" : "destructive"} className="text-[9px]">{domaine || "⚠ REQUIS"}</Badge>{" "}
                  Activité : <Badge variant={codeActivite.length === 9 ? "secondary" : "destructive"} className="text-[9px]">{codeActivite || "⚠ REQUIS (9 car.)"}</Badge>
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={handleAddLigne}
                  disabled={!codeValidation.valid || !tiers || !compte || !montant || !domaine || codeActivite.length !== 9 || budgetCheck.bloque}
                >
                  <Plus className="h-4 w-4 mr-1" /> Émettre le titre de recette
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des titres émis */}
          {lignes.length > 0 && (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Titres de recette émis ({lignes.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tiers</TableHead>
                      <TableHead className="text-xs">Compte</TableHead>
                      <TableHead className="text-xs text-right">Brut</TableHead>
                      <TableHead className="text-xs text-right">Fonds Social</TableHead>
                      <TableHead className="text-xs text-right">Net</TableHead>
                      <TableHead className="text-xs">Domaine</TableHead>
                      <TableHead className="text-xs">Code Activité</TableHead>
                      <TableHead className="text-xs text-center">Étape</TableHead>
                      <TableHead className="text-xs text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((l) => {
                      const compteLabel = ALL_COMPTES.find(c => c.compte === l.compteComptable)?.libelle || "";
                      const net = l.fondsSocial ? Math.max(0, l.montant - l.montantFondsSocial) : l.montant;
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs font-medium">{l.tiers}</TableCell>
                          <TableCell className="text-xs">
                            <span className="font-mono">{l.compteComptable}</span>
                            <span className="text-muted-foreground ml-1 text-[10px]">{compteLabel}</span>
                          </TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(l.montant)}</TableCell>
                          <TableCell className="text-xs text-right">
                            {l.fondsSocial ? (
                              <span className="text-destructive">-{formatCurrency(l.montantFondsSocial)}</span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">{formatCurrency(net)}</TableCell>
                          <TableCell className="text-xs"><Badge variant="outline" className="text-[9px]">{l.domaine}</Badge></TableCell>
                          <TableCell className="text-xs font-mono">{l.codeActivite}</TableCell>
                          <TableCell className="text-center">
                            {l.etape === "ordonnateur" ? (
                              <Badge className="bg-warning/10 text-warning border-0 text-[9px]">Ordonnateur</Badge>
                            ) : (
                              <Badge className="bg-success/10 text-success border-0 text-[9px]">Comptable ✓</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {l.etape === "ordonnateur" && (
                                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleValiderComptable(l.id)}>
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" /> Prise en charge AC
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleSupprimer(l.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="text-xs font-bold">Total</TableCell>
                      <TableCell className="text-xs text-right font-bold">{formatCurrency(totalRecettes)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-destructive">
                        {totalFondsSocial > 0 ? `-${formatCurrency(totalFondsSocial)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold">{formatCurrency(totalNetATitrer)}</TableCell>
                      <TableCell colSpan={4} />
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ ÉCRITURES COMPTABLES ═══ */}
        <TabsContent value="ecritures" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Écritures de prise en charge
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={() => genererBordereauPDF(voyage, lignes, ecritures)}
                  disabled={ecritures.length === 0}
                >
                  <Download className="h-3 w-3 mr-1" /> Export bordereau PDF
                </Button>
              </div>
              <CardDescription className="text-xs">
                Écritures générées automatiquement après validation par l'Agent Comptable — Mapping M9-6 : Débit {"{"}code_4{"}"} / Crédit {"{"}code_7{"}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {ecritures.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">
                  Aucune écriture — Validez des titres de recette depuis l'onglet « Saisie Ordonnateur ».
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Débit (4)</TableHead>
                      <TableHead className="text-xs">Crédit (7)</TableHead>
                      <TableHead className="text-xs text-right">Brut</TableHead>
                      <TableHead className="text-xs text-right">Fds Social</TableHead>
                      <TableHead className="text-xs text-right">Net</TableHead>
                      <TableHead className="text-xs">Service</TableHead>
                      <TableHead className="text-xs">Domaine</TableHead>
                      <TableHead className="text-xs">Activité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ecritures.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{e.dateEcriture}</TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono">{e.compteDebit}</span>
                          <span className="text-muted-foreground text-[10px] ml-1">{e.libelleDebit}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono">{e.compteCredit}</span>
                          <span className="text-muted-foreground text-[10px] ml-1">{e.libelleCredit}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(e.montantBrut)}</TableCell>
                        <TableCell className="text-xs text-right">
                          {e.deductionFondsSocial > 0 ? (
                            <span className="text-destructive">-{formatCurrency(e.deductionFondsSocial)}</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold">{formatCurrency(e.montant)}</TableCell>
                        <TableCell className="text-xs"><Badge variant="secondary" className="text-[9px]">{e.serviceAP}</Badge></TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[9px]">{e.domaine}</Badge></TableCell>
                        <TableCell className="text-xs font-mono">{e.codeActivite}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-xs font-bold">Total pris en charge</TableCell>
                      <TableCell className="text-xs text-right font-bold">
                        {formatCurrency(ecritures.reduce((s, e) => s + e.montantBrut, 0))}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-destructive">
                        {ecritures.reduce((s, e) => s + e.deductionFondsSocial, 0) > 0
                          ? `-${formatCurrency(ecritures.reduce((s, e) => s + e.deductionFondsSocial, 0))}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold">
                        {formatCurrency(ecritures.reduce((s, e) => s + e.montant, 0))}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ DASHBOARD PAR DOMAINE ═══ */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tableau de bord récapitulatif par domaine</CardTitle>
              <CardDescription className="text-xs">Comparaison recettes émises vs prises en charge par l'Agent Comptable</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardDomaines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée — Saisissez des titres de recette.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Domaine</TableHead>
                      <TableHead className="text-xs text-right">Titres émis</TableHead>
                      <TableHead className="text-xs text-right">Fonds Social</TableHead>
                      <TableHead className="text-xs text-right">Pris en charge (AC)</TableHead>
                      <TableHead className="text-xs text-right">Écart</TableHead>
                      <TableHead className="text-xs text-center">Nb lignes</TableHead>
                      <TableHead className="text-xs text-center">Taux recouvrement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardDomaines.map((d) => {
                      const ecart = d.prevu - d.encaisse;
                      const taux = d.prevu > 0 ? (d.encaisse / d.prevu) * 100 : 0;
                      return (
                        <TableRow key={d.domaine}>
                          <TableCell className="text-xs font-semibold"><Badge variant="outline">{d.domaine}</Badge></TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(d.prevu)}</TableCell>
                          <TableCell className="text-xs text-right">
                            {d.fondsSocial > 0 ? <span className="text-destructive">-{formatCurrency(d.fondsSocial)}</span> : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold text-success">{formatCurrency(d.encaisse)}</TableCell>
                          <TableCell className={`text-xs text-right font-semibold ${ecart > 0 ? "text-warning" : "text-success"}`}>
                            {ecart > 0 ? `−${formatCurrency(ecart)}` : "0 €"}
                          </TableCell>
                          <TableCell className="text-xs text-center">{d.lignes}</TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge className={taux >= 100 ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>
                              {taux.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="text-xs font-bold">Total</TableCell>
                      <TableCell className="text-xs text-right font-bold">{formatCurrency(totalRecettes)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-destructive">
                        {totalFondsSocial > 0 ? `-${formatCurrency(totalFondsSocial)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-success">{formatCurrency(totalEncaisse)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-warning">
                        {totalRecettes - totalEncaisse > 0 ? `−${formatCurrency(totalRecettes - totalEncaisse)}` : "0 €"}
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold">{lignes.length}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Nomenclature rappel */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Rappel nomenclature — Code Activité (1er caractère)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(CODE_ACTIVITE_PREFIXES).map(([prefix, desc]) => (
                  <div key={prefix} className="bg-muted/50 rounded-md p-2">
                    <p className="font-mono text-sm font-bold">{prefix}xxxxxxxx</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
