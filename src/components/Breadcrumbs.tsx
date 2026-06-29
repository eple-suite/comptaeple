import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Fil d'Ariane cohérent (amélioration #21) dérivé de l'URL. Les segments
// techniques (id/uuid/slug long) sont masqués ; les autres sont mappés vers un
// libellé métier, avec humanisation par défaut.

const LABELS: Record<string, string> = {
  audit: "Audit", regies: "Régies & caisse", satd: "SATD", logements: "Logements",
  etablissements: "Établissements", parametres: "Paramètres", voyages: "Voyages",
  "voyages-v2": "Voyages", "fonds-sociaux": "Fonds sociaux", "fonds-sociaux-v2": "Fonds sociaux",
  "credit-nourriture": "Crédit nourriture", "execution-budgetaire": "Exécution budgétaire",
  "compte-financier": "Compte financier", "controle-interne": "Contrôle interne",
  "valeurs-inactives": "Valeurs inactives", "cfa-npec": "CFA / NPEC", cfa: "CFA",
  entretiens: "Entretiens", ressources: "Ressources", opale: "Op@le", marches: "Marchés",
  balance: "Balance", "fonds-roulement": "Fonds de roulement", habilitations: "Habilitations",
  "enquetes-rectorat": "Enquêtes rectorat", "veille-juridique": "Veille juridique",
  "liens-utiles": "Liens utiles", indicateurs: "Indicateurs", aide: "Aide", agence: "Agence",
  admin: "Administration", import: "Import", rentree: "Rentrée", hyperale: "Hyper@le",
  nouveautes: "Nouveautés", "design-system": "Système de design", fiche: "Fiche",
};

const isId = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || s.length > 24;
const label = (seg: string) =>
  LABELS[seg] ?? seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const all = pathname.split("/").filter(Boolean);
  if (all.length === 0) return null;

  const items: { label: string; href: string }[] = [];
  for (let i = 0; i < all.length; i++) {
    if (isId(all[i])) continue;
    items.push({ label: label(all[i]), href: "/" + all.slice(0, i + 1).join("/") });
  }
  if (items.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild><Link to="/">Accueil</Link></BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((c, i) => (
          <Fragment key={c.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === items.length - 1 ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild><Link to={c.href}>{c.label}</Link></BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
