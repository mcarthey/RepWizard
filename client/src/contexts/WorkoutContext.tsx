import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { Exercise, Program } from '@shared/schema';
import { useAuth } from '../hooks/use-auth';
import { useLocalStorage } from '../hooks/use-local-storage';

// Types for workout data
export interface LocalSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  setType: 'warmup' | 'working' | 'dropset';
  completed: boolean;
  notes: string | null;
}

export interface LocalExercise {
  id: number; 
  name: string;
  muscleGroups: string[];
}

export interface LocalWorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: number;
  exercise: LocalExercise;
  order: number;
  sets: LocalSet[];
}

export interface LocalWorkout {
  id: string;
  date: string;
  name: string;
  notes: string | null;
  programId: number | null;
  templateId: number | null;
  completed: boolean;
  exercises: LocalWorkoutExercise[];
}

// We can remove this as we're importing from schema.ts
// export interface Program {
//   id: number;
//   name: string;
//   description: string;
//   weeks: number;
//   daysPerWeek: number;
//   type: string;
//   difficulty: string;
//   createdBy: number;
// }

// We'll import ProgramSchedule from schema.ts in the future
export interface LocalProgramSchedule {
  id: string;
  userId: number;
  programId: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

// Context state type
interface WorkoutState {
  loading: boolean;
  workout: LocalWorkout | null;
  selectedDate: Date;
  showAddModal: boolean;
  showSaveModal: boolean;
}

// Actions that can be performed on the state
type WorkoutAction =
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_WORKOUT', payload: LocalWorkout | null }
  | { type: 'SET_DATE', payload: Date }
  | { type: 'SHOW_ADD_MODAL' }
  | { type: 'HIDE_ADD_MODAL' }
  | { type: 'SHOW_SAVE_MODAL' }
  | { type: 'HIDE_SAVE_MODAL' }
  | { type: 'ADD_EXERCISE', payload: LocalWorkoutExercise }
  | { type: 'REMOVE_EXERCISE', payload: string }
  | { type: 'ADD_SET', payload: { exerciseId: string, set: LocalSet } }
  | { type: 'REMOVE_SET', payload: string }
  | { type: 'UPDATE_SET', payload: { setId: string, updates: Partial<LocalSet> } }
  | { type: 'TOGGLE_COMPLETE' };

// Create initial state
const initialState: WorkoutState = {
  loading: true,
  workout: null,
  selectedDate: new Date(),
  showAddModal: false,
  showSaveModal: false
};

// Reducer function
function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_WORKOUT':
      return { ...state, workout: action.payload, loading: false };
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SHOW_ADD_MODAL':
      return { ...state, showAddModal: true };
    case 'HIDE_ADD_MODAL':
      return { ...state, showAddModal: false };
    case 'SHOW_SAVE_MODAL':
      return { ...state, showSaveModal: true };
    case 'HIDE_SAVE_MODAL':
      return { ...state, showSaveModal: false };
    case 'ADD_EXERCISE':
      if (!state.workout) return state;
      console.log('Adding exercise to workout:', action.payload);
      const currentExercises = state.workout.exercises || [];
      console.log('Current exercises:', currentExercises.length);
      
      const updatedWorkout = {
        ...state.workout,
        exercises: [...currentExercises, action.payload]
      };
      console.log('Updated workout:', updatedWorkout);
      console.log('Exercise count:', updatedWorkout.exercises.length);
      return { 
        ...state, 
        workout: updatedWorkout
      };
    case 'REMOVE_EXERCISE':
      if (!state.workout) return state;
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.filter(e => e.id !== action.payload)
        }
      };
    case 'ADD_SET':
      if (!state.workout) return state;
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.map(exercise => 
            exercise.id === action.payload.exerciseId
              ? { ...exercise, sets: [...exercise.sets, action.payload.set] }
              : exercise
          )
        }
      };
    case 'REMOVE_SET':
      if (!state.workout) return state;
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== action.payload)
          }))
        }
      };
    case 'UPDATE_SET':
      if (!state.workout) return state;
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => 
              set.id === action.payload.setId
                ? { ...set, ...action.payload.updates }
                : set
            )
          }))
        }
      };
    case 'TOGGLE_COMPLETE':
      if (!state.workout) return state;
      return {
        ...state,
        workout: {
          ...state.workout,
          completed: !state.workout.completed
        }
      };
    default:
      return state;
  }
}

