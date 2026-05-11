import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Rocket, FileSpreadsheet, BarChart3, Bell, Bot, Settings,
  Users, ChevronRight, Lightbulb, AlertTriangle, Sparkles, Target, MessagesSquare,
  CalendarDays, Trophy, Brain, Workflow,
} from 'lucide-react';

/**
 * Mode d'emploi complet du module HYPER@LE.
 * Structure : 3 parcours (Découverte, Quotidien, Expert) + glossaire + FAQ + raccourcis.
 */

const PARCOURS = [
  {
    id: 'decouverte',
    icon: Rocket,
    title: 'Parcours Découverte',
    duree: '10 min',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
    cible: 'Vous découvrez HYPER@LE',
    etapes: [
      { num: 1, titre: 'Ouvrez la page Accueil', desc: 'Sélectionnez votre établissement et l\'exercice à analyser. Le score de santé financière s\'affiche immédiatement.', cta: { label: 'Aller à l\'Accueil', to: '/hyperale' } },
      { num: 2, titre: 'Lisez le résumé "storyteller"', desc: 'Un texte généré explique en français clair la situation de votre EPLE. Aucun jargon : il est destiné à votre chef d\'établissement.' },
      { num: 3, titre: 'Parcourez les 4 KPI principaux', desc: 'FDR, CAF, Trésorerie, Réserves. Chaque tuile affiche une infobulle de définition (mode Débutant activé).' },
      { num: 4, titre: 'Consultez les suggestions proactives', desc: 'L\'IA repère les points faibles et propose des actions priorisées. Cliquez sur une suggestion pour atterrir directement sur le bon écran.' },
    ],
  },
  {
    id: 'quotidien',
    icon: Workflow,
    title: 'Parcours Quotidien',
    duree: '20 min / mois',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    cible: 'Vous utilisez HYPER@LE chaque mois',
    etapes: [
      { num: 1, titre: 'Importez la balance Op@le du mois', desc: 'Import > déposez vos fichiers ECBU / SDE / SDR. La détection est automatique. Aucune ressaisie.', cta: { label: 'Aller à l\'Import', to: '/hyperale/import' } },
      { num: 2, titre: 'Ajoutez un événement au Data Journal', desc: 'Datez vos décisions financières (DBM, virement, encaissement exceptionnel). L\'historique permet de retracer la trajectoire au moment du COFI.', cta: { label: 'Ouvrir le Journal', to: '/hyperale/journal' } },
      { num: 3, titre: 'Vérifiez les nouvelles alertes', desc: 'Toute évolution franchissant un seuil produit une alerte hiérarchisée (info / warning / critical). Traitez en priorité les alertes rouges.' },
      { num: 4, titre: 'Lancez l\'Analyse complète', desc: 'Graphiques pluriannuels, ratios SIG, marge SRH, DRFN. Copiez les commentaires générés directement dans votre annexe COFI.', cta: { label: 'Lancer l\'Analyse', to: '/hyperale/analyse' } },
    ],
  },
  {
    id: 'expert',
    icon: Trophy,
    title: 'Parcours Expert',
    duree: 'à la demande',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    cible: 'Agent comptable, préparation rectorat',
    etapes: [
      { num: 1, titre: 'Personnalisez les seuils', desc: 'Paramètres > ajustez les bornes FDR (jours), trésorerie, taux d\'exécution selon le profil de l\'établissement (interne, demi-pension, EREA…).', cta: { label: 'Ouvrir Paramètres', to: '/hyperale/parametres' } },
      { num: 2, titre: 'Activez le mode Expert', desc: 'Affiche tous les ratios SIG (VA, EBE, MBA), les ratios bilanciels avancés, les comparaisons aux moyennes nationales.' },
      { num: 3, titre: 'Consolidation multi-EPLE', desc: 'Pour un agent comptable de groupement : le sélecteur multi-établissements affiche un classement par score de santé et identifie les EPLE à risque.' },
      { num: 4, titre: 'Interrogez l\'Assistant IA', desc: 'Posez des questions précises ("pourquoi ma DRFN dépasse 90 jours ?") — la réponse cite la M9-6 et propose un plan d\'action.', cta: { label: 'Ouvrir l\'Assistant', to: '/hyperale/assistant' } },
      { num: 5, titre: 'Exportez en PDF', desc: 'Génération d\'un PDF A4 paysage de 4 pages prêt à présenter au CA ou au rectorat (graphiques pure CSS, aucune dépendance externe).' },
    ],
  },
];

