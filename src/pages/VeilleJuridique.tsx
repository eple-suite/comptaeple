import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Scale, Search, Download, Printer, BookOpen, AlertTriangle, CheckCircle2, Clock, Calendar, Tag, ExternalLink, Filter, Plus, Bell, FileText, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createStyledPDF, savePDF, printPDF, type PDFOrientation } from "@/lib/pdfUtils";

// ===== Types =====
interface TexteJuridique {
  id: string;
  reference: string; // ex: "Décret n° 2024-xxx"
  titre: string;
  source: "JORF" | "BO_MEN" | "BO_DGFIP" | "circulaire" | "note_service" | "jurisprudence" | "instruction" | "arrete";
  datePublication: string;
  dateEntreeVigueur: string;
  categorie: TexteCategorie;
  sousCategorie: string;
  resume: string;
  impactEPLE: "fort" | "moyen" | "faible" | "information";
  actionRequise: string;
  delaiApplication: string; // ex: "Immédiat", "01/09/2026", "3 mois"
  statut: "a_traiter" | "en_cours" | "applique" | "non_applicable" | "archive";
  observations: string;
  lienOfficiel: string;
  etablissementsInformes: boolean;
  dateInformation: string;
  responsable: string; // "AC", "ordonnateur", "gestionnaire"
}

type TexteCategorie =
  | "comptabilite_publique"
  | "recouvrement"
  | "marches_publics"
  | "restauration_hebergement"
  | "bourses_aides"
  | "regies"
  | "fiscalite"
  | "patrimoine"
  | "rh_paie"
  | "controle_interne"
  | "audit"
  | "numerique_dematerialisation"
  | "securite_ehs"
  | "budget_finances";

const CATEGORIE_LABELS: Record<TexteCategorie, string> = {
  comptabilite_publique: "Comptabilité publique",
  recouvrement: "Recouvrement — SATD",
  marches_publics: "Marchés publics — Achats",
  restauration_hebergement: "Restauration & Hébergement",
  bourses_aides: "Bourses & Aides sociales",
  regies: "Régies",
  fiscalite: "Fiscalité — TVA",
  patrimoine: "Patrimoine — Inventaire",
  rh_paie: "RH & Paie",
  controle_interne: "Contrôle interne comptable",
  audit: "Audit — Certification",
  numerique_dematerialisation: "Numérique — Dématérialisation",
  securite_ehs: "Sécurité — EHS",
  budget_finances: "Budget & Finances",
};

const SOURCE_LABELS: Record<string, string> = {
  JORF: "Journal Officiel",
  BO_MEN: "BO Éducation Nationale",
  BO_DGFIP: "BO DGFiP",
  circulaire: "Circulaire",
  note_service: "Note de service",
  jurisprudence: "Jurisprudence",
  instruction: "Instruction",
  arrete: "Arrêté",
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  fort: { label: "Impact fort", color: "bg-destructive/10 text-destructive border-0" },
  moyen: { label: "Impact moyen", color: "bg-warning/10 text-warning border-0" },
  faible: { label: "Impact faible", color: "bg-muted text-muted-foreground border-0" },
  information: { label: "Information", color: "bg-primary/10 text-primary border-0" },
};

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  a_traiter: { label: "À traiter", color: "bg-destructive/10 text-destructive border-0" },
  en_cours: { label: "En cours", color: "bg-warning/10 text-warning border-0" },
  applique: { label: "Appliqué", color: "bg-success/10 text-success border-0" },
  non_applicable: { label: "Non applicable", color: "bg-muted text-muted-foreground border-0" },
  archive: { label: "Archivé", color: "bg-muted/60 text-muted-foreground border-0" },
};

