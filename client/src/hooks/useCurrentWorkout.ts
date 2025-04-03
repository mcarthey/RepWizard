import { useState, useCallback, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
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
  
  // Check if we have a manually selected date stored in either sessionStorage or localStorage
  // If so, use that as the initial activeDate to maintain user selection across page loads
  const sessionDate = sessionStorage.getItem('manually_selected_date');
  const localDate = localStorage.getItem('repwizard_manually_selected_date') || 
                    localStorage.getItem('repwizard_last_viewed_workout_date');
  
  // Use the session date with fallback to localStorage date
  const manuallySelectedDate = sessionDate || localDate;
  
  console.log(`[DATE PROTECTION] Checking for stored dates: Session: ${sessionDate}, Local: ${localDate}`);
  
  // Active date state - initialize with manually selected date if available
  const [activeDate, setActiveDate] = useState<Date>(() => {
    if (manuallySelectedDate) {
      try {
        console.log(`[DATE PROTECTION] Initializing with manually selected date: ${manuallySelectedDate}`);
        
        // If we have a local date but no session date, sync them
        if (localDate && !sessionDate) {
          console.log(`[DATE PROTECTION] Syncing localStorage date to sessionStorage: ${localDate}`);
          sessionStorage.setItem('manually_selected_date', localDate);
          sessionStorage.setItem('manually_selected_date_timestamp', new Date(localDate).getTime().toString());
        }
        
        return parseISO(manuallySelectedDate);
      } catch (err) {
        console.error(`[DATE PROTECTION] Error parsing manually selected date: ${manuallySelectedDate}`, err);
        return new Date();
      }
    }
    return new Date();
  });
  
  // Workout and loading states
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load the workout whenever the active date changes
  useEffect(() => {
    const loadWorkoutForDate = async () => {
      try {
        setLoading(true);
        
        // CRITICAL DATE FIX: Check if there's a manually selected date that we should be using
        // Enhanced logic to check both sessionStorage and localStorage
        const sessionDate = sessionStorage.getItem('manually_selected_date');
        const localStorageDate = localStorage.getItem('repwizard_manually_selected_date') || 
                                localStorage.getItem('repwizard_last_viewed_workout_date');
        
        // Use session date first with fallback to localStorage
        const manuallySelectedDate = sessionDate || localStorageDate;
        let dateToUse = activeDate;
        
        if (manuallySelectedDate) {
          try {
            // If there's a manually selected date and it's different from activeDate, use it
            const manualDateObj = parseISO(manuallySelectedDate);
            const manualDateStr = format(manualDateObj, 'yyyy-MM-dd');
            const activeDateStr = format(activeDate, 'yyyy-MM-dd');
            
            console.log(`[DATE PROTECTION] Comparing manually selected date ${manualDateStr} with active date ${activeDateStr}`);
            console.log(`[DATE PROTECTION] Sources - Session: ${sessionDate}, LocalStorage: ${localStorageDate}`);
            
            if (manualDateStr !== activeDateStr) {
              console.log(`[DATE PROTECTION] Override: Using manually selected date ${manualDateStr} instead of ${activeDateStr}`);
              dateToUse = manualDateObj;
              
              // CRITICAL: Also update the activeDate state to match
              setActiveDate(manualDateObj);
              
              // Since we found the date in localStorage but not sessionStorage, sync them
              if (!sessionDate && localStorageDate) {
                console.log(`[DATE PROTECTION] Syncing localStorage date to sessionStorage: ${localStorageDate}`);
                sessionStorage.setItem('manually_selected_date', localStorageDate);
                sessionStorage.setItem('manually_selected_date_timestamp', new Date(localStorageDate).getTime().toString());
              }
            }
          } catch (err) {
            console.error(`[DATE PROTECTION] Error processing manually selected date: ${manuallySelectedDate}`, err);
            // Continue with activeDate as fallback
          }
        }
        
        // Get the storage key for this date
        const storageKey = getWorkoutKeyForDate(dateToUse);
        console.log(`[TRACKING] Loading workout for date: ${format(dateToUse, 'yyyy-MM-dd')} with key: ${storageKey}`);
        console.log(`[TRACKING] Active date timestamp: ${dateToUse.getTime()}`);
        
        // Try to load an existing workout for this date
        const savedWorkout = loadFromStorage<LocalWorkout>(storageKey);
        
        if (savedWorkout) {
          console.log(`[TRACKING] Found workout for date ${format(dateToUse, 'yyyy-MM-dd')}:`, savedWorkout);
          console.log(`[TRACKING] Workout has ${savedWorkout.exercises.length} exercises`);
          console.log(`[TRACKING] Workout date from storage: ${savedWorkout.date}`);
          console.log(`[TRACKING] Workout date timestamp: ${new Date(savedWorkout.date).getTime()}`);
          
          // Check if this workout has the manuallySelected flag
          if (manuallySelectedDate && (savedWorkout as any).manuallySelected) {
            console.log(`[DATE PROTECTION] This workout was manually selected by the user`);
          }
          
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
          console.log(`No workout found for ${format(dateToUse, 'yyyy-MM-dd')}, creating new one`);
          const newWorkout = createNewWorkout(`Workout for ${format(dateToUse, 'MMM d, yyyy')}`);
          newWorkout.date = dateToUse.toISOString();
          
          // Add manuallySelected flag if this was a manually selected date
          if (manuallySelectedDate) {
            (newWorkout as any).manuallySelected = true;
          }
          
          // Save it immediately
          saveToStorage(storageKey, newWorkout);
          
          // Force a complete state update to ensure UI rendering
          setWorkout(null); // Clear first
          setTimeout(() => {
            // Set the workout with a slight delay
            setWorkout(newWorkout);
            console.log("[TRACKING] Setting new workout to:", newWorkout.name);
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
   * 
   * CRITICAL FIX: We now store if a date was manually selected to prevent
   * it from being overridden by default scheduling logic
   * 
   * @param newDate The date to switch to
   * @param isManualSelection Whether this date change came from user selection (true) or auto-loading (false)
   */
  const changeActiveDate = useCallback((newDate: Date, isManualSelection: boolean = false) => {
    try {
      // Validate input
      if (!newDate || !(newDate instanceof Date) || isNaN(newDate.getTime())) {
        console.error(`[DATE PROTECTION] Invalid date provided to changeActiveDate:`, newDate);
        toast({
          title: "Date Error",
          description: "Invalid date format. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`[TRACKING] Changing active workout date to: ${format(newDate, 'yyyy-MM-dd')}`);
      console.log(`[TRACKING] New date timestamp: ${newDate.getTime()}`);
      console.log(`[DATE PROTECTION] Manual selection: ${isManualSelection}`);
      
      // Make a deep copy of the date to ensure no reference issues
      const dateCopy = new Date(newDate.getTime());
      
      // ENHANCED FIX: This date was manually selected, store more information to make it stick
      if (isManualSelection) {
        try {
          const dateStr = format(dateCopy, 'yyyy-MM-dd');
          console.log(`[DATE PROTECTION] Storing manually selected date in sessionStorage: ${dateStr}`);
          
          // Store in multiple places for triple protection
          // 1. SessionStorage for current browser tab
          sessionStorage.setItem('manually_selected_date', dateStr);
          sessionStorage.setItem('manually_selected_date_timestamp', dateCopy.getTime().toString());
          
          // 2. LocalStorage for persistence across tabs/sessions
          localStorage.setItem('repwizard_last_viewed_workout_date', dateStr);
          localStorage.setItem('repwizard_manually_selected_date', dateStr);
          
          // 3. Flag directly on the workout object
          const storageKey = getWorkoutKeyForDate(dateCopy);
          const existingWorkout = loadFromStorage<LocalWorkout>(storageKey);
          
          if (existingWorkout) {
            console.log(`[DATE PROTECTION] Found existing workout for selected date: ${dateStr}`);
            
            // Set a special flag on the workout to indicate it was manually selected
            const updatedWorkout = {
              ...existingWorkout,
              manuallySelected: true
            };
            
            // Save it back to storage with this flag
            saveToStorage(storageKey, updatedWorkout);
            console.log(`[DATE PROTECTION] Updated workout with manuallySelected flag`);
          } else {
            console.log(`[DATE PROTECTION] No existing workout found for ${dateStr}, will be created with manuallySelected flag`);
          }
        } catch (err) {
          console.error(`[DATE PROTECTION] Error while setting manual date protection flags:`, err);
          // Continue execution despite error - this is just enhanced protection
        }
      }
      
      // Check for date stability
      if (activeDate) {
        console.log(`[TRACKING] Previous active date: ${format(activeDate, 'yyyy-MM-dd')}`);
        console.log(`[TRACKING] Previous date timestamp: ${activeDate.getTime()}`);
        const sameDate = activeDate.toISOString().split('T')[0] === dateCopy.toISOString().split('T')[0];
        console.log(`[TRACKING] Selected same date? ${sameDate}`);
        
        if (sameDate) {
          console.log(`[TRACKING] Selected the same date, but continuing to ensure consistent behavior`);
        }
      }
      
      // Set loading to true when changing dates to indicate we're loading a new date's workout
      setLoading(true);
      
      // Log before the state update
      console.log(`[TRACKING] About to set activeDate state to: ${format(dateCopy, 'yyyy-MM-dd')}`);
      
      // Update the active date with our copy
      setActiveDate(dateCopy);
      
      // Verify the set was called
      console.log(`[TRACKING] Called setActiveDate with: ${format(dateCopy, 'yyyy-MM-dd')}`);
      
      // Additional verification with setTimeout to catch async issues
      setTimeout(() => {
        console.log(`[DATE PROTECTION] Verifying active date was set to: ${format(dateCopy, 'yyyy-MM-dd')}`);
      }, 0);
    } catch (error) {
      console.error(`[DATE PROTECTION] Critical error in changeActiveDate:`, error);
      toast({
        title: "Date Selection Error",
        description: "There was a problem changing the workout date. Please try again.",
        variant: "destructive"
      });
      
      // Still attempt to set the date to avoid getting stuck
      try {
        setActiveDate(newDate);
      } catch (e) {
        console.error(`[DATE PROTECTION] Failed fallback date set:`, e);
      }
    }
  }, [activeDate, loadFromStorage, saveToStorage, toast]);
  
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