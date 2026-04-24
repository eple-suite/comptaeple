// ════════════════════════════════════════════════════════════════
// Règle des 8 € (LF n° 66-948 du 22/12/1966 art. 21)
// ────────────────────────────────────────────────────────────────
// Principe : à l'issue d'un voyage scolaire, tout reliquat individuel
// > 8 € doit être reversé aux familles. ≤ 8 € : conservé par
// l'établissement au titre du don tacite (compte 7588).
//
// En PRÉVISIONNEL (wizard) : on contrôle que la participation
// demandée aux familles ne génère pas, par construction, un
// reste à charge individuel hors-cadre :
//   • un reste à charge négatif ou nul → OK (sponsorisé)
//   • un reste à charge > 0 et ≤ 8 € → BLOQUANT (sous le seuil
//     du don tacite : il faut soit ajuster, soit assumer le don)
//   • un reste à charge > 8 € → OK (légalement remboursable)
//
// La règle bloque la finalisation tant que la participation famille
// n'est pas cohérente avec le seuil légal.
// ════════════════════════════════════════════════════════════════

export const SEUIL_DON_TACITE = 8; // euros — LF 66-948 art. 21

export type Regle8Niveau = "ok" | "warning" | "bloquant";

export interface Regle8Result {
  niveau: Regle8Niveau;
  bloquant: boolean;
  resteAChargeParEleve: number;
  participationFamilleParEleve: number;
  coutParEleve: number;
  message: string;
  recommandation?: string;
  reference: string;
}

export interface Regle8Input {
  nbEleves: number;
  totalDepensesTTC: number;
  partFamilles: number;
  partSubventions: number;
  partAutres: number;
  /** Si true, l'utilisateur a explicitement accepté le don tacite. */
  donTaciteAccepte?: boolean;
}

/**
 * Évalue la règle des 8 € sur le reste à charge prévisionnel par élève.
 * Retourne toujours un résultat (jamais d'exception) — fallback safe.
 */
export function evaluerRegle8Euros(input: Regle8Input): Regle8Result {
  const ref = "LF n° 66-948 du 22/12/1966 art. 21 — règle des 8 €";
  const nb = Math.max(0, Number(input.nbEleves) || 0);
  const dep = Math.max(0, Number(input.totalDepensesTTC) || 0);
  const fam = Math.max(0, Number(input.partFamilles) || 0);
  const sub = Math.max(0, Number(input.partSubventions) || 0);
  const aut = Math.max(0, Number(input.partAutres) || 0);

  if (nb === 0) {
    return {
      niveau: "warning",
      bloquant: false,
      resteAChargeParEleve: 0,
      participationFamilleParEleve: 0,
      coutParEleve: 0,
      message: "Effectif élèves non renseigné — règle des 8 € non vérifiable.",
      recommandation: "Renseignez le nombre d'élèves prévus à l'étape 3.",
      reference: ref,
    };
  }

  const coutParEleve = dep / nb;
  const participationParEleve = fam / nb;
  // Reste à charge prévisionnel = ce qui n'est pas couvert par
  // subventions/autres et qui doit être supporté par chaque famille.
  const resteAChargeParEleve = (dep - sub - aut) / nb;

  // Cas 1 : intégralement couvert → OK
  if (resteAChargeParEleve <= 0) {
    return {
      niveau: "ok",
      bloquant: false,
      resteAChargeParEleve,
      participationFamilleParEleve: participationParEleve,
      coutParEleve,
      message: "Aucun reste à charge famille (financement intégral subventions/autres).",
      reference: ref,
    };
  }

  // Cas 2 : reste à charge dans la zone 0 < x ≤ 8 € → BLOQUANT
  if (resteAChargeParEleve > 0 && resteAChargeParEleve <= SEUIL_DON_TACITE) {
    if (input.donTaciteAccepte) {
      return {
        niveau: "warning",
        bloquant: false,
        resteAChargeParEleve,
        participationFamilleParEleve: participationParEleve,
        coutParEleve,
        message: `Reste à charge ${resteAChargeParEleve.toFixed(2)} €/élève ≤ 8 € — don tacite assumé.`,
        recommandation: "Mentionner le don tacite (compte 7588) dans la délibération CA.",
        reference: ref,
      };
    }
    return {
      niveau: "bloquant",
      bloquant: true,
      resteAChargeParEleve,
      participationFamilleParEleve: participationParEleve,
      coutParEleve,
      message: `Reste à charge ${resteAChargeParEleve.toFixed(2)} €/élève sous le seuil légal de 8 €.`,
      recommandation:
        "Ajustez la participation famille (la baisser à 0 ou la dépasser de 8 €) OU cochez 'Don tacite assumé' pour finaliser.",
      reference: ref,
    };
  }

  // Cas 3 : reste à charge > 8 € → OK
  return {
    niveau: "ok",
    bloquant: false,
    resteAChargeParEleve,
    participationFamilleParEleve: participationParEleve,
    coutParEleve,
    message: `Reste à charge prévisionnel ${resteAChargeParEleve.toFixed(2)} €/élève — au-delà du seuil légal.`,
    recommandation: "À l'issue du voyage, tout reliquat individuel > 8 € sera reversé aux familles.",
    reference: ref,
  };
}

export function formatRegle8Badge(r: Regle8Result): string {
  switch (r.niveau) {
    case "ok": return "Conforme LF 66-948 art. 21";
    case "warning": return "Vigilance règle 8 €";
    case "bloquant": return "BLOQUÉ — règle 8 €";
  }
}
