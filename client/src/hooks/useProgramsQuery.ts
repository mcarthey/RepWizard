import { useQuery } from "@tanstack/react-query";
import { Program } from "@shared/schema";

/**
 * Hook for fetching programs data
 */
export function useProgramsQuery() {
  return useQuery<Program[]>({
    queryKey: ['/api/programs'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}