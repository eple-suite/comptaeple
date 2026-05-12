import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase, ClipboardList, Crown, Users, AlertTriangle, TrendingUp,
  TrendingDown, FileCheck2, Calendar, Wallet, GraduationCap, Building2,
} from 'lucide-react';

type Role = 'ac' | 'adj' | 'chef' | 'ca';

const ROLES: Array<{ id: Role; label: string; icon: any; pitch: string }> = [
  { id: 'ac',   label: 'Agent comptable',         icon: Briefcase,    pitch: 'Vue groupement, risques, contrôles internes' },
  { id: 'adj',  label: 'Adjoint gestionnaire',    icon: ClipboardList,pitch: 'Exécution budgétaire, SRH, voyages, marchés' },
  { id: 'chef', label: 'Chef d\'établissement',   icon: Crown,        pitch: 'Pilotage, équilibre, dialogue de gestion' },
  { id: 'ca',   label: 'Conseil d\'administration',icon: Users,       pitch: 'Synthèse 1 page, vulgarisée, prête à projeter' },
];

interface Tile { titre: string; valeur: string; sous: string; tendance?: 'up' | 'down' | 'flat'; couleur?: string; icon: any; }

const DATA: Record<Role, { titre: string; resume: string; tiles: Tile[]; alertes: string[]; actions: string[] }> = {
  ac: {
    titre: 'Vue agent comptable — groupement',
    resume: '6 EPLE rattachés. 1 en alerte critique (DRFN > 90 j), 2 sous surveillance.',
    tiles: [
      { titre: 'Score moyen groupement', valeur: '72/100', sous: '+4 vs N-1', tendance: 'up', icon: TrendingUp, couleur: 'text-success' },
      { titre: 'EPLE en alerte critique', valeur: '1', sous: 'Lycée Racine — DRFN 112 j', tendance: 'down', icon: AlertTriangle, couleur: 'text-destructive' },
      { titre: 'FDR consolidé', valeur: '892 k€', sous: '≈ 78 jours de fonctionnement', icon: Wallet, couleur: 'text-primary' },
      { titre: 'Contrôles internes en retard', valeur: '3', sous: 'Régies, marchés > 15 k€', icon: FileCheck2, couleur: 'text-amber-500' },
    ],
    alertes: [
      'Lycée Racine — DRFN 112 j (seuil 90 j) → analyser créances anciennes',
      'Collège Bois Rada — FDR 22 j (< 30 j) → plan de redressement à proposer',
      'Lycée Monnet — marge SRH −2,3 % → vérifier crédit nourriture',
    ],
    actions: [
      'Convoquer le CA du Lycée Racine pour validation plan d\'apurement',
      'Préparer note rectorat sur 2 EPLE sous surveillance',
      'Lancer benchmark anonymisé groupement vs académie',
    ],
  },
  adj: {
    titre: 'Vue adjoint gestionnaire — exécution courante',
    resume: 'Exécution 67 % au 30/09 (cible 75 %). 2 marchés à relancer, 1 voyage en clôture.',
    tiles: [
      { titre: 'Taux d\'exécution charges', valeur: '67 %', sous: 'Cible 75 % au T3', icon: TrendingDown, couleur: 'text-amber-500' },
      { titre: 'Marge SRH', valeur: '+3,1 %', sous: 'Conforme cible 2-5 %', tendance: 'up', icon: TrendingUp, couleur: 'text-success' },
      { titre: 'Voyages en cours', valeur: '4', sous: '1 en clôture, 0 en alerte 8 €', icon: Calendar, couleur: 'text-primary' },
      { titre: 'Marchés à relancer', valeur: '2', sous: 'Énergie, fournitures bureau', icon: ClipboardList, couleur: 'text-amber-500' },
    ],
    alertes: [
      'Convention voyage Espagne — pièce 4116 manquante',
      'Marché énergie — relance fournisseur prévue le 15/10',
    ],
    actions: [
      'Saisir SDE/SDR dernière période pour HYPER@LE',
      'Préparer commission permanente du 12/10',
      'Clôturer voyage Espagne (excédent à reverser ?)',
    ],
  },
  chef: {
    titre: 'Vue chef d\'établissement — pilotage',
    resume: 'Établissement en bonne santé (78/100). Dialogue de gestion à préparer.',
    tiles: [
      { titre: 'Score santé', valeur: '78/100', sous: 'Niveau : bon', tendance: 'up', icon: TrendingUp, couleur: 'text-success' },
      { titre: 'Coût moyen / élève', valeur: '432 €', sous: 'Médiane académie : 458 €', icon: GraduationCap, couleur: 'text-primary' },
      { titre: 'Réserves disponibles', valeur: '135 k€', sous: '6,2 mois de charges courantes', icon: Wallet, couleur: 'text-success' },
      { titre: 'Projets pédagogiques', valeur: '12', sous: '8 financés sur fonds propres', icon: Building2, couleur: 'text-primary' },
    ],
    alertes: [
      'Crédits pédagogiques sous-consommés (38 %) — 2 disciplines concernées',
      'Tarification SRH revoir au prochain CA (taux d\'occupation +8 %)',
    ],
    actions: [
      'Préparer dialogue de gestion rectorat avec rapport HYPER@LE',
      'Présenter projet de tarification SRH au CA du 18/11',
      'Communiquer aux équipes : budget pédagogique disponible 24 k€',
    ],
  },
  ca: {
    titre: 'Synthèse Conseil d\'administration',
    resume: 'L\'établissement présente une situation financière saine. 3 décisions sont attendues.',
    tiles: [
      { titre: 'Situation financière', valeur: 'Saine', sous: 'Score 78/100 (en hausse)', tendance: 'up', icon: TrendingUp, couleur: 'text-success' },
      { titre: 'Trésorerie', valeur: '108 k€', sous: '≈ 4 mois de fonctionnement', icon: Wallet, couleur: 'text-success' },
      { titre: 'Capacité d\'autofinancement', valeur: '89 k€', sous: '+3,5 % vs N-1', tendance: 'up', icon: TrendingUp, couleur: 'text-success' },
      { titre: 'Décisions attendues', valeur: '3', sous: 'DBM, tarification SRH, voyage', icon: ClipboardList, couleur: 'text-primary' },
    ],
    alertes: [
      'Vote DBM n°2 — réaffectation crédits pédagogiques',
      'Vote tarification restauration 2026',
      'Approbation voyage scolaire Espagne (12 200 €)',
    ],
    actions: [
      'Lecture par le chef d\'établissement de la synthèse HYPER@LE',
      'Vote des 3 délibérations du jour',
      'Information sur le rapport rectorat (annexe jointe)',
    ],
  },
};

