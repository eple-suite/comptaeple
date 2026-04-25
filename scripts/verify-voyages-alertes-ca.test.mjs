#!/usr/bin/env node
/**
 * Recette P1 — Alertes délai CA voyages scolaires
 * Réf : Code éducation L.421-14 / R.421-20, vademecum Créteil
 * Source contrat : src/pages/voyages-v2/lib/alertesEngine.ts
 * (réimplémentation 1:1 des règles testées)
 */
let ok = 0, ko = 0;
const pass = (m) => { console.log('  ✓', m); ok++; };
const fail = (m) => { console.error('  ✗', m); ko++; };

function diffJours(a, b) {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}
function offset(j) { const d = new Date(); d.setDate(d.getDate() + j); return d.toISOString().slice(0, 10); }

function evaluerDelaiCA({ date_depart, date_ca_autorisation, date_premier_engagement }) {
  const out = [];
  if (date_depart && !date_ca_autorisation) {
    out.push({ niveau: 'rouge', categorie: 'ca_manquant', message: 'Aucune délibération du CA enregistrée. Aucune dépense ne peut être engagée.' });
  }
  if (date_depart && date_ca_autorisation) {
    const d = diffJours(date_depart, date_ca_autorisation);
    if (d < 30) out.push({ niveau: 'rouge', categorie: 'delai_ca', delai: d, message: `L'acte du CA du ${date_ca_autorisation} a été pris seulement ${d} jours avant le départ.` });
    else if (d < 60) out.push({ niveau: 'orange', categorie: 'delai_ca', delai: d });
    else if (d < 90) out.push({ niveau: 'bleu', categorie: 'delai_ca', delai: d });
    else out.push({ niveau: 'vert', categorie: 'delai_ca', delai: d });
  }
  if (date_ca_autorisation && date_premier_engagement) {
    if (diffJours(date_premier_engagement, date_ca_autorisation) < 0) {
      out.push({ niveau: 'rouge', categorie: 'engagement_anticipe', message: 'Engagement de dépenses antérieur à délibération CA. Risque de gestion de fait.' });
    }
  }
  return out;
}

console.log('═══ Recette P1 — Alertes délai CA ══════════════════════');

// Cas 1 : départ J+15, CA aujourd'hui → rouge
let r = evaluerDelaiCA({ date_depart: offset(15), date_ca_autorisation: offset(0) });
r.find(a => a.niveau === 'rouge' && a.categorie === 'delai_ca') ? pass('Cas 1: J+15 → 🔴 délai < 30 jours') : fail('Cas 1: rouge attendu');

// Cas 2 : J+45 → orange
r = evaluerDelaiCA({ date_depart: offset(45), date_ca_autorisation: offset(0) });
r.find(a => a.niveau === 'orange' && a.categorie === 'delai_ca') ? pass('Cas 2: J+45 → 🔶 délai 30-60 jours') : fail('Cas 2: orange attendu');

// Cas 3 : J+75 → bleu
r = evaluerDelaiCA({ date_depart: offset(75), date_ca_autorisation: offset(0) });
r.find(a => a.niveau === 'bleu' && a.categorie === 'delai_ca') ? pass('Cas 3: J+75 → 🔷 délai 60-90 jours') : fail('Cas 3: bleu attendu');

// Cas 4 : J+120 → vert
r = evaluerDelaiCA({ date_depart: offset(120), date_ca_autorisation: offset(0) });
r.find(a => a.niveau === 'vert' && a.categorie === 'delai_ca') ? pass('Cas 4: J+120 → 🟢 OK') : fail('Cas 4: vert attendu');

// Cas 5 : départ renseigné, CA absent → rouge ca_manquant
r = evaluerDelaiCA({ date_depart: offset(60), date_ca_autorisation: null });
r.find(a => a.categorie === 'ca_manquant' && a.niveau === 'rouge') ? pass('Cas 5: départ sans CA → 🔴 ca_manquant') : fail('Cas 5: ca_manquant attendu');

// Cas 6 : engagement antérieur au CA
r = evaluerDelaiCA({ date_depart: offset(60), date_ca_autorisation: offset(10), date_premier_engagement: offset(5) });
r.find(a => a.categorie === 'engagement_anticipe' && a.niveau === 'rouge') ? pass('Cas 6: engagement < CA → 🔴 gestion de fait') : fail('Cas 6: engagement_anticipe attendu');

console.log(`\nRésultat : ${ok} OK / ${ko} KO`);
process.exit(ko === 0 ? 0 : 1);