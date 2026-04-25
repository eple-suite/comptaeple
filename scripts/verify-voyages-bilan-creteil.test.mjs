#!/usr/bin/env node
/**
 * Recette P4 — Page Bilan financier modèle Créteil (6 parties)
 * Source contrat : src/pages/voyages-v2/BilanFinancierPageV2.tsx
 */
import { readFileSync, existsSync } from 'node:fs';
let ok = 0, ko = 0;
const pass = (m) => { console.log('  ✓', m); ok++; };
const fail = (m) => { console.error('  ✗', m); ko++; };

console.log('═══ Recette P4 — Page Bilan modèle Créteil ════════════');

const path = 'src/pages/voyages-v2/BilanFinancierPageV2.tsx';
existsSync(path) ? pass('Page Bilan v2 présente') : fail('Page Bilan v2 absente');
const src = readFileSync(path, 'utf8');

// Route déclarée
const app = readFileSync('src/App.tsx', 'utf8');
app.includes('/voyages-v2/bilan/:voyageId') ? pass('Route /voyages-v2/bilan/:voyageId déclarée') : fail('Route absente');

// 6 parties
for (const p of ['Partie 1', 'Partie 2', 'Partie 3', 'Partie 4', 'Partie 5', 'Partie 6']) {
  src.includes(p) ? pass(`${p} présente`) : fail(`${p} absente`);
}

// Tableau 5 colonnes : Poste / Prévu / Réalisé / Écart / Justification
const cols = ['Poste', 'Prévu au CA', 'Réalisé', 'Écart', 'Justification'];
cols.every(c => src.includes(c)) ? pass('Tableau 5 colonnes (Poste/Prévu/Réalisé/Écart/Justification)') : fail('Colonnes manquantes');

// Branchement règle 8 € post-bilan
src.includes('evaluerBilan8Euros') && src.includes('SEUIL_DON_TACITE_BILAN')
  ? pass('Branchement règle 8 € post-bilan opérationnel') : fail('Règle 8€ non branchée');

// Checklist clôture
['titres_emis','mandats_payes','regie_soldee','remboursements','compte_equilibre','ca_vote','archive']
  .every(k => src.includes(k)) ? pass('Checklist clôture comptable complète (7 items)') : fail('Checklist incomplète');

// Module règle 8€ bilan
existsSync('src/pages/voyages-v2/lib/regle8EurosBilan.ts')
  ? pass('Module regle8EurosBilan.ts présent') : fail('Module absent');

// Sync alertes_transverses
existsSync('src/pages/voyages-v2/lib/syncVoyageAlertesTransverses.ts')
  ? pass('Module sync alertes_transverses présent') : fail('Sync absent');

console.log(`\nRésultat : ${ok} OK / ${ko} KO`);
process.exit(ko === 0 ? 0 : 1);