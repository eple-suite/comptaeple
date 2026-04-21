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
        toast.success(`${res.data.length} ligne(s) lue(s)`);
      },
      error: () => toast.error("Erreur de lecture du fichier"),
    });
  };

  const doImport = async () => {
    if (!selectedEstablishment || !user) return;
    setBusy(true);
    let created = 0, updated = 0, errors = 0;
    try {
      for (const r of rows) {
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
      toast.success(`Import : ${created} créé(s), ${updated} mis à jour, ${errors} erreur(s)`);
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
          <p className="text-xs text-muted-foreground">
            Colonnes attendues : <code>ine, nom, prenom, date_naissance, classe, niveau, voie, filiere, statut_boursier, echelon_bourse, demi_pensionnaire, interne, responsable1_nom, responsable1_prenom, responsable1_lien, responsable1_tel, responsable1_email</code>
          </p>
          <Input type="file" accept=".csv" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          <div className="flex items-center gap-2">
            <Switch checked={updateDoublons} onCheckedChange={setUpdateDoublons} />
            <Label>Mettre à jour les doublons (par INE)</Label>
          </div>

          {rows.length > 0 && (
            <>
              <p className="text-xs font-semibold">Aperçu (10 premières lignes sur {rows.length})</p>
              <div className="border rounded max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead><TableHead>Prénom</TableHead>
                      <TableHead>Classe</TableHead><TableHead>Voie</TableHead>
                      <TableHead>Boursier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.nom}</TableCell>
                        <TableCell>{r.prenom}</TableCell>
                        <TableCell>{r.classe}</TableCell>
                        <TableCell>{r.voie}</TableCell>
                        <TableCell>{r.statut_boursier === "true" || r.statut_boursier === "1" ? "Oui" : "Non"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={doImport} disabled={!rows.length || busy}>
              {busy ? "Import en cours…" : `Importer ${rows.length} élève(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}