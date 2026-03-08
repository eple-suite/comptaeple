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
  { title: "Fonds de roulement", url: "/fonds-roulement", icon: Wallet },
  { title: "Indicateurs M9-6", url: "/indicateurs", icon: FileBarChart },
];

const toolItems = [
  { title: "Annexe comptable", url: "/annexe", icon: FileText },
  { title: "Voyages scolaires", url: "/voyages", icon: Bus },
  { title: "Fonds sociaux", url: "/fonds-sociaux", icon: Heart },
  { title: "SATD", url: "/satd", icon: Gavel },
  { title: "Crédit nourriture", url: "/credit-nourriture", icon: UtensilsCrossed },
];

const pilotageItems = [
  { title: "Veille juridique", url: "/veille-juridique", icon: Scale },
  { title: "Contrôle interne", url: "/controle-interne", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
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
                  className="transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-sm font-bold text-sidebar-foreground">
                Cockpit Comptable
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50">EPLE • GRETA • CFA</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {renderGroup("Navigation", mainItems)}
        {renderGroup("Analyses", analysisItems)}
        {renderGroup("Outils métiers", toolItems)}
        {renderGroup("Pilotage AC", pilotageItems)}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/parametres" className="transition-colors" activeClassName="bg-sidebar-accent">
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
