import { useState, useCallback, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { 
  LocalWorkout, 
  LocalWorkoutExercise, 
  LocalSet,
  createNewWorkout
} from '@/lib/workout';

/**
 * Hook for managing the current workout
 * This is a specialized wrapper around useWorkout that adds stability
 * features to help prevent unnecessary re-renders
 */
export function useCurrentWorkout() {
  const { saveToStorage, loadFromStorage } = useStorage();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use refs to maintain stable function references
  const workoutRef = useRef<LocalWorkout | null>(null);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    workoutRef.current = workout;
  }, [workout]);
  
  // Load workout on initial mount
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const savedWorkout = loadFromStorage<LocalWorkout>('currentWorkout');
        
        if (savedWorkout) {
          console.log("Loaded current workout from storage:", savedWorkout.name);
          setWorkout(savedWorkout);
          workoutRef.current = savedWorkout;
        } else {
          // Create a new workout if none exists
          const newWorkout = createNewWorkout();
          console.log("Created new workout:", newWorkout.name);
          setWorkout(newWorkout);
          workoutRef.current = newWorkout;
          saveToStorage('currentWorkout', newWorkout);
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
      } finally {
        setLoading(false);
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