import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalProgramSchedule } from '@shared/schema';

// Storage key for program schedules
export const PROGRAM_SCHEDULES_STORAGE_KEY = 'repwizard_program_schedules';

// Simple hook to check for schedules
export function useScheduleChecks() {
  const [schedules, setSchedules] = useState<LocalProgramSchedule[]>([]);
  
  // Use refs for stable references
  const schedulesRef = useRef<LocalProgramSchedule[]>([]);
  const getSchedulesForDateRef = useRef<(date: Date) => LocalProgramSchedule[]>(() => []);
  
  // Cache of schedule check results to avoid redundant calculations
  // Using ref to persist across renders
  const scheduleCheckCacheRef = useRef<Map<string, LocalProgramSchedule[]>>(new Map());
  
  // Load schedules from localStorage only once on mount - not a dependency trigger
  useEffect(() => {
    const loadSchedules = () => {
      try {
        // Try to get stored schedules
        const storedSchedules = localStorage.getItem(PROGRAM_SCHEDULES_STORAGE_KEY);
        if (storedSchedules) {
          const parsedSchedules = JSON.parse(storedSchedules);
          setSchedules(parsedSchedules);
          schedulesRef.current = parsedSchedules;
          
          // Clear cache when schedules are loaded or changed
          scheduleCheckCacheRef.current.clear();
        }
      } catch (error) {
        console.error('Error loading schedules:', error);
      }
    };
    
    loadSchedules();
    
    // Setup storage event listener for updates from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PROGRAM_SCHEDULES_STORAGE_KEY) {
        loadSchedules();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Update ref when schedules change - not a dependency trigger
  useEffect(() => {
    schedulesRef.current = schedules;
    scheduleCheckCacheRef.current.clear();
  }, [schedules]);
  
  // Function to get a unique cache key for a date - stable reference
  const getDateCacheKey = useCallback((date: Date): string => {
    // Format as YYYY-MM-DD for cache key
    return date.toISOString().split('T')[0];
  }, []);
  
  // Create the getSchedulesForDate function and store in ref for stability
  // This implementation won't change between renders
  useEffect(() => {
    // This function is created only once and stored in a ref
    getSchedulesForDateRef.current = (date: Date) => {
      // Create a cache key for this date
      const cacheKey = getDateCacheKey(date);
      
      // Check cache first for performance
      if (scheduleCheckCacheRef.current.has(cacheKey)) {
        return scheduleCheckCacheRef.current.get(cacheKey) || [];
      }
      
      // Get current schedules from ref
      const currentSchedules = schedulesRef.current;
      if (currentSchedules.length === 0) {
        return [];
      }
      
      console.log("Getting schedules for date:", date.toISOString());
      
      // Return schedules that include this date and day of the week
      const matchingSchedules = currentSchedules.filter(schedule => {
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
          
          // Check if the date falls within the schedule's date range
          const isInDateRange = checkDate >= startDate && checkDate <= endDate;
          
          // Check if the day of the week matches one of the selected weekdays
          const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
          const isDaySelected = schedule.selectedWeekdays ? schedule.selectedWeekdays.includes(dayOfWeek) : false;
          
          // Must be active, in date range, and on a selected weekday
          return schedule.active && isInDateRange && isDaySelected;
        } catch (error) {
          console.error('Error checking schedule:', error, schedule);
          return false;
        }
      });
      
      // Cache the result for future calls
      scheduleCheckCacheRef.current.set(cacheKey, matchingSchedules);
      
      return matchingSchedules;
    };
  }, [getDateCacheKey]);
  
  // Return a stable wrapped function that uses the ref internally
  // This ensures the returned function reference doesn't change between renders
  const getSchedulesForDate = useCallback((date: Date): LocalProgramSchedule[] => {
    return getSchedulesForDateRef.current(date);
  }, []);
  
  return {
    schedules,
    getSchedulesForDate
  };
}