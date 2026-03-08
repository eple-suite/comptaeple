import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Satd, ETAPE_LABELS, STATUT_SATD_CONFIG } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { AlertTriangle, CheckCircle2, ChevronRight, FileText, ArrowRight, Clock, Shield, Scale, Gavel, BookOpen } from "lucide-react";

interface Props {
  satd: Satd | null;
  onGenerateDocument: (satd: Satd, docType: string) => void;
  onAddEtape: (type: string) => void;
}

// Procédure complète SATD - étapes réglementaires
const PROCEDURE_STEPS = [
  {
    id: 1, key: "relance1", label: "1ère relance amiable",
    description: "Envoi d'un courrier simple rappelant le montant de la dette et invitant le débiteur à régulariser sa situation.",
    delai: "Dès constatation de l'impayé",
    base_legale: "Bonne pratique — obligation de diligence du comptable",
    documents: ["Courrier simple de relance"],
    obligatoire: true,
    conseil: "Privilégier un ton courtois. Proposer un échéancier de paiement. Conserver une copie du courrier.",
  },
  {
    id: 2, key: "relance2", label: "2ème relance amiable (RAR)",
    description: "Envoi d'un courrier recommandé avec accusé de réception. Le RAR constitue une preuve de la démarche amiable.",
    delai: "30 jours après la 1ère relance sans réponse",
    base_legale: "Art. L. 1617-5 CGCT — Phase amiable préalable obligatoire",
    documents: ["Courrier RAR de relance"],
    obligatoire: true,
    conseil: "Le RAR est indispensable : il prouve que le débiteur a été informé. Sans RAR, la SATD peut être contestée.",
  },
  {
    id: 3, key: "relance3", label: "3ème relance (optionnelle)",
    description: "Relance supplémentaire si le débiteur commence à répondre ou si la situation sociale le justifie.",
    delai: "15-30 jours après la 2ème relance",
    base_legale: "Bonne pratique",
    documents: ["Courrier de relance"],
    obligatoire: false,
    conseil: "À adapter selon la situation. Si le débiteur est de bonne foi, proposer un plan d'apurement.",
  },
  {
    id: 4, key: "passage_416", label: "Passage en compte 416",
    description: "Transfert de la créance du compte 411 (clients) au compte 416 (créances douteuses). Provisionner si nécessaire (compte 491).",
    delai: "Avant le 31/12 de l'exercice si créance > 6 mois",
    base_legale: "Instruction M9-6 — Instruction codificatrice des EPLE",
    documents: ["Écriture comptable 411→416"],
    obligatoire: true,
    conseil: "Le passage en 416 est un préalable comptable. Il ne signifie pas l'abandon de la créance. Provisionner à hauteur du risque estimé.",
  },
  {
    id: 5, key: "avis_poursuites", label: "Avis avant poursuites",
    description: "Document obligatoire adressé au débiteur en RAR. Il l'informe que sans régularisation sous 30 jours, des poursuites seront engagées. C'est le dernier avertissement avant la SATD.",
    delai: "Après échec des relances amiables",
    base_legale: "Art. L. 1617-5 al. 4 du CGCT — Envoi obligatoire avant toute poursuite",
    documents: ["Avis avant poursuites (RAR)"],
    obligatoire: true,
    conseil: "L'absence d'avis avant poursuites rend la SATD irrégulière. Le délai de 30 jours court à compter de la réception de l'AR.",
  },
  {
    id: 6, key: "autorisation_ordonnateur", label: "Autorisation de l'ordonnateur",
    description: "Le comptable demande au chef d'établissement (ordonnateur) l'autorisation écrite de poursuivre le recouvrement forcé. L'ordonnateur peut refuser (cas social, etc.).",
    delai: "Après expiration du délai de 30 jours de l'avis",
    base_legale: "Art. L. 1617-5 al. 2 du CGCT — Autorisation préalable obligatoire",
    documents: ["Demande d'autorisation", "Visa de l'ordonnateur"],
    obligatoire: true,
    conseil: "Le refus de l'ordonnateur doit être motivé par écrit. En cas de refus, le comptable est déchargé de sa responsabilité.",
  },
  {
    id: 7, key: "ficoba", label: "Demande FICOBA (si nécessaire)",
    description: "Consultation du fichier national des comptes bancaires (FICOBA) auprès de la DDFiP pour identifier les comptes du débiteur, si le tiers détenteur n'est pas connu.",
    delai: "En parallèle de la demande d'autorisation",
    base_legale: "Art. L. 151 A du LPF — Droit de communication comptable",
    documents: ["Demande de consultation FICOBA"],
    obligatoire: false,
    conseil: "La demande se fait par courrier au directeur de la DDFiP. Délai de réponse variable (2-4 semaines).",
  },
  {
    id: 8, key: "satd_emission", label: "Émission de la SATD",
    description: "Envoi simultané de 3 documents en RAR : lettre au tiers détenteur, notification au débiteur, bordereau récapitulatif. Les 3 doivent partir le même jour.",
    delai: "Après obtention de l'autorisation de l'ordonnateur",
    base_legale: "Art. L. 262-1 et R. 262-1 du LPF — Procédure de SATD",
    documents: ["Lettre au tiers détenteur (RAR)", "Notification au débiteur (RAR)", "Bordereau récapitulatif"],
    obligatoire: true,
    conseil: "Les 3 documents doivent être envoyés le MÊME JOUR en RAR. Conserver les preuves de dépôt et les AR. Le tiers dispose de 30 jours pour verser.",
  },
  {
    id: 9, key: "satd_reception_ar", label: "Réception des AR",
    description: "Vérifier la bonne réception des 3 AR (tiers détenteur, débiteur, DDFiP si applicable). Les AR sont des pièces justificatives essentielles.",
    delai: "5-15 jours après l'émission",
    base_legale: "Preuve de notification — Art. 668 du CPC",
    documents: [],
    obligatoire: true,
    conseil: "Si un AR n'est pas retourné, relancer par voie d'huissier. Sans preuve de notification, la SATD est inopposable.",
  },
  {
    id: 10, key: "prelevement", label: "Prélèvement / Versement du tiers",
    description: "Le tiers détenteur verse les fonds dans les 30 jours. Si le débiteur est salarié, le prélèvement respecte la quotité saisissable (barème légal).",
    delai: "30 jours maximum après notification au tiers",
    base_legale: "Art. L. 262-3 du LPF — Délai de versement",
    documents: ["Avis de réception des fonds"],
    obligatoire: true,
    conseil: "Si le tiers ne verse pas dans les 30 jours, il devient personnellement débiteur. Possibilité de lui adresser une SATD directe.",
  },
  {
    id: 11, key: "contestation", label: "Gestion des contestations",
    description: "Le débiteur peut contester dans les 2 mois devant le juge de l'exécution (JEX). La contestation ne suspend pas la SATD sauf décision du juge.",
    delai: "2 mois à compter de la notification",
    base_legale: "Art. L. 262-5 du LPF — Voies de recours",
    documents: ["Mémoire en défense (si nécessaire)"],
    obligatoire: false,
    conseil: "Préparer un mémoire en défense solide avec toutes les pièces de la procédure. Le juge vérifiera la régularité de chaque étape.",
  },
  {
    id: 12, key: "solde", label: "Clôture de la procédure",
    description: "Lorsque la créance est intégralement recouvrée, clôturer la procédure. Mettre à jour les écritures comptables (extourne 416→411, reprise de provision).",
    delai: "Dès réception intégrale des fonds",
    base_legale: "Instruction M9-6",
    documents: ["Certificat de solde"],
    obligatoire: true,
    conseil: "N'oubliez pas de reprendre la provision pour dépréciation (compte 491) si elle avait été constituée.",
  },
];

