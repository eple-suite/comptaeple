import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppLayout() {
  const { profile, role, signOut } = useAuth();
  const initials = profile
    ? `${(profile.first_name?.[0] || "").toUpperCase()}${(profile.last_name?.[0] || "").toUpperCase()}`
    : "AC";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium text-foreground">0910620T</span>
                <span className="hidden sm:inline">— Lycée Exemple</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {role && (
                <Badge variant="outline" className="text-[10px] capitalize">{role}</Badge>
              )}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {profile?.first_name} {profile?.last_name}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
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
