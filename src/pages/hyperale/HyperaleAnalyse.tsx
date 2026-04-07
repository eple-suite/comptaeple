import { useState } from 'react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useHyperaleData } from './useHyperaleData';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import {
  Wallet, TrendingUp, Landmark, ShieldCheck, Copy, Check,
  HelpCircle, BookOpen, FileText, Users, Lightbulb, Target,
  AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k`;
const fmtTooltip = (v: number) => fmt(v);

interface IndicatorConfig {
  key: string;
  title: string;
  icon: React.ElementType;
  color: string;
  value: number;
  days?: number;
  explanation: string;
  causes: string[];
  consequences: string[];
  recommendations: string[];
  compNat: number;
  compColl: number;
  compLabel: string;
  currentComp: number;
  historique: { exercice: number; value: number }[];
  textAnnexe: string;
  textNote: string;
  textCA: string;
}

function CopyButton({ label, icon: Icon, text }: { label: string; icon: React.ElementType; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Texte copié !');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
      <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copié' : 'Copier'}
      </Button>
    </div>
  );
}

function IndicatorPanel({ config: c }: { config: IndicatorConfig }) {
  const barColors = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${c.color}`}>
          <c.icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl font-black text-foreground">{fmt(c.value)}</span>
            {c.days != null && <Badge variant="outline" className="text-xs">≈ {c.days.toFixed(1)} jours</Badge>}
          </div>
        </div>
      </div>

      {/* Explication */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
        <p className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <span>{c.explanation}</span>
        </p>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> Évolution historique
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={c.historique}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="exercice" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={45} />
                <Tooltip formatter={fmtTooltip} labelFormatter={l => `Exercice ${l}`} />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Line type="monotone" dataKey="value" name={c.title} stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Comparaison ({c.compLabel})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Établ.', val: c.currentComp },
                { name: 'Moy. nat.', val: c.compNat },
                { name: 'Moy. coll.', val: c.compColl },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} width={35} />
                <Tooltip />
                <Bar dataKey="val" name="Valeur" radius={[6, 6, 0, 0]}>
                  {[0, 1, 2].map(i => <Cell key={i} fill={barColors[i]} fillOpacity={i === 0 ? 1 : 0.5} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Analyse détaillée */}
      <Accordion type="multiple" defaultValue={['causes', 'reco']} className="space-y-2">
        <AccordionItem value="causes" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-bold py-3">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Causes probables & Conséquences
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Causes probables</p>
                <ul className="space-y-1">
                  {c.causes.map((t, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t}</li>)}
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Conséquences possibles</p>
                <ul className="space-y-1">
                  {c.consequences.map((t, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-warning mt-0.5">•</span>{t}</li>)}
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reco" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-bold py-3">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-secondary" /> Recommandations opérationnelles
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5 pb-2">
              {c.recommendations.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />{r}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="textes" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-bold py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Textes prêts à copier
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-2">
              <CopyButton label="Annexe du COFI" icon={BookOpen} text={c.textAnnexe} />
              <CopyButton label="Note au chef d'établissement" icon={FileText} text={c.textNote} />
              <CopyButton label="Présentation en CA" icon={Users} text={c.textCA} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default function HyperaleAnalyse() {
  const navigate = useNavigate();
  const etab = useCofiepleStore(s => s.etablissement);
  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const nom = etab.nom || 'l\'établissement';

  const configs: IndicatorConfig[] = [
    {
      key: 'fdr', title: 'Fonds de roulement', icon: Wallet, color: 'bg-primary',
      value: data.fdr, days: data.fdrJours,
      explanation: `Le fonds de roulement représente la marge de sécurité financière de ${nom}. Il correspond à l'excédent des ressources stables sur les emplois stables. Un FDR positif signifie que l'établissement dispose d'une réserve pour faire face aux imprévus.`,
      causes: ['Accumulation de résultats excédentaires', 'Subventions d\'investissement non consommées', 'Amortissements supérieurs aux investissements'],
      consequences: data.fdr < 0 ? ['Impossibilité de financer le BFR', 'Risque d\'incident de trésorerie', 'Nécessité de solliciter la collectivité'] : ['Capacité à absorber les imprévus', 'Marge de manœuvre pour les investissements'],
      recommendations: data.fdr < 0 ? ['Réduire les dépenses non prioritaires', 'Accélérer le recouvrement des créances', 'Solliciter un abondement de la collectivité'] : ['Maintenir le niveau actuel', 'Envisager des investissements pédagogiques', 'Constituer une provision pour GER'],
      compNat: data.moyenneNationale.fdrJours, compColl: data.moyenneCollectivite.fdrJours,
      compLabel: 'en jours', currentComp: data.fdrJours,
      historique: data.historique.map(h => ({ exercice: h.exercice, value: h.fdr })),
      textAnnexe: `Le fonds de roulement de ${nom} s'établit à ${fmt(data.fdr)} au 31/12/${exercice}, soit ${data.fdrJours.toFixed(1)} jours de fonctionnement. ${data.fdrJours > 45 ? 'Ce niveau est supérieur à la moyenne nationale.' : data.fdrJours > 30 ? 'Ce niveau est conforme aux recommandations.' : 'Ce niveau est inférieur au seuil recommandé de 30 jours.'}`,
      textNote: `Monsieur/Madame le Chef d'établissement,\n\nLe fonds de roulement au 31/12/${exercice} s'élève à ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours). ${data.fdr > 0 ? 'La situation financière permet d\'envisager des projets d\'investissement.' : 'La situation nécessite une attention particulière sur les dépenses.'}`,
      textCA: `Le fonds de roulement de l'établissement atteint ${fmt(data.fdr)}, soit ${data.fdrJours.toFixed(1)} jours de fonctionnement. ${data.fdrJours > 30 ? 'Cette marge de sécurité est satisfaisante.' : 'Une vigilance s\'impose pour maintenir la capacité financière.'}`,
    },
    {
      key: 'caf', title: 'Capacité d\'autofinancement', icon: TrendingUp, color: 'bg-secondary',
      value: data.caf,
      explanation: `La CAF mesure la capacité de ${nom} à dégager des ressources par son activité courante pour financer ses investissements, rembourser ses emprunts ou renforcer son fonds de roulement.`,
      causes: data.caf > 0 ? ['Bonne maîtrise des charges', 'Recettes supérieures aux prévisions', 'Dotations aux amortissements'] : ['Charges réelles supérieures aux produits', 'Sous-exécution des recettes', 'Charges exceptionnelles non anticipées'],
      consequences: data.caf > 0 ? ['Capacité à investir sans endettement', 'Renforcement du FDR'] : ['Érosion du fonds de roulement', 'Nécessité de recourir à l\'emprunt'],
      recommendations: data.caf > 0 ? ['Planifier un programme d\'investissement', 'Maintenir la dynamique de gestion'] : ['Identifier les postes de charges à optimiser', 'Revoir la tarification SRH', 'Sécuriser les recettes attendues'],
      compNat: 92, compColl: 89, compLabel: 'taux exec. charges %', currentComp: data.tauxExecCharges,
      historique: data.historique.map(h => ({ exercice: h.exercice, value: h.caf })),
      textAnnexe: `La capacité d'autofinancement de ${nom} est de ${fmt(data.caf)} en ${exercice}. ${data.caf > 0 ? 'L\'établissement dégage des ressources suffisantes pour financer ses investissements.' : 'L\'établissement ne dégage pas suffisamment de ressources pour son autofinancement.'}`,
      textNote: `La CAF s'établit à ${fmt(data.caf)}. ${data.caf > 0 ? 'La gestion courante est saine.' : 'Des mesures correctives sont à envisager.'}`,
      textCA: `La CAF de l'exercice ${exercice} atteint ${fmt(data.caf)}. ${data.caf >= 0 ? 'La gestion permet l\'autofinancement des investissements.' : 'Un redressement est nécessaire.'}`,
    },
    {
      key: 'tresorerie', title: 'Trésorerie', icon: Landmark, color: 'bg-warning',
      value: data.tresorerie, days: data.tresorerieJours,
      explanation: `La trésorerie représente les liquidités immédiatement disponibles. Elle doit couvrir au minimum 15 jours de fonctionnement pour éviter les incidents de paiement.`,
      causes: ['Encaissements rapides des subventions', 'Retards dans les mandatements', 'Niveau du FDR'],
      consequences: data.tresorerie < 0 ? ['Impossibilité de payer les fournisseurs', 'Risque de rejet de virements', 'Alerte du comptable public'] : ['Paiements assurés à bonne date', 'Sérénité de gestion'],
      recommendations: data.tresorerieJours < 15 ? ['Accélérer les encaissements', 'Reporter les dépenses non urgentes', 'Relancer les débiteurs'] : ['Maintenir le suivi hebdomadaire', 'Anticiper les décaissements importants'],
      compNat: data.moyenneNationale.tresorerieJours, compColl: data.moyenneCollectivite.tresorerieJours,
      compLabel: 'en jours', currentComp: data.tresorerieJours,
      historique: data.historique.map(h => ({ exercice: h.exercice, value: h.tresorerie })),
      textAnnexe: `La trésorerie au 31/12/${exercice} s'élève à ${fmt(data.tresorerie)}, soit ${data.tresorerieJours.toFixed(1)} jours de fonctionnement. ${data.tresorerieJours >= 15 ? 'Ce niveau est satisfaisant.' : 'Ce niveau est insuffisant.'}`,
      textNote: `La trésorerie disponible est de ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours). ${data.tresorerieJours >= 15 ? 'Les paiements sont assurés.' : 'Vigilance requise sur les flux de trésorerie.'}`,
      textCA: `La trésorerie de ${fmt(data.tresorerie)} couvre ${data.tresorerieJours.toFixed(1)} jours de charges. ${data.tresorerieJours >= 15 ? 'Situation normale.' : 'Situation tendue nécessitant un suivi rapproché.'}`,
    },
    {
      key: 'reserves', title: 'Réserves', icon: ShieldCheck, color: 'bg-accent',
      value: data.reserves,
      explanation: `Les réserves constituent l'épargne accumulée par ${nom} au fil des exercices. Elles matérialisent la solidité financière et la capacité à faire face aux aléas.`,
      causes: ['Résultats excédentaires passés', 'Politique prudente de gestion', 'Subventions non affectées'],
      consequences: data.reserves > 20000 ? ['Solidité financière démontrée', 'Capacité à financer des projets'] : ['Fragilité face aux imprévus', 'Marge limitée pour les investissements'],
      recommendations: data.reserves < 10000 ? ['Préserver les réserves existantes', 'Viser un résultat excédentaire', 'Limiter les prélèvements'] : ['Planifier l\'utilisation des réserves', 'Affecter aux projets prioritaires'],
      compNat: 45, compColl: 38, compLabel: 'FDR en jours', currentComp: data.fdrJours,
      historique: data.historique.map(h => ({ exercice: h.exercice, value: h.reserves })),
      textAnnexe: `Les réserves de ${nom} s'établissent à ${fmt(data.reserves)} au 31/12/${exercice}.`,
      textNote: `Les réserves de l'établissement sont de ${fmt(data.reserves)}.`,
      textCA: `Les réserves totales atteignent ${fmt(data.reserves)}.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Analyse complète — {nom}</h2>
          <p className="text-xs text-muted-foreground">Exercice {exercice} · Sélectionnez un indicateur ci-dessous</p>
        </div>
        {!data.hasData && <Badge className="bg-warning/15 text-warning border-warning/30" variant="outline">Données de démonstration</Badge>}
      </div>

      <Tabs defaultValue="fdr" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {configs.map(c => (
            <TabsTrigger key={c.key} value={c.key} className="gap-1.5 text-xs">
              <c.icon className="h-3.5 w-3.5" />{c.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {configs.map(c => (
          <TabsContent key={c.key} value={c.key}>
            <IndicatorPanel config={c} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
