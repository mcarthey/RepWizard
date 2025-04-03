import { v4 as uuidv4 } from 'uuid';
import { Exercise } from '@shared/schema';

// Type definitions
export interface LocalSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  setType: string; // 'warmup' | 'working' | 'dropset' | 'failure';
  completed: boolean;
  notes: string | null;
}

export interface LocalWorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: number;
  exercise: Pick<Exercise, 'id' | 'name' | 'muscleGroups'>;
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
  manuallySelected?: boolean; // Flag to indicate if this workout's date was manually selected
}

// Type for local program schedules
export interface LocalProgramSchedule {
  id: string;
  programId: number;
  startDate: string;
  endDate: string;
  selectedWeekdays: number[];
  active: boolean;
}

// Helper functions
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

export function createWorkoutExercise(
  workoutId: string,
  exercise: Exercise,
  order: number
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

export function createSet(
  workoutExerciseId: string,
  setNumber: number,
  setType: LocalSet['setType'] = 'working'
): LocalSet {
  return {
    id: uuidv4(),
    workoutExerciseId,
    setNumber,
    weight: 0,
    reps: 0,
    rpe: null,
    setType,
    completed: false,
    notes: null
  };
}

/**
 * Returns a descriptive text for a given RPE value
 * @param rpe RPE value (1-10)
 * @returns Description of the RPE level
 */
export function getRpeDescription(rpe: number): string {
  if (rpe <= 5) return "Very light, could do many more reps";
  if (rpe <= 6) return "Light, could do several more reps";
  if (rpe <= 7) return "Moderate, could do a few more reps";
  if (rpe === 7.5) return "Getting challenging";
  if (rpe === 8) return "Challenging, could do 2-3 more reps";
  if (rpe === 8.5) return "Very challenging";
  if (rpe === 9) return "Very hard, could do 1 more rep";
  if (rpe === 9.5) return "Almost maximal effort";
  if (rpe >= 10) return "Maximal effort, couldn't do any more";
  return "Unknown RPE level";
}

/**
 * Calculate one-rep max based on weight and reps using the Brzycki formula
 * @param weight The weight lifted
 * @param reps The number of reps performed
 * @returns Estimated one-rep max
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  // Brzycki formula: weight × (36 / (37 - reps))
  return weight * (36 / (37 - Math.min(reps, 36)));
}