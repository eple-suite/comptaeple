// ═══════════════════════════════════════════════════════════════
// Wizard nouvelle décision Fonds Social — 5 étapes
// 1) Élève  2) Type/Nature  3) Modalités  4) Imputation  5) Récap
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Info } from "lucide-react";
import { useEleves, useCommissions, useDecisions, useUpsertDecision } from "./useFsData";
import {
  buildNumeroDecision, currentAnneeScolaire, defaultTypeFondsForNature, CODE_ACTIVITE_DEFAULT,
  NATURE_AIDE_LABELS, NATURES_Q10,
  type FsDecision, type NatureAide, type TypeFonds, type ModaliteAttribution, type ModaliteVersement,
} from "./fsv2Types";
import { VoieBadge } from "./VoieBadge";
import {
  Q10_LIGNE_LABELS, evaluerCompletudeEleve,
  cumulAnnuelEleve, premiereAideAnnee,
} from "./fsEnqueteHelpers";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; }

const STEPS = ["Élève", "Type & Nature", "Modalités", "Imputation", "Récapitulatif"];

export function NouvelleDecisionWizard({ open, onClose }: Props) {
  const { data: eleves = [] } = useEleves();
  const { data: commissions = [] } = useCommissions();
  const { data: decisionsExist = [] } = useDecisions();
  const upsert = useUpsertDecision();

  const [step, setStep] = useState(0);
  const [eleveId, setEleveId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [typeFonds, setTypeFonds] = useState<TypeFonds>("FS");
  const [natureAide, setNatureAide] = useState<NatureAide>("restauration");
  const [montant, setMontant] = useState<number>(0);
  const [motif, setMotif] = useState("");
  const [modaliteAttribution, setModaliteAttribution] = useState<ModaliteAttribution>("commission");
  const [commissionId, setCommissionId] = useState<string | null>(null);
  const [modaliteVersement, setModaliteVersement] = useState<ModaliteVersement>("aide_directe");
  const [organismeNom, setOrganismeNom] = useState("");
  const [organismeSiret, setOrganismeSiret] = useState("");
  const [codeActivite, setCodeActivite] = useState<string>(CODE_ACTIVITE_DEFAULT.FS);
  const [compteImputation, setCompteImputation] = useState<string>("6571");
  const [dateDecision, setDateDecision] = useState<string>(new Date().toISOString().slice(0, 10));

  const annee = currentAnneeScolaire();

  const elevesFiltres = useMemo(() => {
    if (!search) return eleves.slice(0, 50);
    const q = search.toLowerCase();
    return eleves.filter(e =>
      `${e.nom} ${e.prenom} ${e.classe} ${e.ine ?? ""}`.toLowerCase().includes(q),
    ).slice(0, 50);
  }, [eleves, search]);

  const eleveSelectionne = eleves.find(e => e.id === eleveId);

  function handleNatureChange(n: NatureAide) {
    setNatureAide(n);
    const tf = defaultTypeFondsForNature(n);
    setTypeFonds(tf);
    setCodeActivite(CODE_ACTIVITE_DEFAULT[tf]);
  }

  function handleTypeFondsChange(tf: TypeFonds) {
    setTypeFonds(tf);
    setCodeActivite(CODE_ACTIVITE_DEFAULT[tf]);
  }

  function nextSeqForType(): number {
    const sameType = decisionsExist.filter(d => d.type_fonds === typeFonds && d.annee_scolaire === annee);
    return sameType.length + 1;
  }

  async function handleSave() {
    if (!eleveId) return toast.error("Sélectionnez un élève");
    if (montant <= 0) return toast.error("Le montant doit être > 0");
    if (modaliteAttribution === "commission" && !commissionId)
      return toast.error("Sélectionnez une commission ou choisissez Urgence");
    if (modaliteAttribution === "urgence" && !motif.trim())
      return toast.error("Le motif est obligatoire pour une aide d'urgence");
    if (modaliteVersement === "organisme_tiers" && (!organismeNom || !organismeSiret))
      return toast.error("Nom et SIRET de l'organisme tiers requis");

    const numero = buildNumeroDecision(typeFonds, annee, nextSeqForType());
    const payload: Partial<FsDecision> = {
      numero_decision: numero,
      eleve_id: eleveId,
      annee_scolaire: annee,
      type_fonds: typeFonds,
      nature_aide: natureAide,
      modalite_attribution: modaliteAttribution,
      commission_id: modaliteAttribution === "commission" ? commissionId : null,
      modalite_versement: modaliteVersement,
      organisme_tiers_nom: modaliteVersement === "organisme_tiers" ? organismeNom : null,
      organisme_tiers_siret: modaliteVersement === "organisme_tiers" ? organismeSiret : null,
      montant,
      code_activite_opale: codeActivite,
      compte_imputation_opale: compteImputation,
      date_decision: dateDecision,
      motif,
      pieces_justificatives_urls: [],
      statut: "brouillon",
    };
    try {
      await upsert.mutateAsync(payload);
      toast.success(`Décision ${numero} créée`);
      onClose(); reset();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  }

  function reset() {
    setStep(0); setEleveId(""); setSearch(""); setTypeFonds("FS");
    setNatureAide("restauration"); setMontant(0); setMotif("");
    setModaliteAttribution("commission"); setCommissionId(null);
    setModaliteVersement("aide_directe"); setOrganismeNom(""); setOrganismeSiret("");
    setCodeActivite(CODE_ACTIVITE_DEFAULT.FS); setCompteImputation("6571");
    setDateDecision(new Date().toISOString().slice(0, 10));
  }

  const canNext = () => {
    if (step === 0) return !!eleveId;
    if (step === 1) return montant > 0;
    if (step === 2) {
      if (modaliteAttribution === "commission" && !commissionId) return false;
      if (modaliteVersement === "organisme_tiers" && (!organismeNom || !organismeSiret)) return false;
      return true;
    }
    if (step === 3) return !!codeActivite;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle décision — Fonds Social</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 my-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "font-bold" : "text-muted-foreground"} hidden md:inline`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <Label>Rechercher un élève (nom, prénom, classe, INE)</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tapez pour rechercher…" />
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {elevesFiltres.length === 0 && <div className="p-4 text-sm text-muted-foreground">Aucun élève</div>}
              {elevesFiltres.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEleveId(e.id)}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${eleveId === e.id ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{e.nom} {e.prenom}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.classe} • {e.voie} {e.statut_boursier && <Badge variant="outline" className="ml-1 text-[9px]">Boursier éch. {e.echelon_bourse ?? "?"}</Badge>}
                      </div>
                    </div>
                    {eleveId === e.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Nature de l'aide</Label>
              <Select value={natureAide} onValueChange={(v) => handleNatureChange(v as NatureAide)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NATURES_Q10.map(n => <SelectItem key={n} value={n}>{NATURE_AIDE_LABELS[n]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de fonds</Label>
              <Select value={typeFonds} onValueChange={(v) => handleTypeFondsChange(v as TypeFonds)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FS">FS — Fonds social lycéen / collégien</SelectItem>
                  <SelectItem value="FSC">FSC — Fonds social pour les cantines</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Suggéré automatiquement selon la nature.</p>
            </div>
            <div>
              <Label>Montant (€)</Label>
              <Input type="number" min={0} step={0.01} value={montant || ""} onChange={e => setMontant(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Motif (obligatoire si urgence)</Label>
              <Textarea rows={3} value={motif} onChange={e => setMotif(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Modalité d'attribution</Label>
              <Select value={modaliteAttribution} onValueChange={(v) => setModaliteAttribution(v as ModaliteAttribution)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">Commission fonds social</SelectItem>
                  <SelectItem value="urgence">Urgence (chef d'établissement)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modaliteAttribution === "commission" && (
              <div>
                <Label>Commission</Label>
                <Select value={commissionId ?? ""} onValueChange={(v) => setCommissionId(v || null)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {commissions.filter(c => c.annee_scolaire === annee).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.date_commission} — {c.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {commissions.filter(c => c.annee_scolaire === annee).length === 0 && (
                  <p className="text-xs text-destructive mt-1">Aucune commission saisie pour {annee}. Créez-en une dans l'onglet Commissions.</p>
                )}
              </div>
            )}
            <div>
              <Label>Modalité de versement</Label>
              <Select value={modaliteVersement} onValueChange={(v) => setModaliteVersement(v as ModaliteVersement)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aide_directe">Aide directe à la famille</SelectItem>
                  <SelectItem value="organisme_tiers">Versement à un organisme tiers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modaliteVersement === "organisme_tiers" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nom organisme</Label>
                  <Input value={organismeNom} onChange={e => setOrganismeNom(e.target.value)} />
                </div>
                <div>
                  <Label>SIRET</Label>
                  <Input value={organismeSiret} onChange={e => setOrganismeSiret(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code activité Op@le</Label>
                <Input value={codeActivite} onChange={e => setCodeActivite(e.target.value)} />
              </div>
              <div>
                <Label>Compte d'imputation</Label>
                <Input value={compteImputation} onChange={e => setCompteImputation(e.target.value)} placeholder="ex: 6571" />
              </div>
            </div>
            <div>
              <Label>Date de décision</Label>
              <Input type="date" value={dateDecision} onChange={e => setDateDecision(e.target.value)} />
            </div>
          </div>
        )}

        {step === 4 && eleveSelectionne && (
          <div className="space-y-2 text-sm">
            <div className="font-bold text-base">Récapitulatif</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-4 border rounded-md bg-muted/30">
              <div className="text-muted-foreground">Bénéficiaire</div><div className="font-medium">{eleveSelectionne.nom} {eleveSelectionne.prenom} ({eleveSelectionne.classe})</div>
              <div className="text-muted-foreground">Type / Nature</div><div className="font-medium">{typeFonds} — {NATURE_AIDE_LABELS[natureAide]}</div>
              <div className="text-muted-foreground">Montant</div><div className="font-bold text-primary">{montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div>
              <div className="text-muted-foreground">Attribution</div><div className="font-medium">{modaliteAttribution}</div>
              <div className="text-muted-foreground">Versement</div><div className="font-medium">{modaliteVersement === "aide_directe" ? "Aide directe famille" : `Tiers : ${organismeNom}`}</div>
              <div className="text-muted-foreground">Imputation</div><div className="font-medium">{codeActivite} / {compteImputation}</div>
              <div className="text-muted-foreground">Date décision</div><div className="font-medium">{dateDecision}</div>
              <div className="text-muted-foreground">N° prévu</div><div className="font-medium">{buildNumeroDecision(typeFonds, annee, nextSeqForType())}</div>
            </div>
            <p className="text-xs text-muted-foreground">La décision sera enregistrée en statut « Brouillon ». Vous pourrez ensuite générer les PDFs et la mandater.</p>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {step > 0 ? "Précédent" : "Annuler"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Suivant <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Enregistrer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}