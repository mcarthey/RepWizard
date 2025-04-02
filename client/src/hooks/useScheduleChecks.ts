import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalProgramSchedule } from '@shared/schema';

// Storage key for program schedules
export const PROGRAM_SCHEDULES_STORAGE_KEY = 'repwizard_program_schedules';

// Simple hook to check for schedules
export function useScheduleChecks() {
  const [schedules, setSchedules] = useState<LocalProgramSchedule[]>([]);
  // Use a ref to maintain a stable reference to the schedules array
  const schedulesRef = useRef<LocalProgramSchedule[]>([]);
  
  // Cache of schedule check results to avoid redundant calculations
  const scheduleCheckCacheRef = useRef<Map<string, LocalProgramSchedule[]>>(new Map());
  
  // Load schedules from localStorage only once on mount
  useEffect(() => {
    const loadSchedules = () => {
      try {
        // Try to get stored schedules
        const storedSchedules = localStorage.getItem(PROGRAM_SCHEDULES_STORAGE_KEY);
        if (storedSchedules) {
          const parsedSchedules = JSON.parse(storedSchedules);
          setSchedules(parsedSchedules);
          schedulesRef.current = parsedSchedules;
          // Clear cache when schedules are loaded
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
  
  // Update ref when schedules change
  useEffect(() => {
    schedulesRef.current = schedules;
    // Clear cache when schedules change
    scheduleCheckCacheRef.current.clear();
  }, [schedules]);
  
  // Function to get a unique cache key for a date
  const getDateCacheKey = useCallback((date: Date) => {
    // Format as YYYY-MM-DD for cache key
    return date.toISOString().split('T')[0];
  }, []);
  
  // Get schedules for a specific date - stable reference with memoization
  const getSchedulesForDate = useCallback((date: Date) => {
    // Create a cache key for this date
    const cacheKey = getDateCacheKey(date);
    
    // Check cache first
    if (scheduleCheckCacheRef.current.has(cacheKey)) {
      return scheduleCheckCacheRef.current.get(cacheKey) || [];
    }
    
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
  }, [getDateCacheKey]); // Only depends on the stable getDateCacheKey function
  
  return {
    schedules,
    getSchedulesForDate
  };
}