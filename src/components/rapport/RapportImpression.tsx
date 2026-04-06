// ═══════════════════════════════════════════════════════════════
// RAPPORT ORDONNATEUR — Composant dédié impression (A4 PAYSAGE)
// Invisible à l'écran (display:none), visible en @media print
// Lit les 13 commentaires depuis localStorage (persistentStore)
// Graphiques CSS purs (pas de Recharts) pour impression fiable
// Flux continu : pas de saut de page forcé entre les sections,
// seuls les blocs solidaires empêchent les coupures incohérentes.
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { store } from '@/store/persistentStore';
import { useCofiepleStore } from '@/store/useCofiepleStore';

// ── Helpers ──────────────────────────────────────────────────
function fmt(v: number): string {
  if (v == null || isNaN(v)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' €';
}

function pct(v: number): string {
  if (!isFinite(v)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + ' %';
}

// ── En-tête de page ─────────────────────────────────────────
function EnteteRapport({ nom, uai, annee, academie, commune }: {
  nom: string; uai: string; annee: number; academie?: string; commune?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #003366', paddingBottom: '6px', marginBottom: '10px' }}>
      <div>
        <div style={{ fontSize: '7pt', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ministère de l'Éducation Nationale</div>
        {academie && <div style={{ fontSize: '7pt', color: '#666' }}>Académie de {academie}</div>}
        <div style={{ fontSize: '11pt', fontWeight: 900, color: '#003366', marginTop: '2px' }}>{nom}</div>
        <div style={{ fontSize: '8pt', color: '#555' }}>UAI : {uai}{commune ? ` · ${commune}` : ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#003366' }}>Rapport de l'Ordonnateur</div>
        <div style={{ fontSize: '9pt', color: '#555' }}>Compte Financier {annee}</div>
        <div style={{ fontSize: '7pt', color: '#999' }}>M9-6 · Code de l'Éducation Art. R421-68</div>
      </div>
    </div>
  );
}

// ── Titre de section ────────────────────────────────────────
function TitreSection({ texte }: { texte: string }) {
  return (
    <div className="section-titre" style={{ background: '#003366', color: 'white', padding: '4px 10px', fontSize: '9.5pt', fontWeight: 'bold', marginTop: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {texte}
    </div>
  );
}

// ── Bloc commentaire ────────────────────────────────────────
function BlocCommentaire({ texte }: { texte: string }) {
  if (!texte || !texte.trim()) return null;
  return (
    <div style={{ borderLeft: '3px solid #003366', padding: '6px 12px', background: '#f7f9fc', fontSize: '9pt', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginTop: '6px', marginBottom: '8px', orphans: 4, widows: 4 }}>
      {texte}
    </div>
  );
}

// ── Graphique Balance Dépenses/Recettes (CSS) ───────────────
function GraphiqueBalance({ depenses, recettes }: { depenses: number; recettes: number }) {
  const maxVal = Math.max(depenses, recettes) * 1.1 || 1;
  const pctDep = Math.min((depenses / maxVal) * 100, 100);
  const pctRec = Math.min((recettes / maxVal) * 100, 100);
  return (
    <div className="graphique-bloc" style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px 14px', background: 'white', pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#003366', marginBottom: '10px' }}>Balance dépenses / recettes</div>
      {[
        { label: 'Dépenses', pctW: pctDep, val: depenses, color: '#e74c3c' },
        { label: 'Recettes', pctW: pctRec, val: recettes, color: '#27ae60' },
      ].map((item, i) => (
        <div key={i} style={{ marginBottom: i === 0 ? '10px' : '0' }}>
          <div style={{ fontSize: '8pt', color: '#555', marginBottom: '3px', fontWeight: 500 }}>{item.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flexGrow: 1, height: '20px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${item.pctW}%`, height: '100%', background: item.color, borderRadius: '3px', position: 'absolute', left: 0, top: 0 }} />
            </div>
            <span style={{ fontSize: '8pt', fontFamily: 'monospace', fontWeight: 'bold', color: item.color, minWidth: '90px', textAlign: 'right' }}>{fmt(item.val)}</span>
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', color: recettes >= depenses ? '#27ae60' : '#c0392b', marginTop: '8px' }}>
        Solde : {fmt(recettes - depenses)}
      </div>
    </div>
  );
}

// ── Graphique Taux d'exécution (CSS barres verticales) ──────
function GraphiqueTauxExecution({ sections }: { sections: Array<{ libelle: string; budget: number; realise: number }> }) {
  const maxVal = Math.max(...sections.map(s => s.budget), 1);
  const hauteurMax = 100;
  return (
    <div className="graphique-bloc" style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px 14px', background: 'white', pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#003366', marginBottom: '10px' }}>Taux d'exécution budgétaire</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: `${hauteurMax + 25}px`, borderBottom: '1px solid #ddd', borderLeft: '1px solid #ddd', padding: '0 20px 0 4px', marginBottom: '6px', justifyContent: 'center' }}>
        {sections.map((s, i) => {
          const hB = (s.budget / maxVal) * hauteurMax;
          const hR = (s.realise / maxVal) * hauteurMax;
          const taux = s.budget > 0 ? ((s.realise / s.budget) * 100).toFixed(1) : '—';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#003366', marginBottom: '2px' }}>{taux} %</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${hauteurMax}px` }}>
                <div style={{ width: '22px', height: `${hB}px`, background: '#b3cde8', borderRadius: '2px 2px 0 0' }} />
                <div style={{ width: '22px', height: `${hR}px`, background: '#003366', borderRadius: '2px 2px 0 0' }} />
              </div>
              <div style={{ fontSize: '7.5pt', color: '#555', textAlign: 'center', marginTop: '3px', fontWeight: 500 }}>
                {s.libelle}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', fontSize: '7pt', color: '#555', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '10px', height: '10px', background: '#b3cde8', borderRadius: '2px' }} /> Prévu</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '10px', height: '10px', background: '#003366', borderRadius: '2px' }} /> Réalisé</div>
      </div>
    </div>
  );
}

// ── Graphique Répartition (CSS barres horizontales) ──────────
function GraphiqueRepartition({ items, titre }: { items: Array<{ label: string; value: number; color: string }>; titre: string }) {
  const total = items.reduce((s, it) => s + it.value, 0) || 1;
  return (
    <div className="graphique-bloc" style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '10px 14px', background: 'white', pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#003366', marginBottom: '8px' }}>{titre}</div>
      {items.slice(0, 8).map((item, i) => {
        const p = (item.value / total) * 100;
        return (
          <div key={i} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#555', marginBottom: '1px' }}>
              <span>{item.label}</span>
              <span style={{ fontWeight: 'bold' }}>{p.toFixed(1)} %</span>
            </div>
            <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(p, 100)}%`, height: '100%', background: item.color, borderRadius: '2px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────
export function RapportImpression() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];

  if (!R) return null;

  // ── Clés localStorage ──────────────────────────────────────
  const pKey = `cofieple_rapport_ordo_${etab.uai}_${etab.exercice}`;
  const getComment = (suffix: string): string => store.get<string>(`${pKey}_${suffix}`, '');

  const comments = {
    presentation: getComment('com_presentation'),
    resultat: getComment('com_resultat'),
    repartition: getComment('com_repartition'),
    evolution: getComment('com_evolution'),
    domaines: getComment('com_domaines'),
    fdr: getComment('com_fdr'),
    tresorerie: getComment('com_tresorerie'),
    oo: getComment('com_oo'),
    srh: getComment('com_srh'),
    subventions: getComment('com_subventions'),
    patrimoine: getComment('com_patrimoine'),
    pilotage: getComment('com_pilotage'),
    perspectives: getComment('com_perspectives'),
  };

  const nomOrdo = store.get<string>(`${pKey}_nom_ordo`, etab.ordonnateur || '');
  const nomSG = store.get<string>(`${pKey}_nom_sg`, etab.secretaireGeneral || '');
  const dateEdition = new Date().toLocaleDateString('fr-FR');
  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : `31/12/${etab.exercice}`;

  const safe = {
    joursFdr: R.joursFdr ?? 0,
    joursTresorerie: R.joursTresorerie ?? 0,
    fdrMobilisable: R.fdrMobilisable ?? 0,
    dgpJours: R.dgpJours ?? 0,
    dgrJours: R.dgrJours ?? 0,
    totalCreances: R.totalCreances ?? 0,
    creancesEtat: R.creancesEtat ?? 0,
    creancesCollectivite: R.creancesCollectivite ?? 0,
    creancesFamilles: R.creancesFamilles ?? 0,
    reliquatsSubventions: R.reliquatsSubventions ?? 0,
    valeurNette: R.valeurNette ?? 0,
  };

  const oo = R.operationsOrdre ?? { dotationsAmort: 0, reprisesAmort: 0, vncCessions: 0, produitsCessions: 0, neutralisationSubInv: 0, totalChargesOO: 0, totalProduitsOO: 0, soldeOO: 0 };
  const domaines = R.domaines ?? {};
  const domainesList = Object.values(domaines).filter((d: any) => d.chargesReel > 0 || d.produitsReel > 0).sort((a: any, b: any) => a.code.localeCompare(b.code));
  const hasN1 = (R.totalChargesSdeN1 ?? 0) > 0;

  const entete = { nom: etab.nom, uai: etab.uai, annee: etab.exercice, academie: etab.academie, commune: etab.commune };

  // ── SRH — from parService if available ───────────────────────
  const srhService = R.parService?.['SRH'] as any;
  const hasSRH = srhService && (srhService.chargesReel > 0 || srhService.produitsReel > 0);

  return (
    <div id="rapport-impression-container" style={{ display: 'none', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt', color: '#000', background: 'white', width: '100%' }}>

      {/* ══ SECTION 1 — COUVERTURE + SYNTHÈSE ════════════════ */}
      <EnteteRapport {...entete} />

      <div style={{ background: '#003366', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10pt', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
        Présentation du Compte Financier — Exercice {etab.exercice}
      </div>
      <p style={{ textAlign: 'center', fontSize: '8pt', color: '#555', marginBottom: '12px' }}>
        Présenté par l'ordonnateur : <strong>{nomOrdo || '—'}</strong> · Arrêté au : {dateArrete}
      </p>

      {/* Section 1 — Présentation */}
      {comments.presentation.trim() && (
        <div className="bloc-solidaire">
          <TitreSection texte="1. Présentation de l'établissement" />
          <BlocCommentaire texte={comments.presentation} />
        </div>
      )}

      {/* Section 2 — Tableau de bord */}
      <div className="bloc-solidaire">
        <TitreSection texte="2. Tableau de Bord Financier" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          {[
            { label: 'RÉSULTAT BUDGÉTAIRE', valeur: R.resultatBudgetaire, sousTitre: R.resultatBudgetaire >= 0 ? 'Excédent' : 'Déficit', couleur: R.resultatBudgetaire >= 0 ? '#27ae60' : '#c0392b' },
            { label: 'CAF / IAF', valeur: R.cafBudgetaire, sousTitre: R.cafBudgetaire >= 0 ? 'Capacité' : 'Insuffisance', couleur: R.cafBudgetaire >= 0 ? '#27ae60' : '#c0392b' },
            { label: 'FDR', valeur: R.fdrComptable, sousTitre: `${Math.round(safe.joursFdr)} jours`, couleur: '#003366' },
            { label: 'TRÉSORERIE', valeur: R.tresorerie, sousTitre: `${Math.round(safe.joursTresorerie)} jours`, couleur: '#003366' },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card" style={{ border: `1px solid ${kpi.couleur}`, borderRadius: '6px', padding: '6px 8px', background: 'white', pageBreakInside: 'avoid' }}>
              <div style={{ fontSize: '6.5pt', color: '#555', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 'bold', marginBottom: '3px' }}>{kpi.label}</div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: kpi.couleur, fontFamily: "'Courier New', monospace" }}>{fmt(kpi.valeur)}</div>
              <div style={{ fontSize: '7pt', color: '#777', marginTop: '1px' }}>{kpi.sousTitre}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphiques côte à côte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <GraphiqueBalance depenses={R.totalChargesSde} recettes={R.totalProduitsSdr} />
        <GraphiqueTauxExecution sections={[
          { libelle: 'Dépenses', budget: R.totalChargesPrev, realise: R.totalChargesSde },
          { libelle: 'Recettes', budget: R.totalProduitsPrev, realise: R.totalProduitsSdr },
        ]} />
      </div>

      {/* Section 3 — Résultat et exécution budgétaire */}
      <div className="bloc-solidaire">
        <TitreSection texte="3. Résultat et exécution budgétaire" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
          <thead>
            <tr style={{ background: '#003366', color: 'white' }}>
              <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #ccc' }}>Agrégat</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>Prévu</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>Réalisé</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>Taux</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Charges totales', prev: R.totalChargesPrev, real: R.totalChargesSde },
              { label: 'Produits totaux', prev: R.totalProduitsPrev, real: R.totalProduitsSdr },
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f7f9fc' }}>
                <td style={{ padding: '3px 6px', border: '1px solid #ddd', fontWeight: 'bold' }}>{row.label}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(row.prev)}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(row.real)}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right' }}>{row.prev > 0 ? pct((row.real / row.prev) * 100) : '—'}</td>
              </tr>
            ))}
            <tr style={{ background: '#003366', color: 'white', fontWeight: 'bold' }}>
              <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>RÉSULTAT</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.totalProduitsPrev - R.totalChargesPrev)}</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.resultatBudgetaire)}</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ccc', textAlign: 'right' }}>—</td>
            </tr>
          </tbody>
        </table>
      </div>
      <BlocCommentaire texte={comments.resultat} />

      {/* Section 4 — Répartition */}
      {comments.repartition.trim() && (
        <div className="bloc-solidaire">
          <TitreSection texte="4. Répartition des dépenses et des recettes" />
          <BlocCommentaire texte={comments.repartition} />
        </div>
      )}

      {/* Section 5 — Évolution N/N-1 */}
      {hasN1 && (
        <div className="bloc-solidaire">
          <TitreSection texte={`5. Évolution N / N-1`} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #ccc' }}>Agrégat</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>N ({etab.exercice})</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>N-1</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>Variation</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #ccc' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Dépenses réalisées', vN: R.totalChargesSde, vN1: R.totalChargesSdeN1 ?? 0 },
                { label: 'Recettes réalisées', vN: R.totalProduitsSdr, vN1: R.totalProduitsSdrN1 ?? 0 },
                { label: 'Résultat budgétaire', vN: R.resultatBudgetaire, vN1: R.resultatBudgetaireN1 ?? 0 },
              ].map((row, i) => {
                const v = row.vN - row.vN1;
                const p = row.vN1 > 0 ? (v / row.vN1) * 100 : 0;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f7f9fc' }}>
                    <td style={{ padding: '3px 6px', border: '1px solid #ddd', fontWeight: 'bold' }}>{row.label}</td>
                    <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(row.vN)}</td>
                    <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', color: '#777' }}>{fmt(row.vN1)}</td>
                    <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', color: v >= 0 ? '#27ae60' : '#c0392b' }}>{v >= 0 ? '+' : ''}{fmt(v)}</td>
                    <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', color: v >= 0 ? '#27ae60' : '#c0392b' }}>{p >= 0 ? '+' : ''}{p.toFixed(1)} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <BlocCommentaire texte={comments.evolution} />
        </div>
      )}

      {/* Section 6 — Exécution par domaine */}
      {domainesList.length > 0 && (
        <div className="bloc-solidaire">
          <TitreSection texte={`6. Exécution par domaine — Exercice ${etab.exercice}`} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                {['Domaine', 'Crédits ouverts', 'Dépenses', 'Taux', 'Prév. recettes', 'Recettes', 'Solde'].map((h, i) => (
                  <th key={i} style={{ padding: '3px 5px', textAlign: i === 0 ? 'left' : 'right', border: '1px solid #ccc', fontSize: '7.5pt' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domainesList.map((d: any, i: number) => (
                <tr key={d.code} style={{ background: i % 2 === 0 ? 'white' : '#f7f9fc' }}>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: '7.5pt' }}>{d.libelle}</td>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(d.chargesPrev)}</td>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(d.chargesReel)}</td>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', textAlign: 'right', color: d.tauxExecCharges >= 0.9 ? '#27ae60' : d.tauxExecCharges >= 0.7 ? '#e67e22' : '#c0392b' }}>{pct(d.tauxExecCharges * 100)}</td>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(d.produitsPrev)}</td>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(d.produitsReel)}</td>
                  <td style={{ padding: '2px 5px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: d.solde >= 0 ? '#27ae60' : '#c0392b' }}>{fmt(d.solde)}</td>
                </tr>
              ))}
              <tr style={{ background: '#003366', color: 'white', fontWeight: 'bold' }}>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc' }}>TOTAL</td>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.totalChargesPrev)}</td>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.totalChargesSde)}</td>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc', textAlign: 'right' }}>{pct(R.tauxExecCharges * 100)}</td>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.totalProduitsPrev)}</td>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.totalProduitsSdr)}</td>
                <td style={{ padding: '3px 5px', border: '1px solid #ccc', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.resultatBudgetaire)}</td>
              </tr>
            </tbody>
          </table>
          <BlocCommentaire texte={comments.domaines} />
        </div>
      )}

      {/* Section 7 — FDR */}
      <div className="bloc-solidaire">
        <TitreSection texte="7. Fonds de roulement — Autonomie financière" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          {[
            { label: 'FDR comptable', val: fmt(R.fdrComptable), color: R.fdrComptable >= 0 ? '#27ae60' : '#c0392b' },
            { label: 'FDR en jours', val: `${Math.round(safe.joursFdr)} jours`, color: safe.joursFdr >= 30 ? '#27ae60' : '#c0392b' },
            { label: 'FDR mobilisable', val: fmt(safe.fdrMobilisable), color: '#003366' },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card" style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
              <div style={{ fontSize: '7pt', color: '#777', fontWeight: 'bold', textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: kpi.color, fontFamily: 'monospace' }}>{kpi.val}</div>
            </div>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6px' }}>
          <tbody>
            <tr style={{ background: '#f0f4f8' }}><td style={{ padding: '3px 6px', border: '1px solid #ddd', fontWeight: 'bold' }}>FDR</td><td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(R.fdrComptable)}</td></tr>
            <tr><td style={{ padding: '3px 6px', border: '1px solid #ddd' }}>= BFR</td><td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.bfr)}</td></tr>
            <tr><td style={{ padding: '3px 6px', border: '1px solid #ddd' }}>+ Trésorerie</td><td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(R.tresorerie)}</td></tr>
          </tbody>
        </table>
        <BlocCommentaire texte={comments.fdr} />
      </div>

      {/* Section 8 — Trésorerie */}
      <div className="bloc-solidaire">
        <TitreSection texte="8. Trésorerie" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          {[
            { label: 'Trésorerie nette', val: fmt(R.tresorerie), color: R.tresorerie >= 0 ? '#27ae60' : '#c0392b' },
            { label: 'DGP', val: `${Math.round(safe.dgpJours)} jours`, color: safe.dgpJours > 30 ? '#c0392b' : '#27ae60' },
            { label: 'DGR', val: `${Math.round(safe.dgrJours)} jours`, color: safe.dgrJours > 60 ? '#c0392b' : '#27ae60' },
            { label: 'Réserves (1068)', val: fmt(R.reserves), color: '#003366' },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card" style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
              <div style={{ fontSize: '7pt', color: '#777', fontWeight: 'bold', textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: kpi.color, fontFamily: 'monospace' }}>{kpi.val}</div>
            </div>
          ))}
        </div>
        <BlocCommentaire texte={comments.tresorerie} />
      </div>

      {/* Section 9 — Opérations d'ordre */}
      <div className="bloc-solidaire">
        <TitreSection texte="9. Opérations d'ordre" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6px' }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              <th style={{ padding: '3px 6px', textAlign: 'left', border: '1px solid #ddd' }}>Opération</th>
              <th style={{ padding: '3px 6px', textAlign: 'right', border: '1px solid #ddd' }}>Charges (OO)</th>
              <th style={{ padding: '3px 6px', textAlign: 'right', border: '1px solid #ddd' }}>Produits (OO)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Dotations aux amortissements (68)', c: oo.dotationsAmort, p: 0 },
              { label: 'Reprises sur amort./provisions (78)', c: 0, p: oo.reprisesAmort },
              { label: 'VNC cessions (675)', c: oo.vncCessions, p: 0 },
              { label: 'Produits cessions (775/776/777)', c: 0, p: oo.produitsCessions },
              { label: 'Neutralisation subv. invest.', c: 0, p: oo.neutralisationSubInv },
            ].map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #ddd' }}>
                <td style={{ padding: '2px 6px', border: '1px solid #ddd' }}>{row.label}</td>
                <td style={{ padding: '2px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{row.c > 0 ? fmt(row.c) : '—'}</td>
                <td style={{ padding: '2px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{row.p > 0 ? fmt(row.p) : '—'}</td>
              </tr>
            ))}
            <tr style={{ background: '#f0f4f8', fontWeight: 'bold' }}>
              <td style={{ padding: '3px 6px', border: '1px solid #ddd' }}>TOTAL OO</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(oo.totalChargesOO)}</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(oo.totalProduitsOO)}</td>
            </tr>
          </tbody>
        </table>
        <BlocCommentaire texte={comments.oo} />
      </div>

      {/* Section SRH (conditionnelle) */}
      {(hasSRH || comments.srh.trim()) && (
        <div className="bloc-solidaire">
          <TitreSection texte="Service de Restauration et d'Hébergement (SRH)" />
          {hasSRH && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              {[
                { label: 'Résultat SRH', val: fmt(srh.resultatSRH), color: srh.resultatSRH >= 0 ? '#27ae60' : '#c0392b' },
                { label: 'Recettes SRH', val: fmt(srh.totalRecettes), color: '#003366' },
                { label: 'Dépenses SRH', val: fmt(srh.totalDepenses), color: '#003366' },
              ].map((kpi, i) => (
                <div key={i} className="kpi-card" style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
                  <div style={{ fontSize: '7pt', color: '#777', fontWeight: 'bold', textTransform: 'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontSize: '10pt', fontWeight: 'bold', color: kpi.color, fontFamily: 'monospace' }}>{kpi.val}</div>
                </div>
              ))}
            </div>
          )}
          <BlocCommentaire texte={comments.srh} />
        </div>
      )}

      {/* Section 10 — Subventions et financements */}
      <div className="bloc-solidaire">
        <TitreSection texte="10. Suivi des subventions et financements" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6px' }}>
          <tbody>
            {safe.creancesEtat > 0 && <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '2px 6px', border: '1px solid #ddd' }}>Créances sur l'État</td><td style={{ padding: '2px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(safe.creancesEtat)}</td></tr>}
            {safe.creancesCollectivite > 0 && <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '2px 6px', border: '1px solid #ddd' }}>Créances collectivité</td><td style={{ padding: '2px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(safe.creancesCollectivite)}</td></tr>}
            {safe.creancesFamilles > 0 && <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '2px 6px', border: '1px solid #ddd' }}>Créances familles</td><td style={{ padding: '2px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(safe.creancesFamilles)}</td></tr>}
            {safe.reliquatsSubventions > 0 && <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '2px 6px', border: '1px solid #ddd' }}>Reliquats subventions</td><td style={{ padding: '2px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(safe.reliquatsSubventions)}</td></tr>}
            <tr style={{ background: '#f0f4f8', fontWeight: 'bold' }}><td style={{ padding: '3px 6px', border: '1px solid #ddd' }}>Total créances</td><td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(safe.totalCreances)}</td></tr>
          </tbody>
        </table>
        <BlocCommentaire texte={comments.subventions} />
      </div>

      {/* Section 11 — Situation patrimoniale */}
      <div className="bloc-solidaire">
        <TitreSection texte="11. Situation patrimoniale" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          {[
            { label: 'Immobilisations', val: fmt(R.totalImmo), color: '#003366' },
            { label: 'Amortissements', val: fmt(R.totalAmortissements), color: '#e67e22' },
            { label: 'Valeur nette', val: fmt(safe.valeurNette), color: safe.valeurNette >= 0 ? '#27ae60' : '#c0392b' },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card" style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
              <div style={{ fontSize: '7pt', color: '#777', fontWeight: 'bold', textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: kpi.color, fontFamily: 'monospace' }}>{kpi.val}</div>
            </div>
          ))}
        </div>
        <BlocCommentaire texte={comments.patrimoine} />
      </div>

      {/* Section 12 — Pilotage budgétaire */}
      <div className="bloc-solidaire">
        <TitreSection texte="12. Pilotage budgétaire — Budget initial vs exécuté" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6px' }}>
          <thead>
            <tr style={{ background: '#003366', color: 'white' }}>
              {['Agrégat', 'Budget initial', 'Budget exécuté', 'Écart', 'Écart %'].map((h, i) => (
                <th key={i} style={{ padding: '3px 6px', textAlign: i === 0 ? 'left' : 'right', border: '1px solid #ccc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Charges totales', bi: R.totalChargesPrev, be: R.totalChargesSde },
              { label: 'Produits totaux', bi: R.totalProduitsPrev, be: R.totalProduitsSdr },
              { label: 'Résultat', bi: R.totalProduitsPrev - R.totalChargesPrev, be: R.resultatBudgetaire },
            ].map((row, i) => {
              const ecart = row.be - row.bi;
              const pctE = row.bi !== 0 ? (ecart / Math.abs(row.bi)) * 100 : 0;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f7f9fc' }}>
                  <td style={{ padding: '3px 6px', border: '1px solid #ddd', fontWeight: 'bold' }}>{row.label}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', color: '#777' }}>{fmt(row.bi)}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(row.be)}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', color: ecart >= 0 ? '#27ae60' : '#c0392b' }}>{ecart >= 0 ? '+' : ''}{fmt(ecart)}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'right', color: ecart >= 0 ? '#27ae60' : '#c0392b' }}>{pctE >= 0 ? '+' : ''}{pctE.toFixed(1)} %</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <BlocCommentaire texte={comments.pilotage} />
      </div>

      {/* Section 13 — Perspectives */}
      {comments.perspectives.trim() && (
        <div className="bloc-solidaire">
          <TitreSection texte="13. Points d'attention et perspectives" />
          <BlocCommentaire texte={comments.perspectives} />
        </div>
      )}

      {/* ══ SIGNATURES ═════════════════════════════════════════ */}
      <div className="bloc-solidaire" style={{ marginTop: '20px' }}>
        <TitreSection texte="Signatures" />

        <p style={{ textAlign: 'center', fontSize: '8pt', color: '#555', marginBottom: '4px' }}>
          Arrêté le présent compte financier au 31 décembre {etab.exercice}.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '16px' }}>
          {[
            { titre: "L'Ordonnateur", nom: nomOrdo },
            { titre: "Le Secrétaire Général", nom: nomSG },
          ].map((sig, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '4px' }}>{sig.titre}</div>
              <div style={{ fontSize: '9pt', marginBottom: '4px' }}>{sig.nom || '……………………'}</div>
              <div style={{ height: '20mm' }} />
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '8pt', color: '#555' }}>Signature et cachet</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PIED DE PAGE FINAL ═════════════════════════════════ */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '7pt', color: '#999', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
        Document généré le {dateEdition} — {etab.nom} ({etab.uai}) — Compte Financier {etab.exercice}
        {etab.academie && ` — Académie de ${etab.academie}`}
      </div>
    </div>
  );
}
