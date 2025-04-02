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
        console.log("Loading workout from local storage...");
        const localForage = await getLocalForage();
        const storedWorkout = await localForage.getItem<LocalWorkout>(STORAGE_KEYS.CURRENT_WORKOUT);
        console.log("Retrieved workout from storage:", storedWorkout);
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
          console.log("Saving workout to storage:", workout);
          const localForage = await getLocalForage();
          await localForage.setItem(STORAGE_KEYS.CURRENT_WORKOUT, workout);
          console.log("Workout saved successfully");
        } catch (error) {
          console.error('Error saving workout:', error);
        }
      }
    };

    if (!loading) {
      saveWorkout();
    }
  }, [workout, loading]);

  // Create a new workout - stable reference
  const createWorkout = useCallback((newWorkout: LocalWorkout) => {
    console.log("Creating new workout:", newWorkout);
    setWorkout(newWorkout);
  }, []);

  // Add an exercise to the workout - stable reference
  const addExercise = useCallback((exercise: LocalExercise) => {
    console.log("Adding exercise to workout:", exercise);
    setWorkout(prev => {
      if (!prev) {
        console.error("Cannot add exercise: workout is null");
        return null;
      }
      console.log("Current exercises:", prev.exercises.length);
      const updated = {
        ...prev,
        exercises: [...prev.exercises, exercise]
      };
      console.log("Updated workout:", updated);
      return updated;
    });
  }, []);

  // Update an exercise in the workout - stable reference
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

  // Remove an exercise from the workout - stable reference
  const removeExercise = useCallback((exerciseId: string) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
      };
    });
  }, []);

  // Add a set to an exercise - stable reference
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

  // Update a set - stable reference
  const updateSet = useCallback((exerciseId: string, setId: string, updates: Partial<LocalSet>) => {
    console.log("useStorage.updateSet:", { exerciseId, setId, updates });
    
    setWorkout(prev => {
      if (!prev) return null;
      
      // Find the exercise to update
      const exerciseToUpdate = prev.exercises.find(ex => ex.id === exerciseId);
      if (!exerciseToUpdate) {
        console.error(`Exercise with id ${exerciseId} not found`);
        return prev;
      }
      
      // Find the set to update
      const setToUpdate = exerciseToUpdate.sets.find(set => set.id === setId);
      if (!setToUpdate) {
        console.error(`Set with id ${setId} not found in exercise ${exerciseId}`);
        return prev;
      }
      
      console.log("Found set to update:", setToUpdate);
      
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

  // Remove a set - stable reference
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

  // Complete the workout - stable reference
  const completeWorkout = useCallback(() => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        completed: true
      };
    });
  }, []);

  // Clear the current workout - stable reference
  const clearWorkout = useCallback(async () => {
    try {
      const localForage = await getLocalForage();
      await localForage.removeItem(STORAGE_KEYS.CURRENT_WORKOUT);
      setWorkout(null);
    } catch (error) {
      console.error('Error clearing workout:', error);
    }
  }, []);

  // Update the entire workout object - stable reference
  const updateWorkout = useCallback((updates: Partial<LocalWorkout>) => {
    setWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates
      };
    });
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
    clearWorkout,
    updateWorkout
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
