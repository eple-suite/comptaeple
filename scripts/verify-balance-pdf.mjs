#!/usr/bin/env node
/**
 * verify-balance-pdf.mjs — recette de la génération PDF.
 * Vérifie que le module exporte bien les fonctions et types attendus.
 * Exit 0 = succès.
 */
import { genererRapportBalancePdf } from '../src/lib/balance/rapportBalancePdf.ts';

const C = { g: '\x1b[32m', r: '\x1b[31m', b: '\x1b[1m', x: '\x1b[0m' };
let ok = 0, ko = 0;
const t = (label, cond) => { if (cond) { console.log(`  ${C.g}✓${C.x} ${label}`); ok++; } else { console.log(`  ${C.r}✗${C.x} ${label}`); ko++; } };

console.log(`${C.b}━━━ Recette balance PDF ━━━${C.x}`);

t('Fonction genererRapportBalancePdf exportée', typeof genererRapportBalancePdf === 'function');

const doc = genererRapportBalancePdf({
  groupement: 'Lycée Baimbridge',
  eple: 'Lycée Test',
  uai: '9710040S',
  periode: '04/2026',
  signataire: 'Agent comptable',
  anomalies: [
    { compte: '411300', libelle: 'Familles', solde: -4.30, sens_reel: 'C', sens_attendu: 'D',
      niveau: 'critique', message: 'Trop-perçu RGP', cause: 'Sur-paiement',
      action: 'Émettre titre', reference: 'Ord. 2022-408', regle: 'rgp' },
  ],
  projections: [
    { id: 'attente', titre: 'Trajectoire attente', niveau: 'rouge', valeur: 5000,
      unite: '€', message: 'Croissance', recommandation: 'Apurer', reference: 'M9-6 T3' },
  ],
  scoreRisque: 60,
  balance: [
    { compte: '411300', libelle: 'Familles', debit: 0, credit: 4.30, solde: -4.30 },
  ],
  totaux: { debit: 100000, credit: 100000 },
});

t('Document PDF instancié', doc != null);
t('Document PDF a au moins 4 pages (garde + synthèse + anomalies + annexe)', doc.getNumberOfPages() >= 4);

const buf = doc.output('arraybuffer');
t('Buffer PDF non vide', buf && buf.byteLength > 1000);

// Vérifier signature %PDF-
const sig = new Uint8Array(buf).slice(0, 5);
const sigStr = String.fromCharCode(...sig);
t('Signature PDF valide (%PDF-)', sigStr === '%PDF-');

console.log(`\n${C.b}Total : ${ok} OK, ${ko} KO${C.x}`);
process.exit(ko === 0 ? 0 : 1);