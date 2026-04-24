// ════════════════════════════════════════════════════════════════
// Historique des événements règle 8 € (panneau latéral)
// ────────────────────────────────────────────────────────────────
// Charge depuis la table `logs` les actions :
//  • voyage_regle8_bloquant
//  • voyage_regle8_don_tacite_assume / retire
// Filtré par voyage courant si fourni.
// ════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, Loader2, RefreshCw, ShieldAlert, ShieldCheck, ShieldX, FileSearch } from "lucide-react";
import {
  fetchRegle8Logs,
  REGLE8_ACTION_LABELS,
  type Regle8LogAction,
  type Regle8LogEntry,
} from "../lib/voyageLogs";

interface Props {
  voyageId?: string | null;
  uai?: string | null;
  /** Libellé du voyage courant pour le titre */
  voyageLibelle?: string;
}

const ACTION_TONE: Record<Regle8LogAction, { color: string; Icon: typeof ShieldAlert; label: string }> = {
  voyage_regle8_bloquant: {
    color: "bg-destructive text-destructive-foreground",
    Icon: ShieldAlert,
    label: "Bloquant",
  },
  voyage_regle8_don_tacite_assume: {
    color: "bg-amber-500 text-white",
    Icon: ShieldCheck,
    label: "Don assumé",
  },
  voyage_regle8_don_tacite_retire: {
    color: "bg-muted text-foreground",
    Icon: ShieldX,
    label: "Don retiré",
  },
};

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return s;
  }
}

function fmtEur(n: any): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}

export function Regle8History({ voyageId, uai, voyageLibelle }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Regle8LogEntry[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchRegle8Logs({
        voyageId: voyageId ?? null,
        uai: uai ?? null,
        includeOrphans: !voyageId, // si pas encore enregistré, on montre tout
        limit: 200,
      });
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  // Charge à l'ouverture
  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, voyageId, uai]);

  const counts = entries.reduce(
    (acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1;
      return acc;
    },
    {} as Record<Regle8LogAction, number>,
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="h-7 text-[11px]">
          <History className="h-3.5 w-3.5 mr-1" />
          Historique règle 8 €
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historique règle 8 €
          </SheetTitle>
          <SheetDescription className="text-xs">
            Journal des événements (LF n° 66-948 art. 21){" "}
            {voyageLibelle ? <>— <strong>{voyageLibelle}</strong></> : null}
            {!voyageId && (
              <span className="block mt-1 italic text-muted-foreground">
                Voyage non encore enregistré : affichage de tous les événements visibles.
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 py-2 flex-wrap">
          <Badge className={ACTION_TONE.voyage_regle8_bloquant.color}>
            {counts.voyage_regle8_bloquant || 0} bloquage{(counts.voyage_regle8_bloquant || 0) > 1 ? "s" : ""}
          </Badge>
          <Badge className={ACTION_TONE.voyage_regle8_don_tacite_assume.color}>
            {counts.voyage_regle8_don_tacite_assume || 0} don assumé
          </Badge>
          <Badge className={ACTION_TONE.voyage_regle8_don_tacite_retire.color}>
            {counts.voyage_regle8_don_tacite_retire || 0} don retiré
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="ml-auto h-7"
            type="button"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 -mx-6 px-6 py-2">
          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
              <FileSearch className="h-8 w-8 opacity-50" />
              <div>Aucun événement enregistré</div>
              <div className="text-xs italic">
                Les bloquages et coches/décoches du don tacite apparaîtront ici.
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {entries.map((e) => {
                const tone = ACTION_TONE[e.action];
                const d = e.details || {};
                return (
                  <div key={e.id} className="border rounded-md p-3 bg-card">
                    <div className="flex items-start gap-2">
                      <Badge className={`${tone.color} shrink-0`}>
                        <tone.Icon className="h-3 w-3 mr-1" />
                        {tone.label}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">
                          {REGLE8_ACTION_LABELS[e.action]}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {fmtDate(e.created_at)}
                          {d.contexte && <> · {String(d.contexte).replace(/_/g, " ")}</>}
                          {d.step ? <> · étape {d.step}</> : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                      <div className="bg-muted/40 rounded px-2 py-1">
                        <div className="text-muted-foreground">RAC/élève</div>
                        <div className="font-mono font-semibold">{fmtEur(d.reste_a_charge_par_eleve)}</div>
                      </div>
                      <div className="bg-muted/40 rounded px-2 py-1">
                        <div className="text-muted-foreground">Coût/élève</div>
                        <div className="font-mono font-semibold">{fmtEur(d.cout_par_eleve)}</div>
                      </div>
                      <div className="bg-muted/40 rounded px-2 py-1">
                        <div className="text-muted-foreground">Part. famille</div>
                        <div className="font-mono font-semibold">{fmtEur(d.participation_par_eleve)}</div>
                      </div>
                    </div>

                    {(d.voyage_libelle || d.nb_eleves) && (
                      <div className="text-[10px] text-muted-foreground mt-2 flex flex-wrap gap-2">
                        {d.voyage_libelle && <span>📋 {String(d.voyage_libelle)}</span>}
                        {d.nb_eleves ? <span>👥 {d.nb_eleves} élèves</span> : null}
                        {e.uai && <span>🏫 {e.uai}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="text-[10px] text-muted-foreground italic pt-2">
          Référence : LF n° 66-948 du 22/12/1966 art. 21. Source : table <code>logs</code>.
        </div>
      </SheetContent>
    </Sheet>
  );
}
