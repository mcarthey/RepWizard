import { v4 as uuidv4 } from 'uuid';
import type { Exercise } from '@shared/schema';

// Exported Types
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

export interface LocalWorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: number;
  exercise: {
    id: number;
    name: string;
    muscleGroups?: string[];
  };
  order: number;
  sets?: LocalSet[];
}

export interface LocalSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  setType: "warmup" | "working";
  completed: boolean;
  notes: string | null;
}

// Define a type for the full workout with details
export interface WorkoutWithDetails extends LocalWorkout {
  exercises: LocalWorkoutExercise[];
}

// Create a new empty workout
export function createNewWorkout(name: string = "Today's Workout"): LocalWorkout {
  return {
    id: uuidv4(),
    date: new Date().toISOString(),
    name,
    notes: null,
    programId: null,
    templateId: null,
    completed: false,
    exercises: []
  };
}

// Create a new exercise for a workout
export function createWorkoutExercise(
  workoutId: string, 
  exercise: Exercise, 
  order: number = 0
): LocalWorkoutExercise {
  return {
    id: uuidv4(),
    workoutId,
    exerciseId: exercise.id,
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscleGroups: exercise.muscleGroups || []
    },
    order,
    sets: []
  };
}

// Create a new set for an exercise
export function createSet(
  workoutExerciseId: string,
  setNumber: number,
  weight: number = 0,
  reps: number = 0,
  rpe: number | null = null,
  setType: "warmup" | "working" = "working",
  completed: boolean = false,
  notes: string | null = null
): LocalSet {
  return {
    id: uuidv4(),
    workoutExerciseId,
    setNumber,
    weight,
    reps,
    rpe,
    setType,
    completed,
    notes
  };
}

// Create warm-up sets based on working weight
export function generateWarmupSets(
  workoutExerciseId: string,
  workingWeight: number,
  targetReps: number = 5
): LocalSet[] {
  // If working weight is very low, don't add many warm-ups
  if (workingWeight < 50) {
    return [
      createSet(workoutExerciseId, 1, Math.max(workingWeight * 0.5, 5), targetReps + 5, 5, 'warmup')
    ];
  }

  // For moderate weights
  if (workingWeight < 100) {
    return [
      createSet(workoutExerciseId, 1, Math.max(workingWeight * 0.5, 10), targetReps + 5, 4, 'warmup'),
      createSet(workoutExerciseId, 2, Math.max(workingWeight * 0.7, 25), targetReps + 2, 6, 'warmup')
    ];
  }

  // For heavier weights, add more warm-up sets with increasing intensity
  return [
    createSet(workoutExerciseId, 1, Math.max(workingWeight * 0.4, 20), targetReps + 5, 3, 'warmup'),
    createSet(workoutExerciseId, 2, Math.max(workingWeight * 0.6, 40), targetReps + 3, 5, 'warmup'),
    createSet(workoutExerciseId, 3, Math.max(workingWeight * 0.8, 60), targetReps, 7, 'warmup')
  ];
}

// Calculate one-rep max (Epley formula)
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  
  return Math.round(weight * (1 + (reps / 30)));
}

// Calculate weight for target rep range (inverse of Epley formula)
export function calculateWeightForReps(oneRepMax: number, targetReps: number): number {
  if (oneRepMax <= 0 || targetReps <= 0) return 0;
  if (targetReps === 1) return oneRepMax;
  
  return Math.round(oneRepMax / (1 + (targetReps / 30)));
}

// Get a user-friendly representation of RPE
export function getRpeDescription(rpe: number): string {
  if (rpe <= 5) return `${rpe} - Easy`;
  if (rpe <= 7) return `${rpe} - Moderate`;
  if (rpe <= 8.5) return `${rpe} - Hard`;
  if (rpe <= 9.5) return `${rpe} - Very Hard`;
  return `${rpe} - Maximum Effort`;
}

// Storage Keys
const WORKOUT_STORAGE_KEY = 'repwizard_workout';
const WORKOUTS_HISTORY_KEY = 'repwizard_workouts_history';

// Get workout from localStorage
export function getStoredWorkout(date: string): WorkoutWithDetails | null {
  try {
    // Try to get workout for specific date
    const storedItem = localStorage.getItem(`${WORKOUT_STORAGE_KEY}_${date}`);
    
    if (storedItem) {
      return JSON.parse(storedItem);
    }
    
    // If no specific workout, get the "current" one
    const storedWorkout = localStorage.getItem(WORKOUT_STORAGE_KEY);
    if (!storedWorkout) return null;
    
    const workout = JSON.parse(storedWorkout) as WorkoutWithDetails;
    
    // Only return the current workout if it matches the requested date
    if (workout.date.split('T')[0] === date.split('T')[0]) {
      return workout;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving workout from storage:', error);
    return null;
  }
}

// Save workout to localStorage
export function saveWorkoutToStorage(workout: WorkoutWithDetails): boolean {
  try {
    const dateKey = workout.date.split('T')[0];
    
    // Save as current workout
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workout));
    
    // Also save to date-specific key for history
    localStorage.setItem(`${WORKOUT_STORAGE_KEY}_${dateKey}`, JSON.stringify(workout));
    
    // Update workouts history index
    const workoutHistory = getWorkoutHistory();
    if (!workoutHistory.includes(dateKey)) {
      workoutHistory.push(dateKey);
      localStorage.setItem(WORKOUTS_HISTORY_KEY, JSON.stringify(workoutHistory));
    }
    
    console.log('Workout saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving workout to storage:', error);
    return false;
  }
}

// Get list of dates with saved workouts
export function getWorkoutHistory(): string[] {
  try {
    const storedHistory = localStorage.getItem(WORKOUTS_HISTORY_KEY);
    if (!storedHistory) return [];
    return JSON.parse(storedHistory);
  } catch (error) {
    console.error('Error retrieving workout history:', error);
    return [];
  }
}

// Clear all workout data
export function clearWorkouts(): boolean {
  try {
    const workoutHistory = getWorkoutHistory();
    
    // Remove each dated workout
    workoutHistory.forEach(date => {
      localStorage.removeItem(`${WORKOUT_STORAGE_KEY}_${date}`);
    });
    
    // Remove current workout and history
    localStorage.removeItem(WORKOUT_STORAGE_KEY);
    localStorage.removeItem(WORKOUTS_HISTORY_KEY);
    
    return true;
  } catch (error) {
    console.error('Error clearing workouts:', error);
    return false;
  }
}
