import { useState, useMemo } from "react";
import { Info, MapPin, Users, Euro, Check, ArrowRight, Plane, Bus, Train, Ship, AlertTriangle, Scale } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Voyage, CHECKLIST_DEFAUT, TransportType, TypeVoyage } from "./types";
import { validerEquilibreBudgetaire, calculerParticipationEquilibre } from "@/lib/voyageBudgetEngine";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateVoyage: (voyage: Voyage) => void;
}

const TYPE_VOYAGE_OPTIONS: { value: TypeVoyage; label: string; icon: string }[] = [
  { value: "pedagogique", label: "Pédagogique", icon: "📚" },
  { value: "linguistique", label: "Linguistique", icon: "🌍" },
  { value: "sportif", label: "Sportif", icon: "⛷️" },
  { value: "culturel", label: "Culturel", icon: "🏛️" },
  { value: "ski", label: "Ski", icon: "🎿" },
  { value: "erasmus", label: "Erasmus+", icon: "⭐" },
];

const TRANSPORT_OPTIONS: { value: TransportType; label: string; Icon: React.ElementType }[] = [
  { value: "bus", label: "Bus", Icon: Bus },
  { value: "avion", label: "Avion", Icon: Plane },
  { value: "train", label: "Train", Icon: Train },
  { value: "bateau", label: "Bateau", Icon: Ship },
];

const STEPS = [
  { num: 1, label: "Informations", Icon: Info },
  { num: 2, label: "Destination", Icon: MapPin },
  { num: 3, label: "Participants", Icon: Users },
  { num: 4, label: "Budget", Icon: Euro },
];

