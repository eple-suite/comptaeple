import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Scale, ExternalLink } from "lucide-react";

const SOURCES = [
  { code: "M9-6", titre: "Instruction codificatrice M9-6", date: "19 janvier 2026", emetteur: "DGFiP",
    description: "4 tomes + annexes (26 planches comptables). Régit la comptabilité générale des EPLE.",
    portee: "EPLE — toutes opérations comptables et budgétaires.", url: "https://www.collectivites-locales.gouv.fr/" },
  { code: "GBCP", titre: "Décret n° 2012-1246 (Gestion Budgétaire et Comptable Publique)", date: "7 novembre 2012",
    emetteur: "Premier ministre", description: "Titre Ier (principes fondamentaux) + dispositions agents comptables (art. 14+).",
    portee: "Application restreinte aux EPLE (art. 4) — séparation ordonnateur/comptable.",
    url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000026597003" },
  { code: "Code éducation", titre: "Code de l'éducation — partie réglementaire", date: "Consolidé au 14 mars 2026",
    emetteur: "Législateur", description: "Articles R.421-1 à R.421-79. Compétences chef d'établissement, ordonnateur, agent comptable.",
    portee: "Tout EPLE.", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006071191/LEGISCTA000006182465" },
  { code: "RGP — Ordonnance 2022-408", titre: "Régime de Responsabilité financière des Gestionnaires Publics", date: "23 mars 2022 (en vigueur 01/01/2023)",
    emetteur: "Législateur", description: "Remplace la responsabilité personnelle et pécuniaire (RPP) des comptables publics. Mention obligatoire dans tous les actes : « Le présent agent comptable n'est pas soumis à cautionnement ».",
    portee: "Tous comptables publics (dont AC d'EPLE).", url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000045389081" },
  { code: "CCP", titre: "Code de la Commande Publique — décret 2025-1386", date: "29 décembre 2025",
    emetteur: "Premier ministre", description: "Seuils 2026 : dispense 40 k€ HT (60 k€ HT à compter du 01/04/2026). Procédure formalisée européenne ≥ 216 000 € HT.",
    portee: "Marchés publics EPLE.", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000050858789" },
  { code: "RGPD", titre: "Règlement (UE) 2016/679", date: "27 avril 2016 (applicable 25 mai 2018)",
    emetteur: "Parlement européen et Conseil", description: "Protection des données personnelles. Obligations : registre des traitements (art. 30), droit d'accès (art. 15), notification violation 72h (art. 33).",
    portee: "Tout traitement de données nominatives (élèves, agents, familles).",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj" },
  { code: "Décret 2010-888", titre: "Entretien professionnel des fonctionnaires", date: "28 juillet 2010",
    emetteur: "Premier ministre", description: "Cadre général de l'entretien annuel. Circuit N+1 → N+2 → agent. Support du CIA et avancements.",
    portee: "Fonctionnaires titulaires.", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000022531583" },
  { code: "Circulaire MENE2407159C", titre: "Voyages scolaires", date: "16 juillet 2024",
    emetteur: "MENJ — DGESCO", description: "Remplace la circulaire 2011-117. Renforce la sécurité, l'autorisation parentale et les garanties financières (APST).",
    portee: "Voyages scolaires en EPLE.", url: "https://www.education.gouv.fr/" },
  { code: "Décrets 2019-798 / 2020-922", titre: "Régies d'avances et de recettes", date: "2019 / 2020",
    emetteur: "Premier ministre", description: "Cadre des régies des EPLE. Avis conforme DDFiP requis. Régisseur titulaire ≠ suppléant (séparation des fonctions).",
    portee: "Toute régie d'EPLE.", url: "https://www.legifrance.gouv.fr/" },
  { code: "LF 66-948 art. 21", titre: "Règle des 8 €", date: "22 décembre 1966",
    emetteur: "Législateur", description: "En deçà de 8 € (par titre, hors créances cumulées), le comptable n'est pas tenu d'engager le recouvrement.",
    portee: "Recouvrement des créances EPLE.", url: "https://www.legifrance.gouv.fr/" },
];

export default function AideReglementation() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/aide")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Mode d'emploi
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> Index réglementaire</CardTitle>
          <p className="text-sm text-muted-foreground">{SOURCES.length} sources de référence consolidées avec date d'application.</p>
        </CardHeader>
      </Card>
      <div className="space-y-3">
        {SOURCES.map((s) => (
          <Card key={s.code}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Badge variant="default" className="shrink-0">{s.code}</Badge>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{s.titre}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                    <span>📅 {s.date}</span>
                    <span>•</span>
                    <span>{s.emetteur}</span>
                  </div>
                  <p className="text-sm mt-2">{s.description}</p>
                  <p className="text-xs text-muted-foreground mt-1"><strong>Portée :</strong> {s.portee}</p>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                      Texte officiel <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}