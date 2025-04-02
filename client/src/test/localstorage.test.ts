import { getLocalForage, STORAGE_KEYS, clearAllData, fixWorkoutStorage } from '../lib/localForage';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';

/**
 * This test file demonstrates how to inspect localStorage for debugging purposes.
 * Run with: npm test -- localstorage
 */
 
describe('LocalStorage Debug Tests', () => {
  
  test('Inspect the current workout in localStorage', async () => {
    const localForage = await getLocalForage();
    const currentWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    
    console.log('CURRENT WORKOUT IN STORAGE:', JSON.stringify(currentWorkout, null, 2));
    
    // This is a diagnostic test, not a real assertion
    expect(true).toBe(true);
  });
  
  test('Inspect all program schedules in localStorage', async () => {
    const localForage = await getLocalForage();
    const schedules = await localForage.getItem(STORAGE_KEYS.PROGRAM_SCHEDULES);
    
    console.log('PROGRAM SCHEDULES IN STORAGE:', JSON.stringify(schedules, null, 2));
    
    // This is a diagnostic test, not a real assertion
    expect(true).toBe(true);
  });
  
  test('Clear current workout from localStorage', async () => {
    const localForage = await getLocalForage();
    
    // Get the current workout before clearing
    const beforeWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    console.log('WORKOUT BEFORE CLEARING:', JSON.stringify(beforeWorkout, null, 2));
    
    // Remove the workout
    await localForage.removeItem(STORAGE_KEYS.CURRENT_WORKOUT);
    
    // Verify it's gone
    const afterWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    console.log('WORKOUT AFTER CLEARING:', JSON.stringify(afterWorkout, null, 2));
    
    expect(afterWorkout).toBeNull();
  });
  
  test('Reset all localStorage data', async () => {
    // Clear all data
    await clearAllData();
    
    // Verify current workout is cleared
    const localForage = await getLocalForage();
    const workout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    const schedules = await localForage.getItem(STORAGE_KEYS.PROGRAM_SCHEDULES);
    
    expect(workout).toBeNull();
    expect(schedules).toBeNull();
  });
  
  test('Test fixWorkoutStorage function with outdated workout', async () => {
    // First clear all data
    await clearAllData();
    
    // Set up a test workout from yesterday
    const localForage = await getLocalForage();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const testWorkout = {
      id: 'test-workout-id',
      date: yesterday.toISOString(),
      name: 'Test Outdated Workout',
      completed: false,
      exercises: []
    };
    
    // Add the outdated workout to localStorage
    await localForage.setItem(STORAGE_KEYS.CURRENT_WORKOUT, testWorkout);
    
    // Verify it was added
    const addedWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    console.log('ADDED TEST WORKOUT:', JSON.stringify(addedWorkout, null, 2));
    expect(addedWorkout).not.toBeNull();
    
    // Run the fix function
    const result = await fixWorkoutStorage();
    console.log('FIX RESULT:', result);
    
    // Check the workout was cleared
    const afterFixWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    expect(afterFixWorkout).toBeNull();
    expect(result.fixed).toBe(true);
  });
  
  test('Test fixWorkoutStorage with mismatched program ID', async () => {
    // First clear all data
    await clearAllData();
    
    // Set up a test workout for today but with a program ID that doesn't match any schedule
    const localForage = await getLocalForage();
    const today = new Date();
    
    const testWorkout = {
      id: 'test-workout-id',
      date: today.toISOString(),
      name: 'Test Mismatched Program Workout',
      programId: 999, // An ID that doesn't exist in any schedule
      completed: false,
      exercises: []
    };
    
    // Add today's program schedules
    const testSchedules = [
      {
        programId: 1,
        startDate: today.toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        selectedWeekdays: [0, 1, 2, 3, 4, 5, 6], // All days of the week
        active: true,
        id: 'test-schedule-id'
      }
    ];
    
    // Add the test workout and schedules to localStorage
    await localForage.setItem(STORAGE_KEYS.CURRENT_WORKOUT, testWorkout);
    await localForage.setItem(STORAGE_KEYS.PROGRAM_SCHEDULES, testSchedules);
    
    // Verify they were added
    const addedWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    const addedSchedules = await localForage.getItem(STORAGE_KEYS.PROGRAM_SCHEDULES);
    expect(addedWorkout).not.toBeNull();
    expect(addedSchedules).not.toBeNull();
    
    // Run the fix function
    const result = await fixWorkoutStorage();
    console.log('FIX RESULT (MISMATCHED PROGRAM):', result);
    
    // Check the workout was cleared because the program ID doesn't match any schedule
    const afterFixWorkout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
    expect(afterFixWorkout).toBeNull();
    expect(result.fixed).toBe(true);
  });
});