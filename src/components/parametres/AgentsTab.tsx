import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Search, Upload, Plus, FileDown, History, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";
import { validateAgent, ValidationIssue, hasBlockingIssues } from "@/lib/parametres/validations";
import { downloadCsvTemplate, buildPreview, ImportPreview, getDedupKey } from "@/lib/parametres/csvImport";

interface AgentRow {
  id: string;
  nom: string;
  prenom: string;
  corps: string | null;
  grade: string | null;
  role_principal: string | null;
  fonction: string | null;
  statut: string | null;
  date_entree_etablissement: string | null;
  actif: boolean;
  email_professionnel?: string | null;
  telephone_professionnel?: string | null;
  date_naissance?: string | null;
  echelon?: number | null;
  indice_majore?: number | null;
  quotite_travail?: number | null;
  roles_secondaires?: string[] | null;
  administration_origine?: string | null;
  establishment_id: string;
  photo_url?: string | null;
  matricule_education_nationale?: string | null;
  notes_rh?: string | null;
}

const ROLE_OPTIONS = [
  "ac","fp","ordonnateur","ordonnateur_suppleant","sg","adjoint_gestionnaire","assistant_gestion",
  "regisseur_recettes","regisseur_avances","suppleant_regie","magasinier","chef_cuisine",
  "secretaire_intendance","gestionnaire_materiel","responsable_cfa","responsable_greta",
  "correspondant_cicf","archiviste_comptable","autre",
];

const STATUT_OPTIONS = ["titulaire","stagiaire","contractuel_cdd","contractuel_cdi","detache_entrant","detache_sortant","mis_a_disposition"];