export default function HyperaleDashboardsRoles() {
  const [role, setRole] = useState<Role>('ac');
  const data = DATA[role];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-5"
      >
        <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Tableaux de bord adaptatifs</Badge>
        <h2 className="text-xl font-display font-bold tracking-tight">Une vue par rôle, zéro bruit inutile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          HYPER@LE adapte automatiquement les indicateurs, alertes et actions à votre fonction. Cliquez sur un profil :
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(r => {
          const Icon = r.icon;
          const active = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${active ? 'border-primary bg-primary/5 shadow-primary' : 'border-border/50 bg-card hover:border-primary/40'}`}
            >
              <Icon className={`h-5 w-5 mb-2 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className={`font-semibold text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{r.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{r.pitch}</div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data.titre}</CardTitle>
          <p className="text-sm text-muted-foreground">{data.resume}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.tiles.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.titre}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/20 p-4"
                >
                  <Icon className={`h-4 w-4 mb-2 ${t.couleur || 'text-primary'}`} />
                  <div className="text-2xl font-display font-bold text-foreground">{t.valeur}</div>
                  <div className="text-xs font-semibold text-foreground mt-1">{t.titre}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.sous}</div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alertes prioritaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.alertes.map(a => (
                <li key={a} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-primary" /> Actions suggérées</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.actions.map(a => (
                <li key={a} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-4 w-full">Générer un plan d'action complet (PDF)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
