// Hooks React Query — fiches Op@le (amélioration #2).
import { useQuery } from "@tanstack/react-query";
import { listFichesPubliees, listMesFiches } from "@/services/opaleFiches";

export const opaleFichesKeys = {
  publiees: ["opale_fiches", "publiees"] as const,
  mine: ["opale_fiches", "mine"] as const,
};

export function useFichesPubliees() {
  return useQuery({ queryKey: opaleFichesKeys.publiees, queryFn: listFichesPubliees, staleTime: 60_000 });
}

export function useMesFiches() {
  return useQuery({ queryKey: opaleFichesKeys.mine, queryFn: listMesFiches, staleTime: 30_000 });
}
