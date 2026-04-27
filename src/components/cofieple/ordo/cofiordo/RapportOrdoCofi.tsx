// ═══════════════════════════════════════════════════════════════════
// COFI ORDO — Rapport Ordonnateur (4 sections A/B/C/D + 3 vues)
// Vues : Mosaïque (sommaire visuel) · Fiches (détail) · Narration (rédigé)
// Strict M9-6 : aucun indicateur bilanciel côté ordonnateur.
// ═══════════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { OrdoNavigation, OrdoViewMode } from './OrdoNavigation';
import { OrdoMosaique } from './OrdoMosaique';
import { OrdoNarrationContinue } from './OrdoNarrationContinue';
import { ORDO_FICHES, getFicheById } from './catalog';
import { FicheA3Population } from './fiches/FicheA3Population';
import { FicheB3TauxRealisation } from './fiches/FicheB3TauxRealisation';
import { FicheC1ChargesAP } from './fiches/FicheC1ChargesAP';
import { FicheD1Financements } from './fiches/FicheD1Financements';
import { FicheGenerique } from './fiches/FicheGenerique';

export function RapportOrdoCofi() {
  const [view, setView] = useState<OrdoViewMode>('mosaique');
  const [activeFicheId, setActiveFicheId] = useState<string>('ordo_a1');
  const fiche = useMemo(() => getFicheById(activeFicheId) ?? ORDO_FICHES[0], [activeFicheId]);

  const handleOpenFiche = (id: string) => {
    setActiveFicheId(id);
    setView('fiche');
  };

  const renderFiche = () => {
    switch (fiche.id) {
      case 'ordo_a3': return <FicheA3Population />;
      case 'ordo_b3': return <FicheB3TauxRealisation />;
      case 'ordo_c1': return <FicheC1ChargesAP />;
      case 'ordo_d1': return <FicheD1Financements />;
      default:
        return <FicheGenerique fiche={fiche} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <OrdoNavigation
        view={view}
        onChangeView={setView}
        activeFicheId={activeFicheId}
        onSelect={handleOpenFiche}
      />
      <div className="flex-1 min-w-0">
        {view === 'mosaique'  && <OrdoMosaique onOpenFiche={handleOpenFiche} />}
        {view === 'fiche'     && renderFiche()}
        {view === 'narration' && <OrdoNarrationContinue />}
      </div>
    </div>
  );
}