// ===== Données de veille réalistes =====
const mockTextes: TexteJuridique[] = [
  {
    id: "vj1",
    reference: "Décret n° 2025-1245 du 15 décembre 2025",
    titre: "Modification du seuil de dispense de procédure pour les marchés publics des EPLE",
    source: "JORF",
    datePublication: "2025-12-16",
    dateEntreeVigueur: "2026-01-01",
    categorie: "marches_publics",
    sousCategorie: "Seuils de procédure",
    resume: "Le décret relève le seuil de dispense de procédure de 40 000 € HT à 50 000 € HT pour les marchés de fournitures et services des pouvoirs adjudicateurs, applicable aux EPLE. Les marchés entre 50 000 et 90 000 € restent soumis au MAPA simplifié (3 devis minimum). Au-delà de 221 000 € HT, la procédure formalisée s'applique.",
    impactEPLE: "fort",
    actionRequise: "Mettre à jour les procédures internes d'achat. Informer les ordonnateurs des établissements rattachés. Actualiser la note de service sur les seuils.",
    delaiApplication: "01/01/2026",
    statut: "en_cours",
    observations: "Vérifier la mise à jour dans Op@le. Former les gestionnaires.",
    lienOfficiel: "https://www.legifrance.gouv.fr/",
    etablissementsInformes: true,
    dateInformation: "2025-12-20",
    responsable: "AC",
  },
  {
    id: "vj2",
    reference: "Instruction DGFiP n° 2026-01-0012",
    titre: "Nouvelles modalités de la SATD dématérialisée via le portail PEPS",
    source: "instruction",
    datePublication: "2026-01-10",
    dateEntreeVigueur: "2026-03-01",
    categorie: "recouvrement",
    sousCategorie: "SATD — Procédures",
    resume: "L'instruction détaille les nouvelles modalités de dématérialisation des SATD via le portail PEPS (Portail d'Échange pour les Pouvoirs de Saisie). L'envoi papier des lettres aux tiers détenteurs (employeurs, banques) est remplacé par une télétransmission. Les agents comptables d'EPLE doivent s'inscrire sur le portail avant le 1er mars 2026.",
    impactEPLE: "fort",
    actionRequise: "Inscription sur le portail PEPS. Formation des agents. Mise à jour des procédures de recouvrement forcé.",
    delaiApplication: "01/03/2026",
    statut: "a_traiter",
    observations: "Demander les codes d'accès auprès de la DDFiP. Calendrier formation à établir.",
    lienOfficiel: "https://www.impots.gouv.fr/",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "AC",
  },
  {
    id: "vj3",
    reference: "Circulaire MEN n° 2026-012 du 20 janvier 2026",
    titre: "Campagne des bourses nationales 2026-2027 — Calendrier et modalités",
    source: "circulaire",
    datePublication: "2026-01-20",
    dateEntreeVigueur: "2026-02-01",
    categorie: "bourses_aides",
    sousCategorie: "Bourses — Calendrier",
    resume: "Fixe le calendrier de la campagne de bourses nationales pour l'année scolaire 2026-2027. Première période : du 1er avril au 30 juin 2026. Les revenus de référence sont ceux de l'avis d'imposition 2025 (revenus 2024). Les plafonds de ressources sont revalorisés de 2,5 %. Introduction de la demande 100% dématérialisée via EduConnect.",
    impactEPLE: "moyen",
    actionRequise: "Diffuser l'information aux familles. Préparer la campagne dans SIECLE-Bourses. Vérifier les comptes 441.",
    delaiApplication: "01/04/2026",
    statut: "a_traiter",
    observations: "Prévoir communication aux familles avant les vacances de février.",
    lienOfficiel: "https://www.education.gouv.fr/",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "gestionnaire",
  },
  {
    id: "vj4",
    reference: "Arrêté du 8 janvier 2026",
    titre: "Revalorisation des tarifs de restauration scolaire — Barème de référence 2026",
    source: "arrete",
    datePublication: "2026-01-10",
    dateEntreeVigueur: "2026-01-01",
    categorie: "restauration_hebergement",
    sousCategorie: "Tarifs — Barème",
    resume: "L'arrêté fixe le nouveau barème de référence pour les tarifs de restauration scolaire dans les EPLE pour l'année civile 2026. Le coût denrées de référence passe de 2,05 € à 2,15 € par repas. Le forfait hébergement est revalorisé de 3 %. Les collectivités territoriales sont invitées à ajuster les contributions en conséquence.",
    impactEPLE: "moyen",
    actionRequise: "Recalculer les tarifs au prochain CA. Ajuster les prévisions budgétaires SRH (service A2). Informer les familles.",
    delaiApplication: "Immédiat — prise en compte au 2e trimestre",
    statut: "applique",
    observations: "Tarifs votés au CA du 6 février 2026.",
    lienOfficiel: "https://www.legifrance.gouv.fr/",
    etablissementsInformes: true,
    dateInformation: "2026-01-15",
    responsable: "ordonnateur",
  },
  {
    id: "vj5",
    reference: "Note de service DGFiP n° 2025-12-098",
    titre: "Contrôle interne comptable — Référentiel actualisé pour les EPLE",
    source: "note_service",
    datePublication: "2025-12-05",
    dateEntreeVigueur: "2026-01-01",
    categorie: "controle_interne",
    sousCategorie: "CIC — Référentiel",
    resume: "Le référentiel de contrôle interne comptable (CIC) applicable aux EPLE est mis à jour. Principales évolutions : renforcement du contrôle des régies (fréquence trimestrielle au minimum), introduction de la traçabilité des mandatements dans Op@le, ajout de 5 nouveaux indicateurs de qualité comptable. Le taux cible de fiabilité est porté à 98 %.",
    impactEPLE: "fort",
    actionRequise: "Actualiser le plan de contrôle interne. Mettre en place les nouveaux indicateurs. Former les fondés de pouvoir.",
    delaiApplication: "01/01/2026",
    statut: "en_cours",
    observations: "Réunion des fondés de pouvoir prévue le 15/01/2026.",
    lienOfficiel: "https://www.impots.gouv.fr/",
    etablissementsInformes: true,
    dateInformation: "2025-12-10",
    responsable: "AC",
  },
  {
    id: "vj6",
    reference: "Ordonnance n° 2025-1389 du 30 novembre 2025",
    titre: "Réforme de la responsabilité des gestionnaires publics — Application aux EPLE",
    source: "JORF",
    datePublication: "2025-12-01",
    dateEntreeVigueur: "2026-01-01",
    categorie: "comptabilite_publique",
    sousCategorie: "Responsabilité — Régime juridique",
    resume: "L'ordonnance précise les modalités d'application de la réforme de la responsabilité des gestionnaires publics (CDBF supprimée, juridiction financière unique). Pour les agents comptables d'EPLE : suppression de la responsabilité personnelle et pécuniaire, remplacée par la responsabilité pour faute grave devant la Cour des comptes. Le contrôle sélectif de la dépense est renforcé.",
    impactEPLE: "fort",
    actionRequise: "Prendre connaissance du nouveau régime. Adapter les procédures de contrôle de la dépense. Mettre à jour la charte de l'agence comptable.",
    delaiApplication: "01/01/2026",
    statut: "en_cours",
    observations: "Formation IH2EF prévue en mars 2026.",
    lienOfficiel: "https://www.legifrance.gouv.fr/",
    etablissementsInformes: true,
    dateInformation: "2025-12-15",
    responsable: "AC",
  },
  {
    id: "vj7",
    reference: "Instruction Op@le n° 2026-02-003",
    titre: "Déploiement Op@le — Nouvelles fonctionnalités module Régie v3.2",
    source: "instruction",
    datePublication: "2026-02-01",
    dateEntreeVigueur: "2026-02-15",
    categorie: "regies",
    sousCategorie: "Op@le — Module régie",
    resume: "La version 3.2 du module Régie d'Op@le apporte : la gestion multi-régies par établissement, le contrôle automatique des plafonds de caisse, l'édition automatique du PV de vérification, l'interface avec les TPE pour le paiement par carte bancaire. Migration des données à planifier.",
    impactEPLE: "moyen",
    actionRequise: "Planifier la migration des données régie. Tester les nouvelles fonctionnalités. Former les régisseurs.",
    delaiApplication: "15/02/2026",
    statut: "a_traiter",
    observations: "Coordonner avec le service informatique académique.",
    lienOfficiel: "",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "AC",
  },
  {
    id: "vj8",
    reference: "Décret n° 2026-0089 du 25 janvier 2026",
    titre: "Obligation de facturation électronique pour les EPLE — Chorus Pro",
    source: "JORF",
    datePublication: "2026-01-26",
    dateEntreeVigueur: "2026-09-01",
    categorie: "numerique_dematerialisation",
    sousCategorie: "Facturation électronique",
    resume: "Extension de l'obligation de facturation électronique à toutes les transactions des EPLE via Chorus Pro. Les bons de commande et les pièces justificatives de dépense doivent être dématérialisés. Le décret fixe le format Factur-X comme format de référence pour les factures entrantes et sortantes.",
    impactEPLE: "fort",
    actionRequise: "Vérifier la configuration Chorus Pro. Mettre en place le workflow de validation dématérialisé. Former les services gestionnaires.",
    delaiApplication: "01/09/2026",
    statut: "a_traiter",
    observations: "Prévoir la formation pendant les vacances d'été.",
    lienOfficiel: "https://www.legifrance.gouv.fr/",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "AC",
  },
  {
    id: "vj9",
    reference: "Jurisprudence CRC Île-de-France n° 2025-JUR-0412",
    titre: "Obligation de provisionnement des créances anciennes — Compte 491",
    source: "jurisprudence",
    datePublication: "2025-11-15",
    dateEntreeVigueur: "2025-11-15",
    categorie: "comptabilite_publique",
    sousCategorie: "Provisions — Créances",
    resume: "La Chambre Régionale des Comptes rappelle l'obligation pour les agents comptables de provisionner les créances de plus de 2 ans (compte 491). L'absence de provisionnement constitue une irrégularité comptable susceptible d'engager la responsabilité du comptable. La CRC fixe un taux de provisionnement minimum de 50 % pour les créances de 2 à 3 ans, et 100 % au-delà.",
    impactEPLE: "moyen",
    actionRequise: "Vérifier l'état des comptes 411/416/491. Provisionner les créances anciennes. Documenter la politique de provisionnement.",
    delaiApplication: "Immédiat",
    statut: "applique",
    observations: "Contrôle effectué au 31/12/2025. Écritures passées.",
    lienOfficiel: "",
    etablissementsInformes: true,
    dateInformation: "2025-12-01",
    responsable: "AC",
  },
  {
    id: "vj10",
    reference: "Circulaire interministérielle du 5 février 2026",
    titre: "Plan de continuité comptable en cas de cyberattaque — Obligations des EPLE",
    source: "circulaire",
    datePublication: "2026-02-05",
    dateEntreeVigueur: "2026-03-01",
    categorie: "securite_ehs",
    sousCategorie: "Cybersécurité — PCA",
    resume: "Suite aux cyberattaques ayant touché plusieurs académies en 2025, la circulaire impose aux EPLE la mise en place d'un plan de continuité comptable (PCC). Ce plan doit prévoir : la sauvegarde hors-ligne des données comptables, une procédure de fonctionnement en mode dégradé (retour au papier), la notification CNIL sous 72h, et la reprise d'activité sous 5 jours ouvrés.",
    impactEPLE: "fort",
    actionRequise: "Rédiger le PCC. Tester les procédures de sauvegarde. Vérifier les accès Op@le en mode dégradé. Informer les établissements rattachés.",
    delaiApplication: "01/03/2026",
    statut: "a_traiter",
    observations: "Modèle de PCC à adapter à la configuration de l'agence comptable.",
    lienOfficiel: "",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "AC",
  },
  {
    id: "vj11",
    reference: "Note DAF A3 n° 2026-015",
    titre: "Campagne du compte financier 2025 — Calendrier et modalités",
    source: "note_service",
    datePublication: "2026-01-05",
    dateEntreeVigueur: "2026-01-15",
    categorie: "comptabilite_publique",
    sousCategorie: "Compte financier — Calendrier",
    resume: "La note fixe le calendrier de la campagne du compte financier 2025. Date limite de transmission au rectorat : 30 avril 2026. Présentation au CA avant le 30 juin 2026. Les nouveautés : intégration du bilan social dans le rapport annexe, ajout d'un volet développement durable, dématérialisation complète des pièces générales via Op@le.",
    impactEPLE: "fort",
    actionRequise: "Planifier les opérations de clôture. Préparer les états de développement des soldes. Rédiger le rapport de l'ordonnateur. Convoquer le CA.",
    delaiApplication: "30/04/2026",
    statut: "en_cours",
    observations: "Réunion de cadrage avec les fondés de pouvoir le 20/01/2026.",
    lienOfficiel: "",
    etablissementsInformes: true,
    dateInformation: "2026-01-10",
    responsable: "AC",
  },
  {
    id: "vj12",
    reference: "Décret n° 2026-0145 du 10 février 2026",
    titre: "Relèvement du plafond des régies d'avances et de recettes",
    source: "JORF",
    datePublication: "2026-02-11",
    dateEntreeVigueur: "2026-03-01",
    categorie: "regies",
    sousCategorie: "Régies — Plafonds",
    resume: "Le décret relève les plafonds des régies : avances de 2 000 € à 3 000 €, recettes de 5 000 € à 7 500 € par opération. Le plafond de l'encaisse du régisseur passe de 10 000 € à 15 000 €. Les cautionnements sont ajustés en conséquence.",
    impactEPLE: "moyen",
    actionRequise: "Actualiser les actes constitutifs des régies. Informer les régisseurs. Ajuster les cautionnements si nécessaire.",
    delaiApplication: "01/03/2026",
    statut: "a_traiter",
    observations: "",
    lienOfficiel: "https://www.legifrance.gouv.fr/",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "AC",
  },
  {
    id: "vj13",
    reference: "Décret n° 2012-1246 du 7 novembre 2012",
    titre: "Gestion budgétaire et comptable publique (GBCP) — Texte de référence",
    source: "JORF",
    datePublication: "2012-11-07",
    dateEntreeVigueur: "2013-01-01",
    categorie: "comptabilite_publique",
    sousCategorie: "Texte fondateur — GBCP",
    resume: "Décret fondateur régissant la gestion budgétaire et comptable de tous les organismes publics dont les EPLE. Articles clefs : art. 18-20 (responsabilité de l'AC), art. 42-43 (séparation ordonnateur/comptable), art. 195-199 (dispositions EPLE). Définit les obligations de contrôle de la validité de la dette, du recouvrement et de la conservation des fonds.",
    impactEPLE: "fort",
    actionRequise: "Texte permanent. Vérifier régulièrement la conformité des pratiques comptables avec les articles 18 à 20 et 42 à 43.",
    delaiApplication: "Permanent",
    statut: "applique",
    observations: "Texte fondamental — doit être connu de tout agent comptable d'EPLE.",
    lienOfficiel: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000026597003",
    etablissementsInformes: true,
    dateInformation: "2013-01-01",
    responsable: "AC",
  },
  {
    id: "vj14",
    reference: "Instruction codificatrice M9-6 (2026)",
    titre: "Nomenclature comptable des EPLE — M9-6 mise à jour 2026",
    source: "instruction",
    datePublication: "2025-12-20",
    dateEntreeVigueur: "2026-01-01",
    categorie: "comptabilite_publique",
    sousCategorie: "Nomenclature — Plan comptable",
    resume: "Mise à jour de l'instruction codificatrice M9-6 applicable aux EPLE. Principales évolutions : ajout des comptes Op@le à 6 chiffres, clarification de la distinction comptes État (4411, 44311, 4432, 4438) et collectivités (4412, 441220), mise à jour du circuit des bourses nationales (44311→468100→4112/4113→44312), nouveaux comptes de neutralisation.",
    impactEPLE: "fort",
    actionRequise: "Mettre à jour le plan comptable dans Op@le. Vérifier les imputations. Former les fondés de pouvoir aux nouveaux comptes.",
    delaiApplication: "01/01/2026",
    statut: "applique",
    observations: "Référentiel fondamental pour toute opération comptable EPLE.",
    lienOfficiel: "https://www.education.gouv.fr/",
    etablissementsInformes: true,
    dateInformation: "2026-01-05",
    responsable: "AC",
  },
  {
    id: "vj15",
    reference: "Circulaire rectorale — Enquête financière annuelle (EFA)",
    titre: "Campagne EFA 2026 — Remontée des indicateurs financiers annuels",
    source: "circulaire",
    datePublication: "2026-02-01",
    dateEntreeVigueur: "2026-02-15",
    categorie: "budget_finances",
    sousCategorie: "Enquêtes financières",
    resume: "Circulaire rectorale annuelle fixant les modalités de l'enquête financière annuelle. Données à remonter : balance définitive N-1, indicateurs FDR/BFR/trésorerie, effectifs, crédit nourriture, état des créances. Collecte via le portail académique.",
    impactEPLE: "fort",
    actionRequise: "Préparer les données. Renseigner le formulaire de remontée annuelle. Respecter le délai de transmission.",
    delaiApplication: "31/03/2026",
    statut: "a_traiter",
    observations: "Données nécessaires : balance, indicateurs, effectifs SRH.",
    lienOfficiel: "",
    etablissementsInformes: false,
    dateInformation: "",
    responsable: "AC",
  },
  {
    id: "vj16",
    reference: "Code de la commande publique — Titre préliminaire",
    titre: "Seuils de procédure applicables aux EPLE — Mise à jour 2026",
    source: "JORF",
    datePublication: "2019-04-01",
    dateEntreeVigueur: "2026-01-01",
    categorie: "marches_publics",
    sousCategorie: "Seuils — Procédures",
    resume: "Rappel des seuils applicables : <40 000 € HT (gré à gré), 40 000-90 000 € HT (MAPA simplifié, 3 devis), 90 000-221 000 € HT (MAPA avec publicité), >221 000 € HT (procédure formalisée). ATTENTION : les seuils s'apprécient par catégorie homogène de prestations sur l'année civile. Pour les voyages scolaires, cumuler par nature (transport, hébergement, etc.).",
    impactEPLE: "fort",
    actionRequise: "Vérifier les cumuls annuels par catégorie. Mettre en concurrence si seuil dépassé.",
    delaiApplication: "Permanent",
    statut: "applique",
    observations: "Outil de suivi des cumuls intégré dans le module Voyages.",
    lienOfficiel: "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000037701019/",
    etablissementsInformes: true,
    dateInformation: "2026-01-01",
    responsable: "AC",
  },
  {
    id: "vj17",
    reference: "Guide IH2EF — Passation de service de l'agent comptable",
    titre: "Référentiel de passation de service AC",
    source: "note_service",
    datePublication: "2025-09-01",
    dateEntreeVigueur: "2025-09-01",
    categorie: "comptabilite_publique",
    sousCategorie: "Passation de service AC",
    resume: "Guide de référence pour la passation de service entre agents comptables. Couvre : inventaire de caisse, rapprochement bancaire, état des créances, vérification des régies, inventaire du patrimoine, transfert des accès Op@le et PEPS.",
    impactEPLE: "moyen",
    actionRequise: "À utiliser lors de chaque changement d'affectation AC.",
    delaiApplication: "Permanent",
    statut: "applique",
    observations: "Document de référence IH2EF.",
    lienOfficiel: "https://www.ih2ef.gouv.fr/",
    etablissementsInformes: true,
    dateInformation: "2025-09-15",
    responsable: "AC",
  },
];

