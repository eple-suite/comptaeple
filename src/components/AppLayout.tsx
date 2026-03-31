import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Building2, LogOut, ChevronDown, Check, Bell } from "lucide-react";
import { OfflineBanner } from "@/components/OfflineBanner";
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

export function AppLayout() {
  const { profile, role, signOut } = useAuth();
  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();
  const navigate = useNavigate();

  const initials = profile
    ? `${(profile.first_name?.[0] || "").toUpperCase()}${(profile.last_name?.[0] || "").toUpperCase()}`
    : "AC";

  return (
    <SidebarProvider>
      <OfflineBanner />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Professional header with glass effect */}
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-accent rounded-lg transition-colors" />
              <div className="h-5 w-px bg-border/60" />

              {establishments.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 font-normal hover:bg-accent rounded-lg">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {selectedEstablishment ? (
                        <>
                          <span className="font-mono font-semibold text-primary text-xs">{selectedEstablishment.uai}</span>
                          <span className="hidden sm:inline text-muted-foreground text-xs">— {selectedEstablishment.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sélectionner un établissement</span>
                      )}
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 rounded-xl shadow-lg">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Mes établissements</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {establishments.map((est) => (
                      <DropdownMenuItem
                        key={est.id}
                        onClick={() => selectEstablishment(est)}
                        className="flex items-center justify-between cursor-pointer rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{est.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{est.uai} {est.opale_number ? `• ${est.opale_number}` : ""}</span>
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
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground rounded-lg" onClick={() => navigate("/etablissements")}>
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Ajouter un établissement</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {role && (
                <Badge variant="outline" className="text-[10px] capitalize rounded-md font-medium">{role}</Badge>
              )}
              <div className="h-5 w-px bg-border/60 hidden sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-sm">
                  {initials}
                </div>
                <span className="text-xs font-medium hidden sm:inline">
                  {profile?.first_name} {profile?.last_name}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground rounded-lg h-8 w-8 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
