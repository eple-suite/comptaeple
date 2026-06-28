import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EstablishmentProvider } from "@/contexts/EstablishmentContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { AppLayout } from "@/components/AppLayout";
import { ChatEple } from "@/components/ChatEple";

// ── Pages chargées paresseusement (code splitting par route) ──
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DataImport = lazy(() => import("./pages/DataImport"));
const Establishments = lazy(() => import("./pages/Establishments"));
const BalanceAnalysis = lazy(() => import("./pages/BalanceAnalysis"));
const CompteFinancier = lazy(() => import("./pages/CompteFinancier"));
const VoyagesV2Page = lazy(() => import("./pages/voyages-v2/VoyagesV2Page"));
const EnquetesRectoratPage = lazy(() => import("./pages/voyages-v2/EnquetesRectoratPage"));
const BilanFinancierPageV2 = lazy(() => import("./pages/voyages-v2/BilanFinancierPageV2"));
const FondsSociauxV2Home = lazy(() => import("./pages/fonds-sociaux-v2/FondsSociauxV2Home"));
const ElevesPage = lazy(() => import("./pages/fonds-sociaux-v2/ElevesPage"));
const DecisionsPage = lazy(() => import("./pages/fonds-sociaux-v2/DecisionsPage"));
const CommissionsPage = lazy(() => import("./pages/fonds-sociaux-v2/CommissionsPage"));
const EnquetePage = lazy(() => import("./pages/fonds-sociaux-v2/EnquetePage"));
const TableauBordPage = lazy(() => import("./pages/fonds-sociaux-v2/TableauBordPage"));
const GroupementConsolidePage = lazy(() => import("./pages/fonds-sociaux-v2/GroupementConsolidePage"));
const RgpdJournalPage = lazy(() => import("./pages/fonds-sociaux-v2/RgpdJournalPage"));
const DeliberationsCAPage = lazy(() => import("./pages/fonds-sociaux-v2/DeliberationsCAPage"));
const EleveImportPage = lazy(() => import("./pages/fonds-sociaux-v2/EleveImportPage"));
const SATD = lazy(() => import("./pages/SATD"));
const PassationSgeplePage = lazy(() => import("./pages/rentree/PassationSgeplePage"));
const AccreditationOrdoPage = lazy(() => import("./pages/rentree/AccreditationOrdoPage"));
const HabilitationsOpalePage = lazy(() => import("./pages/rentree/HabilitationsOpalePage"));
const HabilitationsRecapPage = lazy(() => import("./pages/rentree/HabilitationsRecapPage"));
const VueRectoratPage = lazy(() => import("./pages/rentree/VueRectoratPage"));
const LiensUtilesPage = lazy(() => import("./pages/rentree/LiensUtilesPage"));
const EnquetesHubPage = lazy(() => import("./pages/enquetes-rectorat/EnquetesHubPage"));
const NomenclaturePage = lazy(() => import("./pages/enquetes-rectorat/NomenclaturePage"));
const CalendrierCampagnesPage = lazy(() => import("./pages/enquetes-rectorat/CalendrierCampagnesPage"));
const VueRectoratEnquetesPage = lazy(() => import("./pages/enquetes-rectorat/VueRectoratEnquetesPage"));
const BibliothequePage = lazy(() => import("./pages/enquetes-rectorat/BibliothequePage"));
const WizardReliquatsBopPage = lazy(() => import("./pages/enquetes-rectorat/WizardReliquatsBopPage"));
const WizardBoursesSieclePage = lazy(() => import("./pages/enquetes-rectorat/WizardBoursesSieclePage"));
const RelancesPage = lazy(() => import("./pages/enquetes-rectorat/RelancesPage"));
const HistoriquePluriannuelPage = lazy(() => import("./pages/enquetes-rectorat/HistoriquePluriannuelPage"));
const CreditNourriture = lazy(() => import("./pages/CreditNourriture"));
const VeilleJuridique = lazy(() => import("./pages/VeilleJuridique"));
const Demo = lazy(() => import("./pages/Demo"));
const ControleInterne = lazy(() => import("./pages/ControleInterne"));
const LogementsPage = lazy(() => import("./pages/logements/LogementsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const RegiesCaisse = lazy(() => import("./pages/RegiesCaisse"));
const ExecutionBudgetaire = lazy(() => import("./pages/ExecutionBudgetaire"));
const HyperalePage = lazy(() => import("./pages/hyperale/HyperalePage"));
const AgencePage = lazy(() => import("./pages/agence/AgencePage"));
const MarchesPage = lazy(() => import("./pages/marches/MarchesPage"));
const Regle8LogsAdmin = lazy(() => import("./pages/admin/Regle8LogsAdmin"));
const EntretiensHome = lazy(() => import("./pages/entretiens/EntretiensHome"));
const NouvelEntretienWizard = lazy(() => import("./pages/entretiens/NouvelEntretienWizard"));
const CampagneDashboard = lazy(() => import("./pages/entretiens/CampagneDashboard"));
const RecoursPage = lazy(() => import("./pages/entretiens/RecoursPage"));
const FichesPostePage = lazy(() => import("./pages/entretiens/FichesPostePage"));
const ExportEstevePage = lazy(() => import("./pages/entretiens/ExportEstevePage"));
const VueRectoratEntretiensPage = lazy(() => import("./pages/entretiens/VueRectoratEntretiensPage"));
const AideAccueil = lazy(() => import("./pages/aide/AideAccueil"));
const AideArticle = lazy(() => import("./pages/aide/AideArticle"));
const AideModule = lazy(() => import("./pages/aide/AideModule"));
const AideGlossaire = lazy(() => import("./pages/aide/AideGlossaire"));
const AideFAQ = lazy(() => import("./pages/aide/AideFAQ"));
const AideModeles = lazy(() => import("./pages/aide/AideModeles"));
const AideOnboarding = lazy(() => import("./pages/aide/AideOnboarding"));
const AideReglementation = lazy(() => import("./pages/aide/AideReglementation"));
const AssistantExpertPage = lazy(() => import("./pages/aide/AssistantExpertPage"));
const OpaleAccueil = lazy(() => import("./pages/opale/OpaleAccueil"));
const OpaleBibliotheque = lazy(() => import("./pages/opale/OpaleBibliotheque"));
const OpaleWizardFiche = lazy(() => import("./pages/opale/OpaleWizardFiche"));
const OpaleFicheDetail = lazy(() => import("./pages/opale/OpaleFicheDetail"));
const OpaleMesFichesPage = lazy(() => import("./pages/opale/OpaleMesFichesPage"));
const OpaleRecherchePage = lazy(() => import("./pages/opale/OpaleRecherchePage"));
const OpaleForumPage = lazy(() => import("./pages/opale/OpaleForumPage"));
const OpaleTendancesPage = lazy(() => import("./pages/opale/OpaleTendancesPage"));
const OpaleDashboardPage = lazy(() => import("./pages/opale/OpaleDashboardPage"));
const OpaleModerationPage = lazy(() => import("./pages/opale/OpaleModerationPage"));
const OpaleCguPage = lazy(() => import("./pages/opale/OpaleCguPage"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuditHub = lazy(() => import("./pages/audit/AuditHub"));
const AuditRun = lazy(() => import("./pages/audit/AuditRun"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** L'assistant n'est rendu que pour un utilisateur authentifié. */
function AuthedChat() {
  const { session } = useAuth();
  return session ? <ChatEple /> : null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoModeProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><EstablishmentProvider><AppLayout /></EstablishmentProvider></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/import" element={<DataImport />} />
              <Route path="/etablissements" element={<Establishments />} />
              <Route path="/balance" element={<BalanceAnalysis />} />
              <Route path="/fonds-roulement" element={<Navigate to="/hyperale/analyse" replace />} />
              <Route path="/indicateurs" element={<Navigate to="/hyperale/analyse" replace />} />
              <Route path="/compte-financier" element={<CompteFinancier />} />
              {/* Module legacy déprécié → redirige vers la v2 (plus de saisie dans un module mort) */}
              <Route path="/voyages" element={<Navigate to="/voyages-v2" replace />} />
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
              {/* Redirections de compatibilité pour anciens liens */}
              <Route path="/habilitations" element={<Navigate to="/rentree/habilitations-opale" replace />} />
              <Route path="/habilitations/recap" element={<Navigate to="/rentree/habilitations-recap" replace />} />
              <Route path="/habilitations/rectorat" element={<Navigate to="/rentree/vue-rectorat" replace />} />
              <Route path="/liens-utiles" element={<LiensUtilesPage />} />
              <Route path="/enquetes-rectorat" element={<EnquetesHubPage />} />
              <Route path="/enquetes-rectorat/nomenclature" element={<NomenclaturePage />} />
              <Route path="/enquetes-rectorat/calendrier" element={<CalendrierCampagnesPage />} />
              <Route path="/enquetes-rectorat/vue-rectorat" element={<VueRectoratEnquetesPage />} />
              <Route path="/enquetes-rectorat/bibliotheque" element={<BibliothequePage />} />
              <Route path="/enquetes-rectorat/wizard-reliquats" element={<WizardReliquatsBopPage />} />
              <Route path="/enquetes-rectorat/bourses-rapprochement" element={<WizardBoursesSieclePage />} />
              <Route path="/enquetes-rectorat/relances" element={<RelancesPage />} />
              <Route path="/enquetes-rectorat/historique" element={<HistoriquePluriannuelPage />} />
              <Route path="/credit-nourriture" element={<CreditNourriture />} />
              <Route path="/regies" element={<RegiesCaisse />} />
              <Route path="/veille-juridique" element={<VeilleJuridique />} />
              <Route path="/controle-interne" element={<ControleInterne />} />
              <Route path="/logements" element={<LogementsPage />} />
              <Route path="/audit" element={<AuditHub />} />
              <Route path="/audit/:missionId" element={<AuditRun />} />
              <Route path="/execution-budgetaire" element={<ExecutionBudgetaire />} />
              <Route path="/parametres" element={<SettingsPage />} />
              <Route path="/hyperale/*" element={<HyperalePage />} />
              <Route path="/agence" element={<AgencePage />} />
              <Route path="/marches/*" element={<MarchesPage />} />
              <Route path="/admin/logs/regle-8" element={<Regle8LogsAdmin />} />
              <Route path="/entretiens" element={<EntretiensHome />} />
              <Route path="/entretiens/nouveau" element={<NouvelEntretienWizard />} />
              <Route path="/entretiens/campagne" element={<CampagneDashboard />} />
              <Route path="/entretiens/recours" element={<RecoursPage />} />
              <Route path="/entretiens/fiches-poste" element={<FichesPostePage />} />
              <Route path="/entretiens/export-esteve" element={<ExportEstevePage />} />
              <Route path="/entretiens/vue-rectorat" element={<VueRectoratEntretiensPage />} />
              <Route path="/aide" element={<AideAccueil />} />
              <Route path="/aide/article/:slug" element={<AideArticle />} />
              <Route path="/aide/module/:moduleId" element={<AideModule />} />
              <Route path="/aide/glossaire" element={<AideGlossaire />} />
              <Route path="/aide/faq" element={<AideFAQ />} />
              <Route path="/aide/modeles" element={<AideModeles />} />
              <Route path="/aide/onboarding/:profilId" element={<AideOnboarding />} />
              <Route path="/aide/reglementation" element={<AideReglementation />} />
              <Route path="/ressources/assistant-expert" element={<AssistantExpertPage />} />
              <Route path="/ressources/opale" element={<OpaleAccueil />} />
              <Route path="/ressources/opale/bibliotheque" element={<OpaleBibliotheque />} />
              <Route path="/ressources/opale/nouvelle" element={<OpaleWizardFiche />} />
              <Route path="/ressources/opale/edition/:id" element={<OpaleWizardFiche />} />
              <Route path="/ressources/opale/fiche/:slug" element={<OpaleFicheDetail />} />
              <Route path="/ressources/opale/mes-fiches" element={<OpaleMesFichesPage />} />
              <Route path="/ressources/opale/recherche" element={<OpaleRecherchePage />} />
              <Route path="/ressources/opale/forum" element={<OpaleForumPage />} />
              <Route path="/ressources/opale/tendances" element={<OpaleTendancesPage />} />
              <Route path="/ressources/opale/dashboard" element={<OpaleDashboardPage />} />
              <Route path="/ressources/opale/moderation" element={<OpaleModerationPage />} />
              <Route path="/ressources/opale/cgu" element={<OpaleCguPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <AuthedChat />
          </DemoModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
