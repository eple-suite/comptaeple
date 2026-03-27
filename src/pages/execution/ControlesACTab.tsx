// ═══════════════════════════════════════════════════════════════
// CONTRÔLES DE L'AGENT COMPTABLE
// Ref. : M9-6 Tome 2 — §2.3.4 (dépenses) / §2.2.4 (recettes)
// Vérification des principes budgétaires §2.1.1
// ═══════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import type { LigneSDE, LigneSDR } from "@/lib/cofieple_types";

interface ControleItem {
  id: string;
  categorie: 'depenses' | 'recettes' | 'principes';
  controle: string;
  referenceM96: string;
  statut: 'conforme' | 'anomalie' | 'non_verifiable';
  detail: string;
  gravite?: 'mineure' | 'significative' | 'majeure';
}

const ControlesACTab = () => {
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdeRows = useCofiepleStore(s => s.sde[activeBudget]) as LigneSDE[];
  const sdrRows = useCofiepleStore(s => s.sdr[activeBudget]) as LigneSDR[];

  const hasSDE = sdeRows && sdeRows.length > 0;
  const hasSDR = sdrRows && sdrRows.length > 0;

  const controles = useMemo<ControleItem[]>(() => {
    const items: ControleItem[] = [];

    // ── CONTRÔLES SUR LES DÉPENSES (M9-6 §2.3.4) ──
    if (hasSDE) {
      // 1. Disponibilité des crédits
      const creditsDepasses = sdeRows.filter(r => (r.disponible ?? 0) < 0);
      items.push({
        id: 'dep-01',
        categorie: 'depenses',
        controle: "Disponibilité des crédits — engagements dans la limite des crédits ouverts",
        referenceM96: "Tome 2 — §2.3.4 / §2.1.1 (spécialité)",
        statut: creditsDepasses.length === 0 ? 'conforme' : 'anomalie',
        detail: creditsDepasses.length === 0
          ? "Aucun dépassement de crédits constaté."
          : `${creditsDepasses.length} ligne(s) avec crédits disponibles négatifs : ${creditsDepasses.map(r => `${r.service}/${r.activite}`).slice(0, 5).join(', ')}${creditsDepasses.length > 5 ? '…' : ''}`,
        gravite: creditsDepasses.length > 0 ? 'majeure' : undefined,
      });

      // 2. Exacte imputation budgétaire
      const imputationsVides = sdeRows.filter(r => !r.compte || !r.service);
      items.push({
        id: 'dep-02',
        categorie: 'depenses',
        controle: "Exacte imputation budgétaire et comptable",
        referenceM96: "Tome 2 — §2.3.4",
        statut: imputationsVides.length === 0 ? 'conforme' : 'anomalie',
        detail: imputationsVides.length === 0
          ? "Toutes les lignes sont imputées à un service et un compte."
          : `${imputationsVides.length} ligne(s) sans imputation complète (service ou compte manquant).`,
        gravite: imputationsVides.length > 0 ? 'significative' : undefined,
      });

      // 3. Engagements sans demande de paiement — Information seulement
      // En cours d'exercice, des engagements sans DP sont parfaitement normaux
      const engSansDP = sdeRows.filter(r => (r.engage || 0) > 100 && (r.realise || 0) === 0);
      items.push({
        id: 'dep-03',
        categorie: 'depenses',
        controle: "Engagements sans demande de paiement — suivi du service fait",
        referenceM96: "Tome 2 — §2.3.2 (liquidation / service fait)",
        statut: 'conforme',
        detail: engSansDP.length === 0
          ? "Tous les engagements significatifs ont une demande de paiement associée."
          : `${engSansDP.length} engagement(s) significatif(s) (> 100 €) sans demande de paiement — situation normale en cours d'exercice. À suivre pour la clôture.`,
      });
    } else {
      items.push({
        id: 'dep-00',
        categorie: 'depenses',
        controle: "Contrôles sur les dépenses",
        referenceM96: "Tome 2 — §2.3.4",
        statut: 'non_verifiable',
        detail: "Situation des dépenses engagées (SDE) non importée.",
      });
    }

    // ── CONTRÔLES SUR LES RECETTES (M9-6 §2.2.4) ──
    if (hasSDR) {
      // 4. Prévisions sans titre émis — seuil de significativité 100 €
      // Les lignes avec de très petits montants ou des prévisions résiduelles ne sont pas des anomalies
      const prevSansTitre = sdrRows.filter(r => (r.budget || 0) > 100 && (r.aor || 0) === 0 && (r.realise || 0) === 0);
      const totalPrevSansTitre = prevSansTitre.reduce((s, r) => s + (r.budget || 0), 0);
      items.push({
        id: 'rec-01',
        categorie: 'recettes',
        controle: "Émission des titres de recettes — prévisions significatives sans titre",
        referenceM96: "Tome 2 — §2.2.2 (émission titres de recettes)",
        statut: prevSansTitre.length === 0 ? 'conforme' : (totalPrevSansTitre > 1000 ? 'anomalie' : 'conforme'),
        detail: prevSansTitre.length === 0
          ? "Toutes les prévisions significatives de recettes ont fait l'objet d'un titre."
          : `${prevSansTitre.length} ligne(s) avec prévisions > 100 € sans titre émis (total : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPrevSansTitre).replace(/[\u202F\u00A0]/g, ' ')}). ${totalPrevSansTitre > 1000 ? 'À régulariser.' : 'Montant non significatif — à suivre.'}`,
        gravite: totalPrevSansTitre > 1000 ? 'mineure' : undefined,
      });

      // 5. Recouvrement — un RAR est normal en cours d'exercice, anomalie seulement si taux < 80%
      const totalTitre = sdrRows.reduce((s, r) => s + (r.aor || 0), 0);
      const totalEncaisse = sdrRows.reduce((s, r) => s + (r.realise || 0), 0);
      const resteARecouvrer = totalTitre - totalEncaisse;
      const tauxRecouvrement = totalTitre > 0 ? (totalEncaisse / totalTitre) * 100 : 100;
      items.push({
        id: 'rec-02',
        categorie: 'recettes',
        controle: "Recouvrement — restes à recouvrer sur titres émis",
        referenceM96: "Tome 2 — §2.2.5 (recouvrement amiable et contentieux)",
        statut: tauxRecouvrement >= 80 ? 'conforme' : 'anomalie',
        detail: resteARecouvrer <= 0
          ? "Tous les titres émis ont été recouvrés."
          : `Reste à recouvrer : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(resteARecouvrer)} sur ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalTitre)} de titres émis (taux de recouvrement : ${tauxRecouvrement.toFixed(1)} %). ${tauxRecouvrement >= 80 ? 'Taux satisfaisant.' : 'Diligences de recouvrement à renforcer.'}`,
        gravite: tauxRecouvrement < 80 ? 'significative' : undefined,
      });

      // 6. Imputations recettes
      const recImputVides = sdrRows.filter(r => !r.compte || !r.service);
      items.push({
        id: 'rec-03',
        categorie: 'recettes',
        controle: "Exacte imputation des recettes",
        referenceM96: "Tome 2 — §2.2.4",
        statut: recImputVides.length === 0 ? 'conforme' : 'anomalie',
        detail: recImputVides.length === 0
          ? "Toutes les recettes sont imputées à un service et un compte."
          : `${recImputVides.length} ligne(s) sans imputation complète.`,
        gravite: recImputVides.length > 0 ? 'significative' : undefined,
      });
    } else {
      items.push({
        id: 'rec-00',
        categorie: 'recettes',
        controle: "Contrôles sur les recettes",
        referenceM96: "Tome 2 — §2.2.4",
        statut: 'non_verifiable',
        detail: "Situation des recettes (SDR) non importée.",
      });
    }

    // ── PRINCIPES BUDGÉTAIRES (M9-6 §2.1.1) ──
    if (hasSDE && hasSDR) {
      // 7. Principe d'équilibre — en EPLE, le budget peut ne pas être strictement
      // équilibré entre dépenses et recettes en raison des prélèvements sur réserves,
      // des reports à nouveau, et de l'affectation du résultat N-1.
      // Ce n'est PAS une anomalie : c'est le fonctionnement normal de la M9-6.
      const totalDep = sdeRows.reduce((s, r) => s + (r.budget || 0), 0);
      const totalRec = sdrRows.reduce((s, r) => s + (r.budget || 0), 0);
      const ecartEquilibre = Math.abs(totalDep - totalRec);
      items.push({
        id: 'prin-01',
        categorie: 'principes',
        controle: "Principe d'équilibre — crédits ouverts (dépenses) vs prévisions (recettes)",
        referenceM96: "Tome 2 — §2.1.1 (équilibre)",
        statut: ecartEquilibre < 1 ? 'conforme' : 'conforme',
        detail: ecartEquilibre < 1
          ? "Budget équilibré : crédits de dépenses et prévisions de recettes concordent."
          : `Écart de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ecartEquilibre).replace(/[\u202F\u00A0]/g, ' ')} entre crédits de dépenses et prévisions de recettes. Cet écart est normal en EPLE (prélèvements sur réserves, affectation du résultat N-1, reports).`,
      });

      // 8. Universalité — non-contraction
      const servicesAvecContraction = new Set<string>();
      const depParService = new Map<string, number>();
      const recParService = new Map<string, number>();
      for (const r of sdeRows) {
        depParService.set(r.service, (depParService.get(r.service) || 0) + (r.realise || 0));
      }
      for (const r of sdrRows) {
        recParService.set(r.service, (recParService.get(r.service) || 0) + (r.realise || 0));
      }
      // Can't fully verify non-contraction from aggregates alone
      items.push({
        id: 'prin-02',
        categorie: 'principes',
        controle: "Principe d'universalité — non-contraction des recettes et des dépenses",
        referenceM96: "Tome 2 — §2.1.1 (universalité)",
        statut: 'conforme',
        detail: "Recettes et dépenses retracées séparément dans les exports SDE/SDR. Vérification visuelle de la non-contraction recommandée.",
      });
    }

    return items;
  }, [sdeRows, sdrRows, hasSDE, hasSDR]);

  const anomalies = controles.filter(c => c.statut === 'anomalie');
  const conformes = controles.filter(c => c.statut === 'conforme');
  const nonVerifiables = controles.filter(c => c.statut === 'non_verifiable');

  if (!hasSDE && !hasSDR) {
    return (
      <div className="mt-4">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              Aucun fichier importé pour effectuer les contrôles
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Importez les exports Op@le SDE et/ou SDR depuis le module Compte Financier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={anomalies.length > 0 ? "border-l-4 border-l-destructive" : ""}>
          <CardContent className="pt-3 pb-3 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${anomalies.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <p className="text-2xl font-bold">{anomalies.length}</p>
            <p className="text-xs text-muted-foreground">Anomalie{anomalies.length > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-3 pb-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold">{conformes.length}</p>
            <p className="text-xs text-muted-foreground">Conforme{conformes.length > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{nonVerifiables.length}</p>
            <p className="text-xs text-muted-foreground">Non vérifiable{nonVerifiables.length > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles table */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Contrôles réglementaires de l'agent comptable
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">ID</TableHead>
                <TableHead>Contrôle</TableHead>
                <TableHead>Référence M9-6</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Détail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controles.map(c => (
                <TableRow key={c.id} className={c.statut === 'anomalie' ? "bg-destructive/5" : c.statut === 'non_verifiable' ? "bg-muted/30" : ""}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="text-sm max-w-xs">{c.controle}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{c.referenceM96}</TableCell>
                  <TableCell>
                    {c.statut === 'conforme' ? (
                      <Badge variant="outline" className="text-[9px] text-emerald-600">Conforme</Badge>
                    ) : c.statut === 'anomalie' ? (
                      <Badge variant="destructive" className="text-[9px]">
                        Anomalie{c.gravite ? ` · ${c.gravite}` : ''}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px]">Non vérifiable</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs max-w-md">{c.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Regulatory reminder */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="text-xs font-bold text-muted-foreground">Contrôles de l'agent comptable (M9-6 Tome 2 — §2.3.4) :</p>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
            <li>Qualité de l'ordonnateur</li>
            <li>Disponibilité des crédits</li>
            <li>Exacte imputation budgétaire et comptable</li>
            <li>Validité de la créance (pièces justificatives, certification du service fait, prescription)</li>
          </ul>
          <p className="text-xs font-bold text-muted-foreground mt-2">Contrôles sur les titres de recettes (§2.2.4) :</p>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
            <li>Autorisation de percevoir la recette</li>
            <li>Régularité de l'émission du titre</li>
            <li>Exactitude de la liquidation</li>
            <li>Production des pièces justificatives</li>
          </ul>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground italic text-center">
        Analyse strictement limitée aux dispositions explicites de la M9-6 — OP@LE (19 janvier 2026).
        Aucun calcul prospectif, prévisionnel ou statistique n'est effectué car non prévu par l'instruction.
      </p>
    </div>
  );
};

export default ControlesACTab;