export const VoyageCreationWizard = ({ open, onOpenChange, onCreateVoyage }: Props) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    intitule: "", typeVoyage: "pedagogique" as TypeVoyage, dateDepart: "", dateRetour: "", dateVoteCA: "",
    destination: "", pays: "", transportType: "bus" as TransportType,
    classe: "", professeur: "", nbEleves: "", nbAccompagnateurs: "",
    budgetTotal: "", participationFamilles: "", subventionCollectivite: "", subventionEtat: "",
    subventionAutre: "", autofinancement: "",
    transport: "", hebergement: "", restauration: "", activites: "", assurance: "", divers: "",
    regieAvances: "",
    objectifPedagogique: "", observations: "", dateLimiteInscription: "", codeActiviteGFC: "",
    versionStatut: "brouillon" as "brouillon" | "valide",
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // Budget validation in real-time
  const budgetValidation = useMemo(() => {
    const nbEleves = Number(form.nbEleves) || 0;
    const data = {
      nbEleves,
      participationFamilles: Number(form.participationFamilles) || 0,
      subventionCollectivite: Number(form.subventionCollectivite) || 0,
      subventionEtat: Number(form.subventionEtat) || 0,
      subventionAutre: Number(form.subventionAutre) || 0,
      autofinancement: Number(form.autofinancement) || 0,
      transport: Number(form.transport) || 0,
      hebergement: Number(form.hebergement) || 0,
      restauration: Number(form.restauration) || 0,
      activites: Number(form.activites) || 0,
      assurance: Number(form.assurance) || 0,
      divers: Number(form.divers) || 0,
      regieAvances: Number(form.regieAvances) || 0,
    };
    return validerEquilibreBudgetaire(data);
  }, [form]);

  const participationSuggestion = useMemo(() => {
    return calculerParticipationEquilibre({
      nbEleves: Number(form.nbEleves) || 0,
      participationFamilles: Number(form.participationFamilles) || 0,
      subventionCollectivite: Number(form.subventionCollectivite) || 0,
      subventionEtat: Number(form.subventionEtat) || 0,
      subventionAutre: Number(form.subventionAutre) || 0,
      autofinancement: Number(form.autofinancement) || 0,
      transport: Number(form.transport) || 0,
      hebergement: Number(form.hebergement) || 0,
      restauration: Number(form.restauration) || 0,
      activites: Number(form.activites) || 0,
      assurance: Number(form.assurance) || 0,
      divers: Number(form.divers) || 0,
      regieAvances: Number(form.regieAvances) || 0,
    });
  }, [form]);

  const handleCreate = () => {
    // Block if profit on families (recettes > dépenses)
    if (budgetValidation.erreurs.length > 0) return;

    const budget = budgetValidation.totalDepenses;
    const familles = Number(form.participationFamilles);
    const subvColl = Number(form.subventionCollectivite) || 0;
    const subvEtat = Number(form.subventionEtat) || 0;
    const subvAutre = Number(form.subventionAutre) || 0;
    const subv = subvColl + subvEtat + subvAutre;
    const autofi = Number(form.autofinancement) || 0;
    const regie = Number(form.regieAvances) || 0;

    const newVoyage: Voyage = {
      id: Date.now().toString(),
      destination: form.destination, pays: form.pays,
      dateDepart: form.dateDepart, dateRetour: form.dateRetour,
      nbEleves: Number(form.nbEleves) || 0,
      nbAccompagnateurs: Number(form.nbAccompagnateurs) || 0,
      budgetTotal: budget, participationFamilles: familles,
      subventions: subv, chargeEtablissement: Math.max(0, budget - familles - subv - autofi),
      statut: "projet",
      transport: Number(form.transport) || 0, hebergement: Number(form.hebergement) || 0,
      restauration: Number(form.restauration) || 0, activites: Number(form.activites) || 0,
      assurance: Number(form.assurance) || 0, divers: Number(form.divers) || 0,
      professeur: form.professeur, classe: form.classe,
      objectifPedagogique: form.objectifPedagogique,
      subventionCollectivite: subvColl, subventionEtat: subvEtat, subventionAutre: subvAutre,
      autofinancement: autofi,
      eleves: [], accompagnateurs: [],
      dateVoteCA: form.dateVoteCA, dateLimiteInscription: form.dateLimiteInscription,
      echeances: [{ date: form.dateLimiteInscription || form.dateDepart, pourcentage: 100 }],
      observations: form.observations,
      actesCA: [], conventions: [], subventionsDetail: [],
      checklist: CHECKLIST_DEFAUT.map((item, i) => ({ ...item, id: `chk-new-${i}`, fait: false, observations: "" })),
      devis: [],
      lieuDepart: "", horairesDepart: "", horairesRetour: "",
      moyenTransport: "", typeHebergement: "",
      contactUrgence: "", telUrgence: "",
      transportType: form.transportType,
      typeVoyage: form.typeVoyage,
      intitule: form.intitule || `Voyage à ${form.destination}`,
      codeActiviteGFC: form.codeActiviteGFC,
      regieAvances: regie,
      versionStatut: form.versionStatut,
    } as any;
    onCreateVoyage(newVoyage);
    onOpenChange(false);
    setStep(1);
    setForm({
      intitule: "", typeVoyage: "pedagogique", dateDepart: "", dateRetour: "", dateVoteCA: "",
      destination: "", pays: "", transportType: "bus",
      classe: "", professeur: "", nbEleves: "", nbAccompagnateurs: "",
      budgetTotal: "", participationFamilles: "", subventionCollectivite: "", subventionEtat: "",
      subventionAutre: "", autofinancement: "",
      transport: "", hebergement: "", restauration: "", activites: "", assurance: "", divers: "",
      regieAvances: "",
      objectifPedagogique: "", observations: "", dateLimiteInscription: "", codeActiviteGFC: "",
      versionStatut: "brouillon",
    });
  };

  const canProceed = () => {
    if (step === 1) return form.intitule.trim() && form.dateDepart && form.dateRetour;
    if (step === 2) return form.destination.trim();
    if (step === 3) return form.classe.trim() && form.professeur.trim();
    // Step 4: at least one expense, and NO budget errors (no profit)
    const hasExpense = budgetValidation.totalDepenses > 0;
    const noBlockingErrors = budgetValidation.erreurs.length === 0;
    return hasExpense && noBlockingErrors;
  };

  const formatEuro = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/70 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Nouveau voyage scolaire
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold transition-all
                    ${step === s.num ? "bg-primary border-primary text-primary-foreground"
                      : step > s.num ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted border-border text-muted-foreground"}`}
                >
                  {step > s.num ? <Check className="h-3 w-3" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${step > s.num ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label>Intitulé du voyage *</Label>
                <Input value={form.intitule} onChange={e => update("intitule", e.target.value)} placeholder="Ex: Voyage linguistique à Londres" />
              </div>
              <div>
                <Label className="mb-2 block">Type de voyage</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_VOYAGE_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => update("typeVoyage", t.value)}
                      className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-1
                        ${form.typeVoyage === t.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Date départ *</Label><Input type="date" value={form.dateDepart} onChange={e => update("dateDepart", e.target.value)} /></div>
                <div><Label>Date retour *</Label><Input type="date" value={form.dateRetour} onChange={e => update("dateRetour", e.target.value)} /></div>
                <div><Label>Date vote CA</Label><Input type="date" value={form.dateVoteCA} onChange={e => update("dateVoteCA", e.target.value)} /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Destination *</Label><Input value={form.destination} onChange={e => update("destination", e.target.value)} placeholder="Ex: Londres" /></div>
                <div><Label>Pays</Label><Input value={form.pays} onChange={e => update("pays", e.target.value)} placeholder="Ex: Royaume-Uni" /></div>
              </div>
              <div>
                <Label className="mb-2 block">Mode de transport</Label>
                <div className="flex gap-2">
                  {TRANSPORT_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => update("transportType", t.value)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5
                        ${form.transportType === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"}`}
                    >
                      <t.Icon className={`h-5 w-5 ${form.transportType === t.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${form.transportType === t.value ? "text-primary" : "text-muted-foreground"}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Objectif pédagogique</Label>
                <Textarea value={form.objectifPedagogique} onChange={e => update("objectifPedagogique", e.target.value)} placeholder="Décrivez l'objectif..." rows={2} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Classe *</Label><Input value={form.classe} onChange={e => update("classe", e.target.value)} placeholder="Ex: 2nde A" /></div>
                <div><Label>Professeur référent *</Label><Input value={form.professeur} onChange={e => update("professeur", e.target.value)} placeholder="Ex: M. Dupont" /></div>
                <div><Label>Nb élèves</Label><Input type="number" value={form.nbEleves} onChange={e => update("nbEleves", e.target.value)} /></div>
                <div><Label>Nb accompagnateurs</Label><Input type="number" value={form.nbAccompagnateurs} onChange={e => update("nbAccompagnateurs", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date limite inscription</Label><Input type="date" value={form.dateLimiteInscription} onChange={e => update("dateLimiteInscription", e.target.value)} /></div>
                <div><Label>Code activité GFC</Label><Input value={form.codeActiviteGFC} onChange={e => update("codeActiviteGFC", e.target.value)} placeholder="Ex: N3VOY1" /></div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              {/* Version statut */}
              <div className="flex items-center gap-3">
                <Label className="text-xs font-semibold">Version du budget :</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => update("versionStatut", "brouillon")}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      form.versionStatut === "brouillon" ? "border-warning bg-warning/5 text-warning" : "border-border text-muted-foreground"
                    }`}
                  >
                    📝 Brouillon enseignant
                  </button>
                  <button
                    onClick={() => update("versionStatut", "valide")}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      form.versionStatut === "valide" ? "border-success bg-success/5 text-success" : "border-border text-muted-foreground"
                    }`}
                  >
                    ✅ Validé comptable
                  </button>
                </div>
              </div>

              <Separator />

              <p className="text-xs font-semibold text-foreground">Dépenses (prestations + régie)</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>🚌 Transport (€)</Label><Input type="number" value={form.transport} onChange={e => update("transport", e.target.value)} /></div>
                <div><Label>🏨 Hébergement (€)</Label><Input type="number" value={form.hebergement} onChange={e => update("hebergement", e.target.value)} /></div>
                <div><Label>🍽️ Restauration (€)</Label><Input type="number" value={form.restauration} onChange={e => update("restauration", e.target.value)} /></div>
                <div><Label>🎭 Activités (€)</Label><Input type="number" value={form.activites} onChange={e => update("activites", e.target.value)} /></div>
                <div><Label>🛡️ Assurance (€)</Label><Input type="number" value={form.assurance} onChange={e => update("assurance", e.target.value)} /></div>
                <div><Label>📦 Divers (€)</Label><Input type="number" value={form.divers} onChange={e => update("divers", e.target.value)} /></div>
              </div>

              {/* Régie d'avances */}
              <div className="bg-accent/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">💳 Régie d'avances</span>
                  <Badge variant="outline" className="text-[9px]">Décrets 2019/2020</Badge>
                </div>
                <Input type="number" value={form.regieAvances} onChange={e => update("regieAvances", e.target.value)} placeholder="Menus frais, entrées, péages..." />
                <p className="text-[10px] text-muted-foreground">Frais sur place nécessitant un mandataire (menus frais, entrées musées, péages)</p>
              </div>

              <Separator />

              <p className="text-xs font-semibold text-foreground">Financement (recettes)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Participation familles (€)</Label>
                  <Input type="number" value={form.participationFamilles} onChange={e => update("participationFamilles", e.target.value)} />
                  {participationSuggestion > 0 && Number(form.nbEleves) > 0 && (
                    <button
                      onClick={() => update("participationFamilles", String(Math.round(participationSuggestion * Number(form.nbEleves) * 100) / 100))}
                      className="text-[10px] text-primary hover:underline mt-0.5"
                    >
                      💡 Suggestion : {formatEuro(participationSuggestion)}/él. = {formatEuro(participationSuggestion * Number(form.nbEleves))}
                    </button>
                  )}
                </div>
                <div><Label>Autofinancement (€)</Label><Input type="number" value={form.autofinancement} onChange={e => update("autofinancement", e.target.value)} /></div>
                <div><Label>Subvention collectivité (€)</Label><Input type="number" value={form.subventionCollectivite} onChange={e => update("subventionCollectivite", e.target.value)} /></div>
                <div><Label>Subvention État (€)</Label><Input type="number" value={form.subventionEtat} onChange={e => update("subventionEtat", e.target.value)} /></div>
                <div><Label>Autres subventions (€)</Label><Input type="number" value={form.subventionAutre} onChange={e => update("subventionAutre", e.target.value)} /></div>
              </div>

              {/* Budget validation feedback */}
              {budgetValidation.totalDepenses > 0 && (
                <div className="space-y-2">
                  {/* Equilibrium status */}
                  <div className={`rounded-lg p-3 text-xs border ${
                    budgetValidation.equilibre
                      ? "bg-success/5 border-success/30"
                      : budgetValidation.erreurs.length > 0
                        ? "bg-destructive/5 border-destructive/30"
                        : "bg-warning/5 border-warning/30"
                  }`}>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      {budgetValidation.equilibre ? (
                        <><Check className="h-3.5 w-3.5 text-success" /> <span className="text-success">Budget équilibré — Recettes = Dépenses</span></>
                      ) : budgetValidation.erreurs.length > 0 ? (
                        <><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> <span className="text-destructive">Blocage : {budgetValidation.erreurs[0]}</span></>
                      ) : (
                        <><Scale className="h-3.5 w-3.5 text-warning" /> <span className="text-warning">Budget déséquilibré (solde : {formatEuro(budgetValidation.solde)})</span></>
                      )}
                    </div>
                    <div className="flex gap-6 text-muted-foreground">
                      <span>Dépenses : <strong className="font-mono">{formatEuro(budgetValidation.totalDepenses)}</strong></span>
                      <span>Recettes : <strong className="font-mono">{formatEuro(budgetValidation.totalRecettes)}</strong></span>
                    </div>
                  </div>

                  {/* Point mort preview */}
                  {Number(form.nbEleves) > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                        🎯 Analyse rapide
                      </div>
                      <div className="text-muted-foreground">
                        Coût par élève : <span className="font-mono font-semibold text-foreground">
                          {formatEuro(budgetValidation.totalDepenses / Number(form.nbEleves))}
                        </span>
                        {Number(form.participationFamilles) > 0 && (
                          <> — Participation / élève : <span className="font-mono font-semibold text-foreground">
                            {formatEuro(Number(form.participationFamilles) / Number(form.nbEleves))}
                          </span></>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Observations</Label>
                <Textarea value={form.observations} onChange={e => update("observations", e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/30">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
            {step === 1 ? "Annuler" : "← Précédent"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continuer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={!canProceed()} className="gradient-primary border-0">
              <Check className="h-4 w-4 mr-1" /> Créer le voyage
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
