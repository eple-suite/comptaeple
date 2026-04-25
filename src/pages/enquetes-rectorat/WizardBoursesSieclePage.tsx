import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { GraduationCap, Upload, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { generateEnquetePdf, downloadPdf } from "@/lib/enquetes-rectorat/pdfExport";
import { toast } from "sonner";

interface LigneSiecle {
  ine: string;
  nom: string;
  prenom: string;
  echelon: number;
  montantTrim: number;
}

interface LignePaiement {
  ine: string;
  montant: number;
}

interface LigneRapprochement {
  ine: string;
  nom: string;
  attendu: number;
  paye: number;
  ecart: number;
  statut: "ok" | "ecart_montant" | "manquant_opale" | "manquant_siecle";
}

function parseCSV(text: string): string[][] {
  return text.trim().split(/\r?\n/).map((l) => l.split(/[;,\t]/));
}

export default function WizardBoursesSieclePage() {
  const [siecle, setSiecle] = useState<LigneSiecle[]>([]);
  const [opale, setOpale] = useState<LignePaiement[]>([]);
  const [trimestre, setTrimestre] = useState("T1");
  const [exercice, setExercice] = useState(new Date().getFullYear().toString());

  async function loadFile(e: React.ChangeEvent<HTMLInputElement>, kind: "siecle" | "opale") {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const rows = parseCSV(text);
    const headerSkipped = rows.slice(rows[0]?.[0]?.toLowerCase().includes("ine") ? 1 : 0);
    if (kind === "siecle") {
      const lignes: LigneSiecle[] = headerSkipped.map((r) => ({
        ine: (r[0] ?? "").trim(),
        nom: (r[1] ?? "").trim(),
        prenom: (r[2] ?? "").trim(),
        echelon: parseInt(r[3] ?? "0", 10) || 0,
        montantTrim: parseFloat((r[4] ?? "0").replace(",", ".")) || 0,
      })).filter((l) => l.ine);
      setSiecle(lignes);
      toast.success(`SIECLE : ${lignes.length} boursiers importés`);
    } else {
      const lignes: LignePaiement[] = headerSkipped.map((r) => ({
        ine: (r[0] ?? "").trim(),
        montant: parseFloat((r[1] ?? "0").replace(",", ".")) || 0,
      })).filter((l) => l.ine);
      setOpale(lignes);
      toast.success(`Op@le : ${lignes.length} paiements importés`);
    }
  }

  const rapprochement = useMemo<LigneRapprochement[]>(() => {
    const map = new Map<string, LigneRapprochement>();
    for (const s of siecle) {
      map.set(s.ine, {
        ine: s.ine,
        nom: `${s.nom} ${s.prenom}`,
        attendu: s.montantTrim,
        paye: 0,
        ecart: -s.montantTrim,
        statut: "manquant_opale",
      });
    }
    for (const o of opale) {
      const existing = map.get(o.ine);
      if (existing) {
        existing.paye = o.montant;
        existing.ecart = o.montant - existing.attendu;
        existing.statut = Math.abs(existing.ecart) < 0.01 ? "ok" : "ecart_montant";
      } else {
        map.set(o.ine, {
          ine: o.ine, nom: "(absent SIECLE)",
          attendu: 0, paye: o.montant, ecart: o.montant,
          statut: "manquant_siecle",
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));
  }, [siecle, opale]);

  const stats = useMemo(() => {
    const ok = rapprochement.filter((r) => r.statut === "ok").length;
    const ecartM = rapprochement.filter((r) => r.statut === "ecart_montant").length;
    const manqO = rapprochement.filter((r) => r.statut === "manquant_opale").length;
    const manqS = rapprochement.filter((r) => r.statut === "manquant_siecle").length;
    const totalAttendu = rapprochement.reduce((s, r) => s + r.attendu, 0);
    const totalPaye = rapprochement.reduce((s, r) => s + r.paye, 0);
    return { ok, ecartM, manqO, manqS, totalAttendu, totalPaye };
  }, [rapprochement]);

  async function exporterPdf() {
    const pdf = await generateEnquetePdf({
      titre: `Rapprochement bourses ${trimestre} ${exercice}`,
      soustitre: "Compte 443110 — Circulaire MENE1704160C 17/02/2017",
      sections: [
        { titre: "Synthèse", lignes: [
          ["Boursiers SIECLE", siecle.length.toString()],
          ["Paiements Op@le", opale.length.toString()],
          ["Conformes", stats.ok.toString()],
          ["Écarts montants", stats.ecartM.toString()],
          ["Manquants Op@le", stats.manqO.toString()],
          ["Manquants SIECLE", stats.manqS.toString()],
          ["Total attendu", `${stats.totalAttendu.toFixed(2)} €`],
          ["Total payé", `${stats.totalPaye.toFixed(2)} €`],
          ["Écart global", `${(stats.totalPaye - stats.totalAttendu).toFixed(2)} €`],
        ]},
        { titre: "Anomalies (max 20)", lignes: rapprochement
          .filter((r) => r.statut !== "ok")
          .slice(0, 20)
          .map((r) => [`${r.ine} ${r.nom}`, `${r.statut} | écart ${r.ecart.toFixed(2)} €`]),
        },
      ],
    });
    downloadPdf(pdf, `rapprochement-bourses-${trimestre}-${exercice}.pdf`);
    toast.success("PDF généré");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Rapprochement bourses SIECLE ↔ Op@le"
        description="Compte 443110 — non déspécialisable. Import CSV puis contrôle automatique."
      />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Compte 443110 NON déspécialisable</AlertTitle>
        <AlertDescription>
          Tout reliquat constaté doit être reversé aux familles ou restitué (DAF A3 / MENE1704160C).
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. État SIECLE</CardTitle>
            <CardDescription>CSV : INE ; Nom ; Prénom ; Échelon ; Montant trimestre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input type="file" accept=".csv,.txt" onChange={(e) => loadFile(e, "siecle")} />
            {siecle.length > 0 && <Badge>{siecle.length} boursiers</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Export Op@le compte 443110</CardTitle>
            <CardDescription>CSV : INE ; Montant payé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input type="file" accept=".csv,.txt" onChange={(e) => loadFile(e, "opale")} />
            {opale.length > 0 && <Badge>{opale.length} paiements</Badge>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Trimestre</Label>
          <Input value={trimestre} onChange={(e) => setTrimestre(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Exercice</Label>
          <Input value={exercice} onChange={(e) => setExercice(e.target.value)} />
        </div>
      </div>

      {rapprochement.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto text-green-600" />
              <div className="text-2xl font-bold">{stats.ok}</div>
              <div className="text-xs text-muted-foreground">Conformes</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-amber-600" />
              <div className="text-2xl font-bold">{stats.ecartM}</div>
              <div className="text-xs text-muted-foreground">Écarts montant</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-orange-600" />
              <div className="text-2xl font-bold">{stats.manqO}</div>
              <div className="text-xs text-muted-foreground">Manquants Op@le</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-red-600" />
              <div className="text-2xl font-bold">{stats.manqS}</div>
              <div className="text-xs text-muted-foreground">Manquants SIECLE</div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Détail rapprochement</CardTitle>
                <Button onClick={exporterPdf}><Download className="mr-2 h-4 w-4" />Générer PDF officiel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INE</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead className="text-right">Attendu</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rapprochement.slice(0, 200).map((r) => (
                      <TableRow key={r.ine}>
                        <TableCell className="font-mono text-xs">{r.ine}</TableCell>
                        <TableCell>{r.nom}</TableCell>
                        <TableCell className="text-right">{r.attendu.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{r.paye.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{r.ecart.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={r.statut === "ok" ? "default" : "destructive"}>{r.statut}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}