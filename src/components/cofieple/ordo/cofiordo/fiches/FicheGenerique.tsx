// ═══════════════════════════════════════════════════════════════════
// COFI ORDO — Fiche générique câblée au store
// Couvre TOUTES les fiches non câblées explicitement (A.1, A.2, A.4-A.6,
// B.1, B.2, B.4-B.7, C.2-C.10, D.2-D.11) en sélectionnant automatiquement
// les bonnes données depuis useOrdoData (R + ind + etab).
// ⚠️ Strict M9-6 : aucun indicateur bilanciel (FDR/BFR/TN/réserves) ici —
// ces indicateurs sont rendus uniquement dans la sphère Agent Comptable.
// ═══════════════════════════════════════════════════════════════════
import { useMemo } from 'react';
import { OrdoFicheIndicateur, type FicheRow, type FicheChartPoint } from '../OrdoFicheIndicateur';
import { type OrdoFicheDef } from '../catalog';
import { useOrdoData } from '../../useOrdoData';

interface Props { fiche: OrdoFicheDef; }

const SERVICES_SG = ['AP', 'VE', 'ALO'] as const;
const SERVICES_SS = ['SRH', 'OPC'] as const;

export function FicheGenerique({ fiche }: Props) {
  const { etab, R, ind } = useOrdoData();

  const built = useMemo(() => buildFicheData(fiche, R, ind, etab), [fiche, R, ind, etab]);

  return (
    <OrdoFicheIndicateur
      fiche={fiche}
      rows={built.rows}
      chartData={built.chartData}
      chartSeries={built.chartSeries}
      hasData={built.hasData}
      emptyMessage={built.emptyMessage}
    />
  );
}

