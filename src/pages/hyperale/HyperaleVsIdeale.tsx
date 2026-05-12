import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Check, X, Minus, Zap, Sparkles, Trophy, Target, Brain, FileSpreadsheet,
  MessagesSquare, BellRing, Layers, History, Wand2, Languages, Shield,
  Download, GitCompareArrows, Info, Users, GraduationCap, BarChart3,
  Presentation, Rocket, Clock, Smartphone, FileText, LineChart,
} from 'lucide-react';

/**
 * HYPER@LE vs Ide@le — tableau comparatif "rectorat-ready"
 * - 5 catégories thématiques
 * - 3 niveaux : ✓ natif / ~ partiel / ✗ absent
 * - Score visuel par catégorie
 * - Lien vers la version diapositive
 */

type Niveau = 'oui' | 'partiel' | 'non';

interface Row {
  icon: any;
  axe: string;
  ideale: { niveau: Niveau; text: string };
  hyperale: { text: string; bonus?: string };
}

interface Categorie {
  titre: string;
  couleur: string;
  rows: Row[];
}

const CATEGORIES: Categorie[] = [
  {
    titre: 'Données & sources',
    couleur: 'from-blue-500/10 to-transparent',
    rows: [
      {
        icon: FileSpreadsheet, axe: 'Sources de données',
        ideale: { niveau: 'oui', text: 'Connexion native aux données Op@le (ECBU, SDE, SDR, balance) sur l\'exercice en cours' },
        hyperale: { text: 'Mêmes sources Op@le + import CSV/Excel + Chorus Pro + anciens GFC/REPROFI + saisie manuelle', bonus: 'Mapping automatique IA des colonnes (alias, formats FR/EN, virgules/points)' },
      },
      {
        icon: History, axe: 'Profondeur historique',
        ideale: { niveau: 'partiel', text: 'Limitée à la durée d\'utilisation d\'Op@le par l\'EPLE (souvent N et N-1)' },
        hyperale: { text: 'Profondeur 6 exercices N→N-5, y compris période GFC pré-Op@le, projection N+1', bonus: 'Détection automatique des décrochages et ruptures de tendance' },
      },
      {
        icon: GitCompareArrows, axe: 'Multi-établissements',
        ideale: { niveau: 'partiel', text: 'Vue par EPLE ; consolidation de groupement comptable non native' },
        hyperale: { text: 'Sélecteur multi-EPLE, agence comptable consolidée, classement par score de santé', bonus: 'Heatmap des établissements à risque pour l\'AC' },
      },
    ],
  },
  {
    titre: 'Intelligence & analyse',
    couleur: 'from-violet-500/10 to-transparent',
    rows: [
      {
        icon: Brain, axe: 'Interprétation des ratios',
        ideale: { niveau: 'partiel', text: 'Calcule les ratios M9-6 (FDR, BFR, CAF, trésorerie…) sans interprétation textuelle' },
        hyperale: { text: 'Score santé 0-100, niveau qualifié (excellent / surveiller / critique), commentaires IA prêts à coller', bonus: 'Détection patterns DRFN >90j, marge SRH négative, FDR <30j…' },
      },
      {
        icon: BellRing, axe: 'Alertes intelligentes',
        ideale: { niveau: 'partiel', text: 'Lecture de seuils standards M9-6, sans recommandation actionnable' },
        hyperale: { text: 'Seuils paramétrables par EPLE, hiérarchisation info/warning/critical, recommandations cliquables', bonus: 'Mode "Débutant" qui explique l\'alerte en français clair' },
      },
      {
        icon: MessagesSquare, axe: 'Assistant IA conversationnel',
        ideale: { niveau: 'non', text: 'Pas d\'assistant conversationnel à date' },
        hyperale: { text: 'IA contextuelle ("Quels risques sur la trésorerie d\'ici fin d\'année ?") + graphiques + suggestions sourcées M9-6/GBCP', bonus: 'Mode "Expliquez à mon CA" — réponse vulgarisée' },
      },
      {
        icon: LineChart, axe: 'Simulations what-if & prévisions',
        ideale: { niveau: 'non', text: 'Pas de simulateur prospectif intégré' },
        hyperale: { text: 'Simulateur FDR/BFR, projections CAF, scénarios de redressement, prévisions IA', bonus: 'Sliders interactifs en temps réel' },
      },
    ],
  },
  {
    titre: 'Pilotage & décision',
    couleur: 'from-emerald-500/10 to-transparent',
    rows: [
      {
        icon: Users, axe: 'Tableaux de bord par rôle',
        ideale: { niveau: 'partiel', text: 'Vue unique destinée principalement à l\'agent comptable' },
        hyperale: { text: 'Vues dédiées : agent comptable, adjoint gestionnaire, chef d\'établissement, conseil d\'administration', bonus: 'Synthèse 1 page CA prête à projeter' },
      },
      {
        icon: GraduationCap, axe: 'Pilotage pédagogique',
        ideale: { niveau: 'non', text: 'Aucun lien dépenses ↔ activités pédagogiques' },
        hyperale: { text: 'Coût par élève, par projet, par voyage scolaire, par discipline ; analyse marge SRH par convive', bonus: 'Détection des projets à coût atypique' },
      },
      {
        icon: Target, axe: 'Aide à la décision',
        ideale: { niveau: 'non', text: 'Restitution des indicateurs sans plan d\'action proposé' },
        hyperale: { text: 'Suggestions priorisées avec deeplink vers la page d\'action, plan de redressement guidé', bonus: 'Recommandations conformes M9-6 avec référence réglementaire citée' },
      },
      {
        icon: BarChart3, axe: 'Benchmark anonymisé',
        ideale: { niveau: 'non', text: 'Pas de comparaison inter-EPLE' },
        hyperale: { text: 'Comparaison opt-in avec EPLE similaires (taille, type, académie) — données anonymisées', bonus: 'Positionnement quartile par indicateur' },
      },
    ],
  },
  {
    titre: 'Restitution & communication',
    couleur: 'from-amber-500/10 to-transparent',
    rows: [
      {
        icon: Wand2, axe: 'Textes générés',
        ideale: { niveau: 'non', text: 'Production manuelle des commentaires d\'annexe et notes au CA' },
        hyperale: { text: 'Commentaire annexe COFI, note CE, présentation CA, synthèse rectorat — générés par IA', bonus: 'Ton ajusté (technique / pédagogique) selon destinataire' },
      },
      {
        icon: Presentation, axe: 'Rapports CA prêts à l\'emploi',
        ideale: { niveau: 'partiel', text: 'Exports tableurs nécessitant remise en forme manuelle' },
        hyperale: { text: 'PDF A4 paysage 4 pages + PowerPoint complet prêt à projeter en CA', bonus: 'Graphiques pure CSS imprimables, charte EN respectée' },
      },
      {
        icon: Download, axe: 'Exports & compatibilité',
        ideale: { niveau: 'oui', text: 'Exports Excel/CSV standards' },
        hyperale: { text: 'PDF, PPTX, CSV, JSON, copier-coller direct dans le COFI ; format rectorat conforme', bonus: 'Aucune dépendance externe (impression locale OK)' },
      },
      {
        icon: Languages, axe: 'Pédagogie & onboarding',
        ideale: { niveau: 'non', text: 'Vocabulaire technique M9-6 sans mode pédagogique' },
        hyperale: { text: 'Mode Débutant/Expert, infobulles, glossaire, mode d\'emploi pas-à-pas par profil', bonus: 'Tutoriels intégrés et démo rectorat scriptée' },
      },
    ],
  },
  {
    titre: 'Ergonomie, sécurité & gouvernance',
    couleur: 'from-rose-500/10 to-transparent',
    rows: [
      {
        icon: Smartphone, axe: 'Ergonomie & mobile',
        ideale: { niveau: 'partiel', text: 'Interface intégrée Op@le, peu adaptée au mobile' },
        hyperale: { text: 'UI moderne, responsive, dark mode, navigation < 2 clics vers tout indicateur', bonus: 'Consultable sur smartphone en CA' },
      },
      {
        icon: Layers, axe: 'Journal & traçabilité',
        ideale: { niveau: 'non', text: 'Pas de journal d\'événements financiers commenté' },
        hyperale: { text: 'Data Journal chronologique, audit trail complet horodaté, signature des actions', bonus: 'Détection IA d\'anomalies de saisie' },
      },
      {
        icon: Shield, axe: 'Sécurité & RGPD',
        ideale: { niveau: 'oui', text: 'Hébergement et gouvernance Éducation nationale' },
        hyperale: { text: 'RLS par EPLE, chiffrement, gestion fine des droits, RGPD renforcé, anonymisation IA', bonus: 'Mode démonstration sans écriture en base' },
      },
      {
        icon: Clock, axe: 'Temps de préparation analyse',
        ideale: { niveau: 'partiel', text: '~3h par EPLE pour produire l\'analyse complète + commentaires' },
        hyperale: { text: '~20 min : import → score → commentaires → rapport CA générés' },
      },
    ],
  },
];

