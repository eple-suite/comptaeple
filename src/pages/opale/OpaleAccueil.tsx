import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Plus, Search, MessageSquare, BarChart3, Shield, AlertTriangle, FileText,
} from "lucide-react";
import { RappelOfficielBanner } from "@/components/opale/RappelOfficielBanner";

const TUILES = [
  { to: "/ressources/opale/bibliotheque", titre: "Bibliothèque de fiches", desc: "Consulter les fiches publiées par les AC de l'académie", icon: BookOpen },
  { to: "/ressources/opale/recherche", titre: "Recherche avancée", desc: "Par symptôme, version, module, criticité", icon: Search },
  { to: "/ressources/opale/nouvelle", titre: "Soumettre une fiche", desc: "Capitaliser une procédure ou un blocage résolu", icon: Plus },
  { to: "/ressources/opale/mes-fiches", titre: "Mes fiches", desc: "Brouillons, soumises, publiées", icon: FileText },
  { to: "/ressources/opale/forum", titre: "Forum Q&R inter-AC", desc: "Poser une question, répondre à un collègue", icon: MessageSquare },
  { to: "/ressources/opale/tendances", titre: "Tendances et alertes", desc: "Problèmes récurrents identifiés", icon: AlertTriangle },
  { to: "/ressources/opale/dashboard", titre: "Tableau de bord", desc: "KPI plateforme académique", icon: BarChart3 },
  { to: "/ressources/opale/moderation", titre: "Modération", desc: "Réservé aux modérateurs académiques", icon: Shield },
];

export default function OpaleAccueil() {
  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Ressources › AIDE Op@le académique</p>
        <h1 className="font-display text-3xl font-bold">Plateforme de capitalisation Op@le</h1>
        <p className="text-muted-foreground max-w-3xl">
          Mutualisation des connaissances Op@le entre les agents comptables de l'académie de la
          Guadeloupe. <strong>Complémentaire</strong> à l'assistance officielle (DAF A3 / Pléiade /
          Inetum), jamais substitut.
        </p>
      </header>

      <RappelOfficielBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TUILES.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.titre}</CardTitle>
                </div>
                <CardDescription className="pt-2">{t.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Charte de contribution</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>RGPD</strong> : aucune donnée nominative dans les captures (élèves, familles, agents).</p>
          <p>• <strong>Propriété intellectuelle</strong> : pas de reproduction de manuels Op@le officiels (Inetum).</p>
          <p>• <strong>Versioning</strong> : la version Op@le concernée est obligatoire sur chaque fiche.</p>
          <p>• <strong>Modération</strong> : les fiches en visibilité académique sont relues par un modérateur rectoral avant publication.</p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/ressources/opale/cgu">Lire les conditions générales</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}