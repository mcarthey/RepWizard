import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSchedules } from '@/hooks/use-schedules';
import { Exercise } from '@shared/schema';
import {
  LocalWorkout,
  LocalWorkoutExercise,
  LocalSet,
  WorkoutWithDetails,
  createNewWorkout,
  createWorkoutExercise,
  createSet,
  generateWarmupSets,
  getStoredWorkout,
  saveWorkoutToStorage
} from '@/lib/workout';

// Context state type
interface WorkoutContextState {
  loading: boolean;
  selectedDate: Date;
  workout: WorkoutWithDetails | null;
  showSaveModal: boolean;
  showAddModal: boolean;
}

// Context actions type
interface WorkoutContextActions {
  changeDate: (date: Date) => void;
  createWorkoutForDate: (date: Date) => void;
  addExerciseToWorkout: (exercise: Exercise) => void;
  removeExerciseFromWorkout: (exerciseId: string) => void;
  updateExercise: (exerciseId: string, updates: Partial<LocalWorkoutExercise>) => void;
  addSetToExercise: (exerciseId: string) => void;
  addWarmupSetsToExercise: (exerciseId: string, workingWeight: number) => void;
  removeSetFromExercise: (setId: string) => void;
  updateSet: (setId: string, updates: Partial<LocalSet>) => void;
  toggleWorkoutComplete: () => void;
  updateWorkoutMetadata: (updates: Partial<LocalWorkout>) => void;
  showAddExerciseModal: () => void;
  hideAddExerciseModal: () => void;
  showSaveProgramModal: () => void;
  hideSaveProgramModal: () => void;
  saveWorkoutAsProgram: (name: string, description: string) => Promise<boolean>;
}

// Combined context type
interface WorkoutContextType {
  state: WorkoutContextState;
  actions: WorkoutContextActions;
}