export default function AgentsTab() {
  const { selectedEstablishment } = useEstablishment();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterActif, setFilterActif] = useState<string>("actif");
  const [openCreate, setOpenCreate] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openEdit, setOpenEdit] = useState<AgentRow | null>(null);

  async function load() {
    if (!selectedEstablishment) { setAgents([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("establishment_id", selectedEstablishment.id)
      .order("nom");
    if (error) toast.error(error.message);
    else setAgents((data ?? []) as AgentRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedEstablishment?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (filterActif === "actif" && !a.actif) return false;
      if (filterActif === "inactif" && a.actif) return false;
      if (filterRole !== "all" && a.role_principal !== filterRole) return false;
      if (filterStatut !== "all" && a.statut !== filterStatut) return false;
      if (q) {
        const blob = `${a.nom} ${a.prenom} ${a.corps ?? ""} ${a.role_principal ?? ""} ${a.fonction ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [agents, search, filterRole, filterStatut, filterActif]);

  // Validations agrégées (alertes globales)
  const allIssues = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    for (const a of agents) map.set(a.id, validateAgent(a));
    return map;
  }, [agents]);

  const errorsCount = Array.from(allIssues.values()).flat().filter((i) => i.severity === "error").length;
  const warningsCount = Array.from(allIssues.values()).flat().filter((i) => i.severity === "warning").length;

  if (!selectedEstablishment) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Sélectionnez d'abord un établissement.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Bandeau alertes */}
      {(errorsCount > 0 || warningsCount > 0) && (
        <Card className={errorsCount > 0 ? "border-destructive/50 bg-destructive/5" : "border-amber-300 bg-amber-50"}>
          <CardContent className="p-3 flex items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span><strong>{errorsCount}</strong> erreur(s) bloquantes — <strong>{warningsCount}</strong> alerte(s) de complétude</span>
            <Badge variant="outline" className="ml-auto">Réf. GBCP / instr. 06-031-A-B-M</Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg flex-row items-center justify-between gap-3">
          <CardTitle className="text-white text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Agents BIATSS — {selectedEstablishment.name}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadCsvTemplate("agents")}><FileDown className="h-3.5 w-3.5 mr-1" />Modèle CSV</Button>
            <Button size="sm" variant="secondary" onClick={() => setOpenImport(true)}><Upload className="h-3.5 w-3.5 mr-1" />Importer</Button>
            <Button size="sm" onClick={() => setOpenCreate(true)}><Plus className="h-3.5 w-3.5 mr-1" />Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recherche nom, prénom, corps, rôle…" className="pl-8" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous rôles</SelectItem>{ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 text-xs">
            <Button variant={filterActif === "actif" ? "default" : "outline"} size="sm" onClick={() => setFilterActif("actif")}>Actifs</Button>
            <Button variant={filterActif === "inactif" ? "default" : "outline"} size="sm" onClick={() => setFilterActif("inactif")}>Inactifs</Button>
            <Button variant={filterActif === "tous" ? "default" : "outline"} size="sm" onClick={() => setFilterActif("tous")}>Tous</Button>
            <span className="ml-auto text-muted-foreground self-center">{filtered.length} / {agents.length}</span>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Corps / Grade</TableHead>
                  <TableHead>Rôle principal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prise fonction</TableHead>
                  <TableHead className="text-right">Validations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground p-6">Chargement…</TableCell></TableRow>}
                {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground p-6">Aucun agent — utilisez « Ajouter » ou « Importer ».</TableCell></TableRow>}
                {filtered.map((a) => {
                  const issues = allIssues.get(a.id) ?? [];
                  const hasErr = hasBlockingIssues(issues);
                  return (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setOpenEdit(a)}>
                      <TableCell>
                        <div className="font-semibold text-sm">{a.prenom} {a.nom}</div>
                        <div className="text-[11px] text-muted-foreground">{a.email_professionnel ?? "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs">{a.corps ?? "—"}<br/>{a.grade ?? ""}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline">{a.role_principal ?? "—"}</Badge></TableCell>
                      <TableCell className="text-xs">{a.statut ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.date_entree_etablissement ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {issues.length === 0 ? (
                          <Badge className="bg-emerald-600 text-white">OK</Badge>
                        ) : hasErr ? (
                          <Badge variant="destructive">{issues.filter((i) => i.severity === "error").length} bloquant(s)</Badge>
                        ) : (
                          <Badge className="bg-amber-500 text-white">{issues.length} alerte(s)</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AgentEditDialog
        open={openCreate || openEdit != null}
        onClose={() => { setOpenCreate(false); setOpenEdit(null); load(); }}
        agent={openEdit}
        establishmentId={selectedEstablishment.id}
      />

      <ImportAgentsDialog open={openImport} onClose={() => { setOpenImport(false); load(); }} establishmentId={selectedEstablishment.id} />
    </div>
  );
}

/* ───────────────────────── DIALOG ÉDITION/CRÉATION ───────────────────── */

function AgentEditDialog({ open, onClose, agent, establishmentId }: { open: boolean; onClose: () => void; agent: AgentRow | null; establishmentId: string }) {
  const [form, setForm] = useState<Partial<AgentRow>>({});
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(agent ?? { actif: true, statut: "titulaire", establishment_id: establishmentId });
      setIssues(agent ? validateAgent(agent) : []);
    }
  }, [open, agent, establishmentId]);

  function update(patch: Partial<AgentRow>) {
    const next = { ...form, ...patch };
    setForm(next);
    setIssues(validateAgent(next as any));
  }

  async function save() {
    if (!form.nom || !form.prenom) {
      toast.error("Nom et prénom obligatoires");
      return;
    }
    if (hasBlockingIssues(issues)) {
      toast.error("Validations bloquantes — corrigez les erreurs avant de sauvegarder");
      return;
    }
    setSaving(true);
    try {
      // Snapshot historique si update
      if (agent?.id) {
        await supabase.from("historique_fonctions").insert({
          agent_id: agent.id,
          establishment_id: establishmentId,
          role: agent.role_principal,
          motif_changement: "modification",
          payload_avant: agent as any,
          payload_apres: form as any,
        });
      }
      const payload: any = { ...form, establishment_id: establishmentId };
      const { error } = agent?.id
        ? await supabase.from("agents").update(payload).eq("id", agent.id)
        : await supabase.from("agents").insert(payload);
      if (error) throw error;
      toast.success(agent?.id ? "Agent mis à jour (historique archivé)" : "Agent créé");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{agent ? `Modifier — ${agent.prenom} ${agent.nom}` : "Nouvel agent"}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          {/* Identité */}
          <Section title="① Identité civile">
            <Grid>
              <Field label="Civilité"><Select value={form.civilite as any ?? ""} onValueChange={(v) => update({ civilite: v as any })}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="mme">Mme</SelectItem><SelectItem value="m">M.</SelectItem></SelectContent></Select></Field>
              <Field label="Nom*"><Input value={form.nom ?? ""} onChange={(e) => update({ nom: e.target.value })} /></Field>
              <Field label="Prénom*"><Input value={form.prenom ?? ""} onChange={(e) => update({ prenom: e.target.value })} /></Field>
              <Field label="Date naissance"><Input type="date" value={form.date_naissance ?? ""} onChange={(e) => update({ date_naissance: e.target.value })} /></Field>
              <Field label="Matricule EN"><Input value={form.matricule_education_nationale ?? ""} onChange={(e) => update({ matricule_education_nationale: e.target.value })} /></Field>
            </Grid>
          </Section>

          {/* Statut */}
          <Section title="② Statut administratif">
            <Grid>
              <Field label="Statut"><Select value={form.statut ?? ""} onValueChange={(v) => update({ statut: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Corps"><Input value={form.corps ?? ""} onChange={(e) => update({ corps: e.target.value })} /></Field>
              <Field label="Grade"><Input value={form.grade ?? ""} onChange={(e) => update({ grade: e.target.value })} /></Field>
              <Field label="Échelon"><Input type="number" value={form.echelon ?? ""} onChange={(e) => update({ echelon: e.target.value ? parseInt(e.target.value) : null })} /></Field>
              <Field label="Indice majoré"><Input type="number" value={form.indice_majore ?? ""} onChange={(e) => update({ indice_majore: e.target.value ? parseInt(e.target.value) : null })} /></Field>
              <Field label="Quotité (%)"><Input type="number" value={form.quotite_travail ?? ""} onChange={(e) => update({ quotite_travail: e.target.value ? parseFloat(e.target.value) : null })} /></Field>
              <Field label="Adm. origine (détaché)"><Input value={form.administration_origine ?? ""} onChange={(e) => update({ administration_origine: e.target.value })} /></Field>
            </Grid>
          </Section>

          {/* Affectation */}
          <Section title="③ Affectation et rôle">
            <Grid>
              <Field label="Rôle principal"><Select value={form.role_principal ?? ""} onValueChange={(v) => update({ role_principal: v as any })}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Fonction (libellé)"><Input value={form.fonction ?? ""} onChange={(e) => update({ fonction: e.target.value })} /></Field>
              <Field label="Date prise fonction"><Input type="date" value={form.date_entree_etablissement ?? ""} onChange={(e) => update({ date_entree_etablissement: e.target.value })} /></Field>
            </Grid>
          </Section>

          {/* Coordonnées */}
          <Section title="④ Coordonnées professionnelles">
            <Grid>
              <Field label="Email pro"><Input value={form.email_professionnel ?? ""} onChange={(e) => update({ email_professionnel: e.target.value })} /></Field>
              <Field label="Téléphone pro"><Input value={form.telephone_professionnel ?? ""} onChange={(e) => update({ telephone_professionnel: e.target.value })} /></Field>
            </Grid>
          </Section>

          {/* Validations */}
          {issues.length > 0 && (
            <Card className={issues.some((i) => i.severity === "error") ? "border-destructive/40 bg-destructive/5" : "border-amber-300 bg-amber-50"}>
              <CardContent className="p-3 space-y-1 text-xs">
                <div className="font-semibold">Validations métier</div>
                {issues.map((i, idx) => (
                  <div key={idx} className="flex gap-2"><span>{i.severity === "error" ? "🔴" : "🟠"}</span><span>{i.message}{i.reference ? ` (${i.reference})` : ""}</span></div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={save} disabled={saving || hasBlockingIssues(issues)}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-primary font-bold mb-2">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</label><div className="mt-1">{children}</div></div>;
}

/* ───────────────────────── DIALOG IMPORT CSV ─────────────────────────── */

function ImportAgentsDialog({ open, onClose, establishmentId }: { open: boolean; onClose: () => void; establishmentId: string }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const p = buildPreview(text, "agents");
    setPreview(p);
    // parse all rows
    const lines = text.split(/\r?\n/).filter((l) => l.length);
    const headers = lines[0].split(p.detectedDelimiter).map((h) => h.trim());
    const all = lines.slice(1).map((l) => {
      const v = l.split(p.detectedDelimiter);
      const r: any = {};
      headers.forEach((h, i) => (r[h] = (v[i] ?? "").trim()));
      return r;
    });
    setRawRows(all);
  }

  async function runImport(dryRun: boolean) {
    if (!preview) return;
    setRunning(true);
    let created = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    // map source -> target
    const map = preview.mapping;
    for (let i = 0; i < rawRows.length; i++) {
      const src = rawRows[i];
      const target: any = { establishment_id: establishmentId };
      for (const [srcCol, tgtField] of Object.entries(map)) {
        if (tgtField && src[srcCol] != null && src[srcCol] !== "") target[tgtField] = src[srcCol];
      }
      if (!target.nom || !target.prenom) { skipped++; continue; }
      const dedup = getDedupKey("agents", target);
      try {
        if (dryRun) { created++; continue; }
        if (dedup?.startsWith("mat:")) {
          const mat = dedup.slice(4);
          const { data: existing } = await supabase
            .from("agents")
            .select("id")
            .eq("matricule_education_nationale", mat)
            .eq("establishment_id", establishmentId)
            .maybeSingle();
          if (existing) {
            await supabase.from("agents").update(target).eq("id", existing.id);
            updated++;
          } else {
            await supabase.from("agents").insert(target);
            created++;
          }
        } else {
          await supabase.from("agents").insert(target);
          created++;
        }
      } catch (e: any) {
        errors.push(`Ligne ${i + 2} : ${e.message}`);
      }
    }
    setReport(`Lignes : ${rawRows.length} • Créés : ${created} • Mis à jour : ${updated} • Ignorés : ${skipped} • Erreurs : ${errors.length}\n${errors.slice(0, 10).join("\n")}`);
    setRunning(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Importer des agents (CSV)</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">Format : CSV (séparateur ; ou , détecté automatiquement). Colonnes courantes mappées intelligemment (nom, prénom, matricule, corps, grade, …).</p>
          <Input type="file" accept=".csv,.txt" onChange={onFile} />
          {preview && (
            <div className="space-y-2">
              <div className="text-xs"><strong>Délimiteur :</strong> « {preview.detectedDelimiter} » • <strong>Encodage :</strong> {preview.detectedEncoding} • <strong>Colonnes :</strong> {preview.headers.length}</div>
              <div className="border rounded-md p-2 max-h-48 overflow-auto">
                <table className="text-xs w-full">
                  <thead><tr>{preview.headers.map((h) => <th key={h} className="text-left p-1 border-b">{h}<div className="text-[10px] font-normal text-emerald-700">→ {preview.mapping[h] ?? "(ignoré)"}</div></th>)}</tr></thead>
                  <tbody>{preview.rows.map((r, i) => <tr key={i}>{preview.headers.map((h) => <td key={h} className="p-1 border-b text-muted-foreground">{r[h]}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => runImport(true)} disabled={running}>Aperçu (dry-run)</Button>
                <Button onClick={() => runImport(false)} disabled={running}>Importer</Button>
              </div>
            </div>
          )}
          {report && <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md">{report}</pre>}
        </div>
      </DialogContent>
    </Dialog>
  );
}