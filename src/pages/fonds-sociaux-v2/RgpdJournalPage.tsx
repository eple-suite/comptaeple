// ═══════════════════════════════════════════════════════════════
// RGPD — Journal d'accès & politique de purge — Fonds sociaux
// Consultation des accès, exports, modifications + rappel du DDR
// (Délai De Rétention) règlementaire.
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Shield, Eye, Pencil, Download, Trash2, Lock, Calendar, Search, AlertTriangle, Loader2,
  Building2, User as UserIcon, FilterX,
} from "lucide-react";
import type { FsJournalAccesEntry } from "./fsv2Types";

const ACTION_META: Record<string, { icon: any; label: string; color: string }> = {
  consultation: { icon: Eye, label: "Consultation", color: "text-muted-foreground" },
  modification: { icon: Pencil, label: "Modification", color: "text-orange-600 dark:text-orange-400" },
  export_pdf: { icon: Download, label: "Export PDF", color: "text-primary" },
  suppression: { icon: Trash2, label: "Suppression", color: "text-destructive" },
};

const RESSOURCE_LABELS: Record<string, string> = {
  eleve: "Fiche élève",
  decision: "Décision",
  commission: "Commission",
  pv: "PV de commission",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RgpdJournalPage() {
  const { selectedEstablishment, establishments } = useEstablishment();
  const multiEtab = establishments.length > 1;
  const [filterEtab, setFilterEtab] = useState<string>("current"); // "current" | "all" | <id>
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Détermine le périmètre d'établissements interrogés
  const scopeEtabIds = useMemo<string[]>(() => {
    if (!multiEtab || filterEtab === "current") {
      return selectedEstablishment?.id ? [selectedEstablishment.id] : [];
    }
    if (filterEtab === "all") return establishments.map(e => e.id);
    return [filterEtab];
  }, [multiEtab, filterEtab, selectedEstablishment?.id, establishments]);

  const etabLabelById = useMemo(() => {
    const m = new Map<string, string>();
    establishments.forEach(e => m.set(e.id, e.name ?? e.uai ?? e.id));
    return m;
  }, [establishments]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["fs_journal_acces", scopeEtabIds.join(",")],
    enabled: scopeEtabIds.length > 0,
    queryFn: async (): Promise<FsJournalAccesEntry[]> => {
      const { data, error } = await supabase
        .from("fs_journal_acces")
        .select("*")
        .in("establishment_id", scopeEtabIds)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as FsJournalAccesEntry[];
    },
  });

  // Liste des utilisateurs distincts présents dans le journal courant
  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach(e => {
      const key = e.user_id ?? `name:${e.user_name ?? "inconnu"}`;
      const label = e.user_name ?? "Utilisateur inconnu";
      if (!map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterAction !== "all" && e.action !== filterAction) return false;
      if (filterResource !== "all" && e.type_ressource !== filterResource) return false;
      if (filterUser !== "all") {
        const key = e.user_id ?? `name:${e.user_name ?? "inconnu"}`;
        if (key !== filterUser) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.user_name ?? ""} ${e.ressource_id} ${JSON.stringify(e.details)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filterAction, filterResource, filterUser, search]);

  const hasActiveFilters =
    filterAction !== "all" ||
    filterResource !== "all" ||
    filterUser !== "all" ||
    (multiEtab && filterEtab !== "current") ||
    search.trim() !== "";

  const resetFilters = () => {
    setFilterAction("all");
    setFilterResource("all");
    setFilterUser("all");
    setSearch("");
    if (multiEtab) setFilterEtab("current");
  };

  // KPIs
  const k = useMemo(() => ({
    consult: entries.filter(e => e.action === "consultation").length,
    modif: entries.filter(e => e.action === "modification").length,
    exports: entries.filter(e => e.action === "export_pdf").length,
    suppr: entries.filter(e => e.action === "suppression").length,
  }), [entries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" /> Journal RGPD — Fonds sociaux
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Traçabilité inaltérable des accès et opérations sur les données nominatives. Conforme RGPD art. 30.
        </p>
      </div>

      {/* Bandeau réglementaire */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4 grid md:grid-cols-3 gap-4 text-sm">
          <Reglo
            icon={Calendar}
            titre="Durée de conservation"
            txt="Dossiers individuels : 5 ans après la sortie de l'élève. Pièces comptables : 10 ans (M9-6)."
          />
          <Reglo
            icon={Lock}
            titre="Accès restreint"
            txt="Seuls le chef d'établissement, l'AC, le secrétaire général et l'AS ont accès aux dossiers nominatifs."
          />
          <Reglo
            icon={Shield}
            titre="Droits des familles"
            txt="Droit d'accès, rectification, opposition. Demandes à adresser au DPD de l'académie."
          />
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Consultations" n={k.consult} icon={Eye} color="text-muted-foreground" />
        <KpiCard label="Modifications" n={k.modif} icon={Pencil} color="text-orange-600 dark:text-orange-400" />
        <KpiCard label="Exports PDF" n={k.exports} icon={Download} color="text-primary" />
        <KpiCard label="Suppressions" n={k.suppr} icon={Trash2} color="text-destructive" />
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Filtres</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              <FilterX className="h-3.5 w-3.5 mr-1" /> Réinitialiser
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (nom, id, détail…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {multiEtab && (
            <Select value={filterEtab} onValueChange={setFilterEtab}>
              <SelectTrigger>
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Établissement" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  Établissement courant {selectedEstablishment?.name ? `— ${selectedEstablishment.name}` : ""}
                </SelectItem>
                <SelectItem value="all">Tous mes établissements ({establishments.length})</SelectItem>
                {establishments.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name ?? e.uai ?? e.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger>
              <div className="flex items-center gap-2 truncate">
                <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Utilisateur" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              {userOptions.length === 0 ? (
                <SelectItem value="__none" disabled>Aucun utilisateur dans le journal</SelectItem>
              ) : (
                userOptions.map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="modification">Modification</SelectItem>
              <SelectItem value="export_pdf">Export PDF</SelectItem>
              <SelectItem value="suppression">Suppression</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterResource} onValueChange={setFilterResource}>
            <SelectTrigger><SelectValue placeholder="Ressource" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les ressources</SelectItem>
              <SelectItem value="eleve">Fiches élève</SelectItem>
              <SelectItem value="decision">Décisions</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
              <SelectItem value="pv">PV</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Journal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Journal — {filtered.length} entrée{filtered.length > 1 ? "s" : ""}
            {entries.length > filtered.length && (
              <span className="text-xs text-muted-foreground ml-2 font-normal">
                (sur {entries.length} au total · 500 dernières)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
              Aucune entrée dans le journal pour le moment.
              <div className="text-xs mt-1">Les actions sur les données seront tracées automatiquement ici.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs">
                  <tr className="border-b">
                    <th className="p-3">Horodatage</th>
                    <th className="p-3">Utilisateur</th>
                    {multiEtab && filterEtab !== "current" && filterEtab !== selectedEstablishment?.id && (
                      <th className="p-3">Établissement</th>
                    )}
                    <th className="p-3">Action</th>
                    <th className="p-3">Ressource</th>
                    <th className="p-3">Identifiant</th>
                    <th className="p-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(e => {
                    const meta = ACTION_META[e.action] ?? ACTION_META.consultation;
                    const Icon = meta.icon;
                    return (
                      <tr key={e.id} className="hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs whitespace-nowrap">{fmtDate(e.created_at)}</td>
                        <td className="p-3">{e.user_name ?? <span className="text-muted-foreground italic">inconnu</span>}</td>
                        {multiEtab && filterEtab !== "current" && filterEtab !== selectedEstablishment?.id && (
                          <td className="p-3 text-xs">
                            <Badge variant="secondary" className="text-[10px]">
                              {etabLabelById.get(e.establishment_id) ?? e.establishment_id.slice(0, 8) + "…"}
                            </Badge>
                          </td>
                        )}
                        <td className="p-3">
                          <div className={`flex items-center gap-1.5 ${meta.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{meta.label}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {RESSOURCE_LABELS[e.type_ressource] ?? e.type_ressource}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground">
                          {e.ressource_id.slice(0, 8)}…
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{e.ip_adresse ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-4 flex items-start gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Journal inaltérable</div>
            <div className="text-xs text-muted-foreground">
              Les entrées de ce journal ne peuvent être ni modifiées ni supprimées (politique RLS append-only).
              Toute tentative est elle-même loggée. Conservation : 6 ans.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, n, icon: Icon, color }: { label: string; n: number; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Icon className={`h-4 w-4 ${color}`} /> <span>{label}</span>
        </div>
        <div className="text-2xl font-bold">{n}</div>
      </CardContent>
    </Card>
  );
}

function Reglo({ icon: Icon, titre, txt }: { icon: any; titre: string; txt: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-xs">{titre}</div>
        <div className="text-xs text-muted-foreground">{txt}</div>
      </div>
    </div>
  );
}