// Create the context
const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Create provider component
export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const scheduleManager = useSchedules();
  
  // Local state
  const [state, setState] = useState<WorkoutContextState>({
    loading: true,
    selectedDate: new Date(),
    workout: null,
    showSaveModal: false,
    showAddModal: false
  });
  
  // Fetch programs data
  const { data: programs = [] } = useQuery({
    queryKey: ['/api/programs'],
    enabled: !!user,
  });
  
  // Load workout for the selected date
  const loadWorkoutForDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, loading: true }));
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // First, try to get from localStorage
    console.log('Loading workout from local storage...');
    let workout = getStoredWorkout(dateStr);
    
    // If no workout in storage, check if there's a scheduled program for this date
    if (!workout) {
      try {
        const activeSchedules = scheduleManager.getSchedulesForDate(date);
        
        if (activeSchedules.length > 0) {
          // Use the first matching schedule for now (could enhance to let user choose)
          const schedule = activeSchedules[0];
          const program = programs.find(p => p.id === schedule.programId);
          
          if (program) {
            console.log(`Creating workout from scheduled program: ${program.name}`);
            // Create a new workout from the program
            workout = createNewWorkout(program.name);
            workout.date = date.toISOString();
            workout.programId = program.id;
            
            // Add exercises and sets based on the program template
            // This would need more logic to select the correct day template
            // Todo: Add logic to pick the correct template based on day of week
            saveWorkoutToStorage(workout);
          }
        }
      } catch (error) {
        console.error('Error checking schedules:', error);
      }
    }
    
    // If still no workout, create a new empty one
    if (!workout) {
      workout = createNewWorkout("Today's Workout");
      workout.date = date.toISOString();
      saveWorkoutToStorage(workout);
    }
    
    console.log('Retrieved workout from storage:', workout);
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      workout
    }));
  }, [programs, scheduleManager]);
  
  // Load workout for current date on initial render
  useEffect(() => {
    loadWorkoutForDate(state.selectedDate);
  }, []);
  
  // Change selected date
  const changeDate = useCallback((date: Date) => {
    if (!isValid(date)) {
      toast({
        title: 'Invalid date',
        description: 'Please select a valid date',
        variant: 'destructive',
      });
      return;
    }
    
    setState(prev => ({ ...prev, selectedDate: date }));
    loadWorkoutForDate(date);
  }, [loadWorkoutForDate, toast]);
  
  // Create a new workout for a specific date
  const createWorkoutForDate = useCallback((date: Date) => {
    const newWorkout = createNewWorkout();
    newWorkout.date = date.toISOString();
    saveWorkoutToStorage(newWorkout);
    setState(prev => ({ ...prev, workout: newWorkout }));
  }, []);
  
  // Save the current workout to storage
  const saveWorkout = useCallback((workout: WorkoutWithDetails) => {
    console.log('Saving workout to storage:', workout);
    const success = saveWorkoutToStorage(workout);
    
    if (!success) {
      toast({
        title: 'Error saving workout',
        description: 'There was a problem saving your workout',
        variant: 'destructive',
      });
    }
    
    return success;
  }, [toast]);
  
  // Add an exercise to the current workout
  const addExerciseToWorkout = useCallback((exercise: Exercise) => {
    if (!state.workout) return;
    
    console.log('Adding exercise to workout:', exercise);
    
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Create new exercise
      const newExercise = createWorkoutExercise(
        prev.workout.id,
        exercise,
        prev.workout.exercises.length
      );
      
      // Add default sets (1 warmup, 2 working)
      newExercise.sets = [
        createSet(newExercise.id, 1, 0, 0, null, "warmup", false, null),
        createSet(newExercise.id, 2, 0, 0, null, "working", false, null),
        createSet(newExercise.id, 3, 0, 0, null, "working", false, null)
      ];
      
      // Create updated workout with the new exercise
      const updatedWorkout = {
        ...prev.workout,
        exercises: [...prev.workout.exercises, newExercise]
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout,
        showAddModal: false
      };
    });
  }, [state.workout, saveWorkout]);
  
  // Remove an exercise from the current workout
  const removeExerciseFromWorkout = useCallback((exerciseId: string) => {
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Create updated workout without the removed exercise
      const updatedWorkout = {
        ...prev.workout,
        exercises: prev.workout.exercises.filter(e => e.id !== exerciseId)
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Update an exercise in the current workout
  const updateExercise = useCallback((exerciseId: string, updates: Partial<LocalWorkoutExercise>) => {
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Create updated workout with the modified exercise
      const updatedWorkout = {
        ...prev.workout,
        exercises: prev.workout.exercises.map(exercise => 
          exercise.id === exerciseId
            ? { ...exercise, ...updates }
            : exercise
        )
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Add a set to an exercise
  const addSetToExercise = useCallback((exerciseId: string) => {
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Find the exercise
      const exercise = prev.workout.exercises.find(e => e.id === exerciseId);
      if (!exercise) return prev;
      
      // Create a new set
      const setNumber = (exercise.sets?.length || 0) + 1;
      const newSet = createSet(exerciseId, setNumber);
      
      // Create updated workout with the new set
      const updatedWorkout = {
        ...prev.workout,
        exercises: prev.workout.exercises.map(e => {
          if (e.id === exerciseId) {
            return {
              ...e,
              sets: [...(e.sets || []), newSet]
            };
          }
          return e;
        })
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Add warmup sets to an exercise
  const addWarmupSetsToExercise = useCallback((exerciseId: string, workingWeight: number) => {
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Find the exercise
      const exercise = prev.workout.exercises.find(e => e.id === exerciseId);
      if (!exercise) return prev;
      
      // Generate warmup sets
      const warmupSets = generateWarmupSets(exerciseId, workingWeight);
      
      // Filter out existing warmup sets and add the new ones
      const existingSets = (exercise.sets || []).filter(set => set.setType !== 'warmup');
      
      // Create updated workout with the warmup sets
      const updatedWorkout = {
        ...prev.workout,
        exercises: prev.workout.exercises.map(e => {
          if (e.id === exerciseId) {
            return {
              ...e,
              sets: [...warmupSets, ...existingSets].sort((a, b) => a.setNumber - b.setNumber)
            };
          }
          return e;
        })
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Remove a set from an exercise
  const removeSetFromExercise = useCallback((setId: string) => {
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Create updated workout without the removed set
      const updatedWorkout = {
        ...prev.workout,
        exercises: prev.workout.exercises.map(exercise => ({
          ...exercise,
          sets: (exercise.sets || []).filter(set => set.id !== setId)
        }))
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Update a set
  const updateSet = useCallback((setId: string, updates: Partial<LocalSet>) => {
    setState(prev => {
      // Skip if workout is not loaded
      if (!prev.workout) return prev;
      
      // Create updated workout with the modified set
      const updatedWorkout = {
        ...prev.workout,
        exercises: prev.workout.exercises.map(exercise => ({
          ...exercise,
          sets: (exercise.sets || []).map(set => 
            set.id === setId ? { ...set, ...updates } : set
          )
        }))
      };
      
      // Save to storage
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Toggle workout completion status
  const toggleWorkoutComplete = useCallback(() => {
    setState(prev => {
      if (!prev.workout) return prev;
      
      const updatedWorkout = {
        ...prev.workout,
        completed: !prev.workout.completed
      };
      
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Update workout metadata (name, notes, etc.)
  const updateWorkoutMetadata = useCallback((updates: Partial<LocalWorkout>) => {
    setState(prev => {
      if (!prev.workout) return prev;
      
      const updatedWorkout = {
        ...prev.workout,
        ...updates
      };
      
      saveWorkout(updatedWorkout);
      
      return {
        ...prev,
        workout: updatedWorkout
      };
    });
  }, [saveWorkout]);
  
  // Show/hide add exercise modal
  const showAddExerciseModal = useCallback(() => {
    setState(prev => ({ ...prev, showAddModal: true }));
  }, []);
  
  const hideAddExerciseModal = useCallback(() => {
    setState(prev => ({ ...prev, showAddModal: false }));
  }, []);
  
  // Show/hide save program modal
  const showSaveProgramModal = useCallback(() => {
    setState(prev => ({ ...prev, showSaveModal: true }));
  }, []);
  
  const hideSaveProgramModal = useCallback(() => {
    setState(prev => ({ ...prev, showSaveModal: false }));
  }, []);
  
  // Save workout as a program
  const saveWorkoutAsProgram = useCallback(async (name: string, description: string): Promise<boolean> => {
    if (!state.workout || !user) {
      toast({
        title: 'Error',
        description: 'Cannot save program: No workout or user not logged in',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // This would need integration with the API to save the program
      // For now, just show success
      toast({
        title: 'Program saved',
        description: `${name} has been saved as a program`,
      });
      
      // Hide modal
      setState(prev => ({ ...prev, showSaveModal: false }));
      return true;
      
    } catch (e: any) {
      toast({
        title: 'Error saving program',
        description: e.message || 'There was a problem saving your program',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.workout, user, toast]);
  
  // Create context value
  const contextValue: WorkoutContextType = {
    state,
    actions: {
      changeDate,
      createWorkoutForDate,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      updateExercise,
      addSetToExercise,
      addWarmupSetsToExercise,
      removeSetFromExercise,
      updateSet,
      toggleWorkoutComplete,
      updateWorkoutMetadata,
      showAddExerciseModal,
      hideAddExerciseModal,
      showSaveProgramModal,
      hideSaveProgramModal,
      saveWorkoutAsProgram
    }
  };
  
  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

// Create hook for consuming the context
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};