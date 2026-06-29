import { useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Building2, LogOut, ChevronDown, Check, Search, Sparkles } from "lucide-react";
import { OfflineBanner } from "@/components/OfflineBanner";
import { CommandPalette } from "@/components/CommandPalette";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { DemoModuleBanner } from "@/components/demo/DemoModuleBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { hasCofieplePersistedData } from "@/hooks/usePersistedState";
import { toast } from "sonner";

export function AppLayout() {
  const { profile, role, signOut } = useAuth();
  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();
  const navigate = useNavigate();
  const location = useLocation();
  const toastShown = useRef(false);

  useEffect(() => {
    if (!toastShown.current && hasCofieplePersistedData()) {
      toastShown.current = true;
      toast.info("📂 Vos données précédentes ont été restaurées automatiquement.", { duration: 4000 });
    }
  }, []);

  const initials = profile
    ? `${(profile.first_name?.[0] || "").toUpperCase()}${(profile.last_name?.[0] || "").toUpperCase()}`
    : "AC";

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <SidebarProvider>
      <OfflineBanner />
      <CommandPalette />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DemoModeBanner />
          {/* Premium glass header */}
          <header className="h-14 flex items-center gap-3 border-b border-border/60 bg-card/70 backdrop-blur-xl px-4 shrink-0 sticky top-0 z-30 supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <SidebarTrigger className="hover:bg-accent rounded-lg transition-colors h-8 w-8" />
              <div className="h-5 w-px bg-border/60 mx-1" />

              {establishments.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 font-normal hover:bg-accent rounded-lg h-9 max-w-[280px]">
                      <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {selectedEstablishment ? (
                        <>
                          <span className="font-mono font-bold text-primary text-[11px] tracking-wider">{selectedEstablishment.uai}</span>
                          <span className="hidden md:inline text-foreground/80 text-xs truncate max-w-[180px]">{selectedEstablishment.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sélectionner un établissement</span>
                      )}
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 rounded-xl shadow-elevated">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Mes établissements
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {establishments.map((est) => (
                      <DropdownMenuItem
                        key={est.id}
                        onClick={() => selectEstablishment(est)}
                        className="flex items-center justify-between cursor-pointer rounded-lg py-2"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{est.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {est.uai} {est.opale_number ? `• ${est.opale_number}` : ""}
                          </span>
                        </div>
                        {selectedEstablishment?.id === est.id && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/etablissements")} className="text-primary cursor-pointer rounded-lg">
                      <Building2 className="h-4 w-4 mr-2" /> Gérer les établissements
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground rounded-lg h-9" onClick={() => navigate("/etablissements")}>
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Ajouter un établissement</span>
                </Button>
              )}
            </div>

            {/* Center — Command Palette trigger (signature element) */}
            <button
              onClick={openPalette}
              className="hidden md:flex flex-1 max-w-md mx-auto items-center gap-2.5 h-9 px-3 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/70 hover:border-border transition-all group shadow-xs"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="flex-1 text-left text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                Rechercher ou exécuter…
              </span>
              <kbd className="kbd">⌘K</kbd>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                aria-label="Nouveautés"
                title="Nouveautés"
                onClick={() => navigate("/nouveautes")}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
              <NotificationsBell />
              <ThemeToggle />
              {role && (
                <Badge variant="outline" className="text-[10px] capitalize rounded-md font-medium hidden sm:inline-flex">
                  {role}
                </Badge>
              )}
              <div className="h-5 w-px bg-border/60 hidden sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-accent rounded-lg px-1.5 py-1 transition-colors group">
                    <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
                      {initials}
                    </div>
                    <span className="text-xs font-medium hidden sm:inline pr-1">
                      {profile?.first_name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elevated">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{role || "Utilisateur"}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer rounded-lg">
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openPalette} className="cursor-pointer rounded-lg justify-between">
                    Recherche rapide <kbd className="kbd">⌘K</kbd>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer rounded-lg text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background relative">
            {/* Subtle radial accent */}
            <div className="absolute inset-x-0 top-0 h-64 bg-radial-fade pointer-events-none -z-10" />
            <DemoModuleBanner />
            <Breadcrumbs />
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
