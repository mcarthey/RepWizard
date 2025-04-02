import { useCallback, useEffect, useState } from 'react';
import { addDays, isSameDay, isWithinInterval } from 'date-fns';
import { LocalProgramSchedule } from '@/lib/workout';

// Using a constant storage key for consistency
const STORAGE_KEY = 'repwizard_program_schedules';

/**
 * Hook for checking if programs are scheduled for a specific date
 */
export function useScheduleChecks() {
  const [schedules, setSchedules] = useState<LocalProgramSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load schedules from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          console.log('Loaded program schedules from localStorage:', parsedData);
          setSchedules(parsedData);
        }
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Check if a date falls on one of the selected weekdays for a schedule
   * @param date The date to check
   * @param weekdays Array of weekdays (0 = Sunday, 1 = Monday, etc.)
   * @returns True if the date falls on one of the selected weekdays
   */
  const isSelectedWeekday = useCallback((date: Date, weekdays: number[]): boolean => {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return weekdays.includes(day);
  }, []);
  
  /**
   * Get all schedules that are valid for a specific date
   * @param date The date to check
   * @returns Array of schedules that are valid for the date
   */
  const getSchedulesForDate = useCallback((date: Date): LocalProgramSchedule[] => {
    if (!date || loading || schedules.length === 0) {
      return [];
    }
    
    // Manually load the schedules from localStorage each time for the most up-to-date data
    let currentSchedules = [];
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          currentSchedules = parsedData;
        }
      }
    } catch (error) {
      console.error('Error getting schedules for date:', error);
      return [];
    }
    
    return currentSchedules.filter(schedule => {
      // Skip inactive schedules
      if (!schedule.active) return false;
      
      // Check if date is within schedule range
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      
      const isInRange = isWithinInterval(date, {
        start: startDate,
        end: addDays(endDate, 1) // Add a day to include the end date
      });
      
      if (!isInRange) return false;
      
      // Check if date falls on one of the selected weekdays
      return isSelectedWeekday(date, schedule.selectedWeekdays);
    });
  }, [schedules, isSelectedWeekday, loading]);
  
  /**
   * Get the next workout date according to the schedule
   * @param fromDate The starting date to check from
   * @param maxDaysToCheck Maximum number of days to check forward
   * @returns The next date that has a scheduled workout, or null if none found
   */
  const getNextWorkoutDate = useCallback((fromDate: Date, maxDaysToCheck: number = 30): Date | null => {
    // Check today first
    if (getSchedulesForDate(fromDate).length > 0) {
      return fromDate;
    }
    
    // Then check future dates
    for (let i = 1; i <= maxDaysToCheck; i++) {
      const checkDate = addDays(fromDate, i);
      if (getSchedulesForDate(checkDate).length > 0) {
        return checkDate;
      }
    }
    
    return null;
  }, [getSchedulesForDate]);
  
  /**
   * Check if a specified date has any scheduled programs
   * @param date The date to check
   * @returns True if the date has scheduled programs
   */
  const hasScheduledPrograms = useCallback((date: Date): boolean => {
    return getSchedulesForDate(date).length > 0;
  }, [getSchedulesForDate]);
  
  /**
   * Force refresh schedules from localStorage
   */
  const refreshSchedules = useCallback(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          console.log('Refreshed program schedules from localStorage:', parsedData);
          setSchedules(parsedData);
        }
      }
    } catch (error) {
      console.error('Error refreshing schedules:', error);
    }
  }, []);
  
  return {
    getSchedulesForDate,
    getNextWorkoutDate,
    hasScheduledPrograms,
    schedules,
    loading,
    refreshSchedules
  };
}