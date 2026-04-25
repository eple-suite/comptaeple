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
// WorkingCapital & Indicators merged into HYPER@LE
import CompteFinancier from "./pages/CompteFinancier";
import Voyages from "./pages/Voyages";
import VoyagesV2Page from "./pages/voyages-v2/VoyagesV2Page";
import EnquetesRectoratPage from "./pages/voyages-v2/EnquetesRectoratPage";
import BilanFinancierPageV2 from "./pages/voyages-v2/BilanFinancierPageV2";
import FondsSociauxV2Home from "./pages/fonds-sociaux-v2/FondsSociauxV2Home";
import ElevesPage from "./pages/fonds-sociaux-v2/ElevesPage";
import DecisionsPage from "./pages/fonds-sociaux-v2/DecisionsPage";
import CommissionsPage from "./pages/fonds-sociaux-v2/CommissionsPage";
import EnquetePage from "./pages/fonds-sociaux-v2/EnquetePage";
import TableauBordPage from "./pages/fonds-sociaux-v2/TableauBordPage";
import GroupementConsolidePage from "./pages/fonds-sociaux-v2/GroupementConsolidePage";
import RgpdJournalPage from "./pages/fonds-sociaux-v2/RgpdJournalPage";
import DeliberationsCAPage from "./pages/fonds-sociaux-v2/DeliberationsCAPage";
import EleveImportPage from "./pages/fonds-sociaux-v2/EleveImportPage";
import SATD from "./pages/SATD";
import PassationSgeplePage from "./pages/rentree/PassationSgeplePage";
import AccreditationOrdoPage from "./pages/rentree/AccreditationOrdoPage";
import HabilitationsOpalePage from "./pages/rentree/HabilitationsOpalePage";
import HabilitationsRecapPage from "./pages/rentree/HabilitationsRecapPage";
import VueRectoratPage from "./pages/rentree/VueRectoratPage";
import LiensUtilesPage from "./pages/rentree/LiensUtilesPage";
import EnquetesHubPage from "./pages/enquetes-rectorat/EnquetesHubPage";
import NomenclaturePage from "./pages/enquetes-rectorat/NomenclaturePage";
import CalendrierCampagnesPage from "./pages/enquetes-rectorat/CalendrierCampagnesPage";
import VueRectoratEnquetesPage from "./pages/enquetes-rectorat/VueRectoratEnquetesPage";
import CreditNourriture from "./pages/CreditNourriture";
import VeilleJuridique from "./pages/VeilleJuridique";
import ControleInterne from "./pages/ControleInterne";
import SettingsPage from "./pages/SettingsPage";
import RegiesCaisse from "./pages/RegiesCaisse";
import ExecutionBudgetaire from "./pages/ExecutionBudgetaire";
import HyperalePage from "./pages/hyperale/HyperalePage";
import AgencePage from "./pages/agence/AgencePage";
import MarchesPage from "./pages/marches/MarchesPage";
import Regle8LogsAdmin from "./pages/admin/Regle8LogsAdmin";
import EntretiensHome from "./pages/entretiens/EntretiensHome";
import NouvelEntretienWizard from "./pages/entretiens/NouvelEntretienWizard";
import CampagneDashboard from "./pages/entretiens/CampagneDashboard";
import AideAccueil from "./pages/aide/AideAccueil";
import AideArticle from "./pages/aide/AideArticle";
import AideModule from "./pages/aide/AideModule";
import AideGlossaire from "./pages/aide/AideGlossaire";
import AideFAQ from "./pages/aide/AideFAQ";
import AideModeles from "./pages/aide/AideModeles";
import AideOnboarding from "./pages/aide/AideOnboarding";
import AideReglementation from "./pages/aide/AideReglementation";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ChatEple } from "@/components/ChatEple";

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
              <Route path="/fonds-roulement" element={<Navigate to="/hyperale/analyse" replace />} />
              <Route path="/indicateurs" element={<Navigate to="/hyperale/analyse" replace />} />
              <Route path="/compte-financier" element={<CompteFinancier />} />
              <Route path="/voyages" element={<Voyages />} />
              <Route path="/voyages-v2" element={<VoyagesV2Page />} />
              <Route path="/voyages-v2/enquetes-rectorat" element={<EnquetesRectoratPage />} />
              <Route path="/voyages-v2/bilan/:voyageId" element={<BilanFinancierPageV2 />} />
              <Route path="/fonds-sociaux" element={<Navigate to="/fonds-sociaux/v2" replace />} />
              <Route path="/fonds-sociaux/v2" element={<FondsSociauxV2Home />} />
              <Route path="/fonds-sociaux/v2/eleves" element={<ElevesPage />} />
              <Route path="/fonds-sociaux/v2/eleves/import" element={<EleveImportPage />} />
              <Route path="/fonds-sociaux/v2/decisions" element={<DecisionsPage />} />
              <Route path="/fonds-sociaux/v2/commissions" element={<CommissionsPage />} />
              <Route path="/fonds-sociaux/v2/enquete" element={<EnquetePage />} />
              <Route path="/fonds-sociaux/v2/tableau-bord" element={<TableauBordPage />} />
              <Route path="/fonds-sociaux/v2/groupement" element={<GroupementConsolidePage />} />
              <Route path="/fonds-sociaux/v2/rgpd" element={<RgpdJournalPage />} />
              <Route path="/fonds-sociaux/v2/deliberations" element={<DeliberationsCAPage />} />
              <Route path="/satd" element={<SATD />} />
              <Route path="/rentree/passation-sgeple" element={<PassationSgeplePage />} />
              <Route path="/rentree/accreditation" element={<AccreditationOrdoPage />} />
              <Route path="/rentree/habilitations-opale" element={<HabilitationsOpalePage />} />
              <Route path="/rentree/habilitations-recap" element={<HabilitationsRecapPage />} />
              <Route path="/rentree/vue-rectorat" element={<VueRectoratPage />} />
              <Route path="/liens-utiles" element={<LiensUtilesPage />} />
              <Route path="/enquetes-rectorat" element={<EnquetesHubPage />} />
              <Route path="/enquetes-rectorat/nomenclature" element={<NomenclaturePage />} />
              <Route path="/enquetes-rectorat/calendrier" element={<CalendrierCampagnesPage />} />
              <Route path="/enquetes-rectorat/vue-rectorat" element={<VueRectoratEnquetesPage />} />
              <Route path="/credit-nourriture" element={<CreditNourriture />} />
              <Route path="/regies" element={<RegiesCaisse />} />
              <Route path="/veille-juridique" element={<VeilleJuridique />} />
              <Route path="/controle-interne" element={<ControleInterne />} />
              <Route path="/execution-budgetaire" element={<ExecutionBudgetaire />} />
              <Route path="/parametres" element={<SettingsPage />} />
              <Route path="/hyperale/*" element={<HyperalePage />} />
              <Route path="/agence" element={<AgencePage />} />
              <Route path="/marches/*" element={<MarchesPage />} />
              <Route path="/admin/logs/regle-8" element={<Regle8LogsAdmin />} />
              <Route path="/entretiens" element={<EntretiensHome />} />
              <Route path="/entretiens/nouveau" element={<NouvelEntretienWizard />} />
              <Route path="/entretiens/campagne" element={<CampagneDashboard />} />
              <Route path="/aide" element={<AideAccueil />} />
              <Route path="/aide/article/:slug" element={<AideArticle />} />
              <Route path="/aide/module/:moduleId" element={<AideModule />} />
              <Route path="/aide/glossaire" element={<AideGlossaire />} />
              <Route path="/aide/faq" element={<AideFAQ />} />
              <Route path="/aide/modeles" element={<AideModeles />} />
              <Route path="/aide/onboarding/:profilId" element={<AideOnboarding />} />
              <Route path="/aide/reglementation" element={<AideReglementation />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatEple />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
