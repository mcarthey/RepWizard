import { useState, useCallback, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { 
  LocalWorkout, 
  LocalWorkoutExercise, 
  LocalSet,
  createNewWorkout
} from '@/lib/workout';

// Create a static cache to maintain workout state between renders and component mounts
// This prevents unnecessary reloads when navigating between tabs
let workoutCache: {
  workout: LocalWorkout | null;
  lastUpdated: number;
} | null = null;

/**
 * Hook for managing the current workout
 * This is a specialized wrapper around useWorkout that adds stability
 * features to help prevent unnecessary re-renders
 */
export function useCurrentWorkout() {
  const { saveToStorage, loadFromStorage } = useStorage();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<LocalWorkout | null>(
    // Initialize from cache if available to prevent flicker during navigation
    workoutCache?.workout || null
  );
  const [loading, setLoading] = useState(!workoutCache);
  
  // Use refs to maintain stable function references
  const workoutRef = useRef<LocalWorkout | null>(workout);
  const initialLoadCompletedRef = useRef<boolean>(!!workoutCache);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    workoutRef.current = workout;
    
    // Update the cache when workout changes
    if (workout) {
      workoutCache = {
        workout,
        lastUpdated: Date.now()
      };
    }
  }, [workout]);
  
  // Load workout on initial mount, but only if we don't have cached data
  useEffect(() => {
    // Skip if we already completed initial load or have cached data
    if (initialLoadCompletedRef.current) {
      return;
    }
    
    const loadWorkout = async () => {
      try {
        // Check if the cached workout is still recent (within last 5 minutes)
        const isCacheValid = workoutCache && 
          (Date.now() - workoutCache.lastUpdated < 5 * 60 * 1000);
          
        if (isCacheValid && workoutCache.workout) {
          console.log("Using cached workout:", workoutCache.workout.name);
          setWorkout(workoutCache.workout);
          workoutRef.current = workoutCache.workout;
        } else {
          // Load from localStorage if cache is invalid or missing
          const savedWorkout = loadFromStorage<LocalWorkout>('currentWorkout');
          
          if (savedWorkout) {
            console.log("Loaded current workout from storage:", savedWorkout.name);
            setWorkout(savedWorkout);
            workoutRef.current = savedWorkout;
            
            // Update cache
            workoutCache = {
              workout: savedWorkout,
              lastUpdated: Date.now()
            };
          } else {
            // Create a new workout if none exists
            const newWorkout = createNewWorkout();
            console.log("Created new workout:", newWorkout.name);
            setWorkout(newWorkout);
            workoutRef.current = newWorkout;
            saveToStorage('currentWorkout', newWorkout);
            
            // Update cache
            workoutCache = {
              workout: newWorkout,
              lastUpdated: Date.now()
            };
          }
        }
      } catch (error) {
        console.error("Error loading workout:", error);
        toast({
          title: "Error",
          description: "Failed to load workout data",
          variant: "destructive"
        });
        
        // Create a new workout as fallback
        const newWorkout = createNewWorkout();
        setWorkout(newWorkout);
        workoutRef.current = newWorkout;
        
        // Update cache
        workoutCache = {
          workout: newWorkout,
          lastUpdated: Date.now()
        };
      } finally {
        setLoading(false);
        initialLoadCompletedRef.current = true;
      }
    };
    
    loadWorkout();
  }, []);
  
  /**
   * Update the current workout while ensuring consistent behavior
   */
  const updateWorkout = useCallback((updatedWorkout: LocalWorkout) => {
    console.log("Updating workout:", updatedWorkout.name, updatedWorkout.date);
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
  }, [saveToStorage]);
  
  /**
   * Create a new workout
   */
  const createWorkout = useCallback(() => {
    const newWorkout = createNewWorkout();
    console.log("Creating new workout:", newWorkout.name);
    setWorkout(newWorkout);
    saveToStorage('currentWorkout', newWorkout);
    return newWorkout;
  }, [saveToStorage]);
  
  /**
   * Add an exercise to the current workout
   */
  const addExercise = useCallback((exercise: LocalWorkoutExercise) => {
    if (!workoutRef.current) return;
    
    const updatedWorkout = {
      ...workoutRef.current,
      exercises: [...workoutRef.current.exercises, exercise]
    };
    
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
  }, [saveToStorage]);
  
  /**
   * Remove an exercise from the current workout
   */
  const removeExercise = useCallback((exerciseId: string) => {
    if (!workoutRef.current) return;
    
    const updatedWorkout = {
      ...workoutRef.current,
      exercises: workoutRef.current.exercises.filter(e => e.id !== exerciseId)
    };
    
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
  }, [saveToStorage]);
  
  /**
   * Add a set to an exercise
   */
  const addSet = useCallback((exerciseId: string, set: LocalSet) => {
    if (!workoutRef.current) return;
    
    const updatedWorkout = {
      ...workoutRef.current,
      exercises: workoutRef.current.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: [...exercise.sets, set]
          };
        }
        return exercise;
      })
    };
    
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
  }, [saveToStorage]);
  
  /**
   * Update a set in an exercise
   */
  const updateSet = useCallback((exerciseId: string, setId: string, updatedSet: LocalSet) => {
    if (!workoutRef.current) return;
    
    const updatedWorkout = {
      ...workoutRef.current,
      exercises: workoutRef.current.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => 
              set.id === setId ? updatedSet : set
            )
          };
        }
        return exercise;
      })
    };
    
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
  }, [saveToStorage]);
  
  /**
   * Remove a set from an exercise
   */
  const removeSet = useCallback((exerciseId: string, setId: string) => {
    if (!workoutRef.current) return;
    
    const updatedWorkout = {
      ...workoutRef.current,
      exercises: workoutRef.current.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== setId)
          };
        }
        return exercise;
      })
    };
    
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
  }, [saveToStorage]);
  
  /**
   * Mark the workout as completed
   */
  const completeWorkout = useCallback(() => {
    if (!workoutRef.current) return;
    
    const updatedWorkout = {
      ...workoutRef.current,
      completed: true
    };
    
    setWorkout(updatedWorkout);
    saveToStorage('currentWorkout', updatedWorkout);
    
    // Save to workout history
    const workoutHistory = loadFromStorage<LocalWorkout[]>('workoutHistory') || [];
    saveToStorage('workoutHistory', [...workoutHistory, updatedWorkout]);
    
    toast({
      title: "Workout completed",
      description: "Your workout has been saved to history"
    });
  }, [saveToStorage, loadFromStorage, toast]);
  
  return {
    workout,
    loading,
    updateWorkout,
    createWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    completeWorkout
  };
}