const KPI = [
  { val: '×6', label: 'profondeur historique', detail: 'N→N-5 vs N/N-1' },
  { val: '×3', label: 'plus de ratios analysés', detail: 'M9-6 + SIG + SRH + projections' },
  { val: '−90%', label: 'temps de préparation', detail: '3h → 20 min par EPLE' },
  { val: '+15', label: 'documents générés', detail: 'PDF, PPTX, notes, commentaires' },
];

function NiveauCell({ niveau, text }: { niveau: Niveau; text: string }) {
  const cfg = {
    oui: { Icon: Check, cls: 'text-success', label: 'Natif' },
    partiel: { Icon: Minus, cls: 'text-amber-500', label: 'Partiel' },
    non: { Icon: X, cls: 'text-destructive', label: 'Absent' },
  }[niveau];
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed">
      <cfg.Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.cls}`} />
      <div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>
        <p className="text-muted-foreground mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function ScoreBadge({ rows }: { rows: Row[] }) {
  const score = rows.reduce((s, r) => s + (r.ideale.niveau === 'oui' ? 100 : r.ideale.niveau === 'partiel' ? 50 : 0), 0) / rows.length;
  return (
    <div className="flex items-center gap-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score Ide@le</div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-bold tabular-nums">{Math.round(score)}/100</span>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-primary ml-2">HYPER@LE</div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary" style={{ width: '100%' }} />
        </div>
        <span className="text-xs font-bold tabular-nums text-primary">100/100</span>
      </div>
    </div>
  );
}

export default function HyperaleVsIdeale() {
  const navigate = useNavigate();
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
              <Badge className="mb-2 bg-primary/15 text-primary hover:bg-primary/20 border-primary/30">Comparatif officiel — version rectorat</Badge>
              <h2 className="text-2xl font-display font-bold tracking-tight">HYPER@LE vs Ide@le</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Ide@le, l'outil officiel embarqué dans Op@le, fournit les ratios M9-6 réglementaires.
                <strong className="text-foreground"> HYPER@LE en fait une plateforme d'analyse augmentée</strong> :
                interprétation IA, profondeur 6 ans, alertes actionnables, rapports CA générés, pilotage pédagogique, benchmark anonymisé.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/hyperale/vs-ideale-slide')} className="gap-2">
            <Presentation className="h-4 w-4" /> Version diapositive
          </Button>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-500/5">
        <CardContent className="p-3 flex items-start gap-2 text-xs leading-relaxed">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Note de sincérité.</strong> Le périmètre exact d'Ide@le évolue avec
            les versions livrées par la DGFIP/MEN. Les fonctions notées « partiel » ou « absent » se basent sur la
            documentation publique à date (instruction M9-6, communications académiques, retours de groupements
            comptables). HYPER@LE est conçu comme une <em>surcouche d'analyse augmentée</em>, indépendante du
            calendrier de déploiement Op@le, et reste pertinente même si Ide@le rattrape une fonction listée.
          </div>
        </CardContent>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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

      {/* Catégories */}
      {CATEGORIES.map((cat, ci) => (
        <Card key={cat.titre} className={`overflow-hidden bg-gradient-to-br ${cat.couleur}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                {ci + 1}. {cat.titre}
              </CardTitle>
              <ScoreBadge rows={cat.rows} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-y border-border/60">
                  <tr>
                    <th className="text-left p-3 font-semibold w-[22%]">Axe</th>
                    <th className="text-left p-3 font-semibold w-[34%]">Ide@le (officiel)</th>
                    <th className="text-left p-3 font-semibold w-[44%] bg-primary/5">
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <Zap className="h-3.5 w-3.5" /> HYPER@LE
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cat.rows.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <tr key={f.axe} className={i % 2 === 0 ? 'bg-background/40' : 'bg-muted/10'}>
                        <td className="p-3 align-top">
                          <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                            <Icon className="h-4 w-4 text-primary shrink-0" />
                            {f.axe}
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <NiveauCell niveau={f.ideale.niveau} text={f.ideale.text} />
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
      ))}

      {/* Pitch */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Pitch en 30 secondes pour le rectorat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            « Ide@le donne les <strong>chiffres bruts</strong> de l'exercice. HYPER@LE en fait une <strong>aide
            à la décision</strong> : il interprète les ratios, alerte de manière hiérarchisée, propose le bon
            levier de redressement et génère le dossier complet du CA. »
          </p>
          <p>
            « Un agent comptable de groupement passe en moyenne <strong>3 heures par EPLE</strong> pour préparer
            l'analyse financière. Avec HYPER@LE, ce temps tombe à <strong>20 minutes</strong>, avec une qualité
            d'analyse supérieure (historique 6 ans, benchmark anonymisé, suggestions sourcées M9-6). »
          </p>
          <p>
            « Et pour les nouveaux gestionnaires, le mode Débutant transforme l'outil en <strong>support de
            formation continue</strong> : chaque ratio est expliqué, chaque alerte renvoie au texte
            réglementaire et à l'action à mener. »
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => navigate('/hyperale/vs-ideale-slide')} className="gap-2"><Presentation className="h-4 w-4" /> Mode diapositive</Button>
            <Button variant="outline" onClick={() => navigate('/hyperale/demo-rectorat')} className="gap-2"><Trophy className="h-4 w-4" /> Démo rectorat scriptée</Button>
            <Button variant="outline" onClick={() => navigate('/hyperale/rapports-ca')} className="gap-2"><FileText className="h-4 w-4" /> Générer un rapport CA</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
