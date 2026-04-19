import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard, Upload, BarChart3, BookOpen, Bus, Heart, Gavel,
  UtensilsCrossed, Landmark, Scale, ShieldCheck, TrendingUp, Settings,
  Building2, Zap, FileText, Sparkles, MessagesSquare, LogOut, Sun, Moon,
  Download, Search, ArrowRight, Bookmark,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  group: string;
  shortcut?: string;
  keywords?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { establishments, selectEstablishment, selectedEstablishment } = useEstablishment();

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => () => {
    navigate(path);
    setOpen(false);
  };

  const actions: PaletteAction[] = useMemo(() => [
    // Navigation
    { id: "nav-dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Navigation", shortcut: "G D", onSelect: go("/") },
    { id: "nav-hyperale", label: "HYPER@LE — Analyse financière", icon: Zap, group: "Navigation", shortcut: "G H", keywords: "fdr trésorerie caf indicateurs", onSelect: go("/hyperale") },
    { id: "nav-cf", label: "Compte financier", icon: BookOpen, group: "Navigation", keywords: "cofi rapport ordo ac", onSelect: go("/compte-financier") },
    { id: "nav-import", label: "Import des données", icon: Upload, group: "Navigation", keywords: "balance opale csv", onSelect: go("/import") },
    { id: "nav-balance", label: "Balance comptable", icon: BarChart3, group: "Navigation", onSelect: go("/balance") },
    { id: "nav-etabs", label: "Établissements", icon: Building2, group: "Navigation", onSelect: go("/etablissements") },
    { id: "nav-agence", label: "Vue Agence comptable", icon: Building2, group: "Navigation", onSelect: go("/agence") },

    // Outils métier
    { id: "tool-voyages", label: "Voyages scolaires", icon: Bus, group: "Outils métier", keywords: "siecle 4116 7067", onSelect: go("/voyages") },
    { id: "tool-fonds", label: "Fonds sociaux", icon: Heart, group: "Outils métier", onSelect: go("/fonds-sociaux") },
    { id: "tool-satd", label: "SATD — Saisie à tiers détenteur", icon: Gavel, group: "Outils métier", keywords: "ddfip créances", onSelect: go("/satd") },
    { id: "tool-credit", label: "Crédit nourriture", icon: UtensilsCrossed, group: "Outils métier", onSelect: go("/credit-nourriture") },
    { id: "tool-regies", label: "Régies & Caisse", icon: Landmark, group: "Outils métier", onSelect: go("/regies") },

    // Pilotage
    { id: "pil-veille", label: "Veille juridique", icon: Scale, group: "Pilotage", onSelect: go("/veille-juridique") },
    { id: "pil-controle", label: "Contrôle interne", icon: ShieldCheck, group: "Pilotage", onSelect: go("/controle-interne") },
    { id: "pil-exec", label: "Exécution budgétaire", icon: TrendingUp, group: "Pilotage", onSelect: go("/execution-budgetaire") },

    // Actions rapides
    { id: "act-import-now", label: "Importer une balance Op@le", icon: Upload, group: "Actions", hint: "Aller à l'import", onSelect: go("/import") },
    { id: "act-pdf", label: "Générer le rapport PDF", icon: Download, group: "Actions", hint: "Compte financier", onSelect: go("/compte-financier") },
    { id: "act-chat", label: "Ouvrir l'assistant IA", icon: MessagesSquare, group: "Actions", hint: "Posez vos questions M9-6", onSelect: () => { setOpen(false); document.getElementById("chat-eple-trigger")?.click(); } },
    { id: "act-search", label: "Rechercher dans la veille juridique", icon: Search, group: "Actions", onSelect: go("/veille-juridique") },

    // Compte
    { id: "acc-settings", label: "Paramètres", icon: Settings, group: "Compte", shortcut: "G ,", onSelect: go("/parametres") },
    { id: "acc-logout", label: "Se déconnecter", icon: LogOut, group: "Compte", onSelect: () => { signOut(); setOpen(false); } },
  ], [navigate, signOut]);

  const etabActions: PaletteAction[] = useMemo(() => establishments.slice(0, 8).map((e) => ({
    id: `etab-${e.id}`,
    label: `${e.uai} — ${e.name}`,
    icon: Building2,
    group: "Établissements",
    hint: selectedEstablishment?.id === e.id ? "Actif" : "Sélectionner",
    onSelect: () => {
      selectEstablishment(e);
      toast.success(`Établissement actif : ${e.name}`);
      setOpen(false);
    },
  })), [establishments, selectEstablishment, selectedEstablishment]);

  const grouped = useMemo(() => {
    const all = [...actions, ...etabActions];
    const map: Record<string, PaletteAction[]> = {};
    all.forEach((a) => {
      if (!map[a.group]) map[a.group] = [];
      map[a.group].push(a);
    });
    return map;
  }, [actions, etabActions]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={`Bonjour ${profile?.first_name || ""} — que souhaitez-vous faire ?`} />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Sparkles className="h-6 w-6 opacity-40" />
            <p className="text-xs">Aucun résultat. Essayez « FDR », « voyages », « rapport »...</p>
          </div>
        </CommandEmpty>
        {Object.entries(grouped).map(([group, items], i) => (
          <div key={group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.label} ${a.keywords || ""} ${a.group}`}
                  onSelect={a.onSelect}
                  className="gap-3 py-2.5 cursor-pointer group"
                >
                  <div className="h-7 w-7 rounded-md bg-muted/60 flex items-center justify-center group-data-[selected=true]:bg-primary/10 transition-colors">
                    <a.icon className="h-3.5 w-3.5 text-muted-foreground group-data-[selected=true]:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.label}</p>
                    {a.hint && <p className="text-[10px] text-muted-foreground">{a.hint}</p>}
                  </div>
                  {a.shortcut ? (
                    <CommandShortcut>{a.shortcut}</CommandShortcut>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <div className="border-t px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="kbd">↑↓</span> naviguer</span>
          <span className="flex items-center gap-1"><span className="kbd">↵</span> sélectionner</span>
          <span className="flex items-center gap-1"><span className="kbd">esc</span> fermer</span>
        </div>
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-2.5 w-2.5 text-primary" /> Cockpit Comptable
        </span>
      </div>
    </CommandDialog>
  );
}
