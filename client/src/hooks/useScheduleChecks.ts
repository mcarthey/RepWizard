import { useCallback } from 'react';
import { addDays, isSameDay, isWithinInterval } from 'date-fns';
import { useProgramSchedules } from '@/hooks/useProgramSchedules';
import { LocalProgramSchedule } from '@/lib/workout';

/**
 * Hook for checking if programs are scheduled for a specific date
 */
export function useScheduleChecks() {
  const { schedules } = useProgramSchedules();
  
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
    if (!date || !schedules || schedules.length === 0) {
      return [];
    }
    
    return schedules.filter(schedule => {
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
  }, [schedules, isSelectedWeekday]);
  
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
  
  return {
    getSchedulesForDate,
    getNextWorkoutDate,
    hasScheduledPrograms,
    schedules
  };
}