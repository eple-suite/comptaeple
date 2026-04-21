import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText, User, Building2, FileCheck, ArrowRight, Check,
  Calendar, Banknote, CreditCard, Users, Building, Calculator,
  AlertTriangle, Info, CheckCircle, Download, Send, Sparkles, X,
} from "lucide-react";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { TiersDetenteur, TYPE_TIERS_LABELS, Satd, Creance, EtapeProcedure } from "./types";
import { BANQUES_COURANTES, NATURE_CREANCE_OPTIONS } from "./SatdReferenceData";
import { formatCurrency } from "@/lib/mockData";
import SatdCalculateur from "./SatdCalculateur";
import SatdAssistant from "./SatdAssistant";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiersDetenteurs: TiersDetenteur[];
  onCreated: (satd: Satd) => void;
  existingCount: number;
}

const STEPS = [
  { num: 1, label: "Créance", icon: FileText },
  { num: 2, label: "Débiteur", icon: User },
  { num: 3, label: "Tiers détenteur", icon: Building2 },
  { num: 4, label: "Récapitulatif", icon: FileCheck },
];

export default function SatdFormulaire({ open, onOpenChange, tiersDetenteurs, onCreated, existingCount }: Props) {
  const { selectedEstablishment } = useEstablishment();
  const [step, setStep] = useState(1);
  const [showCalc, setShowCalc] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantCtx, setAssistantCtx] = useState("creation_satd");

  const [form, setForm] = useState({
    // Créance
    reference: "",
    montant: "",
    nature: "",
    dateEmission: "",
    compte: "4112",
    libelle: "",
    exercice: String(new Date().getFullYear()),
    // Débiteur
    civilite: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    adresse: "",
    codePostal: "",
    ville: "",
    typeDebiteur: "eleve_famille" as Satd["typeDebiteur"],
    // Association débitrice
    associationSiret: "",
    associationRna: "",
    associationRepresentant: "",
    associationStatut: "active" as NonNullable<Satd["associationStatut"]>,
    // Tiers
    typeTiers: "",
    tiersDetenteurId: "",
    nomTiers: "",
    adresseTiers: "",
    cpTiers: "",
    villeTiers: "",
    // Divers
    motif: "",
    observations: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    const count = existingCount + 1;
    const ref = `SATD-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;
    const montant = Number(form.montant) || 0;
    const now = new Date().toISOString().split("T")[0];
    const prescription = new Date();
    prescription.setFullYear(prescription.getFullYear() + 4);

    const creance: Creance = {
      id: `cr${Date.now()}`,
      compte: form.compte,
      libelle: form.libelle || form.motif,
      exercice: Number(form.exercice),
      montantInitial: montant,
      montantRecouvre: 0,
      resteARecouvrer: montant,
    };

    const satd: Satd = {
      id: `s${Date.now()}`,
      reference: ref,
      debiteur: `${form.civilite} ${form.nom} ${form.prenom}`.trim(),
      debiteurAdresse: form.adresse,
      debiteurCP: form.codePostal,
      debiteurVille: form.ville,
      typeDebiteur: form.typeDebiteur,
      creances: [creance],
      montantTotal: montant,
      fraisPoursuite: 0,
      majorations: 0,
      montantGlobal: montant,
      tiersDetenteurId: form.tiersDetenteurId,
      tiersDetenteur: null,
      organisme: selectedEstablishment?.name || "Établissement",
      compteBudgetaire: form.compte === "421" ? "421000" : "411200",
      iban: "FR76 1007 1130 0000 0020 0390 156",
      bic: "TRPUFRP1",
      dateCreation: now,
      dateReception: "",
      dateEcheance: "",
      datePrescription: prescription.toISOString().split("T")[0],
      etapes: [{ type: "relance1", date: now, commentaire: "Première relance envoyée", documentGenere: true }],
      statut: "relance",
      montantPreleve: 0,
      prelevements: [],
      motif: form.motif,
      observations: form.observations,
      autorisationOrdonnateur: false,
      dateAutorisation: "",
      compte416: false,
    };

    onCreated(satd);
    onOpenChange(false);
    setStep(1);
    setForm({
      reference: "", montant: "", nature: "", dateEmission: "", compte: "4112", libelle: "",
      exercice: String(new Date().getFullYear()),
      civilite: "", nom: "", prenom: "", dateNaissance: "", lieuNaissance: "",
      adresse: "", codePostal: "", ville: "", typeDebiteur: "eleve_famille",
      typeTiers: "", tiersDetenteurId: "", nomTiers: "", adresseTiers: "", cpTiers: "", villeTiers: "",
      motif: "", observations: "",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Nouvelle procédure SATD
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setAssistantCtx("creation_satd"); setShowAssistant(true); }}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Aide
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCalc(true)}>
                  <Calculator className="h-3.5 w-3.5 mr-1" /> Quotité
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                    step === s.num ? "bg-primary text-primary-foreground" :
                    step > s.num ? "bg-success/20 text-success" :
                    "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => s.num < step && setStep(s.num)}
                >
                  {step > s.num ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.num ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Établissement lié */}
          {selectedEstablishment && (
            <div className="bg-muted/30 rounded-lg p-2 mb-4 flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{selectedEstablishment.name}</span>
              <Badge variant="outline" className="text-[9px]">{selectedEstablishment.uai}</Badge>
              {selectedEstablishment.opale_number && (
                <Badge variant="outline" className="text-[9px]">Op@le : {selectedEstablishment.opale_number}</Badge>
              )}
            </div>
          )}

          {/* Step 1: Créance */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Informations sur la créance</h3>
                <p className="text-xs text-muted-foreground">Identifiez la créance à recouvrer par voie forcée</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Référence du titre</Label><Input value={form.reference} onChange={e => update("reference", e.target.value)} placeholder="OR-2025-001234" /></div>
                <div><Label>Montant (€)</Label><Input type="number" value={form.montant} onChange={e => update("montant", e.target.value)} placeholder="450.00" /></div>
                <div><Label>Compte</Label>
                  <Select value={form.compte} onValueChange={v => update("compte", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4112">4112 — Familles</SelectItem>
                      <SelectItem value="4122">4122 — Commensaux</SelectItem>
                      <SelectItem value="416">416 — Créances douteuses</SelectItem>
                      <SelectItem value="421">421 — Agents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Nature</Label>
                  <Select value={form.nature} onValueChange={v => update("nature", v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {NATURE_CREANCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Libellé</Label><Input value={form.libelle} onChange={e => update("libelle", e.target.value)} placeholder="Restauration 2025 T1" /></div>
                <div><Label>Exercice</Label><Input value={form.exercice} onChange={e => update("exercice", e.target.value)} /></div>
                <div><Label>Date d'émission</Label><Input type="date" value={form.dateEmission} onChange={e => update("dateEmission", e.target.value)} /></div>
                <div><Label>Motif</Label><Input value={form.motif} onChange={e => update("motif", e.target.value)} placeholder="Impayés restauration 2025" /></div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Prérequis pour une SATD</p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      <li>• Le titre de recette doit être devenu exécutoire</li>
                      <li>• Les relances amiables doivent avoir été effectuées</li>
                      <li>• La créance ne doit pas être prescrite (4 ans)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Débiteur */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Informations sur le débiteur</h3>
                <p className="text-xs text-muted-foreground">Identité et coordonnées du redevable</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Civilité</Label>
                  <Select value={form.civilite} onValueChange={v => update("civilite", v)}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M.">Monsieur</SelectItem>
                      <SelectItem value="Mme">Madame</SelectItem>
                      <SelectItem value="M. et Mme">M. et Mme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Nom</Label><Input value={form.nom} onChange={e => update("nom", e.target.value)} placeholder="DUPONT" /></div>
                <div><Label>Prénom</Label><Input value={form.prenom} onChange={e => update("prenom", e.target.value)} placeholder="Jean" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date de naissance</Label><Input type="date" value={form.dateNaissance} onChange={e => update("dateNaissance", e.target.value)} /></div>
                <div><Label>Lieu de naissance</Label><Input value={form.lieuNaissance} onChange={e => update("lieuNaissance", e.target.value)} placeholder="Paris (75)" /></div>
              </div>
              <div><Label>Adresse</Label><Input value={form.adresse} onChange={e => update("adresse", e.target.value)} placeholder="15 rue des Flamboyants" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code postal</Label><Input value={form.codePostal} onChange={e => update("codePostal", e.target.value)} placeholder="97100" /></div>
                <div><Label>Ville</Label><Input value={form.ville} onChange={e => update("ville", e.target.value)} placeholder="Basse-Terre" /></div>
              </div>
              <div><Label>Type de débiteur</Label>
                <Select value={form.typeDebiteur} onValueChange={(v: any) => update("typeDebiteur", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eleve_famille">Famille d'élève</SelectItem>
                    <SelectItem value="agent">Agent de l'État</SelectItem>
                    <SelectItem value="fournisseur">Fournisseur</SelectItem>
                    <SelectItem value="usager">Usager du service public</SelectItem>
                    <SelectItem value="association">Association (loi 1901)</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Tiers détenteur */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Tiers détenteur</h3>
                <p className="text-xs text-muted-foreground">Organisme qui détient des fonds ou verse une rémunération au débiteur</p>
              </div>

              {/* Type de tiers - visual cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "banque", label: "Banque", icon: CreditCard, desc: "Compte bancaire" },
                  { value: "employeur", label: "Employeur", icon: Building2, desc: "Salaire" },
                  { value: "retraite", label: "Caisse retraite", icon: Users, desc: "Pension" },
                  { value: "caf", label: "CAF", icon: Building, desc: "Prestations" },
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => update("typeTiers", type.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      form.typeTiers === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <type.icon className={`h-5 w-5 ${form.typeTiers === type.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium mt-1">{type.label}</p>
                    <p className="text-[10px] text-muted-foreground">{type.desc}</p>
                  </button>
                ))}
              </div>

              {/* Sélection tiers existant ou nouveau */}
              <Separator />
              <div>
                <Label>Tiers détenteur existant</Label>
                <Select value={form.tiersDetenteurId} onValueChange={v => update("tiersDetenteurId", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un tiers..." /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {tiersDetenteurs
                      .filter(t => !form.typeTiers || t.type.includes(form.typeTiers))
                      .map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.nom} — {TYPE_TIERS_LABELS[t.type]}
                        </SelectItem>
                      ))}
                    {tiersDetenteurs.filter(t => !form.typeTiers || t.type.includes(form.typeTiers)).length === 0 && (
                      <SelectItem value="" disabled>Aucun tiers correspondant</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {form.typeTiers === "banque" && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Attention — Compte bancaire</p>
                      <p className="text-muted-foreground mt-0.5">La SATD sur compte bancaire bloque TOUS les comptes pendant 15 jours. Privilégiez si possible la SATD sur salaire/pension.</p>
                    </div>
                  </div>
                </div>
              )}

              {form.typeTiers === "employeur" && (
                <Button size="sm" variant="ghost" onClick={() => setShowCalc(true)}>
                  <Calculator className="h-3.5 w-3.5 mr-1" /> Calculer la quotité saisissable
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Récapitulatif */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Récapitulatif — Vérification</h3>
                <p className="text-xs text-muted-foreground">Vérifiez les informations avant de créer la procédure</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="pt-3 pb-3">
                  <p className="text-[10px] text-muted-foreground">Créance</p>
                  <p className="text-sm font-semibold">{form.reference || "—"}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(Number(form.montant) || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">{form.nature}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-3 pb-3">
                  <p className="text-[10px] text-muted-foreground">Débiteur</p>
                  <p className="text-sm font-semibold">{form.civilite} {form.nom} {form.prenom}</p>
                  <p className="text-[10px] text-muted-foreground">{form.codePostal} {form.ville}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-3 pb-3">
                  <p className="text-[10px] text-muted-foreground">Tiers détenteur</p>
                  <p className="text-sm font-semibold">
                    {tiersDetenteurs.find(t => t.id === form.tiersDetenteurId)?.nom || form.nomTiers || "—"}
                  </p>
                  <Badge variant="outline" className="text-[9px] mt-1">{form.typeTiers || "—"}</Badge>
                </CardContent></Card>
              </div>

              {/* Documents à générer */}
              <div className="space-y-2">
                <p className="text-xs font-semibold">Documents générés automatiquement</p>
                {[
                  { label: "SATD — Notification au tiers détenteur", required: true },
                  { label: "SATD — Notification au débiteur", required: true },
                  { label: "Bordereau récapitulatif", required: true },
                  { label: "Demande FICOBA (si nécessaire)", required: false },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{doc.label}</span>
                      {doc.required && <Badge variant="secondary" className="text-[8px]">Obligatoire</Badge>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-xs">
                <div className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-success">Prêt pour l'enregistrement</p>
                    <p className="text-muted-foreground mt-0.5">
                      Conforme à la circulaire DAF du 6 octobre 2020. L'établissement sera lié automatiquement : {selectedEstablishment?.name || "—"}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
              {step === 1 ? "Annuler" : "Précédent"}
            </Button>
            <div className="flex gap-2">
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} className="gradient-primary border-0">
                  Continuer <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gradient-primary border-0" disabled={!form.nom || !form.montant}>
                  <Send className="h-4 w-4 mr-1" /> Créer la procédure
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SatdCalculateur open={showCalc} onOpenChange={setShowCalc} />
      <SatdAssistant open={showAssistant} onOpenChange={setShowAssistant} context={assistantCtx} />
    </>
  );
}
