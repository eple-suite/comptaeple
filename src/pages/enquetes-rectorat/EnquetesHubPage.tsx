import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  BookOpen, CalendarDays, FileBarChart, GraduationCap,
  Eye, Library, Send, History, ClipboardList,
} from "lucide-react";

const SOUS_PAGES = [
  { url: "/enquetes-rectorat/nomenclature", title: "Nomenclature M9-6", icon: Library,
    desc: "Référentiel comptes 4411X, 44191X, 443110, 4412X, 4413X, 4416X, 4417X, 44181X." },
  { url: "/enquetes-rectorat/calendrier", title: "Calendrier des campagnes", icon: CalendarDays,
    desc: "Échéances pré-chargées année scolaire (mars → décembre)." },
  { url: "/enquetes-rectorat/bibliotheque", title: "Bibliothèque d'enquêtes", icon: BookOpen,
    desc: "11 enquêtes pré-configurées prêtes à lancer." },
  { url: "/enquetes-rectorat/wizard-reliquats", title: "Wizard reliquats BOP", icon: FileBarChart,
    desc: "Saisie guidée des reliquats par programme État / collectivités / UE." },
  { url: "/enquetes-rectorat/bourses-rapprochement", title: "Rapprochement bourses SIECLE ↔ Op@le", icon: GraduationCap,
    desc: "Contrôle automatique du C/443110 vs état SIECLE des boursiers." },
  { url: "/enquetes-rectorat/vue-rectorat", title: "Vue rectorat consultant", icon: Eye,
    desc: "Tableau de bord académique en lecture seule (rôle observateur_rectoral)." },
  { url: "/enquetes-rectorat/relances", title: "Suivi & relances internes", icon: Send,
    desc: "Tableau AC → ordonnateurs avec relances automatiques par EPLE." },
  { url: "/enquetes-rectorat/historique", title: "Historique pluriannuel", icon: History,
    desc: "Comparaison N / N-1 / N-2 / N-3 et détection de trajectoires." },
];

export default function EnquetesHubPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Enquêtes Rectorat"
        description="Plateforme académique de pilotage des enquêtes — M9-6 tome 3, note DAF A3, circulaire MENE1704160C 17/02/2017."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOUS_PAGES.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.url} to={s.url}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{s.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}