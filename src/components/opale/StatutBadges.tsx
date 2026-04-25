import { Badge } from "@/components/ui/badge";
import {
  STATUT_ACTUALITE_LABELS,
  STATUT_PUBLICATION_LABELS,
  VISIBILITE_LABELS,
  type OpaleStatutActualite,
  type OpaleStatutPublication,
  type OpaleVisibilite,
} from "@/lib/opale/types";

export function BadgeActualite({ statut }: { statut: OpaleStatutActualite }) {
  const cfg = STATUT_ACTUALITE_LABELS[statut];
  return (
    <Badge variant="outline" className={cfg.color}>
      {cfg.label}
    </Badge>
  );
}

export function BadgePublication({ statut }: { statut: OpaleStatutPublication }) {
  return <Badge variant="secondary">{STATUT_PUBLICATION_LABELS[statut]}</Badge>;
}

export function BadgeVisibilite({ visibilite }: { visibilite: OpaleVisibilite }) {
  return <Badge variant="outline">{VISIBILITE_LABELS[visibilite]}</Badge>;
}

export function BadgeVersion({ version }: { version: string }) {
  if (!version) return null;
  return <Badge variant="outline" className="font-mono">Op@le {version}</Badge>;
}