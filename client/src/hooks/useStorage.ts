import { useState, useEffect, useCallback } from 'react';
import { LocalExercise, LocalSet, LocalWorkout } from '@shared/schema';
import { getLocalForage, STORAGE_KEYS } from '@/lib/localForage';

// Hook for managing current workout in localStorage
export function useCurrentWorkout() {
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  // Load workout from storage
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const localForage = await getLocalForage();
        const storedWorkout = await localForage.getItem<LocalWorkout>(STORAGE_KEYS.CURRENT_WORKOUT);
        setWorkout(storedWorkout || null);
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, []);

  // Save workout to storage whenever it changes
  useEffect(() => {
    const saveWorkout = async () => {
      if (workout) {
        try {
          const localForage = await getLocalForage();
          await localForage.setItem(STORAGE_KEYS.CURRENT_WORKOUT, workout);
        } catch (error) {
          console.error('Error saving workout:', error);
        }
      }
    };

    if (!loading) {
      saveWorkout();
    }
  }, [workout, loading]);

  // Create a new workout
  const createWorkout = useCallback((newWorkout: LocalWorkout) => {
    setWorkout(newWorkout);
  }, []);

  // Add an exercise to the workout
  const addExercise = useCallback((exercise: LocalExercise) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: [...prev.exercises, exercise]
      };
    });
  }, []);

  // Update an exercise in the workout
  const updateExercise = useCallback((exerciseId: string, updates: Partial<LocalExercise>) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, ...updates } : ex
        )
      };
    });
  }, []);

  // Remove an exercise from the workout
  const removeExercise = useCallback((exerciseId: string) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
      };
    });
  }, []);

  // Add a set to an exercise
  const addSet = useCallback((exerciseId: string, set: LocalSet) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: [...ex.sets, set]
            };
          }
          return ex;
        })
      };
    });
  }, []);

  // Update a set
  const updateSet = useCallback((exerciseId: string, setId: string, updates: Partial<LocalSet>) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.map(set => 
                set.id === setId ? { ...set, ...updates } : set
              )
            };
          }
          return ex;
        })
      };
    });
  }, []);

  // Remove a set
  const removeSet = useCallback((exerciseId: string, setId: string) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.filter(set => set.id !== setId)
            };
          }
          return ex;
        })
      };
    });
  }, []);

  // Complete the workout
  const completeWorkout = useCallback(() => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        completed: true
      };
    });
  }, []);

  // Clear the current workout
  const clearWorkout = useCallback(async () => {
    try {
      const localForage = await getLocalForage();
      await localForage.removeItem(STORAGE_KEYS.CURRENT_WORKOUT);
      setWorkout(null);
    } catch (error) {
      console.error('Error clearing workout:', error);
    }
  }, []);

  return {
    workout,
    loading,
    createWorkout,
    addExercise,
    updateExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    completeWorkout,
    clearWorkout
  };
}

// Hook for managing workout history in localStorage
export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workouts from storage
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const localForage = await getLocalForage();
        const storedWorkouts = await localForage.getItem<LocalWorkout[]>(STORAGE_KEYS.WORKOUT_HISTORY);
        setWorkouts(storedWorkouts || []);
      } catch (error) {
        console.error('Error loading workout history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, []);

  // Save workouts to storage whenever they change
  useEffect(() => {
    const saveWorkouts = async () => {
      try {
        const localForage = await getLocalForage();
        await localForage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, workouts);
      } catch (error) {
        console.error('Error saving workout history:', error);
      }
    };

    if (!loading) {
      saveWorkouts();
    }
  }, [workouts, loading]);

  // Add a workout to history
  const addWorkout = useCallback((workout: LocalWorkout) => {
    setWorkouts(prev => [...prev, workout]);
  }, []);

  // Remove a workout from history
  const removeWorkout = useCallback((workoutId: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
  }, []);

  // Get a specific workout by ID
  const getWorkout = useCallback((workoutId: string) => {
    return workouts.find(w => w.id === workoutId) || null;
  }, [workouts]);

  return {
    workouts,
    loading,
    addWorkout,
    removeWorkout,
    getWorkout
  };
}
