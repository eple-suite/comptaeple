// Hook React Query — alertes ouvertes (amélioration #2, support #15).
import { useQuery } from "@tanstack/react-query";
import { listAlertesOuvertes } from "@/services/alertes";

export const alertesOuvertesKey = ["alertes_transverses", "ouvertes"] as const;

export function useAlertesOuvertes() {
  return useQuery({ queryKey: alertesOuvertesKey, queryFn: listAlertesOuvertes, staleTime: 60_000 });
}
