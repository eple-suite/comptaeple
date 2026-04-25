#!/usr/bin/env node
/**
 * Recette P2 — Règle des 8 € post-voyage (BILAN)
 * Réf : LF n° 66-948 du 22/12/1966 art. 21 + circ. MENE2407159C 16/7/2024
 * Source contrat : src/pages/voyages-v2/lib/regle8EurosBilan.ts
 * (réimplémentation 1:1)
 */
let ok = 0, ko = 0;
const pass = (m) => { console.log('  ✓', m); ok++; };
const fail = (m) => { console.error('  ✗', m); ko++; };

const SEUIL = 8;
const TOL = 50;

function evaluerBilan8({ recettes, depenses, participants, delai = 30 }) {
  const resultat = +(recettes - depenses).toFixed(2);
  const partis = (participants || []).filter(p => p.parti !== false && (p.paye || 0) > 0);
  const nb = partis.length;

  if (Math.abs(resultat) <= TOL) {
    return { cas: 'equilibre', resultat, nb, reliquat: 0, remboursements: [], coupons: [], documents: ['27_pv_reception.docx', '29_acte_CA_bilan.docx'] };
  }
  if (resultat < 0) {
    return { cas: 'deficit', resultat, nb, reliquat: 0, remboursements: [], coupons: [], documents: ['29_acte_CA_bilan.docx', 'BILAN_deliberation_equilibre_deficit.docx'] };
  }
  if (nb === 0) return { cas: 'excedent_information', resultat, nb: 0, reliquat: 0, remboursements: [], coupons: [], documents: ['29_acte_CA_bilan.docx'] };
  const reliquat = +(resultat / nb).toFixed(2);
  if (reliquat > SEUIL) {
    return {
      cas: 'excedent_remboursement', resultat, nb, reliquat,
      remboursements: partis.map(p => ({ ...p, montant: reliquat })),
      coupons: [],
      documents: ['16_courrier_remboursement.docx', '30_etat_remboursements.docx', '29_acte_CA_bilan.docx', 'BILAN_mandats_remboursement.csv'],
    };
  }
  const today = new Date(); const limite = new Date(today); limite.setDate(today.getDate() + delai);
  return {
    cas: 'excedent_information', resultat, nb, reliquat,
    remboursements: [],
    coupons: partis.map(p => ({ ...p, montant: reliquat, date_envoi: today.toISOString().slice(0, 10), date_limite: limite.toISOString().slice(0, 10), reponse: null })),
    documents: ['BILAN_coupon_reponse_3_options.docx', '30_etat_remboursements.docx', '29_acte_CA_bilan.docx'],
  };
}

function appliquerSilence(coupons, ref = new Date()) {
  const refIso = ref.toISOString().slice(0, 10);
  return coupons.map(c => (!c.reponse && c.date_limite <= refIso) ? { ...c, reponse: 'don_tacite_silence', date_reponse: refIso } : c);
}

console.log('═══ Recette P2 — Règle 8 € post-voyage ════════════════');

// Scénario 1 : excédent 420 € / 30 élèves = 14 €/famille
const part30 = Array.from({ length: 30 }, (_, i) => ({ participant_id: `p${i}`, nom: `N${i}`, prenom: `P${i}`, paye: 100, parti: true }));
let r = evaluerBilan8({ recettes: 420 + 3000, depenses: 3000, participants: part30 });
r.cas === 'excedent_remboursement' ? pass('S1: cas = excedent_remboursement') : fail(`S1: cas attendu excedent_remboursement, reçu ${r.cas}`);
r.reliquat === 14 ? pass('S1: reliquat = 14 €') : fail(`S1: reliquat attendu 14, reçu ${r.reliquat}`);
r.remboursements.length === 30 ? pass('S1: 30 courriers générés') : fail(`S1: ${r.remboursements.length} ≠ 30`);
r.documents.includes('16_courrier_remboursement.docx') && r.documents.includes('BILAN_mandats_remboursement.csv') ? pass('S1: courriers + mandats préparés') : fail('S1: docs manquants');

// Scénario 2 : excédent 150 € / 30 élèves = 5 €/famille
r = evaluerBilan8({ recettes: 150 + 3000, depenses: 3000, participants: part30 });
r.cas === 'excedent_information' ? pass('S2: cas = excedent_information') : fail(`S2: ${r.cas}`);
r.reliquat === 5 ? pass('S2: reliquat = 5 €') : fail(`S2: reliquat ${r.reliquat}`);
r.coupons.length === 30 ? pass('S2: 30 coupons générés') : fail(`S2: ${r.coupons.length} ≠ 30`);
r.remboursements.length === 0 ? pass('S2: pas de mandats automatiques') : fail('S2: mandats inattendus');
r.documents.includes('BILAN_coupon_reponse_3_options.docx') ? pass('S2: doc coupon présent') : fail('S2: coupon doc manquant');

// Scénario 3 : silence après délai → don tacite
const fakeRef = new Date(); fakeRef.setDate(fakeRef.getDate() + 60);
const coupons2 = appliquerSilence(r.coupons, fakeRef);
const tacites = coupons2.filter(c => c.reponse === 'don_tacite_silence');
tacites.length === 30 ? pass('S3: 30 dons tacites enregistrés (silence > délai)') : fail(`S3: ${tacites.length} ≠ 30`);

// Scénario 4 : déficit 500 €
r = evaluerBilan8({ recettes: 2500, depenses: 3000, participants: part30 });
r.cas === 'deficit' ? pass('S4: cas = deficit') : fail(`S4: ${r.cas}`);
r.documents.includes('BILAN_deliberation_equilibre_deficit.docx') ? pass('S4: délibération d\'équilibre générée') : fail('S4: doc déficit manquant');
r.coupons.length === 0 && r.remboursements.length === 0 ? pass('S4: aucun courrier famille') : fail('S4: courriers inattendus');

console.log(`\nRésultat : ${ok} OK / ${ko} KO`);
process.exit(ko === 0 ? 0 : 1);