const GLOSSAIRE = [
  { terme: 'FDR', def: 'Fonds de Roulement = Capitaux permanents − Actif immobilisé. Exprime la marge de manœuvre de financement durable.' },
  { terme: 'BFR', def: 'Besoin en Fonds de Roulement = Stocks + créances d\'exploitation − dettes d\'exploitation. Mesure le besoin de financement du cycle d\'exploitation.' },
  { terme: 'Trésorerie', def: 'Trésorerie = FDR − BFR. Solde des disponibilités après financement du cycle d\'exploitation.' },
  { terme: 'CAF', def: 'Capacité d\'Autofinancement = Résultat + dotations − reprises. Indique la capacité de l\'EPLE à dégager des ressources internes.' },
  { terme: 'DRFN', def: 'Délai de Règlement des Fournisseurs Net (en jours). Seuil d\'alerte : 90 jours (M9-6 §4.3).' },
  { terme: 'Marge SRH', def: 'Marge du Service de Restauration et d\'Hébergement = recettes SRH − charges SRH. Doit être positive ou nulle.' },
  { terme: 'Réserves', def: 'Capital comptable accumulé. En augmentation = exercices excédentaires successifs.' },
  { terme: 'Score de santé', def: 'Indicateur synthétique 0-100 calculé par HYPER@LE à partir de FDR, trésorerie, CAF, résultat, taux d\'exécution.' },
];

const FAQ = [
  {
    q: 'Quelle différence avec Ide@le ?',
    r: 'Ide@le donne les ratios bruts de l\'exercice en cours. HYPER@LE ajoute l\'historique pluriannuel, l\'interprétation IA, les suggestions actionnables, l\'assistant conversationnel et les textes prêts à diffuser au CA. Voir l\'onglet "vs Ide@le" pour le comparatif détaillé.',
  },
  {
    q: 'Mes données sont-elles envoyées à l\'IA ?',
    r: 'Non. Seuls les indicateurs agrégés (chiffres) sont transmis à l\'IA pour analyse. Aucune donnée nominative (élèves, agents, fournisseurs) ne quitte la plateforme.',
  },
  {
    q: 'Puis-je l\'utiliser sans avoir migré sur Op@le ?',
    r: 'Oui. La saisie manuelle des indicateurs annuels est possible (page Paramètres > Saisie manuelle). HYPER@LE devient alors un outil de pilotage indépendant.',
  },
  {
    q: 'Comment importer une balance Op@le ?',
    r: 'Page Import Op@le > glissez-déposez vos fichiers ECBU, SDE et SDR. La détection du type est automatique. Une vérification de cohérence s\'affiche avant validation.',
  },
  {
    q: 'Que faire si mon score de santé est rouge (critique) ?',
    r: 'Cliquez sur la suggestion prioritaire affichée en haut de la page Accueil. Elle vous renvoie vers l\'écran de l\'indicateur dégradé avec un plan d\'action chiffré. L\'Assistant IA peut compléter avec des précisions réglementaires.',
  },
  {
    q: 'Puis-je présenter HYPER@LE au CA sans risque sur les vraies données ?',
    r: 'Oui : activez le Mode démonstration (sidebar) pour basculer sur un jeu de données fictif "Lycée Démonstration Rectorat". Aucune écriture en base.',
  },
];

const PROFILS = [
  { icon: Users, role: 'Chef d\'établissement', focus: 'Lecture du score, du résumé storyteller et des alertes critiques. Mode Débutant recommandé.' },
  { icon: BarChart3, role: 'Gestionnaire / SA', focus: 'Saisie mensuelle, Data Journal, suivi des seuils, génération des commentaires COFI.' },
  { icon: Trophy, role: 'Agent comptable', focus: 'Mode Expert, multi-EPLE, paramétrage fin des seuils, restitution PDF rectorat.' },
  { icon: GraduationCap, role: 'Stagiaire / nouvel arrivant', focus: 'Mode démonstration, glossaire, parcours Découverte, Assistant IA pour comprendre chaque ratio.' },
];

