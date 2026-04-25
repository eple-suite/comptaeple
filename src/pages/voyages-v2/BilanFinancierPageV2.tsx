// ════════════════════════════════════════════════════════════════
// PAGE BILAN FINANCIER — Modèle Créteil (v2)
// ────────────────────────────────────────────────────────────────
// Route : /voyages-v2/bilan/:voyageId
// Référence : Vademecum Créteil + Circ. MENE2407159C + LF 66-948 art.21
//
// 6 parties :
//   1. Identification
//   2. Bilan pédagogique
//   3. Bilan financier détaillé (5 colonnes : Prévu / Réalisé / Écart / Just.)
//   4. Calcul résultat & règle 8 € (3 cas)
//   5. Documents générés automatiquement
//   6. Clôture comptable (checklist)
// ════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, ShieldAlert, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  evaluerBilan8Euros,
  type BilanCloture8EurResult,
  SEUIL_DON_TACITE_BILAN,
} from "./lib/regle8EurosBilan";
import { formatEuro } from "./lib/financialEngine";

interface VoyageRow {
  id: string;
  libelle: string;
  destination_ville: string;
  destination_pays: string;
  date_depart: string | null;
  date_retour: string | null;
  nb_eleves_prevus: number;
  nb_accompagnateurs_prevus: number;
  responsable_pedago_nom: string;
  lien_projet_etablissement: string;
  date_ca_autorisation: string | null;
  numero_acte_ca: string | null;
  establishment_id: string;
}

interface RecetteRow {
  id: string;
  libelle: string;
  nature: string;
  montant: number;
  statut_encaissement: string | null;
}
interface DepenseRow {
  id: string;
  poste: string;
  libelle: string;
  montant_ttc: number;
  statut_paiement: string | null;
}
interface ParticipantRow {
  id: string;
  ine: string | null;
  nom: string;
  prenom: string;
  participation_theorique: number;
  participation_reelle: number;
  reste_a_payer: number;
  statut_inscription: string;
}

interface BilanRow {
  id?: string;
  bilan_pedagogique: string;
  cloture: boolean;
  date_ca_bilan: string | null;
  numero_acte_ca_bilan: string | null;
  modalite_traitement: string | null;
}

const CHECKLIST_ITEMS = [
  { key: "titres_emis", label: "Tous titres recettes émis et encaissés (ou ANV)" },
  { key: "mandats_payes", label: "Tous mandats payés" },
  { key: "regie_soldee", label: "Régie soldée (encaisse + avance = 0)" },
  { key: "remboursements", label: "Remboursements familles effectués" },
  { key: "compte_equilibre", label: "Compte d'activité équilibré dans Op@le" },
  { key: "ca_vote", label: "Bilan présenté et voté en CA" },
  { key: "archive", label: "Dossier archivé (5 ans / 10 ans Erasmus+)" },
] as const;

