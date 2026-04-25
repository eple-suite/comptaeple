import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

function StubPage({ titre, desc }: { titre: string; desc: string }) {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme AIDE Op@le</Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Construction className="h-6 w-6 text-warning" />
            <CardTitle>{titre}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p>{desc}</p>
          <p className="text-xs">Cette section sera enrichie dans une prochaine itération. La structure de données et les politiques d'accès sont déjà en place.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export const OpaleMesFichesPage = () => <StubPage titre="Mes fiches" desc="Brouillons, fiches soumises et publiées par vous." />;
export const OpaleRecherchePage = () => <StubPage titre="Recherche avancée" desc="Recherche full-text par symptôme, version Op@le, module et criticité." />;
export const OpaleForumPage = () => <StubPage titre="Forum Q&R inter-AC" desc="Posez vos questions et répondez aux collègues de l'académie." />;
export const OpaleTendancesPage = () => <StubPage titre="Tendances et alertes" desc="Problèmes Op@le récurrents identifiés sur l'académie." />;
export const OpaleDashboardPage = () => <StubPage titre="Tableau de bord académique" desc="KPI plateforme : fiches publiées, taux d'utilité, modules problématiques." />;
export const OpaleModerationPage = () => <StubPage titre="Modération académique" desc="File des fiches en attente de validation. Réservé aux modérateurs Op@le." />;
export const OpaleCguPage = () => <StubPage titre="Conditions générales d'utilisation" desc="Licence Creative Commons CC-BY-SA. RGPD. Propriété intellectuelle Op@le / Inetum respectée." />;