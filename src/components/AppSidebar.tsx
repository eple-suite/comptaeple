import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Wallet,
  FileText,
  Building2,
  Bus,
  Heart,
  Gavel,
  UtensilsCrossed,
  FileBarChart,
  Shield,
  Settings,
  Scale,
  ShieldCheck,
  BookOpen,
  Landmark,
  TrendingUp,
  Zap,
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

const mainItems = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Import données", url: "/import", icon: Upload },
  { title: "Établissements", url: "/etablissements", icon: Building2 },
];

const analysisItems = [
  { title: "Balance comptable", url: "/balance", icon: BarChart3 },
  { title: "⚡ HYPER@LE", url: "/hyperale", icon: Zap },
];

const toolItems = [
  { title: "Compte financier", url: "/compte-financier", icon: BookOpen },
  { title: "Voyages scolaires", url: "/voyages", icon: Bus },
  { title: "Fonds sociaux", url: "/fonds-sociaux", icon: Heart },
  { title: "SATD", url: "/satd", icon: Gavel },
  { title: "Crédit nourriture", url: "/credit-nourriture", icon: UtensilsCrossed },
  { title: "Régies & Caisse", url: "/regies", icon: Landmark },
];

const pilotageItems = [
  { title: "Veille juridique", url: "/veille-juridique", icon: Scale },
  { title: "Contrôle interne", url: "/controle-interne", icon: ShieldCheck },
  { title: "Exécution budgétaire", url: "/execution-budgetaire", icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-[0.12em] font-semibold mb-1">
        {!collapsed && label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="transition-all duration-200 rounded-lg group/nav"
                  activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-bold ring-2 ring-sidebar-primary/35 shadow-sm"
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                  {!collapsed && <span className="ml-2">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-primary">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-sm font-bold text-sidebar-foreground tracking-tight">
                Cockpit Comptable
              </h1>
              <p className="text-[10px] text-sidebar-foreground/40 tracking-wide">EPLE • GRETA • CFA</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 space-y-1">
        {renderGroup("Navigation", mainItems)}
        {renderGroup("Analyses", analysisItems)}
        {renderGroup("Outils métiers", toolItems)}
        {renderGroup("Pilotage AC", pilotageItems)}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
                <NavLink to="/parametres" className="transition-all duration-200 rounded-lg" activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-bold ring-2 ring-sidebar-primary/35 shadow-sm">
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2">Paramètres</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
