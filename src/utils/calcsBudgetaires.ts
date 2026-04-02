// ⚠️ FICHIER CRITIQUE — Moteur de calcul M9-6 / Op@le
// RÈGLE ABSOLUE : utiliser uniquement les niveaux CGR racine.
// Ne jamais additionner les agrégats ET leurs enfants → doubles comptes.

export interface LigneCGR {
  cgr: string;
  budget: number;
  realise: number;
  disponible?: number;
  ecart?: number;
}

/**
 * Extrait une ligne CGR par son libellé exact depuis les données Op@le.
 */
export function getLigneCGR(
  lignes: LigneCGR[],
  cgrLabel: string
): LigneCGR | null {
  return lignes.find(l =>
    l.cgr.trim().toLowerCase() === cgrLabel.trim().toLowerCase()
  ) ?? null;
}

/**
 * Construit les sections dépenses pour le rapport.
 */
export function buildSectionsDepenses(lignesCGR: LigneCGR[]) {
  const get = (label: string) => getLigneCGR(lignesCGR, label);

  const ets  = get('ETS - Etablissement');
  const sg   = get('SG - SERVICES GENERAUX');
  const ap   = get('AP - ACTIVITES PEDAGO.');
  const ve   = get('VE - VIE DE L\'ELEVE');
  const alo  = get('ALO - ADMIN ET LOGISTIQUE');
  const ss   = get('SS - SERVICES SPECIAUX');
  const srh  = get('SRH - RESTAU ET HEBERG');

  // Contrôles de cohérence
  if (ap && ve && alo && sg) {
    const sommeSG = (ap.budget) + (ve.budget) + (alo.budget);
    if (Math.abs(sommeSG - sg.budget) > 0.02) {
      console.error(`[Calcul] ALERTE : AP+VE+ALO (${sommeSG}) ≠ SG (${sg.budget})`);
    }
  }
  if (sg && ss && ets) {
    const sommeETS = (sg.budget) + (ss.budget);
    if (Math.abs(sommeETS - ets.budget) > 0.02) {
      console.error(`[Calcul] ALERTE : SG+SS (${sommeETS}) ≠ ETS (${ets.budget})`);
    }
  }

  return {
    totalBudget:    ets?.budget    ?? 0,
    totalRealise:   ets?.realise   ?? 0,
    totalDisponible: ets?.disponible ?? 0,
    sections: [
      {
        code: 'SG', libelle: 'Services Généraux',
        budget: sg?.budget ?? 0, realise: sg?.realise ?? 0,
        disponible: sg?.disponible ?? 0,
        taux: sg ? (sg.realise / sg.budget * 100) : 0,
        sousLignes: [
          { code:'AP', libelle:'Activités Pédagogiques',
            budget: ap?.budget ?? 0, realise: ap?.realise ?? 0,
            disponible: ap?.disponible ?? 0,
            taux: ap ? (ap.realise / ap.budget * 100) : 0 },
          { code:'VE', libelle:"Vie de l'Élève",
            budget: ve?.budget ?? 0, realise: ve?.realise ?? 0,
            disponible: ve?.disponible ?? 0,
            taux: ve ? (ve.realise / ve.budget * 100) : 0 },
          { code:'ALO', libelle:'Admin & Logistique',
            budget: alo?.budget ?? 0, realise: alo?.realise ?? 0,
            disponible: alo?.disponible ?? 0,
            taux: alo ? (alo.realise / alo.budget * 100) : 0 },
        ]
      },
      {
        code: 'SS', libelle: 'Services Spéciaux (SRH)',
        budget: ss?.budget ?? 0, realise: ss?.realise ?? 0,
        disponible: ss?.disponible ?? 0,
        taux: ss ? (ss.realise / ss.budget * 100) : 0,
        sousLignes: srh ? [
          { code:'SRH', libelle:'Restauration & Hébergement',
            budget: srh.budget, realise: srh.realise,
            disponible: srh.disponible ?? 0,
            taux: srh.realise / srh.budget * 100 }
        ] : []
      }
    ]
  };
}

/**
 * Construit les sections recettes pour le rapport.
 */
export function buildSectionsRecettes(lignesCGR: LigneCGR[]) {
  const get = (label: string) => getLigneCGR(lignesCGR, label);

  const ets  = get('ETS - Etablissement');
  const sg   = get('SG - SERVICES GENERAUX');
  const ap   = get('AP - ACTIVITES PEDAGO.');
  const ve   = get('VE - VIE DE L\'ELEVE');
  const alo  = get('ALO - ADMIN ET LOGISTIQUE');
  const ss   = get('SS - SERVICES SPECIAUX');

  return {
    totalBudget:  ets?.budget  ?? 0,
    totalRealise: ets?.realise ?? 0,
    totalEcart:   ets?.ecart   ?? 0,
    sections: [sg, ap, ve, alo, ss]
      .filter(Boolean)
      .map(s => ({
        code:    s!.cgr.split(' ')[0],
        libelle: s!.cgr.replace(/^[A-Z]+ - /, '').replace(/ - _$/, '').trim(),
        budget:  s!.budget,
        realise: s!.realise,
        ecart:   s!.ecart ?? 0,
      }))
  };
}

/**
 * Calcule les indicateurs financiers depuis la balance des comptes.
 */
export function calcIndicateursFinanciers(comptes: Record<string, {
  solde_deb: number;
  solde_cred: number;
}>) {
  const get = (c: string) => comptes[c] ?? { solde_deb: 0, solde_cred: 0 };

  const tresorerie = get('515100').solde_deb;

  const actifCirculant =
    get('311200').solde_deb +
    get('411200').solde_deb +
    get('411300').solde_deb +
    get('416000').solde_deb +
    get('441160').solde_deb +
    get('441250').solde_deb;

  const passifCirculant =
    get('401200').solde_cred +
    get('408100').solde_cred +
    get('419100').solde_cred +
    get('419220').solde_cred;

  const ressourcesStables =
    get('106810').solde_cred +
    get('120000').solde_cred;

  const bfr = actifCirculant - passifCirculant;
  const fdr = ressourcesStables;
  const tresoNette = fdr - bfr;

  return {
    tresorerie, actifCirculant, passifCirculant, ressourcesStables,
    bfr, fdr, tresoNette,
    coherent: Math.abs(tresoNette - tresorerie) < 1
  };
}
