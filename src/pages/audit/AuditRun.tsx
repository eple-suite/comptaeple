import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, FileText, Lock, CheckCircle2, AlertTriangle,
  Activity, Map as MapIcon, ListChecks, Wand2, Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { DictationButton } from "@/components/DictationButton";
import {
  DOMAINES, controlesPourBudget, criticite, critMeta, scoreMission,
  cartographie, planActionsAuto, constatAuto, genererRapportAudit, genererLettreObservations,
  useAuditStore,
} from "@/lib/audit";
import type {
  ControleDef, ResultatControle, NiveauRisque, EtatAction, ActionPlan,
} from "@/lib/audit";

const RESULTAT_OPTIONS: { value: ResultatControle; label: string }[] = [
  { value: "non_evalue", label: "Non évalué" },
  { value: "conforme", label: "Conforme" },
  { value: "conforme_reserve", label: "Conforme avec réserve" },
  { value: "non_conforme", label: "Non conforme" },
  { value: "non_verifiable", label: "Non vérifiable" },
];

const PRIORITE_OPTIONS: { value: NiveauRisque; label: string }[] = [
  { value: "faible", label: "Faible" },
  { value: "moyen", label: "Moyen" },
  { value: "important", label: "Important" },
  { value: "critique", label: "Critique" },
];

const ETAT_OPTIONS: { value: EtatAction; label: string }[] = [
  { value: "a_faire", label: "À faire" },
  { value: "en_cours", label: "En cours" },
  { value: "fait", label: "Fait" },
  { value: "abandonne", label: "Abandonné" },
];

