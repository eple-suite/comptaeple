import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
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
            <Route path="/parametres" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