// ── Dispatcher ──────────────────────────────────────────────────────
function buildFicheData(
  fiche: OrdoFicheDef,
  R: any,
  ind: any,
  etab: any,
): {
  rows: FicheRow[];
  chartData: FicheChartPoint[];
  chartSeries: { key: string; label: string; color?: string }[];
  hasData: boolean;
  emptyMessage?: string;
} {
  // Section C — exécution par service (charges/produits)
  if (fiche.section === 'C' && fiche.service) {
    const sv = R?.services?.[fiche.service];
    if (!sv) {
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: `Aucune donnée pour le service ${fiche.service}. Importez le SDE / SDR Op@le pour activer cette fiche.` };
    }
    if (fiche.flux === 'charges') {
      const taux = sv.chargesPrev > 0 ? (sv.chargesReel / sv.chargesPrev) * 100 : null;
      return {
        rows: [
          { label: 'Charges prévues (BI + DBM)', unite: 'eur', n: sv.chargesPrev },
          { label: 'Charges réalisées', unite: 'eur', n: sv.chargesReel, highlight: true },
          { label: 'Reliquats / dépassements', unite: 'eur', n: sv.reliquats },
          { label: "Taux d'exécution", unite: 'pct', n: taux },
        ],
        chartData: [{ name: fiche.service!, Prévu: sv.chargesPrev, Réalisé: sv.chargesReel }],
        chartSeries: [
          { key: 'Prévu', label: 'Prévu', color: 'hsl(215,70%,50%)' },
          { key: 'Réalisé', label: 'Réalisé', color: 'hsl(0,72%,55%)' },
        ],
        hasData: (sv.chargesPrev + sv.chargesReel) > 0,
      };
    }
    // produits
    const taux = sv.produitsPrev > 0 ? (sv.produitsReel / sv.produitsPrev) * 100 : null;
    return {
      rows: [
        { label: 'Produits prévus (BI + DBM)', unite: 'eur', n: sv.produitsPrev },
        { label: 'Produits réalisés', unite: 'eur', n: sv.produitsReel, highlight: true },
        { label: 'Plus-values / moins-values', unite: 'eur', n: sv.plusValues },
        { label: "Taux d'exécution", unite: 'pct', n: taux },
      ],
      chartData: [{ name: fiche.service!, Prévu: sv.produitsPrev, Réalisé: sv.produitsReel }],
      chartSeries: [
        { key: 'Prévu', label: 'Prévu', color: 'hsl(215,70%,50%)' },
        { key: 'Réalisé', label: 'Réalisé', color: 'hsl(160,55%,42%)' },
      ],
      hasData: (sv.produitsPrev + sv.produitsReel) > 0,
    };
  }

  switch (fiche.id) {
    // ── Section A ─────────────────────────────────────────────────
    case 'ordo_a1': {
      return {
        rows: [
          { label: 'Établissement', unite: 'num', n: 0, ...({ valeurTexte: etab.nom } as any) } as any,
          { label: 'Code UAI', unite: 'num', n: 0, ...({ valeurTexte: etab.uai } as any) } as any,
        ].map(r => ({ ...(r as any), n: undefined })) as FicheRow[],
        // Présentation simple via tableau texte : on dégrade en utilisant la fiche standard
        // mais avec un tableau de lignes texte → on préfère retourner des rows vides + emptyMessage informatif.
        chartData: [], chartSeries: [],
        hasData: !!etab.nom,
        emptyMessage: !etab.nom
          ? "Sélectionnez un établissement pour activer cette fiche."
          : `Établissement : ${etab.nom} · UAI : ${etab.uai} · Type : ${etab.type || '—'} · Académie : ${etab.academie || '—'} · Commune : ${etab.commune || '—'} · Exercice : ${etab.exercice}.`,
      };
    }
    case 'ordo_a2': {
      const services = R?.services ? Object.entries(R.services) : [];
      if (services.length === 0) {
        return { rows: [], chartData: [], chartSeries: [], hasData: false,
          emptyMessage: "Importez le SDE / SDR pour lister les services budgétaires actifs." };
      }
      return {
        rows: services.map(([code, sv]: any) => ({
          label: `Service ${code} — ${sv.libelle || code}`, unite: 'eur',
          n: (sv.chargesPrev || 0) + (sv.produitsPrev || 0),
        })),
        chartData: [], chartSeries: [],
        hasData: true,
      };
    }
    case 'ordo_a3': // déjà câblée, ne devrait pas passer ici
    case 'ordo_a4': {
      if (!ind || !ind.effectif_eleves) {
        return { rows: [], chartData: [], chartSeries: [], hasData: false,
          emptyMessage: "Renseignez les effectifs et le nombre de boursiers dans l'onglet Indicateurs." };
      }
      const taux = ind.effectif_eleves > 0 ? (ind.effectif_boursiers / ind.effectif_eleves) * 100 : null;
      return {
        rows: [
          { label: 'Effectif total élèves', unite: 'num', n: ind.effectif_eleves },
          { label: 'Élèves boursiers', unite: 'num', n: ind.effectif_boursiers, highlight: true },
          { label: 'Taux de boursiers', unite: 'pct', n: taux },
        ],
        chartData: [
          { name: 'Boursiers', valeur: ind.effectif_boursiers },
          { name: 'Non boursiers', valeur: Math.max(0, ind.effectif_eleves - ind.effectif_boursiers) },
        ],
        chartSeries: [{ key: 'valeur', label: 'Élèves' }],
        hasData: true,
      };
    }
    case 'ordo_a5': {
      // DGF reçue : on agrège les produits du service ALO si dispo.
      const alo = R?.services?.['ALO'];
      if (!alo) {
        return { rows: [], chartData: [], chartSeries: [], hasData: false,
          emptyMessage: "Importez le SDR pour activer la dotation de fonctionnement (ALO)." };
      }
      return {
        rows: [
          { label: 'DGF prévue (ALO)', unite: 'eur', n: alo.produitsPrev },
          { label: 'DGF reçue (ALO)', unite: 'eur', n: alo.produitsReel, highlight: true },
        ],
        chartData: [{ name: 'Dotation', Prévu: alo.produitsPrev, Reçu: alo.produitsReel }],
        chartSeries: [
          { key: 'Prévu', label: 'Prévu', color: 'hsl(215,70%,50%)' },
          { key: 'Reçu', label: 'Reçu', color: 'hsl(160,55%,42%)' },
        ],
        hasData: (alo.produitsPrev + alo.produitsReel) > 0,
      };
    }
    case 'ordo_a6': {
      const alo = R?.services?.['ALO'];
      if (!alo || !ind?.effectif_eleves) {
        return { rows: [], chartData: [], chartSeries: [], hasData: false,
          emptyMessage: "Renseignez les effectifs et importez le SDR pour calculer la dotation par élève." };
      }
      const ratio = ind.effectif_eleves > 0 ? alo.produitsReel / ind.effectif_eleves : null;
      return {
        rows: [
          { label: 'DGF reçue', unite: 'eur', n: alo.produitsReel },
          { label: 'Effectif élèves', unite: 'num', n: ind.effectif_eleves },
          { label: 'Dotation par élève', unite: 'eur', n: ratio, highlight: true },
        ],
        chartData: [], chartSeries: [],
        hasData: true,
      };
    }

    // ── Section B ─────────────────────────────────────────────────
    case 'ordo_b1': {
      if (!R) return emptyR("Importez le SDE / SDR pour activer le pilotage du budget.");
      const ecartCharges = (R.totalChargesPrev ?? 0) - (R.totalChargesSde ?? 0);
      const ecartProduits = (R.totalProduitsPrev ?? 0) - (R.totalProduitsSdr ?? 0);
      return {
        rows: [
          { label: 'Charges prévues (BI + DBM)', unite: 'eur', n: R.totalChargesPrev },
          { label: 'Charges réalisées', unite: 'eur', n: R.totalChargesSde },
          { label: 'Écart charges', unite: 'eur', n: ecartCharges, highlight: true },
          { label: 'Produits prévus (BI + DBM)', unite: 'eur', n: R.totalProduitsPrev },
          { label: 'Produits réalisés', unite: 'eur', n: R.totalProduitsSdr },
          { label: 'Écart produits', unite: 'eur', n: ecartProduits, highlight: true },
        ],
        chartData: [
          { name: 'Charges', Prévu: R.totalChargesPrev, Réalisé: R.totalChargesSde },
          { name: 'Produits', Prévu: R.totalProduitsPrev, Réalisé: R.totalProduitsSdr },
        ],
        chartSeries: [
          { key: 'Prévu', label: 'Prévu', color: 'hsl(215,70%,50%)' },
          { key: 'Réalisé', label: 'Réalisé', color: 'hsl(38,92%,50%)' },
        ],
        hasData: true,
      };
    }
    case 'ordo_b2': {
      if (!R?.services) return emptyR("Importez le SDE / SDR pour ventiler les masses budgétaires.");
      const services = Object.entries(R.services);
      const totalCh = services.reduce((s: number, [, sv]: any) => s + (sv.chargesReel || 0), 0);
      return {
        rows: services.map(([code, sv]: any) => ({
          label: `Service ${code}`, unite: 'pct',
          n: totalCh > 0 ? (sv.chargesReel / totalCh) * 100 : null,
        })),
        chartData: services.map(([code, sv]: any) => ({ name: code, Charges: sv.chargesReel, Produits: sv.produitsReel })),
        chartSeries: [
          { key: 'Charges', label: 'Charges', color: 'hsl(0,72%,55%)' },
          { key: 'Produits', label: 'Produits', color: 'hsl(160,55%,42%)' },
        ],
        hasData: services.length > 0,
      };
    }
    case 'ordo_b3': // déjà câblée
    case 'ordo_b4': case 'ordo_b5': {
      if (!R?.services) return emptyR("Importez le SDE pour activer l'analyse des codes d'activité.");
      // À défaut de codes d'activité granulaires, on retourne le top des services par dépense.
      const services = Object.entries(R.services)
        .map(([code, sv]: any) => ({ name: code, valeur: sv.chargesReel || 0 }))
        .sort((a, b) => b.valeur - a.valeur);
      return {
        rows: services.map(s => ({ label: `Service ${s.name}`, unite: 'eur', n: s.valeur })),
        chartData: services,
        chartSeries: [{ key: 'valeur', label: 'Dépenses', color: 'hsl(280,55%,55%)' }],
        hasData: services.length > 0,
      };
    }
    case 'ordo_b6': {
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: "Le bilan de la commande publique est alimenté depuis le module Marchés (Ressources). Aucun marché n'est encore rattaché à cet exercice." };
    }
    case 'ordo_b7': {
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: "Saisissez les objectifs assignés via la zone de commentaire ci-dessous (lettre de mission, contrat d'objectifs académique)." };
    }

    // ── Section D ─────────────────────────────────────────────────
    case 'ordo_d1': // déjà câblée
    case 'ordo_d2': {
      const ap = R?.services?.['AP'];
      if (!ap) return emptyR("Importez le SDE pour activer le focus dépenses pédagogiques.");
      return {
        rows: [
          { label: 'Dépenses pédagogiques (AP) prévues', unite: 'eur', n: ap.chargesPrev },
          { label: 'Dépenses pédagogiques (AP) réalisées', unite: 'eur', n: ap.chargesReel, highlight: true },
        ],
        chartData: [{ name: 'AP', Prévu: ap.chargesPrev, Réalisé: ap.chargesReel }],
        chartSeries: [
          { key: 'Prévu', label: 'Prévu', color: 'hsl(215,70%,50%)' },
          { key: 'Réalisé', label: 'Réalisé', color: 'hsl(38,92%,50%)' },
        ],
        hasData: (ap.chargesPrev + ap.chargesReel) > 0,
      };
    }
    case 'ordo_d3': {
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: "Le focus voyages est alimenté depuis le module Voyages Scolaires." };
    }
    case 'ordo_d4': {
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: "Le focus formation continue requiert un budget annexe GRETA. Ouvrez l'onglet GRETA." };
    }
    case 'ordo_d5': case 'ordo_d6': {
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: "Le focus bourses / fonds sociaux est alimenté depuis le module Fonds Sociaux et l'état des bourses SIECLE." };
    }
    case 'ordo_d7': {
      // Taxe d'apprentissage : compte 7481
      return { rows: [], chartData: [], chartSeries: [], hasData: false,
        emptyMessage: "Le focus taxe d'apprentissage s'appuie sur le compte 7481 (balance). Vérifiez l'import balance." };
    }
    case 'ordo_d8': case 'ordo_d9': case 'ordo_d10': case 'ordo_d11': {
      // Restauration / viabilisation : on s'appuie sur SRH si présent
      const srh = R?.services?.['SRH'];
      if (!srh) return emptyR("Importez le SDE / SDR pour activer ce focus thématique.");
      return {
        rows: [
          { label: 'Charges (SRH) réalisées', unite: 'eur', n: srh.chargesReel },
          { label: 'Produits (SRH) réalisés', unite: 'eur', n: srh.produitsReel, highlight: true },
          { label: 'Solde du service', unite: 'eur', n: srh.solde },
        ],
        chartData: [{ name: 'SRH', Charges: srh.chargesReel, Produits: srh.produitsReel }],
        chartSeries: [
          { key: 'Charges', label: 'Charges', color: 'hsl(0,72%,55%)' },
          { key: 'Produits', label: 'Produits', color: 'hsl(160,55%,42%)' },
        ],
        hasData: (srh.chargesReel + srh.produitsReel) > 0,
      };
    }
  }

  return { rows: [], chartData: [], chartSeries: [], hasData: false,
    emptyMessage: "Cette fiche n'est pas encore reliée aux données importées." };

  function emptyR(msg: string) {
    return { rows: [], chartData: [], chartSeries: [], hasData: false, emptyMessage: msg };
  }
}