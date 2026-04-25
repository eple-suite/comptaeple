// ═══════════════════════════════════════════════════════════════
// Accueil du module Action sociale & Enquête Rectorat (v2)
// 4 tuiles principales + compteurs live
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, FileText, ClipboardCheck, BarChart3, HandHeart, AlertTriangle } from "lucide-react";
import { useEleves, useDecisions, useCommissions } from "./useFsData";
import { currentAnneeScolaire } from "./fsv2Types";
import { evaluerCompletudeEleve } from "./fsEnqueteHelpers";
import { motion } from "framer-motion";

const tiles = [
  { to: "/fonds-sociaux/v2/eleves", icon: Users, label: "Élèves & Classes", desc: "Base élèves de l'établissement" },
  { to: "/fonds-sociaux/v2/decisions", icon: FileText, label: "Demandes & Décisions", desc: "Aides FS & FSC, workflow complet" },
  { to: "/fonds-sociaux/v2/commissions", icon: ClipboardCheck, label: "Commissions", desc: "Réunions commission fonds social" },
  { to: "/fonds-sociaux/v2/enquete", icon: BarChart3, label: "Tableau de bord Enquête", desc: "Préparation enquête Rectorat DGESCO" },
];

export default function FondsSociauxV2Home() {
  const { data: eleves = [] } = useEleves();
  const { data: decisions = [] } = useDecisions();
  const { data: commissions = [] } = useCommissions();
  const annee = currentAnneeScolaire();
  const decisionsAnnee = decisions.filter(d => d.annee_scolaire === annee);
  const totalVerse = decisions.filter(d =>
    d.statut === "paye" ||
    d.statut === "demande_paiement_emise" ||
    d.statut === "prise_en_charge" ||
    d.statut === "decide" ||
    d.statut === "mandate" // legacy
  )
    .reduce((s, d) => s + Number(d.montant), 0);
  const fichesIncompletes = eleves.filter(e => evaluerCompletudeEleve(e).pct < 100).length;

  const counters: Record<string, string> = {
    "/fonds-sociaux/v2/eleves": `${eleves.length} élève${eleves.length > 1 ? "s" : ""}`,
    "/fonds-sociaux/v2/decisions": `${decisionsAnnee.length} décision${decisionsAnnee.length > 1 ? "s" : ""} ${annee}`,
    "/fonds-sociaux/v2/commissions": `${commissions.length} commission${commissions.length > 1 ? "s" : ""}`,
    "/fonds-sociaux/v2/enquete": `${totalVerse.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-primary">
            <HandHeart className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-2 flex-1">
            <h1 className="text-3xl font-bold font-display tracking-tight">Action sociale & Enquête Rectorat</h1>
            <p className="italic text-muted-foreground max-w-2xl">
              « L'action sociale en faveur des élèves participe à la réduction des inégalités et à la réussite de tous. »
            </p>
            <p className="text-xs text-muted-foreground">
              Module additionnel — workflow réglementaire conforme M9-6 / Code de l'éducation L.531-1, D.531-7 / Circulaire 2017-122.
            </p>
          </div>
        </div>
      </motion.div>

      {fichesIncompletes > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{fichesIncompletes} fiche{fichesIncompletes > 1 ? "s" : ""} élève{fichesIncompletes > 1 ? "s" : ""} incomplète{fichesIncompletes > 1 ? "s" : ""}</div>
            <p className="text-xs text-muted-foreground">Ces fiches empêchent une enquête DGESCO propre (voie, statut boursier ou échelon manquants).</p>
          </div>
          <Link to="/fonds-sociaux/v2/eleves" className="text-xs font-semibold text-orange-700 dark:text-orange-300 underline whitespace-nowrap">
            Corriger maintenant →
          </Link>
        </motion.div>
      )}

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiles.map((t, i) => (
          <motion.div key={t.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={t.to}>
              <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-border/60">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center shrink-0">
                    <t.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">{t.label}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{t.desc}</p>
                    <div className="text-sm font-bold text-primary">{counters[t.to]}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}