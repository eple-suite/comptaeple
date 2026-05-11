import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Sparkles, Trophy, Target, Brain, FileSpreadsheet, MessagesSquare, BellRing, Layers, History, Wand2, Languages, Shield, Download, GitCompareArrows } from 'lucide-react';

/**
 * Page comparative HYPER@LE vs Ide@le
 * Pensée pour une démonstration au rectorat : positionne HYPER@LE comme la
 * surcouche d'analyse "augmentée" qui va deux fois plus loin que l'outil officiel.
 */

interface FeatureRow {
  icon: any;
  axe: string;
  ideale: { ok: boolean; text: string };
  hyperale: { text: string; bonus?: string };
}

const FEATURES: FeatureRow[] = [
  {
    icon: FileSpreadsheet,
    axe: 'Sources de données',
    ideale: { ok: true, text: 'Restitutions Op@le standardisées (ECBU, SDE, SDR)' },
    hyperale: { text: 'Mêmes sources Op@le + saisie manuelle + historique pluriannuel N à N-5 + import balance externe', bonus: 'Compatible établissements non encore migrés Op@le' },
  },
  {
    icon: History,
    axe: 'Historique pluriannuel',
    ideale: { ok: false, text: 'Vue principalement annuelle, comparaison N/N-1 limitée' },
    hyperale: { text: 'Profondeur 6 exercices (N à N-5), graphiques de tendance, détection automatique des décrochages', bonus: 'Projection N+1 sur la base de la trajectoire CAF/FDR' },
  },
  {
    icon: Brain,
    axe: 'Intelligence d\'analyse',
    ideale: { ok: false, text: 'Calcul des ratios M9-6, sans interprétation' },
    hyperale: { text: 'Score de santé financière 0-100, niveau (excellent / surveiller / critique), texte "storyteller" généré + suggestions proactives priorisées', bonus: 'Détection patterns : DRFN >90j, marge SRH négative, FDR <30j, etc.' },
  },
  {
    icon: BellRing,
    axe: 'Moteur d\'alertes',
    ideale: { ok: false, text: 'Alertes basiques sur seuils figés' },
    hyperale: { text: 'Seuils paramétrables par établissement, alertes hiérarchisées (info/warning/critical), recommandations actionnables avec lien vers le levier', bonus: 'Mode "Débutant" qui explique chaque alerte en français clair' },
  },
  {
    icon: MessagesSquare,
    axe: 'Assistant conversationnel',
    ideale: { ok: false, text: 'Aucun' },
    hyperale: { text: 'Assistant IA contextuel branché sur les données de l\'établissement, réponses sourcées M9-6 / GBCP', bonus: 'Suggestions de questions, mode "expliquez à mon CA"' },
  },
  {
    icon: Wand2,
    axe: 'Textes prêts à copier',
    ideale: { ok: false, text: 'Aucun — production manuelle des commentaires' },
    hyperale: { text: 'Génère automatiquement : commentaire annexe COFI, note CE, présentation CA, synthèse rectorat', bonus: 'Ton ajusté (technique / pédagogique) selon le destinataire' },
  },
  {
    icon: Languages,
    axe: 'Pédagogie',
    ideale: { ok: false, text: 'Vocabulaire purement technique' },
    hyperale: { text: 'Mode Débutant / Expert, infobulles définition pour chaque indicateur, glossaire intégré', bonus: 'Tutoriels vidéo et mode d\'emploi pas-à-pas par profil utilisateur' },
  },
  {
    icon: GitCompareArrows,
    axe: 'Multi-établissements',
    ideale: { ok: false, text: 'Vue mono-établissement' },
    hyperale: { text: 'Sélecteur multi-EPLE, comparaison de groupement, vue agence comptable consolidée, classement par score', bonus: 'Heatmap des établissements à risque pour l\'AC' },
  },
  {
    icon: Layers,
    axe: 'Journal de bord',
    ideale: { ok: false, text: 'Aucun journal' },
    hyperale: { text: 'Data Journal chronologique : événements financiers, décisions CA, commentaires datés', bonus: 'Détection IA d\'anomalies de saisie (montants atypiques)' },
  },
  {
    icon: Download,
    axe: 'Export et restitution',
    ideale: { ok: true, text: 'Exports tableurs bruts' },
    hyperale: { text: 'PDF A4 paysage prêt à diffuser (4 pages), export CSV, copier-coller direct dans le COFI', bonus: 'Graphiques pure CSS imprimables, aucune dépendance externe' },
  },
  {
    icon: Shield,
    axe: 'Souveraineté & sécurité',
    ideale: { ok: true, text: 'Hébergement Éducation nationale' },
    hyperale: { text: 'Données chiffrées, RLS par établissement, audit trail complet, aucune donnée nominative envoyée à l\'IA', bonus: 'Mode démonstration sans écriture en base pour formation/présentation' },
  },
  {
    icon: Target,
    axe: 'Aide à la décision',
    ideale: { ok: false, text: 'Lecture passive des indicateurs' },
    hyperale: { text: 'Suggestions priorisées avec deeplink vers la page d\'action, simulateur FDR, plan de redressement guidé', bonus: 'Recommandations conformes M9-6 avec référence réglementaire citée' },
  },
];