const RACCOURCIS = [
  { icon: BarChart3, label: 'Accueil & score', to: '/hyperale' },
  { icon: Sparkles, label: 'Analyse complète', to: '/hyperale/analyse' },
  { icon: CalendarDays, label: 'Data Journal', to: '/hyperale/journal' },
  { icon: FileSpreadsheet, label: 'Import Op@le', to: '/hyperale/import' },
  { icon: Settings, label: 'Paramètres / seuils', to: '/hyperale/parametres' },
  { icon: Bot, label: 'Assistant IA', to: '/hyperale/assistant' },
  { icon: Trophy, label: 'Comparatif vs Ide@le', to: '/hyperale/vs-ideale' },
];

export default function HyperaleModeEmploi() {
  const navigate = useNavigate();
  const [activeParcours, setActiveParcours] = useState<string>('decouverte');

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-6"
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className="mb-2 bg-primary/15 text-primary hover:bg-primary/20 border-primary/30">Mode d'emploi HYPER@LE</Badge>
            <h2 className="text-2xl font-display font-bold tracking-tight">Tout ce qu'il faut savoir pour tirer le meilleur du module</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
              Trois parcours selon votre profil, un glossaire des indicateurs clés, une FAQ et tous les raccourcis.
              Vous pouvez à tout moment activer le <strong>Mode démonstration</strong> pour expérimenter sans toucher
              aux vraies données.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Profils */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Quel est votre profil&nbsp;?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PROFILS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.role} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <div className="text-sm font-semibold">{p.role}</div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.focus}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Parcours */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Choisissez votre parcours</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {PARCOURS.map((p) => {
            const Icon = p.icon;
            const active = activeParcours === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveParcours(p.id)}
                className={`text-left rounded-xl border-2 p-4 transition-all bg-gradient-to-br ${p.color} ${
                  active ? `${p.border} shadow-md scale-[1.02]` : 'border-border/40 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-foreground" />
                  <Badge variant="outline" className="text-[10px]">{p.duree}</Badge>
                </div>
                <div className="font-bold text-sm">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.cible}</div>
              </button>
            );
          })}
        </div>

        {PARCOURS.filter((p) => p.id === activeParcours).map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5 space-y-3">
              {p.etapes.map((e) => (
                <div key={e.num} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {e.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{e.titre}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{e.desc}</p>
                    {'cta' in e && e.cta && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs"
                        onClick={() => navigate(e.cta!.to)}
                      >
                        {e.cta.label} <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raccourcis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Raccourcis vers chaque écran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {RACCOURCIS.map((r) => {
              const Icon = r.icon;
              return (
                <Button
                  key={r.label}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(r.to)}
                  className="justify-start h-auto py-2"
                >
                  <Icon className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span className="text-xs">{r.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Glossaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Glossaire des indicateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GLOSSAIRE.map((g) => (
              <div key={g.terme} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="font-bold text-sm text-primary mb-1">{g.terme}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.def}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-primary" />
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {f.r}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Bonnes pratiques */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Bonnes pratiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2"><Bell className="h-3.5 w-3.5 text-primary mt-1 shrink-0" /><span>Importez une balance Op@le au moins une fois par mois pour conserver une trajectoire fiable.</span></div>
          <div className="flex items-start gap-2"><Bell className="h-3.5 w-3.5 text-primary mt-1 shrink-0" /><span>Datez vos décisions financières dans le Data Journal — vous gagnerez un temps précieux au COFI.</span></div>
          <div className="flex items-start gap-2"><Bell className="h-3.5 w-3.5 text-primary mt-1 shrink-0" /><span>Avant le CA, exportez le PDF 4 pages : il est conçu pour être joint à la convocation.</span></div>
          <div className="flex items-start gap-2"><Bell className="h-3.5 w-3.5 text-primary mt-1 shrink-0" /><span>Pour une démo ou une formation, activez le Mode démonstration depuis la sidebar.</span></div>
        </CardContent>
      </Card>
    </div>
  );
}