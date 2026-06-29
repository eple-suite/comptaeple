// Hook React Query pour les agents (amélioration #2) : cache, staleTime,
// invalidation par clé. Remplace les fetch impératifs useState/useEffect.

import { useQuery } from "@tanstack/react-query";
import { listAgents } from "@/services/agents";

export const agentsKey = (establishmentId?: string) => ["agents", establishmentId] as const;

export function useAgents(establishmentId?: string) {
  return useQuery({
    queryKey: agentsKey(establishmentId),
    queryFn: () => listAgents(establishmentId!),
    enabled: !!establishmentId,
    staleTime: 30_000,
  });
}