const AuditRun = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const missions = useAuditStore((s) => s.missions);
  const setControle = useAuditStore((s) => s.setControle);
  const setActions = useAuditStore((s) => s.setActions);
  const setStatut = useAuditStore((s) => s.setStatut);

  const mission = missions.find((m) => m.id === missionId);

  const score = useMemo(() => (mission ? scoreMission(mission) : null), [mission]);
  const carto = useMemo(() => (mission ? cartographie(mission) : []), [mission]);
  const controles = useMemo(
    () => (mission ? controlesPourBudget(mission.budgetType) : []),
    [mission],
  );

  if (!mission || !missionId || !score) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-warning" />
        <div>
          <h2 className="text-lg font-semibold">Mission d'audit introuvable</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cette mission n'existe pas ou a été supprimée.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/audit")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour aux audits
        </Button>
      </div>
    );
  }

  const cloturee = mission.statut === "cloturee" || mission.statut === "archivee";
  const critiques = score.parCriticite.critique;
  const anomalies = score.nonConformes + score.reserves;

  // ─── Domaines applicables, groupés ───
  const domainesApplicables = DOMAINES.filter((d) =>
    controles.some((ct) => ct.domaineId === d.id),
  );

  const patchControle = (ctrl: ControleDef, patch: Parameters<typeof setControle>[2]) =>
    setControle(missionId, ctrl.id, patch);

  const cloturer = () => {
    const signatureAuditeur = window.prompt("Signature de l'auditeur :", mission.signatureAuditeur ?? "");
    if (signatureAuditeur === null) return;
    const visaOrdonnateur = window.prompt("Visa de l'ordonnateur :", mission.visaOrdonnateur ?? "");
    if (visaOrdonnateur === null) return;
    setStatut(missionId, "cloturee", { auditeur: signatureAuditeur, visa: visaOrdonnateur });
  };

  const majAction = (id: string, patch: Partial<ActionPlan>) =>
    setActions(
      missionId,
      mission.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title={`Audit — ${mission.etablissementNom}`}
        description={`Budget ${mission.budgetType} · Campagne ${mission.campagne}`}
        showEstablishment={false}
        badge={{
          label: cloturee ? "Clôturée" : mission.statut === "en_cours" ? "En cours" : "Préparation",
          variant: cloturee ? "secondary" : "default",
        }}
      >
        <Button variant="outline" size="sm" onClick={() => navigate("/audit")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
        </Button>
        <Button variant="outline" size="sm" onClick={() => genererRapportAudit(mission)}>
          <FileText className="h-4 w-4 mr-1.5" /> Rapport PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => genererLettreObservations(mission)}>
          <FileText className="h-4 w-4 mr-1.5" /> Lettre d'observations
        </Button>
        <Button size="sm" onClick={cloturer} disabled={cloturee}>
          <Lock className="h-4 w-4 mr-1.5" /> Clôturer
        </Button>
      </PageHeader>

      {/* ─── Indicateurs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Taux de conformité"
          value={`${score.tauxConformite.toFixed(0)}%`}
          subtitle={`${score.conformes} conformes`}
          icon={ShieldCheck}
          variant={score.tauxConformite >= 90 ? "success" : score.tauxConformite >= 70 ? "warning" : "destructive"}
        />
        <KpiCard
          title="Avancement"
          value={`${score.progression.toFixed(0)}%`}
          subtitle={`${score.evalues} / ${score.total} contrôles`}
          icon={Activity}
          variant="primary"
        />
        <KpiCard
          title="Anomalies"
          value={`${anomalies}`}
          subtitle={`${score.nonConformes} NC · ${score.reserves} réserves`}
          icon={AlertTriangle}
          variant={anomalies > 0 ? "warning" : "success"}
        />
        <KpiCard
          title="Dont critiques"
          value={`${critiques}`}
          subtitle="anomalies critiques"
          icon={AlertTriangle}
          variant={critiques > 0 ? "destructive" : "success"}
        />
      </div>

      {/* ─── Cartographie des risques ─── */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapIcon className="h-4 w-4" /> Cartographie des risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {carto.map((e) => {
              const meta = critMeta(e.criticite);
              return (
                <div key={e.domaineId} className="rounded-lg border border-border p-3 flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">{meta.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{e.libelle}</p>
                    <p className={`text-[11px] ${meta.classe}`}>{meta.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {e.nbAnomalies} anomalie{e.nbAnomalies > 1 ? "s" : ""} / {e.nbControles}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Contrôles par domaine ─── */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Conduite des contrôles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {domainesApplicables.map((dom) => {
              const ctrls = controles.filter((ct) => ct.domaineId === dom.id);
              return (
                <AccordionItem key={dom.id} value={dom.id}>
                  <AccordionTrigger className="text-sm font-semibold">
                    {dom.libelle}
                    <Badge variant="outline" className="ml-2 text-[10px]">{ctrls.length}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {ctrls.map((ctrl) => {
                        const saisi = mission.controles[ctrl.id];
                        const resultat = saisi?.resultat ?? "non_evalue";
                        const obs = saisi?.observations;
                        const crit = critMeta(criticite(resultat, ctrl.risque));
                        return (
                          <motion.div
                            key={ctrl.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="rounded-xl border border-border p-4 space-y-3"
                          >
                            {/* Fiche métier */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-semibold">{ctrl.intitule}</h4>
                                  <span className="text-base leading-none" title={crit.label}>{crit.emoji}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{ctrl.sousDomaine}</p>
                              </div>
                            </div>

                            <p className="text-xs"><span className="font-medium">Objectif :</span> {ctrl.objectif}</p>

                            <div className="flex flex-wrap gap-1">
                              {ctrl.fondement.map((f) => (
                                <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                              ))}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2 text-xs">
                              <p>
                                <span className="font-medium">Risque :</span>{" "}
                                {PRIORITE_OPTIONS.find((o) => o.value === ctrl.risque)?.label}
                              </p>
                              <p>
                                <span className="font-medium">Documents attendus :</span>{" "}
                                {ctrl.documentsAttendus.join(", ")}
                              </p>
                            </div>
                            <p className="text-xs"><span className="font-medium">Méthode :</span> {ctrl.methode}</p>

                            <Separator />

                            {/* Saisie */}
                            <div className="grid sm:grid-cols-[200px_1fr] gap-3 items-start">
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Résultat</label>
                                <Select
                                  value={resultat}
                                  onValueChange={(v: ResultatControle) => patchControle(ctrl, { resultat: v })}
                                  disabled={cloturee}
                                >
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {RESULTAT_OPTIONS.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Observations</label>
                                <div className="flex gap-2 items-start">
                                  <Textarea
                                    value={obs ?? ""}
                                    onChange={(e) => patchControle(ctrl, { observations: e.target.value })}
                                    placeholder="Constats, échantillon, écarts…"
                                    className="text-xs min-h-[60px]"
                                    disabled={cloturee}
                                  />
                                  {!cloturee && (
                                    <DictationButton
                                      onAppend={(txt) =>
                                        patchControle(ctrl, { observations: (obs ? obs + " " : "") + txt })
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-muted-foreground">Recommandation</label>
                                {!cloturee && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => patchControle(ctrl, { recommandation: constatAuto(ctrl.id, resultat) })}
                                  >
                                    <Wand2 className="h-3.5 w-3.5 mr-1" /> Constat IA
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                value={saisi?.recommandation ?? ""}
                                onChange={(e) => patchControle(ctrl, { recommandation: e.target.value })}
                                placeholder="Recommandation / mise en conformité…"
                                className="text-xs min-h-[60px]"
                                disabled={cloturee}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* ─── Plan d'actions ─── */}
      <Card className="shadow-card">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" /> Plan d'actions
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setActions(missionId, planActionsAuto(mission))}
            disabled={cloturee}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1" /> Générer le plan d'actions
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {mission.actions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Aucune action. Générez le plan à partir des contrôles non conformes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[240px]">Libellé</TableHead>
                  <TableHead className="w-[160px]">Responsable</TableHead>
                  <TableHead className="w-[150px]">Échéance</TableHead>
                  <TableHead className="w-[140px]">Priorité</TableHead>
                  <TableHead className="w-[140px]">État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mission.actions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Input
                        value={a.libelle}
                        onChange={(e) => majAction(a.id, { libelle: e.target.value })}
                        className="h-8 text-xs"
                        disabled={cloturee}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={a.responsable ?? ""}
                        onChange={(e) => majAction(a.id, { responsable: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="—"
                        disabled={cloturee}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={a.echeance ?? ""}
                        onChange={(e) => majAction(a.id, { echeance: e.target.value })}
                        className="h-8 text-xs"
                        disabled={cloturee}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={a.priorite}
                        onValueChange={(v: NiveauRisque) => majAction(a.id, { priorite: v })}
                        disabled={cloturee}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={a.etat}
                        onValueChange={(v: EtatAction) => majAction(a.id, { etat: v })}
                        disabled={cloturee}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ETAT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {cloturee && (mission.signatureAuditeur || mission.visaOrdonnateur) && (
        <Card className="shadow-card">
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <p><CheckCircle2 className="h-4 w-4 inline mr-1 text-success" /><span className="font-medium">Auditeur :</span> {mission.signatureAuditeur || "—"}</p>
            <p><CheckCircle2 className="h-4 w-4 inline mr-1 text-success" /><span className="font-medium">Visa ordonnateur :</span> {mission.visaOrdonnateur || "—"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditRun;
