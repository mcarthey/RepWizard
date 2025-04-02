import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { Exercise } from "@shared/schema";
import { 
  LocalWorkout, 
  LocalWorkoutExercise, 
  LocalSet, 
  createNewWorkout, 
  createWorkoutExercise, 
  createSet 
} from "@/lib/workout";
import { useStorage } from "@/hooks/useStorage";

/**
 * Hook for managing the current workout
 * Handles loading, saving, and modifying workout data
 */
export function useWorkout() {
  const { toast } = useToast();
  const { saveToStorage, loadFromStorage } = useStorage();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  // Load workout on initial mount
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const savedWorkout = await loadFromStorage<LocalWorkout>("currentWorkout");
        
        if (savedWorkout) {
          console.log("Loaded workout from storage:", savedWorkout);
          setWorkout(savedWorkout);
        } else {
          // Create a new workout if none exists
          const newWorkout = createNewWorkout();
          console.log("Created new workout:", newWorkout);
          setWorkout(newWorkout);
          saveToStorage("currentWorkout", newWorkout);
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
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, []);

  /**
   * Save workout to storage
   */
  const saveWorkout = useCallback((workout: LocalWorkout) => {
    console.log("Saving workout:", workout);
    saveToStorage("currentWorkout", workout);
  }, [saveToStorage]);

  /**
   * Create a new workout and save it
   */
  const createWorkout = useCallback((workout: LocalWorkout) => {
    console.log("Creating new workout:", workout);
    setWorkout(workout);
    saveToStorage("currentWorkout", workout);
  }, [saveToStorage]);

  /**
   * Update the current workout with new data
   */
  const updateWorkout = useCallback((updatedWorkout: LocalWorkout) => {
    console.log("Updating workout:", updatedWorkout);
    setWorkout(updatedWorkout);
    saveToStorage("currentWorkout", updatedWorkout);
  }, [saveToStorage]);

  /**
   * Add a workout exercise to the current workout
   */
  const addExercise = useCallback((exercise: LocalWorkoutExercise) => {
    if (!workout) return;

    console.log("Adding exercise to workout:", exercise);
    const updatedWorkout = {
      ...workout,
      exercises: [...workout.exercises, exercise]
    };
    
    setWorkout(updatedWorkout);
    saveToStorage("currentWorkout", updatedWorkout);
  }, [workout, saveToStorage]);

  /**
   * Add a set to a workout exercise
   */
  const addSet = useCallback((exerciseId: string, set: LocalSet) => {
    if (!workout) return;

    console.log("Adding set to exercise:", exerciseId, set);
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(exercise => {
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
    saveToStorage("currentWorkout", updatedWorkout);
  }, [workout, saveToStorage]);

  /**
   * Update a set in a workout exercise
   */
  const updateSet = useCallback((exerciseId: string, updatedSet: LocalSet) => {
    if (!workout) return;

    console.log("Updating set:", exerciseId, updatedSet);
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => 
              set.id === updatedSet.id ? updatedSet : set
            )
          };
        }
        return exercise;
      })
    };
    
    setWorkout(updatedWorkout);
    saveToStorage("currentWorkout", updatedWorkout);
  }, [workout, saveToStorage]);

  /**
   * Remove a set from a workout exercise
   */
  const removeSet = useCallback((exerciseId: string, setId: string) => {
    if (!workout) return;

    console.log("Removing set:", exerciseId, setId);
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(exercise => {
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
    saveToStorage("currentWorkout", updatedWorkout);
  }, [workout, saveToStorage]);

  /**
   * Remove an exercise from the workout
   */
  const removeExercise = useCallback((exerciseId: string) => {
    if (!workout) return;

    console.log("Removing exercise:", exerciseId);
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.filter(exercise => exercise.id !== exerciseId)
    };
    
    setWorkout(updatedWorkout);
    saveToStorage("currentWorkout", updatedWorkout);
  }, [workout, saveToStorage]);

  /**
   * Create a new workout exercise for the specified exercise
   */
  const createExerciseForWorkout = useCallback((
    exercise: Exercise,
    workoutId: string = workout?.id || uuidv4()
  ) => {
    const order = workout?.exercises.length || 0;
    return createWorkoutExercise(workoutId, exercise, order);
  }, [workout]);

  /**
   * Create a new set for the specified exercise
   */
  const createSetForExercise = useCallback((
    exerciseId: string,
    setType: LocalSet['setType'] = 'working'
  ) => {
    if (!workout) return null;
    
    const exercise = workout.exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;
    
    const setNumber = exercise.sets.length + 1;
    return createSet(exerciseId, setNumber, setType);
  }, [workout]);

  return {
    workout,
    loading,
    createWorkout,
    saveWorkout,
    updateWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    createExerciseForWorkout,
    createSetForExercise
  };
}