import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CompteM96Combobox } from "@/components/CompteM96Combobox";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { useFamilles, useSeuilsCcp, useMarches, useCreateMarche } from "./hooks/useMarchesData";
import { determinerProcedure, formatEur } from "./lib/seuilsEngine";
import { evaluerFaisabilite } from "./lib/retroplanningEngine";
import { cumulMemeFamille } from "./lib/saucissonnageEngine";
import { suggererPreset } from "./lib/criteresPresets";
import { PROCEDURE_LABELS, TYPE_MARCHE_LABELS, TVA_GUADELOUPE, type MarcheWizardDraft, type CritereAttribution, nextReference } from "./types";

const DRAFT_KEY = "mp_wizard_draft_v1";
const STEPS = [
  "Besoin",
  "Estimation & procédure",
  "Planning",
  "Critères & lots",
  "Clauses obligatoires 2026",
  "Vérifications",
  "Génération",
];

export default function MarcheNouveau() {
  const navigate = useNavigate();
  const { data: familles = [] } = useFamilles();
  const { data: seuils = [] } = useSeuilsCcp();
  const { data: existingMarches = [] } = useMarches();
  const create = useCreateMarche();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<MarcheWizardDraft>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const today = new Date().toISOString().slice(0, 10);
    return {
      reference_interne: nextReference(new Date().getFullYear(), existingMarches.length),
      libelle: "",
      service_demandeur: "",
      demandeur: "",
      date_emission_besoin: today,
      date_engagement: today,
      type_marche: "fournitures",
      famille_code: "",
      description: "",
      taux_tva: 8.5,
      montant_estime_ht: 0,
      duree_mois: 12,
      reconductions_nb: 0,
      reconductions_duree_mois: 0,
      allotissement: true,
      criteres: [],
      methode_estimation: "devis",
      statut: "preparation",
      procedure_calculee: "dispense",
      checklist_validation: {},
      historique: [],
    };
  });

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, _step: step, _updated: Date.now() }));
  }, [d, step]);

  const upd = (patch: Partial<MarcheWizardDraft>) => setD((prev) => ({ ...prev, ...patch }));

  // Calculs dérivés
  const montantTotal = useMemo(() => {
    const base = Number(d.montant_estime_ht || 0);
    const dur = Number(d.duree_mois || 0);
    const recN = Number(d.reconductions_nb || 0);
    const recDur = Number(d.reconductions_duree_mois || 0);
    if (!dur) return base;
    const tauxMensuel = base / dur;
    return tauxMensuel * (dur + recN * recDur);
  }, [d.montant_estime_ht, d.duree_mois, d.reconductions_nb, d.reconductions_duree_mois]);

  const ttc = useMemo(() => Number(d.montant_estime_ht || 0) * (1 + Number(d.taux_tva || 0) / 100), [d.montant_estime_ht, d.taux_tva]);

  const cumulFamille = useMemo(
    () => (d.famille_code ? cumulMemeFamille(d.famille_code, existingMarches as any) : 0),
    [d.famille_code, existingMarches]
  );
  const cumulTotal = cumulFamille + montantTotal + Number(d.previsionnel_12m_suivants || 0);

  const proc = useMemo(
    () => determinerProcedure(seuils, d.date_engagement || new Date(), (d.type_marche as any) || "fournitures", cumulTotal),
    [seuils, d.date_engagement, d.type_marche, cumulTotal]
  );

  const faisab = useMemo(() => {
    if (!d.date_notification_cible) return null;
    return evaluerFaisabilite(proc.procedure, d.date_notification_cible);
  }, [proc.procedure, d.date_notification_cible]);

  const criteres = (d.criteres as CritereAttribution[]) || [];
  const sumPond = criteres.reduce((s, c) => s + Number(c.ponderation || 0), 0);

  const checklist = {
    besoin_clair: (d.description || "").length >= 200,
    estimation_sourcee: !!d.methode_estimation && Number(d.montant_estime_ht || 0) > 0,
    procedure_coherente: !!proc.seuil,
    saucissonnage_verifie: cumulTotal < (proc.seuil?.seuil_dispense || Infinity) || proc.procedure !== "dispense",
    retroplanning_realiste: faisab ? faisab.faisable : false,
    allotissement_documente: d.allotissement || (!!d.justification_lot_unique && d.justification_lot_unique.length > 30),
    criteres_100: sumPond === 100,
    clause_environnementale: !!(d.exigences_environnementales && d.exigences_environnementales.length >= 30),
    capacite_eco_conforme:
      !((d as any).plafond_ca_exige) ||
      Number((d as any).plafond_ca_exige) <= 1.5 * (Number(d.montant_estime_ht || 0) || 0),
    inscription_budgetaire: !!d.chapitre_budgetaire || !!d.compte_imputation,
    delegation_signature: true,
  };
  const allOk = Object.values(checklist).every(Boolean);

  const onCreate = async () => {
    try {
      const id = await create.mutateAsync({
        ...(d as any),
        montant_estime_ttc: ttc,
        montant_total_ht: montantTotal,
        cumul_meme_famille_12m: cumulFamille,
        cumul_total_12m: cumulTotal,
        procedure_calculee: proc.procedure,
        base_legale: proc.baseLegale,
        checklist_validation: checklist,
        historique: [{ date: new Date().toISOString(), user: "Création", action: "Marché créé via assistant" }],
      });
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Marché créé");
      navigate(`/marches/detail/${id}`);
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || ""));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Nouveau marché — Assistant guidé</h1>
        <p className="text-sm text-muted-foreground">Étape {step + 1} / {STEPS.length} — {STEPS[step]}</p>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-3 h-2" />
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Étape 1 — Expression du besoin</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Libellé court *</Label><Input value={d.libelle || ""} onChange={(e) => upd({ libelle: e.target.value })} placeholder="Ex. Voyage scolaire Espagne 2026" /></div>
              <div><Label>Référence interne</Label><Input value={d.reference_interne || ""} onChange={(e) => upd({ reference_interne: e.target.value })} /></div>
              <div><Label>Service demandeur</Label><Input value={d.service_demandeur || ""} onChange={(e) => upd({ service_demandeur: e.target.value })} placeholder="Intendance, Vie scolaire…" /></div>
              <div><Label>Demandeur (nom)</Label><Input value={d.demandeur || ""} onChange={(e) => upd({ demandeur: e.target.value })} /></div>
              <div><Label>Date d'émission du besoin *</Label><Input type="date" value={d.date_emission_besoin || ""} onChange={(e) => upd({ date_emission_besoin: e.target.value })} /></div>
              <div><Label>Date souhaitée de livraison / exécution</Label><Input type="date" value={d.date_livraison_souhaitee || ""} onChange={(e) => upd({ date_livraison_souhaitee: e.target.value })} /></div>
              <div>
                <Label>Type de marché *</Label>
                <Select value={d.type_marche} onValueChange={(v) => upd({ type_marche: v as any, famille_code: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_MARCHE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Famille d'achat *</Label>
                <Select value={d.famille_code || ""} onValueChange={(v) => upd({ famille_code: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir une famille" /></SelectTrigger>
                  <SelectContent>
                    {familles.filter(f => f.type_marche === d.type_marche).map(f => (
                      <SelectItem key={f.code} value={f.code}>{f.libelle} <span className="text-xs text-muted-foreground">({f.groupe})</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description détaillée du besoin (≥ 200 caractères) *</Label>
              <Textarea rows={5} value={d.description || ""} onChange={(e) => upd({ description: e.target.value })} placeholder="QUOI, COMBIEN, POUR QUI, AVEC QUELLES CARACTÉRISTIQUES…" />
              <p className="text-xs text-muted-foreground mt-1">{(d.description || "").length} caractères</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Quantités</Label><Textarea rows={3} value={d.quantites || ""} onChange={(e) => upd({ quantites: e.target.value })} /></div>
              <div><Label>Spécifications techniques</Label><Textarea rows={3} value={d.specifications || ""} onChange={(e) => upd({ specifications: e.target.value })} /></div>
              <div><Label>Contraintes particulières</Label><Textarea rows={3} value={d.contraintes || ""} onChange={(e) => upd({ contraintes: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Exigences environnementales (loi Climat — obligatoire) *</Label><Textarea rows={3} value={d.exigences_environnementales || ""} onChange={(e) => upd({ exigences_environnementales: e.target.value })} /></div>
              <div><Label>Clauses sociales</Label><Textarea rows={3} value={d.clauses_sociales || ""} onChange={(e) => upd({ clauses_sociales: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Étape 2 — Estimation et procédure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Méthode d'estimation</Label>
                <Select value={d.methode_estimation} onValueChange={(v) => upd({ methode_estimation: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devis">Devis obtenus</SelectItem>
                    <SelectItem value="catalogue">Catalogues fournisseurs</SelectItem>
                    <SelectItem value="anterieur">Marché similaire antérieur</SelectItem>
                    <SelectItem value="etude">Étude de prix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Montant estimé HT (€) *</Label><Input type="number" value={d.montant_estime_ht || 0} onChange={(e) => upd({ montant_estime_ht: parseFloat(e.target.value) || 0 })} /></div>
              <div>
                <Label>TVA</Label>
                <Select value={String(d.taux_tva)} onValueChange={(v) => upd({ taux_tva: parseFloat(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TVA_GUADELOUPE.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Durée du marché (mois)</Label><Input type="number" value={d.duree_mois || 0} onChange={(e) => upd({ duree_mois: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Nb reconductions (max 4 ans total)</Label><Input type="number" value={d.reconductions_nb || 0} onChange={(e) => upd({ reconductions_nb: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Durée d'une reconduction (mois)</Label><Input type="number" value={d.reconductions_duree_mois || 0} onChange={(e) => upd({ reconductions_duree_mois: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <Alert>
              <AlertTitle className="flex items-center justify-between">
                <span>Anti-saucissonnage — cumul 12 mois glissants</span>
                <Badge variant={cumulTotal >= (proc.seuil?.seuil_dispense || Infinity) ? "destructive" : "outline"}>
                  {formatEur(cumulTotal)}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-xs">
                Famille : {formatEur(cumulFamille)} déjà engagés • Présent besoin : {formatEur(montantTotal)} • Prévisionnel 12 mois : {formatEur(Number(d.previsionnel_12m_suivants || 0))}
              </AlertDescription>
              <div className="mt-2"><Label className="text-xs">Prévisionnel 12 mois suivants (même famille)</Label>
                <Input type="number" value={d.previsionnel_12m_suivants || 0} onChange={(e) => upd({ previsionnel_12m_suivants: parseFloat(e.target.value) || 0 })} />
              </div>
            </Alert>
            <Card className="border-2 border-primary/40 bg-primary/5">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between"><span className="text-sm">Montant total estimé (HT)</span><span className="font-bold tabular-nums">{formatEur(montantTotal)}</span></div>
                <div className="flex justify-between"><span className="text-sm">Cumul total 12 mois (anti-saucissonnage)</span><span className="font-bold tabular-nums">{formatEur(cumulTotal)}</span></div>
                <div className="flex justify-between items-center pt-2 border-t"><span className="text-sm font-medium">Procédure applicable</span><Badge className="text-sm">{PROCEDURE_LABELS[proc.procedure]}</Badge></div>
                <p className="text-xs text-muted-foreground">{proc.libelle} — base : {proc.baseLegale}</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Étape 3 — Planification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Date d'engagement de la consultation *</Label><Input type="date" value={d.date_engagement || ""} onChange={(e) => upd({ date_engagement: e.target.value })} /></div>
              <div><Label>Date de notification cible *</Label><Input type="date" value={d.date_notification_cible || ""} onChange={(e) => upd({ date_notification_cible: e.target.value })} /></div>
            </div>
            {faisab && (
              <Alert variant={faisab.faisable ? "default" : "destructive"}>
                <AlertTitle className="flex items-center gap-2">
                  {faisab.faisable ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {faisab.faisable ? "Délai compatible" : "Délai insuffisant"}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Disponibles : {faisab.joursDispo} jours • Minimum requis : {faisab.joursMin} jours pour la procédure {PROCEDURE_LABELS[proc.procedure]}.
                  {!faisab.faisable && ` Date réaliste minimale : ${faisab.dateMin}.`}
                </AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">Le rétroplanning détaillé sera généré automatiquement à la création du marché à partir de la date de notification cible.</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Étape 4 — Critères d'attribution & lots</span>
              <Button size="sm" variant="outline" onClick={() => {
                const preset = suggererPreset(d.type_marche as any, d.famille_code);
                upd({ criteres: preset.criteres });
                toast.success(`Préset appliqué : ${preset.label}`);
              }}>Suggérer un préset</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox id="allot" checked={d.allotissement ?? true} onCheckedChange={(c) => upd({ allotissement: !!c })} />
              <Label htmlFor="allot">Allotissement (règle — art. L2113-10 CCP)</Label>
            </div>
            {!d.allotissement && (
              <div><Label>Justification du lot unique *</Label><Textarea rows={3} value={d.justification_lot_unique || ""} onChange={(e) => upd({ justification_lot_unique: e.target.value })} /></div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Critères et pondérations</Label>
                <Badge variant={sumPond === 100 ? "outline" : "destructive"}>{sumPond} %</Badge>
              </div>
              {criteres.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="flex-1" value={c.libelle} onChange={(e) => {
                    const cp = [...criteres]; cp[i] = { ...cp[i], libelle: e.target.value }; upd({ criteres: cp });
                  }} />
                  <Input type="number" className="w-24" value={c.ponderation} onChange={(e) => {
                    const cp = [...criteres]; cp[i] = { ...cp[i], ponderation: parseFloat(e.target.value) || 0 }; upd({ criteres: cp });
                  }} />
                  <Button variant="ghost" size="sm" onClick={() => upd({ criteres: criteres.filter((_, j) => j !== i) })}>×</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => upd({ criteres: [...criteres, { libelle: "Nouveau critère", ponderation: 0 }] })}>+ Ajouter un critère</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Chapitre budgétaire</Label><Input value={d.chapitre_budgetaire || ""} onChange={(e) => upd({ chapitre_budgetaire: e.target.value })} /></div>
              <div><Label>Compte d'imputation</Label><CompteM96Combobox value={d.compte_imputation || ""} onChange={(v) => upd({ compte_imputation: v })} imputation="depenses" placeholder="ex. 2183, 6068…" /></div>
              <div><Label>Code activité</Label><Input value={d.code_activite || ""} onChange={(e) => upd({ code_activite: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Étape 5 — Clauses obligatoires 2026</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="destructive">BLOQUANT</Badge>
                <div className="flex-1">
                  <Label className="text-sm font-semibold">
                    Clause environnementale (loi Climat &amp; résilience — art. L2112-2 CCP)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Obligatoire pour tout marché passé depuis le 21/08/2026. Sélectionnez au moins un
                    levier et précisez la traduction opérationnelle (critère ou condition d&apos;exécution).
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  "Produits labellisés (Écolabel UE, NF Environnement)",
                  "Recyclabilité des emballages",
                  "Empreinte carbone (transport / production)",
                  "Circuit court de proximité",
                  "Réemploi / matériaux recyclés",
                  "Produits issus de l'agriculture biologique (denrées)",
                ].map((opt) => {
                  const sel: string[] = (d as any).leviers_environnementaux || [];
                  const checked = sel.includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c ? [...sel, opt] : sel.filter((x) => x !== opt);
                          upd({ ...({ leviers_environnementaux: next } as any) });
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              <div>
                <Label className="text-xs">Description précise et critère / condition d&apos;exécution (≥ 30 car.)</Label>
                <Textarea
                  rows={3}
                  value={d.exigences_environnementales || ""}
                  onChange={(e) => upd({ exigences_environnementales: e.target.value })}
                  placeholder="Ex. : tous les produits livrés porteront le label NF Environnement ou équivalent ; pénalité de 1% par fourniture non conforme."
                />
                <p className={`text-xs mt-1 ${checklist.clause_environnementale ? "text-emerald-700" : "text-amber-700"}`}>
                  {(d.exigences_environnementales || "").length} car. — minimum 30
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <Label className="text-sm font-semibold">
                Clause sociale (recommandée ; obligatoire au-delà du seuil européen)
              </Label>
              <p className="text-xs text-muted-foreground">
                Insertion (PLIE / IAE / ESS), entreprises adaptées (handicap), achat responsable.
              </p>
              <Textarea
                rows={3}
                value={d.clauses_sociales || ""}
                onChange={(e) => upd({ clauses_sociales: e.target.value })}
                placeholder="Ex. : 5% des heures d'exécution réservées à l'insertion via une SIAE."
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <Label className="text-sm font-semibold">
                Critères de sélection des candidatures (décret 2025-1383)
              </Label>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Capacités professionnelles exigées</Label>
                  <Textarea
                    rows={2}
                    value={(d as any).capacites_professionnelles || ""}
                    onChange={(e) => upd({ ...({ capacites_professionnelles: e.target.value } as any) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Capacités techniques exigées</Label>
                  <Textarea
                    rows={2}
                    value={(d as any).capacites_techniques || ""}
                    onChange={(e) => upd({ ...({ capacites_techniques: e.target.value } as any) })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">
                  Plafond de chiffre d&apos;affaires annuel exigé (€ HT) — max légal 1,5 × montant marché
                </Label>
                <Input
                  type="number"
                  value={(d as any).plafond_ca_exige || 0}
                  onChange={(e) =>
                    upd({ ...({ plafond_ca_exige: parseFloat(e.target.value) || 0 } as any) })
                  }
                />
                {!checklist.capacite_eco_conforme && (
                  <p className="text-xs text-destructive mt-1">
                    ⚠ Le plafond saisi dépasse 1,5 × {formatEur(Number(d.montant_estime_ht || 0))} ={" "}
                    {formatEur(1.5 * Number(d.montant_estime_ht || 0))} (décret 2025-1383). Bloquant.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Étape 6 — Vérifications préalables</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                ["besoin_clair", "Besoin clairement exprimé (≥ 200 caractères)"],
                ["estimation_sourcee", "Estimation financière sourcée"],
                ["procedure_coherente", "Seuils CCP identifiés et procédure choisie"],
                ["saucissonnage_verifie", "Anti-saucissonnage vérifié (cumul 12 mois)"],
                ["retroplanning_realiste", "Rétroplanning réaliste"],
                ["allotissement_documente", "Allotissement documenté (ou justification)"],
                ["criteres_100", "Critères d'attribution = 100 %"],
                ["clause_environnementale", "Clause environnementale décrite (≥ 30 car., loi Climat)"],
                ["capacite_eco_conforme", "Plafond de CA exigé ≤ 1,5 × montant marché (décret 2025-1383)"],
                ["inscription_budgetaire", "Inscription budgétaire identifiée"],
                ["delegation_signature", "Délégation de signature à jour"],
              ].map(([k, label]) => (
                <li key={k} className="flex items-center gap-2">
                  {(checklist as any)[k] ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  <span className={(checklist as any)[k] ? "" : "text-muted-foreground"}>{label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Étape 7 — Création du marché et génération du dossier</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Une fois créé, le marché apparaîtra dans la liste avec accès aux générations de pièces (RC, AE, CCAP, CCTP, fiche besoin, rapport d'analyse, décision d'attribution, lettres, PV de réception…) depuis sa fiche détail.</p>
            <Button onClick={onCreate} disabled={!allOk || create.isPending} size="lg" className="w-full">
              {create.isPending ? "Création…" : allOk ? "✓ Créer le marché" : "Toutes les vérifications doivent être OK"}
            </Button>
            {!allOk && <p className="text-xs text-amber-700">Revenez aux étapes 5/6 pour corriger les points manquants.</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast.success("Brouillon sauvegardé")}><Save className="h-4 w-4 mr-1" /> Sauvegarder</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Suivant <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
