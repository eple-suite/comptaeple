import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, ChevronRight } from "lucide-react";

/**
 * Mode d'emploi du module Paramètres — 8 chapitres pédagogiques
 * Niveau IH2EF / EAFC. Réf : GBCP, Code éducation, RGP 2022-408, RGPD.
 */
const CHAPITRES = [
  {
    id: "ch1",
    titre: "1. Vue d'ensemble du module Paramètres",
    refs: ["Code éducation R.421-77", "GBCP 2012-1246 art. 86"],
    sections: [
      { h: "Finalité institutionnelle", p: "Le module Paramètres constitue la cellule RH et institutionnelle du groupement comptable. Il agrège la carte d'identité juridique du groupement, le registre des établissements rattachés, le bottin des agents BIATSS, les délégations de signature, les arrêtés administratifs et le registre RGPD." },
      { h: "Architecture", p: "9 onglets (Tableau de bord · Groupement · Établissements · Agents BIATSS · Délégations · Bottin · Arrêtés · RGPD · Mode d'emploi) reposant sur 8 tables PostgreSQL avec RLS et un moteur de validation métier centralisé." },
      { h: "Cadre réglementaire de référence", p: "Décret GBCP 2012-1246 (art. 10, 16, 78, 86), Code de l'éducation (R.421-9, R.421-13, R.421-77), instruction codificatrice 06-031-A-B-M (régies), ordonnance RGP 2022-408 (responsabilité financière), règlement (UE) 2016/679 (RGPD)." },
    ],
  },
  {
    id: "ch2",
    titre: "2. Carte d'identité du groupement",
    refs: ["GBCP art. 86", "Décret 2012-1246"],
    sections: [
      { h: "Champs obligatoires", p: "Nom, code groupement, rectorat, académie, région académique, date de l'arrêté constitutif, identité de l'agent comptable titulaire et date de prise de fonction." },
      { h: "Pièces à joindre", p: "URL de l'arrêté constitutif (stockage externe ou Lovable Cloud Storage). Conservation : durée de vie du groupement." },
      { h: "Cas particulier Guadeloupe", p: "Région académique \"Guadeloupe\" ; rectorat libellé \"Rectorat de la Guadeloupe\". Code groupement à formaliser auprès de la DAF rectorale." },
    ],
  },
  {
    id: "ch3",
    titre: "3. Établissements & UAI / SIRET",
    refs: ["Référentiel RAMSESE", "Répertoire SIRENE"],
    sections: [
      { h: "Format UAI (RAMSESE)", p: "7 chiffres + 1 lettre. La validation rejette tout UAI non conforme. La duplication d'UAI est interdite par contrainte d'unicité." },
      { h: "SIRET (Luhn)", p: "14 chiffres validés par algorithme de Luhn. Un SIRET invalide bloque la sauvegarde de l'établissement." },
      { h: "Coordonnées", p: "E-mails secrétariat / intendance contrôlés (RFC 5322). Téléphones : formats DOM (0590, 0690, 0691, 0696) et métropole acceptés." },
    ],
  },
  {
    id: "ch4",
    titre: "4. Agents BIATSS — séparation des fonctions",
    refs: ["GBCP art. 10 et 78", "Décret 86-83"],
    sections: [
      { h: "Rôles incompatibles (CICF)", p: "Agent comptable / Ordonnateur ; AC / Régisseur ; Ordonnateur / Régisseur ; Correspondant CICF / AC ou Ordonnateur. Tout cumul incompatible déclenche une alerte bloquante \"GBCP_SEPARATION\"." },
      { h: "Régies — suppléance obligatoire", p: "Tout régisseur doit avoir un suppléant désigné par arrêté (instruction 06-031-A-B-M art. 5). Le moteur de validation alerte tant qu'aucun suppléant actif n'est rattaché au groupement." },
      { h: "Statuts & corps", p: "Pour un titulaire, le corps est obligatoire. Pour un détaché entrant ou sortant, l'administration d'origine est obligatoire." },
    ],
  },
  {
    id: "ch5",
    titre: "5. Délégations de signature",
    refs: ["R.421-13", "GBCP art. 16"],
    sections: [
      { h: "5 types pris en charge", p: "Délégation ordonnateur générale, délégation ordonnateur partielle, délégation AC, fondé de pouvoir, mandataire." },
      { h: "Cycle de vie", p: "Active → Expire bientôt (< 30 j) → Expirée → Abrogée. Une délégation abrogée est conservée pour traçabilité (motif obligatoire)." },
      { h: "Plafonds financiers", p: "Le plafond peut être fixé en euros pour limiter la portée d'une délégation partielle (ex : marchés < 25 000 €)." },
    ],
  },
  {
    id: "ch6",
    titre: "6. Arrêtés & actes administratifs",
    refs: ["13 types", "RGP 2022-408", "Instruction 06-031-A-B-M"],
    sections: [
      { h: "Types d'actes générés", p: "Nominations (régisseurs, suppléants, mandataires), arrêtés constitutifs / abrogations de régies, délégations de signature ordo et AC, abrogations, engagements AC, PV d'installation et de remise de service, lettre de mission CICF." },
      { h: "Mention RGP 2022-408", p: "Pour les actes de régisseur et d'agent comptable, la mention \"le cautionnement n'est plus exigé\" est insérée automatiquement (ordonnance 2022-408 du 23/03/2022)." },
      { h: "Archivage probant", p: "Chaque acte généré est horodaté et son contenu HTML est haché en SHA-256 stocké dans <code>arretes_actes.contenu_hash</code> (preuve d'intégrité)." },
    ],
  },
  {
    id: "ch7",
    titre: "7. Imports CSV / XLSX",
    refs: ["Mapping intelligent FR/EN", "Déduplication"],
    sections: [
      { h: "Détection automatique", p: "Délimiteur (; , tab |), encodage UTF-8 / Windows-1252, BOM. Mapping suggéré à partir d'alias (matricule EN, nom usage, ddn, etc.)." },
      { h: "Aperçu sec (dry-run)", p: "10 premières lignes affichées avec mapping ; aucune écriture en base avant validation explicite." },
      { h: "Déduplication", p: "Agents dédupliqués par matricule EN puis (nom + prénom + DDN). Établissements dédupliqués par UAI (clé RAMSESE)." },
    ],
  },
  {
    id: "ch8",
    titre: "8. RGPD — conformité Art. 13 / 15 / 30",
    refs: ["UE 2016/679", "Loi 78-17 modifiée"],
    sections: [
      { h: "Registre Art. 30", p: "5 traitements documentés : agents, établissements, actes, évaluations, régies. Chaque fiche précise base légale, finalité, destinataires, durée de conservation et données collectées." },
      { h: "Mention Art. 13/14", p: "Mention d'information standard à afficher à chaque collecte (formulaire d'inscription, fiche agent, etc.)." },
      { h: "Demande d'accès Art. 15", p: "Génération à la demande d'un rapport HTML / PDF reprenant l'intégralité des données détenues sur un agent. Toute consultation est tracée dans <code>rgpd_acces_logs</code>." },
    ],
  },
];

export default function ModeEmploiParametres() {
  const [open, setOpen] = useState<string>("ch1");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><CardTitle className="text-base">Mode d'emploi — 8 chapitres</CardTitle></div>
            <Badge variant="outline">Niveau IH2EF / EAFC</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v || "")}>
            {CHAPITRES.map((c) => (
              <AccordionItem key={c.id} value={c.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold">{c.titre}</span>
                    <div className="flex flex-wrap gap-1 ml-auto">
                      {c.refs.map((r) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {c.sections.map((s, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <h4 className="text-sm font-semibold mb-1">{s.h}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: s.p }} />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => window.print()}>Imprimer le mode d'emploi</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}