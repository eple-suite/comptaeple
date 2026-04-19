import { TextareaElastique } from '@/components/rapport/TextareaElastique';
import { SaveIndicator } from '@/components/SaveIndicator';
import { SectionEditorial } from '@/components/cofieple/premium/SectionEditorial';
import { NarrationIA } from '@/components/cofieple/premium/NarrationIA';
import { useOrdoData } from './useOrdoData';

// ── Métadonnées éditoriales par section ────────────────────────
// Mapping numero → kicker, lede et accent magazine
const SECTION_META: Record<string, { lede: string; meta: string; accent: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  S1:  { lede: "Identité de l'établissement, périmètre comptable et grandes caractéristiques de l'exercice.", meta: 'M9-6 §1.1', accent: 'primary' },
  S2:  { lede: "Vue d'ensemble synthétique des grands équilibres financiers et de l'exécution budgétaire.", meta: 'M9-6 §2.1', accent: 'primary' },
  S3:  { lede: "Analyse de l'exécution des dépenses de fonctionnement par service et domaine.", meta: 'M9-6 §2.3.1', accent: 'destructive' },
  S4:  { lede: "Analyse de l'exécution des recettes par origine, dont ressources propres et subventions.", meta: 'M9-6 §2.3.2', accent: 'success' },
  S5:  { lede: "Indicateurs de pilotage : taux d'exécution, jours de fonds de roulement, créances et dettes.", meta: 'M9-6 §2.4', accent: 'primary' },
  S6:  { lede: "Service de restauration et d'hébergement : équilibre du SRH, taux de pression et coûts.", meta: 'M9-6 §3.2', accent: 'warning' },
  S7:  { lede: "Vie de l'élève : fonds sociaux, bourses, contributions familiales et politique tarifaire.", meta: 'M9-6 §3.3', accent: 'secondary' },
  S8:  { lede: "Viabilisation : consommations énergétiques, surfaces, ratios par m² et par élève.", meta: 'M9-6 §3.4', accent: 'warning' },
  S9:  { lede: "Activités pédagogiques, voyages scolaires et projets éducatifs financés sur l'exercice.", meta: 'M9-6 §3.5', accent: 'secondary' },
  S10: { lede: "Analyse des créances et dettes : restes à recouvrer, restes à payer, ancienneté et qualité du recouvrement.", meta: 'M9-6 §4.1', accent: 'destructive' },
  S11: { lede: "Compte de résultat : formation du résultat comptable, capacité d'autofinancement et affectation.", meta: 'M9-6 §5.1', accent: 'primary' },
  S12: { lede: "Perspectives pluriannuelles : trajectoires d'investissement, financement et stratégie financière.", meta: 'M9-6 §6.1', accent: 'secondary' },
  S13: { lede: "Signatures de l'ordonnateur et de l'agent comptable, validation et transmission du rapport.", meta: 'M9-6 §7.1', accent: 'primary' },
};

export function CommentaireBox({
  label, value, onChange, status, lastSaved,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  status?: 'saving' | 'saved' | 'idle';
  lastSaved?: Date | null;
}) {
  return (
    <div className="mt-6 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">✎ {label}</span>
        {status && status !== 'idle' && <SaveIndicator status={status as 'saving' | 'saved'} lastSaved={lastSaved ?? null} />}
      </div>
      <TextareaElastique
        value={value}
        onChange={onChange}
        placeholder="Saisissez votre commentaire éditorial…"
        minRows={3}
      />
    </div>
  );
}

/**
 * SectionTitre — magazine premium
 * Affiche un en-tête éditorial + (optionnel) une narration IA contextuelle.
 * Conserve l'API legacy (numero, title) utilisée par les 13 sections Ordo.
 */
export function SectionTitre({
  numero,
  title,
  withNarration = false,
}: {
  numero: string;
  title: string;
  withNarration?: boolean;
}) {
  const meta = SECTION_META[numero] ?? { lede: '', meta: numero, accent: 'primary' as const };

  return (
    <>
      <SectionEditorial
        kicker={`Section ${numero} · Ordonnateur`}
        title={title}
        lede={meta.lede}
        meta={meta.meta}
        accent={meta.accent}
      />
      {withNarration && <SectionTitreNarration numero={numero} title={title} />}
    </>
  );
}

/** Slot de narration IA contextualisée à la section courante */
function SectionTitreNarration({ numero, title }: { numero: string; title: string }) {
  const { etab, R, ind } = useOrdoData();
  if (!R) return null;
  return (
    <div className="mb-6">
      <NarrationIA
        sectionId={`ordo_${numero.toLowerCase()}_${etab.uai}_${etab.exercice}`}
        title={`Lecture experte — ${title}`}
        variant="compact"
        context={{
          section: numero,
          etablissement: { nom: etab.nom, uai: etab.uai, exercice: etab.exercice, type: etab.type },
          resultats: R,
          indicateurs: ind,
        }}
      />
    </div>
  );
}
