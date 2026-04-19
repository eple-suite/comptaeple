import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Building2,
  Bus,
  Heart,
  Gavel,
  UtensilsCrossed,
  Shield,
  Settings,
  Scale,
  ShieldCheck,
  BookOpen,
  Landmark,
  TrendingUp,
  Zap,
  Search,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCofiepleStore } from "@/store/useCofiepleStore";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
  hot?: boolean;
}

const mainItems: NavItem[] = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Vue Agence", url: "/agence", icon: Building2 },
  { title: "Import des données", url: "/import", icon: Upload },
  { title: "Établissements", url: "/etablissements", icon: Building2 },
];

const analysisItems: NavItem[] = [
  { title: "Balance comptable", url: "/balance", icon: BarChart3 },
  { title: "HYPER@LE", url: "/hyperale", icon: Zap, hot: true },
  { title: "Compte financier", url: "/compte-financier", icon: BookOpen },
];

const toolItems: NavItem[] = [
  { title: "Voyages scolaires", url: "/voyages", icon: Bus },
  { title: "Fonds sociaux", url: "/fonds-sociaux", icon: Heart },
  { title: "SATD", url: "/satd", icon: Gavel },
  { title: "Crédit nourriture", url: "/credit-nourriture", icon: UtensilsCrossed },
  { title: "Régies & Caisse", url: "/regies", icon: Landmark },
];

const pilotageItems: NavItem[] = [
  { title: "Veille juridique", url: "/veille-juridique", icon: Scale },
  { title: "Contrôle interne", url: "/controle-interne", icon: ShieldCheck },
  { title: "Exécution budgétaire", url: "/execution-budgetaire", icon: TrendingUp },
];

const allGroups: { id: string; label: string; items: NavItem[] }[] = [
  { id: "main", label: "Navigation", items: mainItems },
  { id: "analysis", label: "Analyses", items: analysisItems },
  { id: "tools", label: "Outils métiers", items: toolItems },
  { id: "pilotage", label: "Pilotage AC", items: pilotageItems },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const balance = useCofiepleStore((s) => s.balance);
  const activeBudget = useCofiepleStore((s) => s.activeBudget);
  const balanceData = balance[activeBudget] || [];
  const hasData = balanceData.length > 0;

  // Search filter
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return allGroups;
    const q = query.toLowerCase();
    return allGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      {/* Premium gradient header */}
      <SidebarHeader className="p-4 pb-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-primary">
            <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar animate-pulse-soft" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[15px] font-bold text-sidebar-foreground tracking-tight leading-tight">
                Cockpit Comptable
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 tracking-wider uppercase font-medium">
                EPLE • GRETA • CFA
              </p>
            </div>
          )}
        </div>

        {/* Search bar — only when expanded */}
        {!collapsed && (
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer..."
              className="w-full h-8 pl-8 pr-12 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/40 text-[12px] text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:ring-1 focus:ring-sidebar-ring/60 focus:bg-sidebar-accent transition-all"
            />
            <kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-5 px-1.5 rounded border border-sidebar-border/60 bg-sidebar-background/40 text-[9px] font-mono text-sidebar-foreground/40 font-semibold">
              ⌘K
            </kbd>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2 space-y-0.5">
        {filtered.map((group) => (
          <SidebarGroup key={group.id} className="py-1">
            <SidebarGroupLabel className="text-sidebar-foreground/35 uppercase text-[9px] tracking-[0.14em] font-bold px-2 mb-0.5 h-6">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="relative transition-all duration-200 rounded-lg group/nav h-9 px-2"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        >
                          {/* Active indicator bar */}
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-sidebar-primary" />
                          )}
                          <item.icon
                            className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                              active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover/nav:text-sidebar-foreground group-hover/nav:scale-110"
                            }`}
                          />
                          {!collapsed && (
                            <>
                              <span className="ml-2 flex-1 truncate text-[13px]">{item.title}</span>
                              {item.hot && (
                                <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r from-primary/30 to-secondary/30 text-sidebar-primary-foreground border border-sidebar-primary/30 uppercase tracking-wider">
                                  <Sparkles className="h-2 w-2" /> New
                                </span>
                              )}
                              {item.badge && (
                                <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-sidebar-primary/15 text-sidebar-primary">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {filtered.length === 0 && !collapsed && (
          <div className="px-3 py-6 text-center text-[11px] text-sidebar-foreground/40">
            Aucun module ne correspond à « {query} »
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/40">
        {/* Status pill */}
        {!collapsed && (
          <div className="px-2 py-2 mb-1 rounded-lg bg-sidebar-accent/40 flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${hasData ? "bg-success" : "bg-warning"} animate-pulse-soft`} />
            <span className="text-[10px] text-sidebar-foreground/60 flex-1">
              {hasData ? `${balanceData.length} lignes chargées` : "En attente d'import"}
            </span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/parametres"
                className="transition-all duration-200 rounded-lg h-9 px-2"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              >
                <Settings className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                {!collapsed && <span className="ml-2 text-[13px]">Paramètres</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
