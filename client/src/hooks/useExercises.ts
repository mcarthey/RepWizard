import { useQuery } from '@tanstack/react-query';
import { Exercise } from '@shared/schema';

export function useExercises() {
  return useQuery<Exercise[], Error>({
    queryKey: ['/api/exercises'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}