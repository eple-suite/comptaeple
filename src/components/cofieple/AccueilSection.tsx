// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Section Accueil (identification UAI + budgets annexes)
// Réglementation : Code Éducation Art. L421-1, L423-1 (GRETA),
//                  Code du travail Art. L6232-1 (CFA)
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { UxChainDiagram } from './UxChainDiagram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, X, ArrowRight, Info, Check } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import type { EtablissementUI } from '@/lib/cofieple_storeTypes';

export function AccueilSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const setEtablissement = useCofiepleStore(s => s.setEtablissement);
  const addBudgetAnnexe = useCofiepleStore(s => s.addBudgetAnnexe);
  const removeBudgetAnnexe = useCofiepleStore(s => s.removeBudgetAnnexe);
  const budgets = useCofiepleStore(s => s.budgets);
  const setActiveTab = useCofiepleStore(s => s.setActiveTab);

  const { establishments, selectedEstablishment, selectEstablishment } = useEstablishment();

  // Auto-sync selected establishment into cofieple store
  useEffect(() => {
    if (selectedEstablishment && selectedEstablishment.uai !== etab.uai) {
      const typeMap: Record<string, string> = {
        'Lycée': 'lycee', 'Lycée professionnel': 'lycee_pro',
        'LEGT': 'legt', 'Collège': 'college', 'EREA': 'erea',
      };
      setEtablissement({
        uai: selectedEstablishment.uai,
        nom: selectedEstablishment.name,
        type: typeMap[selectedEstablishment.type] || 'lycee',
        commune: selectedEstablishment.city,
        academie: selectedEstablishment.academy,
        exercice: etab.exercice || new Date().getFullYear() - 1,
      });
    }
  }, [selectedEstablishment]);

  function handleSelectEstablishment(id: string) {
    const est = establishments.find(e => e.id === id);
    if (est) selectEstablishment(est);
  }

  const hasBA_GRETA = budgets.some(b => b.type === 'annexe_greta');
  const hasBA_CFA = budgets.some(b => b.type === 'annexe_cfa');

  return (
    <div className="space-y-5">
      {/* Bandeau réglementaire */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-foreground">
            <strong>COFIEPLE</strong> — Outil d'analyse du compte financier EPLE. Importez les extractions Op@le
            (SDE, SDR, Balance) pour obtenir la check-list de cohérence M9-6, les rapports de l'ordonnateur et
            de l'agent comptable, et le diaporama du conseil d'administration.
            Prise en charge des <strong>budgets annexes GRETA</strong> et <strong>CFA</strong> (Art. L423-1
            Code Éducation — M9-6 2026 Titre 3).
          </div>
        </CardContent>
      </Card>

      {/* Sélection de l'établissement */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Identification de l'établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Établissement</Label>
              {establishments.length > 0 ? (
                <Select value={selectedEstablishment?.id || ''} onValueChange={handleSelectEstablishment}>
                  <SelectTrigger className="mt-1.5 font-semibold">
                    <SelectValue placeholder="Sélectionnez un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map(est => (
                      <SelectItem key={est.id} value={est.id}>
                        <span className="font-mono text-primary mr-2">{est.uai}</span>
                        {est.name}
                        {est.city && <span className="text-muted-foreground ml-1">— {est.city}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1.5 p-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Aucun établissement enregistré.{' '}
                    <Button variant="link" className="p-0 h-auto text-primary" onClick={() => window.location.href = '/etablissements'}>
                      Ajouter un établissement
                    </Button>
                  </p>
                </div>
              )}
              {selectedEstablishment && (
                <p className="text-xs mt-1.5 flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="h-3 w-3" />
                  Données chargées depuis le menu Établissements
                </p>
              )}
              <p className="text-muted-foreground text-xs mt-1">Source : menu Établissements de l'application</p>
            </div>
          </div>

          {/* Champs identitaires — LECTURE SEULE depuis le référentiel Établissements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReadOnlyField label="Nom de l'établissement" value={etab.nom} />
            <ReadOnlyField label="Type" value={etab.type} />
            <ReadOnlyField label="UAI / RNE" value={etab.uai} mono />
            <ReadOnlyField label="Commune" value={etab.commune} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReadOnlyField label="Académie" value={etab.academie} />
            <ReadOnlyField label="Région académique" value={etab.regionAcademique} />
            <ReadOnlyField label="Département" value={etab.departement || ''} />
          </div>

          {/* Champs éditables spécifiques au Compte Financier */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">Paramètres du compte financier</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Exercice" value={String(etab.exercice)} onChange={v => setEtablissement({ exercice: parseInt(v) || 2025 })} type="number" />
              <FormField label="Date d'arrêté" value={etab.dateArrete} onChange={v => setEtablissement({ dateArrete: v })} type="date" />
              <FormField label="Ordonnateur" value={etab.ordonnateur} onChange={v => setEtablissement({ ordonnateur: v })} placeholder="Prénom NOM" />
              <FormField label="Agent comptable" value={etab.agentComptable} onChange={v => setEtablissement({ agentComptable: v })} placeholder="Prénom NOM" />
            </div>
          </div>

          <Button onClick={() => setActiveTab('import')} className="mt-2">
            <ArrowRight className="h-4 w-4 mr-2" />
            Passer aux imports CSV
          </Button>
        </CardContent>
      </Card>

      {/* Budgets annexes */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Budgets annexes (GRETA · CFA)
            <Badge variant="outline" className="ml-auto text-warning border-warning/50 text-xs">
              Art. L423-1 Code Éducation — M9-6 2026 Titre 3
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Si l'établissement est support d'un <strong>GRETA</strong> (Art. L423-1 Code de l'Éducation) ou d'un{' '}
            <strong>CFA</strong> (Art. L6232-1 Code du travail), activez le budget annexe correspondant pour
            obtenir une <strong>consolidation automatique</strong> avec élimination des flux internes (compte 185).
          </p>
          <div className="flex flex-wrap gap-3">
            {!hasBA_GRETA ? (
              <Button variant="outline" className="border-dashed border-2 border-primary/30" onClick={() => addBudgetAnnexe({ type: 'annexe_greta', libelle: 'GRETA' })}>
                <Plus className="h-4 w-4 mr-2" /> Budget annexe GRETA
              </Button>
            ) : (
              <Card className="border-primary/30 bg-primary/5 min-w-[280px]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-primary text-primary-foreground">GRETA ACTIVÉ</Badge>
                      <p className="text-sm font-semibold mt-1">Formation Continue</p>
                      <p className="text-xs text-muted-foreground">Art. L423-1 Code de l'Éducation</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeBudgetAnnexe('annexe_greta')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {!hasBA_CFA ? (
              <Button variant="outline" className="border-dashed border-2 border-purple-300" onClick={() => addBudgetAnnexe({ type: 'annexe_cfa', libelle: 'CFA' })}>
                <Plus className="h-4 w-4 mr-2" /> Budget annexe CFA
              </Button>
            ) : (
              <Card className="border-purple-300 bg-purple-50 dark:bg-purple-900/10 min-w-[280px]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-purple-600 text-white">CFA ACTIVÉ</Badge>
                      <p className="text-sm font-semibold mt-1">Apprentissage</p>
                      <p className="text-xs text-muted-foreground">Art. L6232-1 Code du travail</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeBudgetAnnexe('annexe_cfa')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Références réglementaires */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg">
          <CardTitle className="text-white text-sm">📖 Références réglementaires</CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { titre: 'M9-6 — 2026', desc: 'Instruction codificatrice du 12 février 2026 — Comptabilité des EPLE (5e édition)', color: 'primary' },
            { titre: 'Décret 2012-1246', desc: 'Règlement général sur la comptabilité publique (RGCP) du 7 novembre 2012', color: 'muted' },
            { titre: 'Code de l\'Éducation', desc: 'Art. L421-1 à L421-26 (EPLE) — Art. L423-1 (GRETA)', color: 'success' },
            { titre: 'Code du travail', desc: 'Art. L6232-1 et suivants — CFA — Loi n°2018-771 Avenir Pro', color: 'warning' },
          ].map(r => (
            <div key={r.titre} className="rounded-lg border p-4 bg-muted/30">
              <div className="font-bold text-sm mb-1">{r.titre}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{r.desc}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chaîne de valeur UX */}
      <UxChainDiagram />
    </div>
  );
}

function FormField({ label, value, onChange, placeholder = '', type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5" />
    </div>
  );
}