// Create the context
interface WorkoutContextType {
  state: WorkoutState;
  actions: {
    changeDate: (date: Date) => void;
    createWorkoutForDate: (date: Date) => void;
    addExerciseToWorkout: (exercise: Exercise) => void;
    removeExerciseFromWorkout: (exerciseId: string) => void;
    addSetToExercise: (exerciseId: string) => void;
    removeSetFromExercise: (setId: string) => void;
    updateSet: (setId: string, updates: Partial<LocalSet>) => void;
    addWarmupSetsToExercise: (exerciseId: string, weight: number) => void;
    showAddExerciseModal: () => void;
    hideAddExerciseModal: () => void;
    showSaveProgramModal: () => void;
    hideSaveProgramModal: () => void;
    saveWorkoutAsProgram: (name: string, description: string) => Promise<boolean>;
    toggleWorkoutComplete: () => void;
  };
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

// Local storage key for workouts
const WORKOUTS_STORAGE_KEY = 'repwizard_workouts';

// Provider component
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  const { user } = useAuth();
  const [storedWorkouts, setStoredWorkouts] = useLocalStorage<LocalWorkout[]>(WORKOUTS_STORAGE_KEY, []);
  
  // Load programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
    enabled: !!user,
  });
  
  // Load workout for the current date
  useEffect(() => {
    // Create a flag to prevent setting state after unmount
    let isMounted = true;
    
    const loadWorkoutForDate = async () => {
      if (!isMounted) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Format date for lookup: YYYY-MM-DD
      const dateStr = state.selectedDate.toISOString().split('T')[0];
      
      // Check local storage for workouts on this date
      const workoutForDate = storedWorkouts.find(w => 
        w.date.split('T')[0] === dateStr
      );
      
      if (workoutForDate) {
        // Found existing workout
        console.log('[load-workout] Found workout for date:', workoutForDate);
        if (isMounted) {
          dispatch({ type: 'SET_WORKOUT', payload: workoutForDate });
        }
      } else {
        // Check if there's a scheduled program for this date
        // For now, this is simplified - usually you'd check a program schedule
        // Just use a default workout template from program 1 as an example
        
        // Create a new default workout for demo purposes
        if (programs && Array.isArray(programs) && programs.length > 0) {
          const defaultProgram = programs[0];
          
          if (defaultProgram && defaultProgram.id && defaultProgram.name) {
            const defaultWorkout: LocalWorkout = {
              id: uuidv4(),
              date: state.selectedDate.toISOString(),
              name: defaultProgram.name,
              notes: null,
              programId: defaultProgram.id,
              templateId: 1, // Assuming template ID 1
              completed: false,
              exercises: []
            };
            
            // To prevent recursive updates, only update storage if component is still mounted
            if (isMounted) {
              console.log('[load-workout] Created new workout:', defaultWorkout);
              dispatch({ type: 'SET_WORKOUT', payload: defaultWorkout });
              // We'll let the other useEffect handle storage update to avoid duplication
            }
          } else {
            if (isMounted) {
              dispatch({ type: 'SET_WORKOUT', payload: null });
            }
          }
        } else {
          if (isMounted) {
            dispatch({ type: 'SET_WORKOUT', payload: null });
          }
        }
      }
    };
    
    loadWorkoutForDate();
    
    // Cleanup function to prevent updates after unmount
    return () => {
      isMounted = false; 
    };
  }, [state.selectedDate]);
  
  // Save workout changes to local storage
  useEffect(() => {
    if (state.workout && !state.loading) {
      console.log('Saving workout to storage:', state.workout);
      
      // Add a check to prevent infinite re-renders
      const existingWorkout = storedWorkouts.find(w => w.id === state.workout!.id);
      if (existingWorkout && JSON.stringify(existingWorkout) === JSON.stringify(state.workout)) {
        console.log('No changes detected, skipping save');
        return;
      }
      
      // Update the workout in the stored list
      const updatedWorkouts = state.workout.id
        ? storedWorkouts.map(w => 
            w.id === state.workout!.id ? state.workout! : w
          )
        : [...storedWorkouts, state.workout];
      
      setStoredWorkouts(updatedWorkouts);
      console.log('Workout saved successfully');
    }
  }, [state.workout, state.loading, storedWorkouts]);
  
  // Actions
  const actions = {
    changeDate: (date: Date) => {
      dispatch({ type: 'SET_DATE', payload: date });
    },
    
    createWorkoutForDate: (date: Date) => {
      const newWorkout: LocalWorkout = {
        id: uuidv4(),
        date: date.toISOString(),
        name: 'Ad Hoc Workout',
        notes: null,
        programId: null,
        templateId: null,
        completed: false,
        exercises: []
      };
      
      dispatch({ type: 'SET_WORKOUT', payload: newWorkout });
    },
    
    addExerciseToWorkout: (exercise: Exercise) => {
      if (!state.workout) return;
      
      console.log('[reload-' + Date.now() + '] Adding exercise:', exercise.name);
      
      const newExercise: LocalWorkoutExercise = {
        id: uuidv4(),
        workoutId: state.workout.id,
        exerciseId: exercise.id,
        exercise: {
          id: exercise.id,
          name: exercise.name,
          muscleGroups: exercise.muscleGroups || []
        },
        order: state.workout.exercises.length,
        sets: []
      };
      
      // Add default sets (1 warmup, 2 working)
      const defaultSets = [
        {
          id: uuidv4(),
          workoutExerciseId: newExercise.id,
          setNumber: 1,
          weight: 0,
          reps: 0,
          rpe: null,
          setType: 'warmup' as const,
          completed: false,
          notes: null
        },
        {
          id: uuidv4(),
          workoutExerciseId: newExercise.id,
          setNumber: 2,
          weight: 0,
          reps: 0,
          rpe: null,
          setType: 'working' as const,
          completed: false,
          notes: null
        },
        {
          id: uuidv4(),
          workoutExerciseId: newExercise.id,
          setNumber: 3,
          weight: 0,
          reps: 0,
          rpe: null,
          setType: 'working' as const,
          completed: false,
          notes: null
        }
      ];
      
      // First add the exercise
      dispatch({ type: 'ADD_EXERCISE', payload: newExercise });
      
      // Then add the sets one by one
      setTimeout(() => {
        for (const set of defaultSets) {
          dispatch({ 
            type: 'ADD_SET', 
            payload: { exerciseId: newExercise.id, set }
          });
        }
        
        console.log('[reload-' + Date.now() + '] Exercise update completed successfully');
      }, 10);
      
      // Hide the modal
      dispatch({ type: 'HIDE_ADD_MODAL' });
    },
    
    removeExerciseFromWorkout: (exerciseId: string) => {
      dispatch({ type: 'REMOVE_EXERCISE', payload: exerciseId });
    },
    
    addSetToExercise: (exerciseId: string) => {
      if (!state.workout) return;
      
      const exercise = state.workout.exercises.find(e => e.id === exerciseId);
      if (!exercise) return;
      
      const newSetNumber = exercise.sets.length + 1;
      
      const newSet: LocalSet = {
        id: uuidv4(),
        workoutExerciseId: exerciseId,
        setNumber: newSetNumber,
        weight: 0,
        reps: 0,
        rpe: null,
        setType: 'working',
        completed: false,
        notes: null
      };
      
      dispatch({ 
        type: 'ADD_SET', 
        payload: { exerciseId, set: newSet }
      });
    },
    
    removeSetFromExercise: (setId: string) => {
      dispatch({ type: 'REMOVE_SET', payload: setId });
    },
    
    updateSet: (setId: string, updates: Partial<LocalSet>) => {
      dispatch({ 
        type: 'UPDATE_SET', 
        payload: { setId, updates }
      });
    },
    
    addWarmupSetsToExercise: (exerciseId: string, weight: number) => {
      if (!state.workout) return;
      
      const exercise = state.workout.exercises.find(e => e.id === exerciseId);
      if (!exercise) return;
      
      // Create warmup sets at 50%, 60%, 70% of working weight
      const warmupWeights = [
        Math.round(weight * 0.5),
        Math.round(weight * 0.6),
        Math.round(weight * 0.7)
      ];
      
      // Remove existing warmup sets
      const workingSets = exercise.sets.filter(set => set.setType !== 'warmup');
      
      // Create new warmup sets
      const warmupSets = warmupWeights.map((w, i) => ({
        id: uuidv4(),
        workoutExerciseId: exerciseId,
        setNumber: i + 1,
        weight: w,
        reps: 5,
        rpe: null,
        setType: 'warmup' as const,
        completed: false,
        notes: null
      }));
      
      // Update the workout with new sets
      if (state.workout) {
        const updatedExercises = state.workout.exercises.map(e => {
          if (e.id === exerciseId) {
            return {
              ...e,
              sets: [...warmupSets, ...workingSets].map((set, idx) => ({
                ...set,
                setNumber: idx + 1
              }))
            };
          }
          return e;
        });
        
        dispatch({ 
          type: 'SET_WORKOUT', 
          payload: {
            ...state.workout,
            exercises: updatedExercises
          }
        });
      }
    },
    
    showAddExerciseModal: () => {
      dispatch({ type: 'SHOW_ADD_MODAL' });
    },
    
    hideAddExerciseModal: () => {
      dispatch({ type: 'HIDE_ADD_MODAL' });
    },
    
    showSaveProgramModal: () => {
      dispatch({ type: 'SHOW_SAVE_MODAL' });
    },
    
    hideSaveProgramModal: () => {
      dispatch({ type: 'HIDE_SAVE_MODAL' });
    },
    
    saveWorkoutAsProgram: async (name: string, description: string) => {
      if (!state.workout) return false;
      
      // In a real implementation, this would call the API to save the program
      // For now, we'll just return true to simulate success
      
      dispatch({ type: 'HIDE_SAVE_MODAL' });
      return true;
    },
    
    toggleWorkoutComplete: () => {
      dispatch({ type: 'TOGGLE_COMPLETE' });
    }
  };
  
  return (
    <WorkoutContext.Provider value={{ state, actions }}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Custom hook to use the context
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}