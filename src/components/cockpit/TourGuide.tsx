import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

const ETAPES = [
  { titre: 'Voici votre cockpit AC', desc: 'Tableau de bord institutionnel adapté à votre rôle. Tout ce dont vous avez besoin pour piloter le groupement comptable.' },
  { titre: 'Vos indicateurs clés en temps réel', desc: '8 KPI réglementaires consolidés : score CICF, trésorerie, FDR, créances, anomalies M9-6, échéances, marchés, voyages.' },
  { titre: 'Vue consolidée du groupement', desc: 'Heatmap multi-EPLE permettant d\'identifier d\'un coup d\'œil les établissements à risque. Cliquez sur une cellule pour drill-down.' },
  { titre: 'Le centre d\'alertes transverses', desc: 'Toutes les alertes des modules (Balance, Voyages, Marchés…) regroupées avec priorité et lien d\'action direct.' },
  { titre: 'Le calendrier comptable annuel', desc: 'Frise des échéances réglementaires (M9-6, L.421-11, R.421-77). Cliquez sur un point pour ouvrir la fiche échéance.' },
  { titre: 'Le mode d\'emploi', desc: 'Toujours accessible via le menu de navigation. Documentation complète des modules et procédures.' },
  { titre: 'Assistant intelligent', desc: 'En bas à droite, l\'assistant Claude répond à vos questions M9-6, GBCP, CCP avec références réglementaires précises.' },
];

interface Props {
  open: boolean;
  onClose: (completed: boolean) => void;
}

export function TourGuide({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => { if (open) setStep(0); }, [open]);

  const isLast = step === ETAPES.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">{ETAPES[step].titre}</DialogTitle>
            <span className="text-[10px] text-muted-foreground">Étape {step + 1} / {ETAPES.length}</span>
          </div>
          <DialogDescription className="text-sm pt-2">{ETAPES[step].desc}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1 my-2">
          {ETAPES.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <DialogFooter className="flex-row sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => onClose(false)}>
            <X className="h-3 w-3 mr-1" /> Fermer
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-3 w-3 mr-1" /> Précédent
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                Suivant <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => onClose(true)}>Terminer</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
