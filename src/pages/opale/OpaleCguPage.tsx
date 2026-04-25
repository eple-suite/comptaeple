import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function OpaleCguPage() {
  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
      </Button>
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> Conditions générales d'utilisation</h1>
        <p className="text-muted-foreground">Plateforme académique AIDE Op@le — Académie de la Guadeloupe.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Positionnement</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>La plateforme est <strong>complémentaire</strong> à l'assistance officielle Op@le (DAF A3, Pléiade, Inetum). Elle ne s'y substitue jamais.</p>
          <p>Les contributions reflètent l'expérience opérationnelle des agents comptables, sans valeur réglementaire opposable.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">2. Licence et propriété intellectuelle</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Les fiches publiées sont diffusées sous licence <strong>Creative Commons CC-BY-SA 4.0</strong> entre les agents comptables de l'académie.</p>
          <p>La reproduction de manuels Op@le officiels (Inetum) est interdite. Les références à la documentation officielle doivent être citées (titre, version, page).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">3. RGPD et anonymisation</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Aucune donnée nominative (élèves, familles, agents) ne doit apparaître dans les fiches, captures, ou échanges du forum.</p>
          <p>Les éléments suivants sont automatiquement détectés et bloqués à la publication : codes UAI, SIRET, INE, emails, numéros de téléphone, IBAN.</p>
          <p>Les consultations sont journalisées (table <code>opale_acces_log</code>) à des fins de traçabilité, conformément à l'art. 30 RGPD.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">4. Modération</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Les fiches en visibilité <strong>académique</strong> ou <strong>nationale</strong> sont relues par un modérateur rectoral avant publication.</p>
          <p>Le rectorat se réserve le droit de retirer ou archiver toute contribution non conforme.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">5. Versioning Op@le</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p>La version Op@le concernée est obligatoire sur chaque fiche. Les fiches deviennent automatiquement « à vérifier » après la périodicité définie (défaut 12 mois).</p>
        </CardContent>
      </Card>
    </div>
  );
}