export default function BilanFinancierPageV2() {
  const { voyageId } = useParams<{ voyageId: string }>();
  const navigate = useNavigate();

  const [voyage, setVoyage] = useState<VoyageRow | null>(null);
  const [recettes, setRecettes] = useState<RecetteRow[]>([]);
  const [depenses, setDepenses] = useState<DepenseRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [bilan, setBilan] = useState<BilanRow>({
    bilan_pedagogique: "",
    cloture: false,
    date_ca_bilan: null,
    numero_acte_ca_bilan: null,
    modalite_traitement: null,
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!voyageId) return;
    void (async () => {
      setLoading(true);
      const [v, r, d, p, b] = await Promise.all([
        supabase.from("vs_voyages").select("*").eq("id", voyageId).maybeSingle(),
        supabase.from("vs_recettes").select("*").eq("voyage_id", voyageId),
        supabase.from("vs_depenses").select("*").eq("voyage_id", voyageId),
        supabase.from("vs_participants").select("*").eq("voyage_id", voyageId),
        supabase.from("vs_bilans").select("*").eq("voyage_id", voyageId).maybeSingle(),
      ]);
      if (v.data) setVoyage(v.data as any);
      setRecettes((r.data || []) as any);
      setDepenses((d.data || []) as any);
      setParticipants((p.data || []) as any);
      if (b.data) {
        setBilan({
          id: (b.data as any).id,
          bilan_pedagogique: (b.data as any).bilan_pedagogique || "",
          cloture: !!(b.data as any).cloture,
          date_ca_bilan: (b.data as any).date_ca_bilan,
          numero_acte_ca_bilan: (b.data as any).numero_acte_ca_bilan,
          modalite_traitement: (b.data as any).modalite_traitement,
        });
      }
      setLoading(false);
    })();
  }, [voyageId]);

  // ─── Bilan financier détaillé (PARTIE 3) ────────────────────
  const lignesFinancieres = useMemo(() => {
    type Ligne = { type: "R" | "D"; poste: string; prevu: number; realise: number };
    const map = new Map<string, Ligne>();
    for (const r of recettes) {
      const k = `R::${r.nature}`;
      const cur = map.get(k) || { type: "R" as const, poste: r.nature, prevu: 0, realise: 0 };
      cur.realise += Number(r.montant) || 0;
      cur.prevu += Number(r.montant) || 0; // à défaut d'un champ "prévu" : on miroite
      map.set(k, cur);
    }
    for (const d of depenses) {
      const k = `D::${d.poste}`;
      const cur = map.get(k) || { type: "D" as const, poste: d.poste, prevu: 0, realise: 0 };
      cur.realise += Number(d.montant_ttc) || 0;
      cur.prevu += Number(d.montant_ttc) || 0;
      map.set(k, cur);
    }
    return Array.from(map.values());
  }, [recettes, depenses]);

  const totalRecettesReelles = useMemo(
    () => recettes.reduce((s, r) => s + (Number(r.montant) || 0), 0),
    [recettes],
  );
  const totalDepensesReelles = useMemo(
    () => depenses.reduce((s, d) => s + (Number(d.montant_ttc) || 0), 0),
    [depenses],
  );

  // ─── Règle 8 € post-bilan (PARTIE 4) ────────────────────────
  const resultBilan8: BilanCloture8EurResult = useMemo(() => {
    return evaluerBilan8Euros({
      recettes_reelles: totalRecettesReelles,
      depenses_reelles: totalDepensesReelles,
      participants: participants.map((p) => ({
        participant_id: p.id,
        ine: p.ine,
        nom: p.nom,
        prenom: p.prenom,
        paye: Number(p.participation_reelle) || 0,
        parti: p.statut_inscription !== "desiste",
      })),
    });
  }, [totalRecettesReelles, totalDepensesReelles, participants]);

  const sauvegarder = async () => {
    if (!voyageId) return;
    setSaving(true);
    const payload: any = {
      voyage_id: voyageId,
      bilan_pedagogique: bilan.bilan_pedagogique,
      cloture: bilan.cloture,
      date_ca_bilan: bilan.date_ca_bilan,
      numero_acte_ca_bilan: bilan.numero_acte_ca_bilan,
      modalite_traitement: resultBilan8.cas,
      recettes_realisees: totalRecettesReelles,
      depenses_realisees: totalDepensesReelles,
      resultat: resultBilan8.resultat,
      reliquat_par_famille: resultBilan8.reliquat_par_famille,
      nb_eleves_partis: resultBilan8.nb_eleves_payants,
    };
    if (bilan.id) payload.id = bilan.id;
    const { error } = await supabase
      .from("vs_bilans")
      .upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) toast.error("Échec sauvegarde bilan : " + error.message);
    else toast.success("Bilan enregistré");
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement du bilan…</div>;
  if (!voyage) return <div className="p-6 text-sm text-destructive">Voyage introuvable.</div>;

  const casBadge = {
    equilibre: { color: "bg-emerald-600 text-white", label: "ÉQUILIBRE", Icon: CheckCircle2 },
    excedent_remboursement: { color: "bg-orange-600 text-white", label: "EXCÉDENT > 8 € — REMBOURSEMENT", Icon: AlertTriangle },
    excedent_information: { color: "bg-amber-500 text-white", label: "EXCÉDENT ≤ 8 € — INFORMATION", Icon: Info },
    deficit: { color: "bg-destructive text-destructive-foreground", label: "DÉFICIT", Icon: ShieldAlert },
  }[resultBilan8.cas];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/voyages-v2")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voyages
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Bilan financier — Modèle Créteil</h1>
          <p className="text-muted-foreground text-sm">
            Voyage : <strong>{voyage.libelle}</strong> — {voyage.destination_ville} ({voyage.destination_pays})
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">v2 — 6 parties</Badge>
          <Badge variant="outline" className="bg-blue-50">Vademecum Créteil</Badge>
        </div>
      </div>

      {/* ═══ PARTIE 1 — IDENTIFICATION ═══════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partie 1 — Identification</CardTitle>
          <CardDescription>Récapitulatif administratif du voyage.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Field label="Libellé" value={voyage.libelle} />
          <Field label="Destination" value={`${voyage.destination_ville}, ${voyage.destination_pays}`} />
          <Field label="Dates" value={`${voyage.date_depart || "—"} → ${voyage.date_retour || "—"}`} />
          <Field label="Élèves prévus / partis" value={`${voyage.nb_eleves_prevus} / ${resultBilan8.nb_eleves_payants}`} />
          <Field label="Accompagnateurs" value={String(voyage.nb_accompagnateurs_prevus)} />
          <Field label="Responsable pédagogique" value={voyage.responsable_pedago_nom || "—"} />
          <Field label="Date CA autorisation" value={voyage.date_ca_autorisation || "—"} />
          <Field label="N° acte CA autorisation" value={voyage.numero_acte_ca || "—"} />
          <div className="md:col-span-2">
            <Label className="text-xs">Date & n° acte CA bilan</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="date"
                value={bilan.date_ca_bilan || ""}
                onChange={(e) => setBilan((b) => ({ ...b, date_ca_bilan: e.target.value || null }))}
              />
              <Input
                placeholder="N° acte CA"
                value={bilan.numero_acte_ca_bilan || ""}
                onChange={(e) => setBilan((b) => ({ ...b, numero_acte_ca_bilan: e.target.value || null }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ PARTIE 2 — BILAN PÉDAGOGIQUE ═══════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partie 2 — Bilan pédagogique</CardTitle>
          <CardDescription>Objectifs initiaux, réalisation, points forts/difficultés.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Lien au projet d'établissement (rappel wizard étape 1)</Label>
            <div className="text-sm border rounded p-2 bg-muted/30 mt-1">{voyage.lien_projet_etablissement || "—"}</div>
          </div>
          <div>
            <Label className="text-xs">Bilan rédigé (réalisation, productions élèves, évaluation)</Label>
            <Textarea
              rows={6}
              value={bilan.bilan_pedagogique}
              onChange={(e) => setBilan((b) => ({ ...b, bilan_pedagogique: e.target.value }))}
              placeholder="Réalisation effective, points forts, difficultés, productions, évaluation pédagogique…"
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══ PARTIE 3 — BILAN FINANCIER DÉTAILLÉ (5 colonnes) ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partie 3 — Bilan financier détaillé</CardTitle>
          <CardDescription>
            Tableau Recettes/Dépenses miroir du budget prévisionnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poste</TableHead>
                <TableHead className="text-right">Prévu au CA</TableHead>
                <TableHead className="text-right">Réalisé</TableHead>
                <TableHead className="text-right">Écart</TableHead>
                <TableHead>Justification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignesFinancieres.map((l, idx) => {
                const ecart = l.realise - l.prevu;
                return (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="mr-1">{l.type === "R" ? "RECETTE" : "DÉPENSE"}</Badge>
                      {l.poste}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatEuro(l.prevu)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatEuro(l.realise)}</TableCell>
                    <TableCell className={`text-right font-mono text-xs ${ecart === 0 ? "" : ecart > 0 ? "text-emerald-700" : "text-destructive"}`}>
                      {formatEuro(ecart)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">À justifier si écart {">"} 10 %</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold">
                <TableCell>Total Recettes réelles</TableCell>
                <TableCell colSpan={1} />
                <TableCell className="text-right font-mono">{formatEuro(totalRecettesReelles)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>Total Dépenses réelles</TableCell>
                <TableCell colSpan={1} />
                <TableCell className="text-right font-mono">{formatEuro(totalDepensesReelles)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══ PARTIE 4 — RÉSULTAT & RÈGLE 8 € ════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partie 4 — Calcul du résultat & règle des 8 €</CardTitle>
          <CardDescription>Loi de finances n° 66-948 du 22/12/1966 art. 21 — circulaire MENE2407159C.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Field label="Recettes réelles" value={formatEuro(totalRecettesReelles)} />
            <Field label="Dépenses réelles" value={formatEuro(totalDepensesReelles)} />
            <Field label="Résultat" value={formatEuro(resultBilan8.resultat)} />
            <Field
              label="Reliquat / famille"
              value={`${formatEuro(resultBilan8.reliquat_par_famille)} (sur ${resultBilan8.nb_eleves_payants})`}
            />
          </div>
          <Alert className="border-2">
            <casBadge.Icon className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              <Badge className={casBadge.color}>{casBadge.label}</Badge>
              <span className="text-xs text-muted-foreground">Seuil légal {SEUIL_DON_TACITE_BILAN} €</span>
            </AlertTitle>
            <AlertDescription className="space-y-1 mt-2 text-xs">
              <div>{resultBilan8.message_principal}</div>
              {resultBilan8.recommandation && (
                <div className="italic text-muted-foreground">→ {resultBilan8.recommandation}</div>
              )}
              <div className="text-[11px] text-muted-foreground">Réf. : {resultBilan8.reference_legale}</div>
            </AlertDescription>
          </Alert>

          {resultBilan8.cas === "excedent_remboursement" && (
            <div className="border rounded p-3 bg-orange-50/40">
              <div className="text-xs font-semibold mb-2">
                {resultBilan8.remboursements.length} courriers/mandats à émettre
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Famille</TableHead>
                    <TableHead>INE</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultBilan8.remboursements.slice(0, 50).map((r) => (
                    <TableRow key={r.participant_id}>
                      <TableCell className="text-xs">{r.nom} {r.prenom}</TableCell>
                      <TableCell className="text-[11px] font-mono">{r.ine || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatEuro(r.montant_a_rembourser)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {resultBilan8.cas === "excedent_information" && resultBilan8.coupons.length > 0 && (
            <div className="border rounded p-3 bg-amber-50/40">
              <div className="text-xs font-semibold mb-2">
                {resultBilan8.coupons.length} coupons à envoyer (3 options)
              </div>
              <div className="text-[11px] text-muted-foreground mb-2">
                Date envoi : {resultBilan8.coupons[0].date_envoi} — Délai réponse :{" "}
                {resultBilan8.coupons[0].date_limite_reponse}. Sans réponse → don tacite (C/7588).
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Famille</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Réponse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultBilan8.coupons.slice(0, 50).map((c) => (
                    <TableRow key={c.participant_id}>
                      <TableCell className="text-xs">{c.nom} {c.prenom}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatEuro(c.montant_concerne)}</TableCell>
                      <TableCell className="text-[11px]">{c.reponse || "(en attente)"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ PARTIE 5 — DOCUMENTS À GÉNÉRER ═════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partie 5 — Documents générés automatiquement</CardTitle>
          <CardDescription>
            La génération est exécutée depuis le tableau de bord Voyages, section « 32 documents ».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {resultBilan8.documents_a_generer.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[11px]">{d}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ═══ PARTIE 6 — CLÔTURE COMPTABLE ════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partie 6 — Clôture comptable</CardTitle>
          <CardDescription>Checklist de clôture avant archivage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={!!checklist[item.key]}
                onCheckedChange={(v) => setChecklist((c) => ({ ...c, [item.key]: v === true }))}
              />
              <span>{item.label}</span>
            </label>
          ))}
          <Separator className="my-3" />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={bilan.cloture}
              onCheckedChange={(v) => setBilan((b) => ({ ...b, cloture: v === true }))}
            />
            <span className="font-semibold">Voyage clôturé (verrouillage)</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={sauvegarder} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer le bilan"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}