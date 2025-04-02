import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { LocalWorkout } from '@/lib/workout';

/**
 * Hook for accessing the workout history
 */
export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadFromStorage } = useStorage();
  
  // Load workout history on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = loadFromStorage<LocalWorkout[]>('workoutHistory') || [];
        setWorkouts(history);
      } catch (error) {
        console.error('Error loading workout history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [loadFromStorage]);
  
  return {
    workouts,
    loading
  };
}
