// ════════════════════════════════════════════════════════════════
// Panneau d'affichage du moteur d'alertes voyages
// Réf : Code éducation L.421-14, R.421-20, MENE2407159C, M9-6,
//       LF 66-948 art. 21, GBCP 2012-1246, CCP 2026
// ════════════════════════════════════════════════════════════════
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import {
  evaluerAlertesVoyage,
  trierAlertes,
  compterParNiveau,
  type AlertesVoyageInput,
  type NiveauAlerte,
} from "../lib/alertesEngine";

interface Props {
  input: AlertesVoyageInput;
  /** Filtre les alertes par catégorie (sinon : toutes) */
  filtreCategories?: string[];
  /** Titre personnalisé du panneau */
  titre?: string;
  /** Compact (sans titre) pour intégration dans une étape */
  compact?: boolean;
}

const NIVEAU_TONE: Record<NiveauAlerte, string> = {
  rouge: "border-destructive/50 bg-destructive/5",
  orange: "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20",
  bleu: "border-sky-500/40 bg-sky-50 dark:bg-sky-950/20",
  vert: "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20",
};

const NIVEAU_ICON = {
  rouge: ShieldAlert,
  orange: AlertTriangle,
  bleu: Info,
  vert: CheckCircle2,
} as const;

const NIVEAU_LABEL: Record<NiveauAlerte, string> = {
  rouge: "BLOQUANT",
  orange: "VIGILANCE",
  bleu: "INFO",
  vert: "OK",
};

export function AlertesPanel({ input, filtreCategories, titre, compact }: Props) {
  let alertes = trierAlertes(evaluerAlertesVoyage(input));
  if (filtreCategories && filtreCategories.length > 0) {
    alertes = alertes.filter((a) => filtreCategories.includes(a.categorie));
  }
  const counts = compterParNiveau(alertes);

  if (alertes.length === 0) {
    return (
      <Alert className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20">
        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
        <AlertTitle className="text-sm">
          {titre || "Contrôles de conformité"} — aucun signalement
        </AlertTitle>
        <AlertDescription className="text-xs">
          Tous les contrôles automatiques sont au vert sur le périmètre analysé.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold">{titre || "Contrôles de conformité"}</p>
          <div className="flex gap-1">
            {counts.rouge > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {counts.rouge} bloquant{counts.rouge > 1 ? "s" : ""}
              </Badge>
            )}
            {counts.orange > 0 && (
              <Badge className="text-[10px] bg-amber-500 text-white hover:bg-amber-600">
                {counts.orange} vigilance{counts.orange > 1 ? "s" : ""}
              </Badge>
            )}
            {counts.bleu > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {counts.bleu} info{counts.bleu > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      )}

      {alertes.map((a) => {
        const Icon = NIVEAU_ICON[a.niveau];
        return (
          <Alert key={a.id} className={NIVEAU_TONE[a.niveau]}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="text-xs flex items-center gap-2 flex-wrap">
              <Badge
                variant={a.niveau === "rouge" ? "destructive" : "outline"}
                className="text-[9px]"
              >
                {NIVEAU_LABEL[a.niveau]}
              </Badge>
              <span>{a.titre}</span>
              {a.bloquant && (
                <Badge variant="destructive" className="text-[9px]">
                  Empêche la finalisation
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="text-xs space-y-1 mt-1">
              <div>{a.message}</div>
              {a.reference_legale && (
                <div className="text-[10px] italic text-muted-foreground">
                  📚 {a.reference_legale}
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

/**
 * Helper : construit l'input du moteur à partir du draft + recettes/dépenses
 * du wizard. Centralisé ici pour cohérence entre Step7 et Step9.
 */
export function buildAlertesInputFromDraft(
  draft: any,
  recettes: any[],
  depenses: any[],
  participants: any[] = [],
): AlertesVoyageInput {
  const totalRecettes = (recettes || []).reduce((s, r) => s + (Number(r.montant) || 0), 0);
  const totalRecettesSecured = (recettes || [])
    .filter((r) => r.statut_financeur === "notifiee")
    .reduce((s, r) => s + (Number(r.montant) || 0), 0);
  const totalDepenses = (depenses || []).reduce(
    (s, d) => s + (Number(d.montant_ttc) || Number(d.montant_ht) || 0),
    0,
  );

  // La "date CA" de référence pour le contrôle de légalité est le vote
  // qui rend le budget exécutoire (vote n°2). Fallback sur l'ancien champ
  // unique pour compatibilité avec les voyages historiques.
  const dateCaRef =
    draft.date_ca_budget || draft.date_ca_autorisation || null;

  return {
    date_depart: draft.date_depart || null,
    date_retour: draft.date_retour || null,
    date_ca_autorisation: dateCaRef,
    destination_pays: draft.destination_pays || null,
    inscription_ariane: !!draft.inscription_ariane,
    budget_total: totalDepenses,
    assurance_annulation_souscrite: !!draft.assurance_annulation_souscrite,
    acte_regie_mentionne_cautionnement: !!draft.acte_regie_mentionne_cautionnement,
    niveau_etablissement: draft.niveau_etablissement || undefined,
    nb_eleves_prevus: Number(draft.nb_eleves_prevus) || 0,
    total_recettes: totalRecettes,
    total_depenses: totalDepenses,
    total_recettes_secured: totalRecettesSecured,
    recettes: (recettes || []).map((r) => ({
      libelle: r.libelle,
      statut_financeur: r.statut_financeur,
      piece_jointe: !!r.pj_url,
      montant: Number(r.montant) || 0,
    })),
    depenses: (depenses || []).map((d) => ({
      libelle: d.libelle,
      fournisseur: d.fournisseur,
      montant_ttc: Number(d.montant_ttc) || 0,
      montant_ht: Number(d.montant_ht) || 0,
      poste: d.poste,
      est_accompagnateur: !!d.est_accompagnateur,
      devis_present: !!d.devis_url,
    })),
    participants,
  };
}