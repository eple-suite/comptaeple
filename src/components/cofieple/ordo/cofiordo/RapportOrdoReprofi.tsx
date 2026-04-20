// ═══════════════════════════════════════════════════════════════════
// RapportOrdoReprofi — Rapport Ordonnateur (REPROFI 4 sections A/B/C/D)
// Remplace l'ancien découpage S1-S13. Strict M9-6.
// ═══════════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { OrdoNavigationReprofi } from './OrdoNavigationReprofi';
import { OrdoFicheIndicateur } from './OrdoFicheIndicateur';
import { ORDO_FICHES_REPROFI, getFicheById } from './catalog';
import { FicheA3Population } from './fiches/FicheA3Population';
import { FicheB3TauxRealisation } from './fiches/FicheB3TauxRealisation';
import { FicheC1ChargesAP } from './fiches/FicheC1ChargesAP';
import { FicheD1Financements } from './fiches/FicheD1Financements';

export function RapportOrdoReprofi() {
  const [activeFicheId, setActiveFicheId] = useState<string>('ordo_a1');
  const fiche = useMemo(() => getFicheById(activeFicheId) ?? ORDO_FICHES_REPROFI[0], [activeFicheId]);

  // Aiguillage : fiches démonstratives (1 par section) → composant dédié
  const renderFiche = () => {
    switch (fiche.id) {
      case 'ordo_a3': return <FicheA3Population />;
      case 'ordo_b3': return <FicheB3TauxRealisation />;
      case 'ordo_c1': return <FicheC1ChargesAP />;
      case 'ordo_d1': return <FicheD1Financements />;
      default:
        // Fiche par défaut : structure générique avec message « à câbler »
        return (
          <OrdoFicheIndicateur
            fiche={fiche}
            rows={[]}
            hasData={false}
            emptyMessage={`Cette fiche est en cours de câblage aux données réelles. La structure REPROFI est en place : tableau N-2/N-1/N, graphique adapté, narration IA et zone de commentaire ordonnateur sont prêts. Voir M9-6 ${fiche.meta} pour la définition normative de l'indicateur.`}
          />
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <OrdoNavigationReprofi activeFicheId={activeFicheId} onSelect={setActiveFicheId} />
      <div className="flex-1 min-w-0">
        {renderFiche()}
      </div>
    </div>
  );
}