const CHIFFRES = [
  { val: '×2', label: 'plus de ratios analysés', detail: 'FDR, BFR, trésorerie, CAF, DRFN, ratios SIG, marge SRH' },
  { val: '×6', label: 'profondeur historique', detail: 'N à N-5 vs N/N-1' },
  { val: '0', label: 'minute de saisie', detail: 'import direct des restitutions Op@le' },
  { val: '+12', label: 'documents générés', detail: 'commentaires, notes, PDF, exports prêts' },
];

export default function HyperaleVsIdeale() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-6"
      >
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <Badge className="mb-2 bg-primary/15 text-primary hover:bg-primary/20 border-primary/30">Positionnement rectorat</Badge>
              <h2 className="text-2xl font-display font-bold tracking-tight">HYPER@LE vs Ide@le — l'analyse augmentée</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Ide@le est l'outil officiel d'analyse financière intégré à Op@le. Il fournit les ratios réglementaires sur l'exercice
                en cours. <strong className="text-foreground">HYPER@LE</strong> reprend cette base et la double : profondeur historique,
                intelligence proactive, assistant IA, suggestions actionnables et restitutions prêtes à diffuser au CA et au rectorat.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CHIFFRES.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-4">
                <div className="text-3xl font-display font-bold text-primary">{c.val}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground mt-1">{c.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{c.detail}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tableau comparatif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Comparaison fonctionnelle détaillée
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/60">
                <tr>
                  <th className="text-left p-3 font-semibold w-[22%]">Axe</th>
                  <th className="text-left p-3 font-semibold w-[34%]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                      Ide@le (officiel)
                    </span>
                  </th>
                  <th className="text-left p-3 font-semibold w-[44%] bg-primary/5">
                    <span className="inline-flex items-center gap-1.5 text-primary">
                      <Zap className="h-3.5 w-3.5" />
                      HYPER@LE
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <tr key={f.axe} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          {f.axe}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed">
                          {f.ideale.ok ? (
                            <Check className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          )}
                          <span>{f.ideale.text}</span>
                        </div>
                      </td>
                      <td className="p-3 align-top bg-primary/5">
                        <div className="flex items-start gap-2 text-xs leading-relaxed">
                          <Check className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                          <div>
                            <div className="text-foreground">{f.hyperale.text}</div>
                            {f.hyperale.bonus && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                <Sparkles className="h-3 w-3" /> Bonus : {f.hyperale.bonus}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pitch rectorat */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Pitch en 30 secondes pour le rectorat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            « Ide@le nous donne les <strong>chiffres bruts</strong> de l'exercice. HYPER@LE en fait une
            <strong> aide à la décision</strong> : il interprète les ratios, alerte de manière hiérarchisée,
            propose le bon levier de redressement et génère les commentaires que nous mettrions des heures
            à rédiger pour le CA. »
          </p>
          <p>
            « Concrètement : un agent comptable de groupement passe en moyenne <strong>3h par établissement</strong>
            pour préparer l'analyse financière. Avec HYPER@LE, ce temps tombe à <strong>20 minutes</strong>,
            avec une qualité d'analyse supérieure (historique 6 ans, suggestions sourcées M9-6). »
          </p>
          <p>
            « Et pour les nouveaux gestionnaires, le mode Débutant transforme l'outil en <strong>support de
            formation continue</strong> : chaque ratio est expliqué, chaque alerte renvoie au texte
            réglementaire et à l'action à mener. »
          </p>
        </CardContent>
      </Card>
    </div>
  );
}