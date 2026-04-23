// ═══════════════════════════════════════════════════════════════
// Import CSV d'élèves via Papaparse, avec preview et upsert par INE
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { currentAnneeScolaire, Voie } from "./fsv2Types";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}

type Row = Record<string, string>;

const VOIES_VALIDES: Voie[] = ["GT", "PRO", "1er_degre"];

function rowErrors(r: Row): string[] {
  const errs: string[] = [];
  if (!r.nom?.trim()) errs.push("nom");
  if (!r.prenom?.trim()) errs.push("prenom");
  if (!r.voie || !VOIES_VALIDES.includes(r.voie as Voie))
    errs.push("voie (GT/PRO/1er_degre obligatoire)");
  if (r.statut_boursier === undefined || r.statut_boursier === "")
    errs.push("statut_boursier (true/false)");
  const isBoursier = r.statut_boursier === "true" || r.statut_boursier === "1";
  if (isBoursier && (!r.echelon_bourse || isNaN(Number(r.echelon_bourse))))
    errs.push("echelon_bourse requis si boursier");
  return errs;
}

const CSV_TEMPLATE = [
  "voie,statut_boursier,echelon_bourse,ine,nom,prenom,date_naissance,classe,niveau,filiere,demi_pensionnaire,interne,responsable1_nom,responsable1_prenom,responsable1_lien,responsable1_tel,responsable1_email",
  "GT,true,3,123456789AA,Dupont,Marie,2008-05-12,2nde A,Seconde,STMG,true,false,Dupont,Sophie,mère,0612345678,sophie.dupont@example.com",
  "PRO,false,,,Martin,Léo,2007-09-03,Tle Bac Pro,Terminale,MELEC,true,false,Martin,Karim,père,,",
].join("\n");

export function EleveImportCsvDialog({ open, onOpenChange }: Props) {
  const { selectedEstablishment } = useEstablishment();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [updateDoublons, setUpdateDoublons] = useState(true);
  const [busy, setBusy] = useState(false);

  const onFile = (f: File) => {
    Papa.parse<Row>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data.filter(r => r.nom && r.prenom));
        const lignes = res.data.filter(r => r.nom && r.prenom);
        const ko = lignes.filter(r => rowErrors(r).length > 0).length;
        toast.success(`${lignes.length} ligne(s) lue(s) — ${ko} avec erreurs`);
      },
      error: () => toast.error("Erreur de lecture du fichier"),
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modele-import-eleves-fs.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const doImport = async () => {
    if (!selectedEstablishment || !user) return;
    setBusy(true);
    let created = 0, updated = 0, errors = 0, skipped = 0;
    try {
      for (const r of rows) {
        const errs = rowErrors(r);
        if (errs.length > 0) { skipped++; continue; }
        const payload: any = {
          establishment_id: selectedEstablishment.id,
          user_id: user.id,
          ine: r.ine || null,
          nom: r.nom,
          prenom: r.prenom,
          date_naissance: r.date_naissance || null,
          classe: r.classe || "",
          niveau: r.niveau || "",
          voie: ((r.voie as Voie) || "GT"),
          filiere: r.filiere || "",
          statut_boursier: r.statut_boursier === "true" || r.statut_boursier === "1",
          echelon_bourse: r.echelon_bourse ? Number(r.echelon_bourse) : null,
          demi_pensionnaire: r.demi_pensionnaire !== "false",
          interne: r.interne === "true" || r.interne === "1",
          annee_scolaire: r.annee_scolaire || currentAnneeScolaire(),
          responsables_legaux: r.responsable1_nom ? [{
            nom: r.responsable1_nom,
            prenom: r.responsable1_prenom || "",
            lien: r.responsable1_lien || "mère",
            telephone: r.responsable1_tel || "",
            email: r.responsable1_email || "",
          }] : [],
        };
        // Doublons par INE si présent
        if (r.ine && updateDoublons) {
          const { data: existing } = await supabase
            .from("fs_eleves").select("id").eq("establishment_id", selectedEstablishment.id).eq("ine", r.ine).maybeSingle();
          if (existing) {
            const { error } = await supabase.from("fs_eleves").update(payload).eq("id", existing.id);
            if (error) errors++; else updated++;
            continue;
          }
        }
        const { error } = await supabase.from("fs_eleves").insert(payload);
        if (error) errors++; else created++;
      }
      toast.success(`Import : ${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s) pour champs manquants, ${errors} erreur(s)`);
      qc.invalidateQueries({ queryKey: ["fs_eleves"] });
      onOpenChange(false);
      setRows([]);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des élèves (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs space-y-2">
            <p>
              <strong>Colonnes obligatoires pour l'enquête DGESCO</strong> :
              <code className="mx-1 font-bold text-primary">voie</code> (GT / PRO / 1er_degre),
              <code className="mx-1 font-bold text-primary">statut_boursier</code> (true/false),
              <code className="mx-1 font-bold text-primary">echelon_bourse</code> (si boursier).
            </p>
            <p className="text-muted-foreground">
              Colonnes additionnelles : ine, nom, prenom, date_naissance, classe, niveau, filiere,
              demi_pensionnaire, interne, responsable1_nom/prenom/lien/tel/email.
            </p>
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-1" /> Télécharger le modèle CSV
            </Button>
          </div>
          <Input type="file" accept=".csv" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          <div className="flex items-center gap-2">
            <Switch checked={updateDoublons} onCheckedChange={setUpdateDoublons} />
            <Label>Mettre à jour les doublons (par INE)</Label>
          </div>

          {rows.length > 0 && (
            <>
              <p className="text-xs font-semibold">
                Aperçu — {rows.filter(r => rowErrors(r).length === 0).length} valide(s),{" "}
                <span className="text-destructive">{rows.filter(r => rowErrors(r).length > 0).length} en erreur</span>{" "}
                (les lignes en erreur ne seront pas importées)
              </p>
              <div className="border rounded max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead><TableHead>Prénom</TableHead>
                      <TableHead>Classe</TableHead><TableHead>Voie</TableHead>
                      <TableHead>Boursier</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 20).map((r, i) => {
                      const errs = rowErrors(r);
                      return (
                        <TableRow key={i} className={errs.length > 0 ? "bg-destructive/5" : ""}>
                          <TableCell>{r.nom}</TableCell>
                          <TableCell>{r.prenom}</TableCell>
                          <TableCell>{r.classe}</TableCell>
                          <TableCell>{r.voie || <span className="text-destructive">—</span>}</TableCell>
                          <TableCell>{r.statut_boursier === "true" || r.statut_boursier === "1" ? "Oui" : r.statut_boursier === "false" || r.statut_boursier === "0" ? "Non" : <span className="text-destructive">?</span>}</TableCell>
                          <TableCell className="text-xs">
                            {errs.length === 0
                              ? <span className="text-success">OK</span>
                              : <span className="text-destructive inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errs.join(", ")}</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={doImport} disabled={!rows.length || busy}>
              {busy ? "Import en cours…" : `Importer ${rows.filter(r => rowErrors(r).length === 0).length} élève(s) valide(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}