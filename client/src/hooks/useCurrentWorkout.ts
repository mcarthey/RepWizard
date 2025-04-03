import { useState, useCallback, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  LocalWorkout, 
  LocalWorkoutExercise, 
  LocalSet,
  createNewWorkout
} from '@/lib/workout';

/**
 * Generate a consistent storage key for a specific date
 * Format: workout_YYYY-MM-DD
 */
const getWorkoutKeyForDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateStr = format(dateObj, 'yyyy-MM-dd');
  const key = `workout_${dateStr}`;
  console.log(`[TRACKING] Generated storage key for date ${dateStr}, timestamp: ${dateObj.getTime()}, key: ${key}`);
  return key;
};

/**
 * Hook for managing workouts by date
 * Each date has its own workout stored in localStorage with a unique key
 */
export function useCurrentWorkout() {
  const { saveToStorage, loadFromStorage } = useStorage();
  const { toast } = useToast();
  
  // Active date state
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  
  // Workout and loading states
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load the workout whenever the active date changes
  useEffect(() => {
    const loadWorkoutForDate = async () => {
      try {
        setLoading(true);
        
        // Get the storage key for this date
        const storageKey = getWorkoutKeyForDate(activeDate);
        console.log(`[TRACKING] Loading workout for date: ${format(activeDate, 'yyyy-MM-dd')} with key: ${storageKey}`);
        console.log(`[TRACKING] Active date timestamp: ${activeDate.getTime()}`);
        
        // Try to load an existing workout for this date
        const savedWorkout = loadFromStorage<LocalWorkout>(storageKey);
        
        if (savedWorkout) {
          console.log(`[TRACKING] Found workout for date ${format(activeDate, 'yyyy-MM-dd')}:`, savedWorkout);
          console.log(`[TRACKING] Workout has ${savedWorkout.exercises.length} exercises`);
          console.log(`[TRACKING] Workout date from storage: ${savedWorkout.date}`);
          console.log(`[TRACKING] Workout date timestamp: ${new Date(savedWorkout.date).getTime()}`);
          
          // Force a complete state update to ensure UI rendering
          setWorkout(null); // Clear first
          setTimeout(() => {
            // Set the workout with a slight delay
            setWorkout(savedWorkout);
            console.log("[TRACKING] Setting workout to:", savedWorkout.name, "with", savedWorkout.exercises.length, "exercises");
            // Explicitly set loading to false AFTER the workout is set
            setTimeout(() => setLoading(false), 50);
          }, 10); // Then set with small delay
        } else {
          // Create a new workout for this date if none exists
          console.log(`No workout found for ${format(activeDate, 'yyyy-MM-dd')}, creating new one`);
          const newWorkout = createNewWorkout(`Workout for ${format(activeDate, 'MMM d, yyyy')}`);
          newWorkout.date = activeDate.toISOString();
          
          // Save it immediately
          saveToStorage(storageKey, newWorkout);
          
          // Force a complete state update to ensure UI rendering
          setWorkout(null); // Clear first
          setTimeout(() => {
            // Set the workout with a slight delay
            setWorkout(newWorkout);
            console.log("Setting new workout to:", newWorkout.name);
            // Explicitly set loading to false AFTER the workout is set
            setTimeout(() => setLoading(false), 50);
          }, 10); // Then set with small delay
        }
      } catch (error) {
        console.error(`Error loading workout for date ${format(activeDate, 'yyyy-MM-dd')}:`, error);
        toast({
          title: "Error",
          description: `Failed to load workout for ${format(activeDate, 'MMMM d, yyyy')}`,
          variant: "destructive"
        });
        
        // Create a fallback workout
        const fallbackWorkout = createNewWorkout(`Workout for ${format(activeDate, 'MMM d, yyyy')}`);
        fallbackWorkout.date = activeDate.toISOString();
        
        // Force a complete state update to ensure UI rendering
        setWorkout(null); // Clear first
        setTimeout(() => {
          // Set the workout with a slight delay
          setWorkout(fallbackWorkout);
          console.log("Setting fallback workout to:", fallbackWorkout.name);
          // Explicitly set loading to false AFTER the workout is set
          setTimeout(() => setLoading(false), 50);
        }, 10); // Then set with small delay
      } finally {
        // We don't need to set loading to false here anymore as it's handled in each case
      }
    };
    
    loadWorkoutForDate();
  }, [activeDate, loadFromStorage, saveToStorage, toast]);
  
  /**
   * Change the active date and load the corresponding workout
   */
  const changeActiveDate = useCallback((newDate: Date) => {
    console.log(`[TRACKING] Changing active workout date to: ${format(newDate, 'yyyy-MM-dd')}`);
    console.log(`[TRACKING] New date timestamp: ${newDate.getTime()}`);
    
    // Check for date stability
    if (activeDate) {
      console.log(`[TRACKING] Previous active date: ${format(activeDate, 'yyyy-MM-dd')}`);
      console.log(`[TRACKING] Previous date timestamp: ${activeDate.getTime()}`);
      const sameDate = activeDate.toISOString().split('T')[0] === newDate.toISOString().split('T')[0];
      console.log(`[TRACKING] Selected same date? ${sameDate}`);
    }
    
    // Set loading to true when changing dates to indicate we're loading a new date's workout
    setLoading(true);
    
    // Log before the state update
    console.log(`[TRACKING] About to set activeDate state to: ${format(newDate, 'yyyy-MM-dd')}`);
    
    // Make a deep copy of the date to ensure no reference issues
    const dateCopy = new Date(newDate.getTime());
    console.log(`[TRACKING] Deep copied date: ${format(dateCopy, 'yyyy-MM-dd')}`);
    
    // Set the active date
    setActiveDate(dateCopy);
    
    // Log after the state update to confirm
    console.log(`[TRACKING] Called setActiveDate with: ${format(dateCopy, 'yyyy-MM-dd')}`);
  }, [activeDate]);
  
  /**
   * Update the current workout
   */
  const updateWorkout = useCallback((updatedWorkout: LocalWorkout) => {
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    console.log(`Updating workout for ${format(new Date(updatedWorkout.date), 'yyyy-MM-dd')}`, 
      updatedWorkout.name);
    console.log(`Exercise count: ${updatedWorkout.exercises.length}`);
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // If we're updating with exercises, we're no longer loading
    if (updatedWorkout.exercises && updatedWorkout.exercises.length > 0) {
      console.log(`Workout updated with ${updatedWorkout.exercises.length} exercises, setting loading to false`);
      // Small delay to ensure React has processed the workout state update
      setTimeout(() => setLoading(false), 50);
    }
  }, [saveToStorage]);
  
  /**
   * Create a new workout
   */
  const createWorkout = useCallback((providedWorkout?: LocalWorkout) => {
    // If a workout is provided, use it, otherwise create a new one
    const newWorkout = providedWorkout || createNewWorkout(
      `Workout for ${format(activeDate, 'MMM d, yyyy')}`
    );
    
    // Make sure date is set correctly
    if (!providedWorkout) {
      newWorkout.date = activeDate.toISOString();
    }
    
    // Get the storage key for this workout's date
    const dateObj = new Date(newWorkout.date);
    const storageKey = getWorkoutKeyForDate(dateObj);
    
    console.log(`Creating new workout for ${format(dateObj, 'yyyy-MM-dd')}:`, 
      newWorkout.name);
    
    // Update state and storage
    setWorkout(newWorkout);
    saveToStorage(storageKey, newWorkout);
    
    return newWorkout;
  }, [activeDate, saveToStorage]);
  
  /**
   * Add an exercise to the current workout
   */
  const addExercise = useCallback((exercise: LocalWorkoutExercise) => {
    if (!workout) {
      console.error("Cannot add exercise - no current workout");
      return;
    }
    
    // Add the exercise
    const updatedWorkout = {
      ...workout,
      exercises: [...workout.exercises, exercise]
    };
    
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    console.log(`Added exercise to workout. Now has ${updatedWorkout.exercises.length} exercises`);
  }, [workout, saveToStorage]);
  
  /**
   * Remove an exercise from the current workout
   */
  const removeExercise = useCallback((exerciseId: string) => {
    if (!workout) return;
    
    // Remove the exercise
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.filter(e => e.id !== exerciseId)
    };
    
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
  }, [workout, saveToStorage]);
  
  /**
   * Add a set to an exercise
   */
  const addSet = useCallback((exerciseId: string, set: LocalSet) => {
    if (!workout) return;
    
    // Add the set to the specified exercise
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
    
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
  }, [workout, saveToStorage]);
  
  /**
   * Update a set in an exercise
   */
  const updateSet = useCallback((exerciseId: string, setId: string, updatedSet: LocalSet) => {
    if (!workout) return;
    
    // Update the specified set
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(exercise => {
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
    
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
  }, [workout, saveToStorage]);
  
  /**
   * Remove a set from an exercise
   */
  const removeSet = useCallback((exerciseId: string, setId: string) => {
    if (!workout) return;
    
    // Remove the specified set
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
    
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
  }, [workout, saveToStorage]);
  
  /**
   * Mark the workout as completed and save to history
   */
  const completeWorkout = useCallback(() => {
    if (!workout) return;
    
    // Mark as completed
    const updatedWorkout = {
      ...workout,
      completed: true
    };
    
    // Get the storage key for this workout's date
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    // Update state and storage
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Save to workout history
    const workoutHistory = loadFromStorage<LocalWorkout[]>('workoutHistory') || [];
    saveToStorage('workoutHistory', [...workoutHistory, updatedWorkout]);
    
    toast({
      title: "Workout completed",
      description: "Your workout has been saved to history"
    });
  }, [workout, saveToStorage, loadFromStorage, toast]);
  
  return {
    workout,
    loading,
    activeDate,
    changeActiveDate,
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