import { useState, useEffect, useCallback } from 'react';
import { LocalProgramSchedule } from '@shared/schema';

// Storage key for program schedules
export const PROGRAM_SCHEDULES_STORAGE_KEY = 'repwizard_program_schedules';

// Simple hook to check for schedules
export function useScheduleChecks() {
  const [schedules, setSchedules] = useState<LocalProgramSchedule[]>([]);
  
  // Load schedules from localStorage
  useEffect(() => {
    try {
      // Try to get stored schedules
      const storedSchedules = localStorage.getItem(PROGRAM_SCHEDULES_STORAGE_KEY);
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }, []);
  
  // Get schedules for a specific date
  const getSchedulesForDate = useCallback((date: Date) => {
    if (schedules.length === 0) {
      return [];
    }
    
    console.log("Getting schedules for date:", date.toISOString());
    console.log("All available schedules:", schedules);
    
    // Return schedules that include this date and day of the week
    const matchingSchedules = schedules.filter(schedule => {
      try {
        // Parse dates for comparison (YYYY-MM-DD format)
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);
        
        // Set to start of day and end of day for proper comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        // Create a new date object for the check date and reset time to noon
        const checkDate = new Date(date);
        checkDate.setHours(12, 0, 0, 0);
        
        // Print debug information
        console.log("Checking schedule:", {
          programId: schedule.programId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          checkDate: checkDate.toISOString(),
          selectedWeekdays: schedule.selectedWeekdays,
          checkDateDay: checkDate.getDay()
        });
        
        // Check if the date falls within the schedule's date range
        const isInDateRange = checkDate >= startDate && checkDate <= endDate;
        
        // Check if the day of the week matches one of the selected weekdays
        const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
        const isDaySelected = schedule.selectedWeekdays ? schedule.selectedWeekdays.includes(dayOfWeek) : false;
        
        console.log("Schedule check results:", {
          isInDateRange,
          isDaySelected,
          isActive: schedule.active
        });
        
        // Must be active, in date range, and on a selected weekday
        return schedule.active && isInDateRange && isDaySelected;
      } catch (error) {
        console.error('Error checking schedule:', error, schedule);
        return false;
      }
    });
    
    console.log("Matching schedules:", matchingSchedules);
    return matchingSchedules;
  }, [schedules]);
  
  return {
    schedules,
    getSchedulesForDate
  };
}