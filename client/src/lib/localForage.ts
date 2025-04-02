import localforage from 'localforage';
import { createNewWorkout } from './workout';

export const STORAGE_KEYS = {
  CURRENT_WORKOUT: 'repwizard_current_workout',
  WORKOUT_HISTORY: 'repwizard_workout_history',
  EXERCISES: 'repwizard_exercises',
  PROGRAMS: 'repwizard_programs',
  PROGRAM_SCHEDULES: 'repwizard_program_schedules',
  USER_SETTINGS: 'repwizard_user_settings',
};

let localForageInstance: LocalForage | null = null;

export async function getLocalForage(): Promise<LocalForage> {
  if (localForageInstance) {
    return localForageInstance;
  }

  // Create and configure localForage
  localForageInstance = localforage.createInstance({
    name: 'RepWizard',
    storeName: 'repwizard_data',
    description: 'RepWizard workout tracking data'
  });

  return localForageInstance;
}

export async function clearAllData(): Promise<void> {
  const localForage = await getLocalForage();
  await localForage.clear();
}

export async function clearCurrentWorkout(): Promise<void> {
  const localForage = await getLocalForage();
  await localForage.removeItem(STORAGE_KEYS.CURRENT_WORKOUT);
}

/**
 * Fix LocalStorage Workout Issues
 * 
 * This function performs a deep check of the current workout in localStorage:
 * 1. Verifies if the current workout is from a previous date
 * 2. Checks if the current workout has a program ID
 * 3. Verifies if there are scheduled workouts for today
 * 
 * It will only keep a workout if it's from today AND either:
 * - Has a program ID that matches a scheduled program for today, OR
 * - There are no scheduled programs for today
 * 
 * @returns {Promise<{fixed: boolean, message: string}>} Result of the fix operation
 */
export async function fixWorkoutStorage(): Promise<{fixed: boolean, message: string}> {
  const localForage = await getLocalForage();
  
  try {
    // Step 1: Get the current workout
    const currentWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT) as any;
    
    // If no workout exists, nothing to fix
    if (!currentWorkout) {
      return {
        fixed: false,
        message: "No current workout found in localStorage."
      };
    }
    
    // Step 2: Check the date of the workout
    const workoutDate = new Date(currentWorkout.date);
    const today = new Date();
    const isSameDay = workoutDate.toDateString() === today.toDateString();
    
    // Step 3: Get scheduled workouts for today
    const schedules = await localForage.getItem(STORAGE_KEYS.PROGRAM_SCHEDULES) as any[] || [];
    const todaySchedules = Array.isArray(schedules) ? schedules.filter(schedule => {
      try {
        // Parse dates for comparison
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const checkDate = new Date();
        checkDate.setHours(12, 0, 0, 0);
        
        // Check date range
        const isInDateRange = checkDate >= startDate && checkDate <= endDate;
        
        // Check weekday
        const dayOfWeek = checkDate.getDay();
        const isDaySelected = schedule.selectedWeekdays ? 
          schedule.selectedWeekdays.includes(dayOfWeek) : false;
        
        // Must be active, in date range, and on a selected weekday
        return schedule.active && isInDateRange && isDaySelected;
      } catch (error) {
        console.error('Error checking schedule:', error);
        return false;
      }
    }) : [];
    
    // If it's not today's workout or has no program ID when one is required, clear it
    const hasScheduledProgramForToday = todaySchedules.length > 0;
    const workoutHasProgramId = !!currentWorkout.programId;
    
    if (!isSameDay) {
      // Not today's workout
      await clearCurrentWorkout();
      return {
        fixed: true,
        message: `Cleared outdated workout from ${workoutDate.toLocaleDateString()}.`
      };
    }
    
    // Only clear if there are scheduled workouts but the current workout doesn't match
    if (hasScheduledProgramForToday && !workoutHasProgramId) {
      await clearCurrentWorkout();
      return {
        fixed: true,
        message: "Cleared current workout because it didn't match today's scheduled program."
      };
    }
    
    // If the workout has a programId, check if it matches any scheduled programs
    if (workoutHasProgramId && hasScheduledProgramForToday) {
      const matchingSchedule = todaySchedules.find(s => s.programId === currentWorkout.programId);
      if (!matchingSchedule) {
        await clearCurrentWorkout();
        return {
          fixed: true,
          message: "Cleared current workout because its program ID didn't match any scheduled programs for today."
        };
      }
    }
    
    return {
      fixed: false,
      message: "Current workout is valid and matches today's schedule (or no scheduled workouts found for today)."
    };
  } catch (error: any) {
    console.error("Error fixing workout storage:", error);
    return {
      fixed: false,
      message: `Error while fixing: ${error?.message || 'Unknown error'}`
    };
  }
}

export async function exportData(): Promise<string> {
  const localForage = await getLocalForage();
  const data: Record<string, any> = {};

  // Export all keys
  for (const key of Object.values(STORAGE_KEYS)) {
    data[key] = await localForage.getItem(key);
  }

  return JSON.stringify(data);
}

export async function importData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    const localForage = await getLocalForage();

    // Import all valid keys
    for (const key of Object.values(STORAGE_KEYS)) {
      if (data[key] !== undefined) {
        await localForage.setItem(key, data[key]);
      }
    }
  } catch (error) {
    throw new Error('Invalid data format for import');
  }
}