export default function SatdProcedure({ satd, onGenerateDocument, onAddEtape }: Props) {
  // Determine current step for the selected SATD
  const currentStepIndex = useMemo(() => {
    if (!satd) return -1;
    const etapeTypes = satd.etapes.map(e => e.type);
    // Find the last completed step
    for (let i = PROCEDURE_STEPS.length - 1; i >= 0; i--) {
      if (etapeTypes.includes(PROCEDURE_STEPS[i].key as any)) return i;
    }
    return -1;
  }, [satd]);

  const nextStep = currentStepIndex < PROCEDURE_STEPS.length - 1 ? PROCEDURE_STEPS[currentStepIndex + 1] : null;

  // Jours depuis dernière action
  const joursSanAction = useMemo(() => {
    if (!satd || satd.etapes.length === 0) return 0;
    const lastDate = satd.etapes[satd.etapes.length - 1].date;
    return Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  }, [satd]);

  // Jours avant prescription
  const joursAvantPrescription = useMemo(() => {
    if (!satd) return 0;
    return Math.floor((new Date(satd.datePrescription).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [satd]);

  return (
    <div className="space-y-6">
      {/* Guide de procédure complet */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Procédure de recouvrement forcé — Guide étape par étape
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cadre juridique : Articles L. 262-1 et suivants du Livre des procédures fiscales, Art. L. 1617-5 du CGCT
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {PROCEDURE_STEPS.map((step, i) => {
              const isDone = satd ? satd.etapes.some(e => e.type === step.key) : false;
              const isCurrent = i === currentStepIndex + 1;
              const isPast = i <= currentStepIndex;

              return (
                <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Vertical line */}
                  {i < PROCEDURE_STEPS.length - 1 && (
                    <div className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] ${isPast ? "bg-success" : isCurrent ? "bg-primary" : "bg-border"}`} />
                  )}

                  {/* Circle */}
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? "bg-success text-success-foreground" :
                    isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-lg p-3 ${
                    isCurrent ? "bg-primary/5 border border-primary/20" :
                    isDone ? "bg-success/5" :
                    "bg-muted/20"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isDone ? "text-success" : isCurrent ? "text-primary" : ""}`}>
                            {step.label}
                          </span>
                          {step.obligatoire && (
                            <Badge variant="outline" className="text-[9px] h-4">Obligatoire</Badge>
                          )}
                          {isCurrent && (
                            <Badge className="bg-primary/10 text-primary border-0 text-[9px]">→ Étape suivante</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground"><strong>Délai :</strong> {step.delai}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground"><strong>Base :</strong> {step.base_legale}</span>
                      </div>
                    </div>

                    {step.documents.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground"><strong>Documents :</strong> {step.documents.join(", ")}</span>
                      </div>
                    )}

                    <div className="mt-2 bg-accent/30 rounded p-2 text-[11px] text-muted-foreground italic flex items-start gap-1.5">
                      <Shield className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{step.conseil}</span>
                    </div>

                    {/* Action buttons for current step */}
                    {isCurrent && satd && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {step.documents.map(doc => (
                          <Button key={doc} size="sm" variant="outline" className="text-xs h-7" onClick={() => onGenerateDocument(satd, step.key)}>
                            <FileText className="h-3 w-3 mr-1" /> {doc}
                          </Button>
                        ))}
                        <Button size="sm" className="text-xs h-7 gradient-primary border-0" onClick={() => onAddEtape(step.key)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Marquer comme fait
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommandation "que faire ensuite" */}
      {satd && nextStep && satd.statut !== "termine" && (
        <Card className="shadow-card border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" /> Action recommandée — {satd.reference}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Débiteur</span>
                <p className="font-medium">{satd.debiteur}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Montant restant</span>
                <p className="font-mono font-bold text-warning">{formatCurrency(satd.montantGlobal - satd.montantPreleve)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Jours sans action</span>
                <p className={`font-bold ${joursSanAction > 30 ? "text-destructive" : ""}`}>{joursSanAction} jours</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Prescription dans</span>
                <p className={`font-bold ${joursAvantPrescription < 365 ? "text-destructive" : ""}`}>{joursAvantPrescription} jours</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Prochaine étape : {nextStep.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{nextStep.description}</p>
                <p className="text-xs text-muted-foreground mt-1"><strong>Délai recommandé :</strong> {nextStep.delai}</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {nextStep.documents.map(doc => (
                <Button key={doc} size="sm" variant="outline" className="text-xs h-7" onClick={() => onGenerateDocument(satd, nextStep.key)}>
                  <FileText className="h-3 w-3 mr-1" /> Générer : {doc}
                </Button>
              ))}
              <Button size="sm" className="text-xs h-7 gradient-primary border-0" onClick={() => onAddEtape(nextStep.key)}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Enregistrer cette étape
              </Button>
            </div>

            {joursSanAction > 30 && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                <AlertTriangle className="h-4 w-4" />
                <span><strong>Attention :</strong> {joursSanAction} jours sans action. Risque de mise en jeu de la responsabilité du comptable (diligences insuffisantes).</span>
              </div>
            )}

            {joursAvantPrescription < 365 && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                <AlertTriangle className="h-4 w-4" />
                <span><strong>⚠️ Prescription proche :</strong> La créance sera prescrite dans {joursAvantPrescription} jours. Accélérer la procédure.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan d'apurement */}
      {satd && satd.statut !== "termine" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">💡 Alternative : Plan d'apurement amiable</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>Avant d'engager la SATD, il est toujours préférable de proposer un <strong className="text-foreground">plan d'apurement amiable</strong> au débiteur :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Le plan fixe un échéancier de paiement que le débiteur s'engage à respecter</li>
              <li>Il doit être formalisé par écrit et signé par les deux parties</li>
              <li>Il suspend les poursuites mais <strong>n'interrompt pas la prescription</strong></li>
              <li>En cas de non-respect, la procédure de recouvrement forcé reprend automatiquement</li>
              <li>Privilégier des mensualités adaptées aux capacités du débiteur</li>
            </ul>
            <p className="mt-2 italic">Base légale : Art. L. 1617-5 al. 6 du CGCT — Le comptable public peut accorder des délais de paiement.</p>
          </CardContent>
        </Card>
      )}

      {!satd && (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sélectionnez une procédure dans l'onglet <strong>Registre</strong> pour suivre le guide étape par étape.</p>
            <p className="text-xs text-muted-foreground mt-1">La procédure ci-dessus reste consultable comme référence réglementaire.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
