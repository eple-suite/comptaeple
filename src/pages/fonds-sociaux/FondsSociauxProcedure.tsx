import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DemandeAide, Eleve, mockEleves, TYPE_LABELS, NATURES_AIDE, STATUT_CONFIG } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { BookOpen, Shield, Users, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

interface Props {
  demandes: DemandeAide[];
}

// Barème indicatif basé sur le quotient familial
const BAREME_QF = [
  { qfMin: 0, qfMax: 200, tauxRestauration: 100, tauxInternat: 100, tauxEquipement: 100, tauxTransport: 100, label: "Prise en charge intégrale" },
  { qfMin: 201, qfMax: 350, tauxRestauration: 80, tauxInternat: 80, tauxEquipement: 80, tauxTransport: 80, label: "Forte aide" },
  { qfMin: 351, qfMax: 500, tauxRestauration: 60, tauxInternat: 60, tauxEquipement: 60, tauxTransport: 50, label: "Aide importante" },
  { qfMin: 501, qfMax: 700, tauxRestauration: 40, tauxInternat: 40, tauxEquipement: 40, tauxTransport: 30, label: "Aide partielle" },
  { qfMin: 701, qfMax: 900, tauxRestauration: 20, tauxInternat: 20, tauxEquipement: 20, tauxTransport: 0, label: "Aide ponctuelle" },
  { qfMin: 901, qfMax: 99999, tauxRestauration: 0, tauxInternat: 0, tauxEquipement: 0, tauxTransport: 0, label: "Hors barème" },
];

// Procédure réglementaire fonds sociaux
const PROCEDURE_ETAPES = [
  { titre: "Repérage et signalement", description: "L'assistante sociale, le CPE, l'infirmier(e) ou un enseignant signale une situation de difficulté sociale. Le repérage peut aussi venir de la détection d'impayés de restauration.", responsable: "Tout personnel", delai: "En continu" },
  { titre: "Entretien et évaluation sociale", description: "L'assistante sociale (ou le CPE en son absence) reçoit la famille, évalue la situation (ressources, charges, composition familiale) et préconise une aide.", responsable: "AS / CPE", delai: "Sous 15 jours" },
  { titre: "Constitution du dossier", description: "Le dossier comprend : formulaire de demande, avis d'imposition, justificatif de domicile, attestation CAF/QF, RIB, et toute pièce pertinente. Le dossier est vérifié par le gestionnaire.", responsable: "Famille + Gestionnaire", delai: "Variable" },
  { titre: "Instruction préalable", description: "Le gestionnaire vérifie la complétude du dossier, la disponibilité des crédits et prépare la fiche de synthèse pour la commission.", responsable: "Gestionnaire", delai: "Avant la commission" },
  { titre: "Passage en commission", description: "La commission sociale se réunit (CE, gestionnaire, AS, CPE, infirmier(e), parents élus). Elle examine chaque dossier anonymisé et vote l'attribution. Le PV est rédigé.", responsable: "Chef d'établissement", delai: "Au moins 3 fois/an" },
  { titre: "Décision et notification", description: "Le chef d'établissement prend la décision au vu de l'avis de la commission. La famille est notifiée par courrier (confidentiel). En cas de refus, le motif est indiqué.", responsable: "Chef d'établissement", delai: "Sous 8 jours" },
  { titre: "Versement / Imputation", description: "Le gestionnaire émet le mandat de paiement. Pour la restauration, imputation directe sur le compte de l'élève. Pour les autres aides, virement au responsable légal.", responsable: "Gestionnaire", delai: "Sous 15 jours" },
  { titre: "Bilan annuel au CA", description: "Présentation anonymisée au Conseil d'Administration : nombre de demandes, montants, répartition, taux de consommation des crédits. Proposition de dotation complémentaire si nécessaire.", responsable: "Gestionnaire + CE", delai: "1 fois/an minimum" },
];

export default function FondsSociauxProcedure({ demandes }: Props) {
  // Historique par élève
  const historiqueParEleve = useMemo(() => {
    const map: Record<string, { eleve: Eleve; demandes: DemandeAide[]; totalAccorde: number }> = {};
    demandes.forEach(d => {
      if (!map[d.eleveId]) map[d.eleveId] = { eleve: d.eleve, demandes: [], totalAccorde: 0 };
      map[d.eleveId].demandes.push(d);
      if (d.statut === "accorde" || d.statut === "verse") map[d.eleveId].totalAccorde += d.montantAccorde;
    });
    return Object.values(map).sort((a, b) => b.totalAccorde - a.totalAccorde);
  }, [demandes]);

  // Élèves bénéficiant de plusieurs aides
  const elevesMultiAides = historiqueParEleve.filter(h => h.demandes.filter(d => d.statut === "accorde" || d.statut === "verse").length > 1);

  return (
    <div className="space-y-6">
      {/* Procédure réglementaire */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Procédure réglementaire — Fonds sociaux EPLE
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cadre : Circulaire n° 2017-122 du 22/08/2017 — Fonds sociaux en faveur des élèves
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {PROCEDURE_ETAPES.map((etape, i) => (
              <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                {i < PROCEDURE_ETAPES.length - 1 && (
                  <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] bg-border" />
                )}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{etape.titre}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[9px]">{etape.responsable}</Badge>
                      <Badge variant="secondary" className="text-[9px]">{etape.delai}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{etape.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Barème indicatif QF */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" /> Barème indicatif selon le quotient familial
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Ce barème est indicatif et soumis à l'appréciation de la commission. Il peut être adapté au cas par cas.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tranche QF</TableHead>
                <TableHead>Niveau d'aide</TableHead>
                <TableHead className="text-center">Restauration</TableHead>
                <TableHead className="text-center">Internat</TableHead>
                <TableHead className="text-center">Équipement</TableHead>
                <TableHead className="text-center">Transport</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BAREME_QF.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{b.qfMin} — {b.qfMax === 99999 ? "+" : b.qfMax}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] border-0 ${
                      b.tauxRestauration >= 80 ? "bg-success/10 text-success" :
                      b.tauxRestauration >= 40 ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>{b.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold">{b.tauxRestauration > 0 ? `${b.tauxRestauration}%` : "—"}</TableCell>
                  <TableCell className="text-center text-sm font-semibold">{b.tauxInternat > 0 ? `${b.tauxInternat}%` : "—"}</TableCell>
                  <TableCell className="text-center text-sm font-semibold">{b.tauxEquipement > 0 ? `${b.tauxEquipement}%` : "—"}</TableCell>
                  <TableCell className="text-center text-sm font-semibold">{b.tauxTransport > 0 ? `${b.tauxTransport}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historique par élève */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Historique par élève — Cumul des aides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Situation</TableHead>
                <TableHead className="text-center">QF</TableHead>
                <TableHead className="text-center">Nb demandes</TableHead>
                <TableHead className="text-center">Accordées</TableHead>
                <TableHead className="text-right">Total accordé</TableHead>
                <TableHead>Natures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historiqueParEleve.map(h => {
                const accordees = h.demandes.filter(d => d.statut === "accorde" || d.statut === "verse");
                const natures = [...new Set(accordees.map(d => NATURES_AIDE[d.nature]?.split(" ")[0] || d.nature))];
                return (
                  <TableRow key={h.eleve.id}>
                    <TableCell className="font-medium text-sm">{h.eleve.nom} {h.eleve.prenom}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.eleve.classe}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={h.eleve.situationFamiliale}>{h.eleve.situationFamiliale}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{h.eleve.quotientFamilial}</TableCell>
                    <TableCell className="text-center text-sm">{h.demandes.length}</TableCell>
                    <TableCell className="text-center text-sm text-success font-semibold">{accordees.length}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">{formatCurrency(h.totalAccorde)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {natures.map(n => <Badge key={n} variant="outline" className="text-[9px]">{n}</Badge>)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alertes multi-aides */}
      {elevesMultiAides.length > 0 && (
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Élèves bénéficiant de plusieurs aides</p>
                <p className="text-xs text-muted-foreground">Ces élèves cumulent plusieurs aides sur l'année. Vérifier la cohérence avec la situation sociale.</p>
                {elevesMultiAides.map(h => (
                  <p key={h.eleve.id} className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{h.eleve.nom} {h.eleve.prenom}</strong> ({h.eleve.classe}) — {h.demandes.filter(d => d.statut === "accorde" || d.statut === "verse").length} aides pour {formatCurrency(h.totalAccorde)} — QF {h.eleve.quotientFamilial}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rappels réglementaires */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Rappels réglementaires
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• <strong className="text-foreground">Confidentialité absolue :</strong> Les informations relatives aux fonds sociaux sont strictement confidentielles. Les documents présentés au CA doivent être anonymisés.</p>
          <p>• <strong className="text-foreground">Pas de condition de nationalité :</strong> Les fonds sociaux sont ouverts à tous les élèves inscrits, quelle que soit leur nationalité ou situation administrative.</p>
          <p>• <strong className="text-foreground">Pas de condition de bourse :</strong> Un élève non boursier peut bénéficier des fonds sociaux si sa situation le justifie.</p>
          <p>• <strong className="text-foreground">Urgence :</strong> En cas d'urgence sociale avérée, le chef d'établissement peut accorder une aide immédiate sans attendre la commission, sous réserve de ratification ultérieure.</p>
          <p>• <strong className="text-foreground">Commission obligatoire :</strong> La commission doit se réunir au moins 3 fois par an. Les parents d'élèves élus y participent.</p>
          <p>• <strong className="text-foreground">Crédits non fongibles :</strong> Les crédits FSL ne peuvent pas être utilisés pour le FSC et inversement. Seule exception : les aides exceptionnelles du CE.</p>
          <p>• <strong className="text-foreground">Report des crédits :</strong> Les crédits non consommés sont reportés sur l'exercice suivant (même chapitre budgétaire).</p>
        </CardContent>
      </Card>
    </div>
  );
}
