import { useState, useCallback, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  LocalWorkout, 
  LocalWorkoutExercise, 
  LocalSet,
  createNewWorkout
} from '@/lib/workout';

// Create a cache system for workouts by date
interface WorkoutCacheEntry {
  workout: LocalWorkout;
  lastUpdated: number;
}

type WorkoutCache = Record<string, WorkoutCacheEntry>;

// Initialize an empty cache
let workoutCache: WorkoutCache = {};

/**
 * Generate a storage key for a specific date
 * Format: workout_YYYY-MM-DD
 */
const getWorkoutKeyForDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `workout_${format(dateObj, 'yyyy-MM-dd')}`;
};

/**
 * Hook for managing the current workout
 * This is a specialized wrapper around useWorkout that adds date-specific storage
 * to handle multiple workouts across different dates
 */
export function useCurrentWorkout() {
  const { saveToStorage, loadFromStorage } = useStorage();
  const { toast } = useToast();
  
  // Store the currently active date
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  
  // Create storage key for the active date
  const activeStorageKey = getWorkoutKeyForDate(activeDate);
  
  // Initialize from cache if available for current date
  const cachedWorkout = workoutCache[activeStorageKey]?.workout || null;
  
  const [workout, setWorkout] = useState<LocalWorkout | null>(cachedWorkout);
  const [loading, setLoading] = useState(!cachedWorkout);
  
  // Use refs to maintain stable function references
  const workoutRef = useRef<LocalWorkout | null>(workout);
  const activeDateRef = useRef<Date>(activeDate);
  const initialLoadCompletedRef = useRef<boolean>(!!cachedWorkout);
  
  // Keep the refs in sync with the state
  useEffect(() => {
    workoutRef.current = workout;
    activeDateRef.current = activeDate;
    
    // Update the cache when workout changes
    if (workout) {
      workoutCache[activeStorageKey] = {
        workout,
        lastUpdated: Date.now()
      };
    }
  }, [workout, activeDate, activeStorageKey]);
  
  // Load workout for the active date when date changes
  useEffect(() => {
    // Skip if we're still initializing
    if (!initialLoadCompletedRef.current && !activeDate) {
      return;
    }
    
    const loadWorkoutForDate = async () => {
      try {
        setLoading(true);
        console.log(`Loading workout for date: ${format(activeDate, 'yyyy-MM-dd')}`);
        
        // Check if we have a cached version first
        const dateSpecificKey = getWorkoutKeyForDate(activeDate);
        const cachedWorkoutEntry = workoutCache[dateSpecificKey];
        const isCacheValid = cachedWorkoutEntry && 
          (Date.now() - cachedWorkoutEntry.lastUpdated < 5 * 60 * 1000);
          
        if (isCacheValid) {
          console.log(`Using cached workout for date ${format(activeDate, 'yyyy-MM-dd')}:`, 
            cachedWorkoutEntry.workout.name);
          setWorkout(cachedWorkoutEntry.workout);
        } else {
          // Load from storage using date-specific key
          const savedWorkout = loadFromStorage<LocalWorkout>(dateSpecificKey);
          
          if (savedWorkout) {
            console.log(`Loaded workout for date ${format(activeDate, 'yyyy-MM-dd')} from storage:`, 
              savedWorkout.name);
            setWorkout(savedWorkout);
            
            // Update the cache
            workoutCache[dateSpecificKey] = {
              workout: savedWorkout,
              lastUpdated: Date.now()
            };
          } else {
            // Create a new workout for this date if none exists
            const newWorkout = createNewWorkout(`Workout for ${format(activeDate, 'MMM d, yyyy')}`);
            newWorkout.date = activeDate.toISOString();
            
            console.log(`Created new workout for date ${format(activeDate, 'yyyy-MM-dd')}:`, 
              newWorkout.name);
            setWorkout(newWorkout);
            saveToStorage(dateSpecificKey, newWorkout);
            
            // Update the cache
            workoutCache[dateSpecificKey] = {
              workout: newWorkout,
              lastUpdated: Date.now()
            };
          }
        }
      } catch (error) {
        console.error(`Error loading workout for date ${format(activeDate, 'yyyy-MM-dd')}:`, error);
        toast({
          title: "Error",
          description: "Failed to load workout data for selected date",
          variant: "destructive"
        });
        
        // Create a new workout as fallback
        const newWorkout = createNewWorkout(`Workout for ${format(activeDate, 'MMM d, yyyy')}`);
        newWorkout.date = activeDate.toISOString();
        
        setWorkout(newWorkout);
        
        // Update the cache
        const dateSpecificKey = getWorkoutKeyForDate(activeDate);
        workoutCache[dateSpecificKey] = {
          workout: newWorkout,
          lastUpdated: Date.now()
        };
      } finally {
        setLoading(false);
        initialLoadCompletedRef.current = true;
      }
    };
    
    loadWorkoutForDate();
  }, [activeDate]);
  
  /**
   * Change the active date and load the corresponding workout
   */
  const changeActiveDate = useCallback((newDate: Date) => {
    console.log(`Changing active workout date to: ${format(newDate, 'yyyy-MM-dd')}`);
    setActiveDate(newDate);
  }, []);
  
  /**
   * Update the current workout while ensuring consistent behavior
   */
  const updateWorkout = useCallback((updatedWorkout: LocalWorkout) => {
    console.log("Updating workout:", updatedWorkout.name, updatedWorkout.date);
    console.log("DEBUG updateWorkout - Exercise count in update:", 
      updatedWorkout.exercises.length);
    
    // Always use the date from the workout to determine storage key
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
    
    // Double-check what was stored
    const storedData = loadFromStorage<LocalWorkout>(storageKey);
    console.log("DEBUG updateWorkout - VALIDATION - Exercise count in storage:", 
      storedData?.exercises.length || 0);
  }, [saveToStorage, loadFromStorage]);
  
  /**
   * Create a new workout for the current active date
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
    
    console.log("Creating new workout:", newWorkout.name, "for date:", 
      format(new Date(newWorkout.date), 'yyyy-MM-dd'));
    
    // Calculate storage key based on workout date
    const storageKey = getWorkoutKeyForDate(new Date(newWorkout.date));
    
    setWorkout(newWorkout);
    saveToStorage(storageKey, newWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: newWorkout,
      lastUpdated: Date.now()
    };
    
    return newWorkout;
  }, [activeDate, saveToStorage]);
  
  /**
   * Add an exercise to the current workout
   */
  const addExercise = useCallback((exercise: LocalWorkoutExercise) => {
    if (!workoutRef.current) {
      console.error("Cannot add exercise - no current workout");
      return;
    }
    
    console.log("DEBUG addExercise - BEFORE: workout has", 
      workoutRef.current.exercises.length, "exercises");
    
    const updatedWorkout = {
      ...workoutRef.current,
      exercises: [...workoutRef.current.exercises, exercise]
    };
    
    console.log("DEBUG addExercise - AFTER: updatedWorkout now has", 
      updatedWorkout.exercises.length, "exercises");
    
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
    
    console.log("DEBUG: Saved workout with", updatedWorkout.exercises.length, 
      "exercises to storage with key", storageKey);
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
    
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
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
    
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
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
    
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
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
    
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
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
    
    const storageKey = getWorkoutKeyForDate(new Date(updatedWorkout.date));
    
    setWorkout(updatedWorkout);
    saveToStorage(storageKey, updatedWorkout);
    
    // Update cache
    workoutCache[storageKey] = {
      workout: updatedWorkout,
      lastUpdated: Date.now()
    };
    
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