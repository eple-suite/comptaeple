import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EstablishmentProvider } from "@/contexts/EstablishmentContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import DataImport from "./pages/DataImport";
import Establishments from "./pages/Establishments";
import BalanceAnalysis from "./pages/BalanceAnalysis";
import WorkingCapital from "./pages/WorkingCapital";
import Indicators from "./pages/Indicators";
import AccountingAnnex from "./pages/AccountingAnnex";
import Voyages from "./pages/Voyages";
import FondsSociaux from "./pages/FondsSociaux";
import SATD from "./pages/SATD";
import CreditNourriture from "./pages/CreditNourriture";
import VeilleJuridique from "./pages/VeilleJuridique";
import ControleInterne from "./pages/ControleInterne";
import SettingsPage from "./pages/SettingsPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route element={<ProtectedRoute><EstablishmentProvider><AppLayout /></EstablishmentProvider></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<DataImport />} />
              <Route path="/etablissements" element={<Establishments />} />
              <Route path="/balance" element={<BalanceAnalysis />} />
              <Route path="/fonds-roulement" element={<WorkingCapital />} />
              <Route path="/indicateurs" element={<Indicators />} />
              <Route path="/annexe" element={<AccountingAnnex />} />
              <Route path="/voyages" element={<Voyages />} />
              <Route path="/fonds-sociaux" element={<FondsSociaux />} />
              <Route path="/satd" element={<SATD />} />
              <Route path="/credit-nourriture" element={<CreditNourriture />} />
              <Route path="/veille-juridique" element={<VeilleJuridique />} />
              <Route path="/controle-interne" element={<ControleInterne />} />
              <Route path="/parametres" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