// ===== Component =====
const VeilleJuridique = () => {
  const [textes, setTextes] = useState<TexteJuridique[]>(mockTextes);
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [filterImpact, setFilterImpact] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [selectedTexte, setSelectedTexte] = useState<TexteJuridique | null>(null);
  const [pdfOrientation, setPdfOrientation] = useState<PDFOrientation>("portrait");
  const [openNew, setOpenNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    reference: "", titre: "", source: "circulaire" as TexteJuridique["source"],
    datePublication: "", dateEntreeVigueur: "", categorie: "comptabilite_publique" as TexteCategorie,
    sousCategorie: "", resume: "", impactEPLE: "moyen" as TexteJuridique["impactEPLE"],
    actionRequise: "", delaiApplication: "", observations: "", lienOfficiel: "", responsable: "AC",
  });

  const filtered = useMemo(() => {
    return textes.filter(t => {
      if (filterCategorie !== "all" && t.categorie !== filterCategorie) return false;
      if (filterImpact !== "all" && t.impactEPLE !== filterImpact) return false;
      if (filterStatut !== "all" && t.statut !== filterStatut) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.titre.toLowerCase().includes(q) && !t.reference.toLowerCase().includes(q) && !t.resume.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [textes, search, filterCategorie, filterImpact, filterStatut]);

  // KPIs
  const aTraiter = textes.filter(t => t.statut === "a_traiter").length;
  const impactFort = textes.filter(t => t.impactEPLE === "fort" && t.statut !== "applique" && t.statut !== "archive").length;
  const nonInformes = textes.filter(t => !t.etablissementsInformes && t.statut !== "archive" && t.statut !== "non_applicable").length;
  const delaisProches = textes.filter(t => {
    if (t.statut === "applique" || t.statut === "archive") return false;
    const d = new Date(t.dateEntreeVigueur);
    return d <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && d >= new Date();
  }).length;

  const handleAdd = () => {
    const newTexte: TexteJuridique = {
      id: `vj${Date.now()}`,
      ...form,
      statut: "a_traiter",
      etablissementsInformes: false,
      dateInformation: "",
    };
    setTextes([newTexte, ...textes]);
    setOpenNew(false);
    setForm({ reference: "", titre: "", source: "circulaire", datePublication: "", dateEntreeVigueur: "", categorie: "comptabilite_publique", sousCategorie: "", resume: "", impactEPLE: "moyen", actionRequise: "", delaiApplication: "", observations: "", lienOfficiel: "", responsable: "AC" });
  };

  const handleChangeStatut = (id: string, statut: TexteJuridique["statut"]) => {
    setTextes(textes.map(t => t.id === id ? { ...t, statut } : t));
  };

  const handleInformerEtablissements = (id: string) => {
    setTextes(textes.map(t => t.id === id ? { ...t, etablissementsInformes: true, dateInformation: new Date().toISOString().split("T")[0] } : t));
  };

  // ===== PDF Generation =====
  const genererBulletinVeille = () => {
    const doc = createStyledPDF({
      orientation: pdfOrientation,
      title: "Bulletin de Veille Juridique",
      subtitle: "Agent Comptable — Établissements rattachés",
    });
    const pw = doc.internal.pageSize.getWidth();
    let y = 48;

    doc.setTextColor(37, 68, 120);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Textes à impact fort — Actions requises", 14, y);
    y += 7;

    const fortTextes = textes.filter(t => t.impactEPLE === "fort" && t.statut !== "archive");
    autoTable(doc, {
      startY: y,
      head: [["Réf.", "Titre", "Source", "Entrée en vigueur", "Action requise", "Statut"]],
      body: fortTextes.map(t => [
        t.reference, t.titre.substring(0, 60) + (t.titre.length > 60 ? "…" : ""),
        SOURCE_LABELS[t.source], new Date(t.dateEntreeVigueur).toLocaleDateString("fr-FR"),
        t.actionRequise.substring(0, 80) + (t.actionRequise.length > 80 ? "…" : ""),
        STATUT_CONFIG[t.statut].label,
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 45 } },
    });

    y = (doc as any).lastAutoTable?.finalY || 120;
    y += 12;

    doc.setTextColor(37, 68, 120);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Tous les textes en veille", 14, y);
    y += 7;

    const actifs = textes.filter(t => t.statut !== "archive");
    autoTable(doc, {
      startY: y,
      head: [["Réf.", "Titre", "Catégorie", "Impact", "Délai", "Établ. informés"]],
      body: actifs.map(t => [
        t.reference,
        t.titre.substring(0, 50) + (t.titre.length > 50 ? "…" : ""),
        CATEGORIE_LABELS[t.categorie],
        IMPACT_CONFIG[t.impactEPLE].label,
        t.delaiApplication,
        t.etablissementsInformes ? "✓ Oui" : "✗ Non",
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable?.finalY || 200;
    y += 12;

    // Résumé par catégorie
    if (y < doc.internal.pageSize.getHeight() - 60) {
      doc.setTextColor(37, 68, 120);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Synthèse par domaine", 14, y);
      y += 7;

      const parCategorie: Record<string, number> = {};
      actifs.forEach(t => {
        parCategorie[CATEGORIE_LABELS[t.categorie]] = (parCategorie[CATEGORIE_LABELS[t.categorie]] || 0) + 1;
      });
      autoTable(doc, {
        startY: y,
        head: [["Domaine", "Nombre de textes"]],
        body: Object.entries(parCategorie).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, String(v)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 68, 120], textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });
    }

    savePDF(doc, `bulletin_veille_juridique_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const genererFicheTexte = (texte: TexteJuridique) => {
    const doc = createStyledPDF({
      orientation: pdfOrientation,
      title: "Fiche de Veille Juridique",
      subtitle: texte.reference,
    });
    let y = 48;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(texte.titre, 14, y, { maxWidth: doc.internal.pageSize.getWidth() - 28 });
    y += doc.splitTextToSize(texte.titre, doc.internal.pageSize.getWidth() - 28).length * 5 + 8;

    const fields = [
      ["Référence", texte.reference],
      ["Source", SOURCE_LABELS[texte.source]],
      ["Date de publication", new Date(texte.datePublication).toLocaleDateString("fr-FR")],
      ["Date d'entrée en vigueur", new Date(texte.dateEntreeVigueur).toLocaleDateString("fr-FR")],
      ["Catégorie", `${CATEGORIE_LABELS[texte.categorie]} — ${texte.sousCategorie}`],
      ["Impact EPLE", IMPACT_CONFIG[texte.impactEPLE].label],
      ["Délai d'application", texte.delaiApplication],
      ["Statut", STATUT_CONFIG[texte.statut].label],
      ["Responsable", texte.responsable],
      ["Établissements informés", texte.etablissementsInformes ? `Oui — ${new Date(texte.dateInformation).toLocaleDateString("fr-FR")}` : "Non"],
    ];

    autoTable(doc, {
      startY: y,
      body: fields.map(([k, v]) => [k, v]),
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 14, right: 14 },
      theme: "plain",
    });

    y = (doc as any).lastAutoTable?.finalY || 120;
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Résumé :", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const resumeLines = doc.splitTextToSize(texte.resume, doc.internal.pageSize.getWidth() - 28);
    doc.text(resumeLines, 14, y);
    y += resumeLines.length * 4 + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Action requise :", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const actionLines = doc.splitTextToSize(texte.actionRequise, doc.internal.pageSize.getWidth() - 28);
    doc.text(actionLines, 14, y);
    y += actionLines.length * 4 + 8;

    if (texte.observations) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Observations :", 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(texte.observations, doc.internal.pageSize.getWidth() - 28), 14, y);
    }

    savePDF(doc, `fiche_veille_${texte.id}.pdf`);
  };

  const imprimerBulletin = () => {
    const doc = createStyledPDF({
      orientation: pdfOrientation,
      title: "Bulletin de Veille Juridique",
      subtitle: "Agent Comptable — Établissements rattachés",
    });
    let y = 48;
    const actifs = textes.filter(t => t.statut !== "archive");

    actifs.forEach((t, i) => {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(37, 68, 120);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${t.titre}`, 14, y, { maxWidth: doc.internal.pageSize.getWidth() - 28 });
      const titleLines = doc.splitTextToSize(`${i + 1}. ${t.titre}`, doc.internal.pageSize.getWidth() - 28);
      y += titleLines.length * 4 + 3;

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${t.reference} — ${SOURCE_LABELS[t.source]} — ${IMPACT_CONFIG[t.impactEPLE].label} — Délai : ${t.delaiApplication}`, 14, y);
      y += 5;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(t.resume, doc.internal.pageSize.getWidth() - 28);
      doc.text(lines, 14, y);
      y += lines.length * 3.5 + 3;

      if (t.actionRequise) {
        doc.setFont("helvetica", "bold");
        doc.text("→ " + t.actionRequise.substring(0, 120), 14, y, { maxWidth: doc.internal.pageSize.getWidth() - 28 });
        y += 5;
      }
      y += 5;
    });

    printPDF(doc);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Veille juridique</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Suivi réglementaire — Agent comptable • EPLE & établissements rattachés</p>
            </div>
          </div>
        </div>
          <div className="flex gap-2">
            <Select value={pdfOrientation} onValueChange={(v: PDFOrientation) => setPdfOrientation(v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Paysage</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={imprimerBulletin} className="h-8 text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
            </Button>
            <Button size="sm" variant="outline" onClick={genererBulletinVeille} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Bulletin PDF
            </Button>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0 h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un texte</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Ajouter un texte à la veille</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Référence</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Décret n° 2026-..." /></div>
                    <div className="col-span-2"><Label>Titre</Label><Input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} /></div>
                    <div>
                      <Label>Source</Label>
                      <Select value={form.source} onValueChange={(v: any) => setForm({ ...form, source: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select value={form.categorie} onValueChange={(v: any) => setForm({ ...form, categorie: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Date de publication</Label><Input type="date" value={form.datePublication} onChange={e => setForm({ ...form, datePublication: e.target.value })} /></div>
                    <div><Label>Date d'entrée en vigueur</Label><Input type="date" value={form.dateEntreeVigueur} onChange={e => setForm({ ...form, dateEntreeVigueur: e.target.value })} /></div>
                    <div>
                      <Label>Impact EPLE</Label>
                      <Select value={form.impactEPLE} onValueChange={(v: any) => setForm({ ...form, impactEPLE: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(IMPACT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Délai d'application</Label><Input value={form.delaiApplication} onChange={e => setForm({ ...form, delaiApplication: e.target.value })} placeholder="01/09/2026" /></div>
                  </div>
                  <div><Label>Sous-catégorie</Label><Input value={form.sousCategorie} onChange={e => setForm({ ...form, sousCategorie: e.target.value })} /></div>
                  <div><Label>Résumé</Label><Textarea value={form.resume} onChange={e => setForm({ ...form, resume: e.target.value })} rows={3} /></div>
                  <div><Label>Action requise</Label><Textarea value={form.actionRequise} onChange={e => setForm({ ...form, actionRequise: e.target.value })} rows={2} /></div>
                  <div><Label>Lien officiel</Label><Input value={form.lienOfficiel} onChange={e => setForm({ ...form, lienOfficiel: e.target.value })} placeholder="https://..." /></div>
                  <div><Label>Observations</Label><Input value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} /></div>
                  <Button onClick={handleAdd} disabled={!form.reference || !form.titre} className="w-full gradient-primary border-0">Ajouter à la veille</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="À traiter" value={`${aTraiter}`} icon={AlertTriangle} variant="destructive" />
        <KpiCard title="Impact fort en cours" value={`${impactFort}`} icon={Scale} variant="warning" />
        <KpiCard title="Établ. non informés" value={`${nonInformes}`} icon={Bell} variant="warning" />
        <KpiCard title="Échéances < 30 j" value={`${delaisProches}`} icon={Clock} variant="primary" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un texte..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategorie} onValueChange={setFilterCategorie}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterImpact} onValueChange={setFilterImpact}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Impact" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous impacts</SelectItem>
            {Object.entries(IMPACT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des textes */}
      <div className="space-y-3">
        {filtered.map(t => (
          <Card key={t.id} className={`shadow-card transition-shadow hover:shadow-card-hover ${t.impactEPLE === "fort" && t.statut !== "applique" ? "border-l-4 border-l-destructive" : ""}`}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  t.impactEPLE === "fort" ? "bg-destructive/10" :
                  t.impactEPLE === "moyen" ? "bg-warning/10" :
                  "bg-muted"
                }`}>
                  <Scale className={`h-5 w-5 ${
                    t.impactEPLE === "fort" ? "text-destructive" :
                    t.impactEPLE === "moyen" ? "text-warning" :
                    "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{t.titre}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{t.reference}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] ${IMPACT_CONFIG[t.impactEPLE].color}`}>
                        {IMPACT_CONFIG[t.impactEPLE].label}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] ${STATUT_CONFIG[t.statut].color}`}>
                        {STATUT_CONFIG[t.statut].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {CATEGORIE_LABELS[t.categorie]}</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {SOURCE_LABELS[t.source]}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(t.dateEntreeVigueur).toLocaleDateString("fr-FR")}</span>
                    {!t.etablissementsInformes && t.statut !== "archive" && (
                      <span className="flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" /> Établissements non informés</span>
                    )}
                  </div>

                  {expandedId === t.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-3">
                      <Separator />
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div><span className="text-muted-foreground">Délai d'application :</span> <strong>{t.delaiApplication}</strong></div>
                        <div><span className="text-muted-foreground">Responsable :</span> <strong>{t.responsable}</strong></div>
                        <div><span className="text-muted-foreground">Sous-catégorie :</span> <strong>{t.sousCategorie}</strong></div>
                        <div><span className="text-muted-foreground">Établ. informés :</span> <strong>{t.etablissementsInformes ? `Oui (${new Date(t.dateInformation).toLocaleDateString("fr-FR")})` : "Non"}</strong></div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-xs">
                        <p className="font-semibold text-muted-foreground mb-1">Résumé</p>
                        <p>{t.resume}</p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3 text-xs">
                        <p className="font-semibold text-primary mb-1">Action requise</p>
                        <p>{t.actionRequise}</p>
                      </div>
                      {t.observations && (
                        <div className="text-xs"><span className="text-muted-foreground">Observations :</span> {t.observations}</div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {t.statut === "a_traiter" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleChangeStatut(t.id, "en_cours")}>
                            <Clock className="h-3 w-3 mr-1" /> Passer en cours
                          </Button>
                        )}
                        {(t.statut === "a_traiter" || t.statut === "en_cours") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleChangeStatut(t.id, "applique")}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Marquer appliqué
                          </Button>
                        )}
                        {!t.etablissementsInformes && t.statut !== "archive" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleInformerEtablissements(t.id)}>
                            <Bell className="h-3 w-3 mr-1" /> Marquer informés
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererFicheTexte(t)}>
                          <FileText className="h-3 w-3 mr-1" /> Fiche PDF
                        </Button>
                        {t.lienOfficiel && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                            <a href={t.lienOfficiel} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" /> Source officielle
                            </a>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
                <Button
                  size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  {expandedId === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun texte ne correspond aux filtres sélectionnés.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VeilleJuridique;
