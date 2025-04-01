import { useState, useEffect, useCallback } from 'react';
import { ProgramSchedule } from '@shared/schema';

// Simple hook to check for schedules
export function useScheduleChecks() {
  const [schedules, setSchedules] = useState<ProgramSchedule[]>([]);
  
  // Load schedules from localStorage
  useEffect(() => {
    try {
      // Try to get stored schedules
      const storedSchedules = localStorage.getItem('repwizard_program_schedules');
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }, []);
  
  // Get schedules for a specific date
  const getSchedulesForDate = useCallback((date: Date) => {
    console.log("DEBUG - Checking for schedules for date:", date);
    console.log("DEBUG - All available schedules:", schedules);
    
    // Manual test schedule for today
    // This is for testing - you can remove this after the scheduling is verified
    if (schedules.length === 0) {
      console.log("DEBUG - No schedules found, adding test schedule for today");
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const nextWeekStr = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Create a test schedule
      const testSchedule: ProgramSchedule = {
        id: "test-schedule-1",
        programId: 1, // Push/Pull/Legs program
        startDate: todayStr,
        endDate: nextWeekStr,
        selectedWeekdays: [today.getDay()], // Today's weekday
        active: true
      };
      
      // Store the test schedule
      localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
      
      return [testSchedule];
    }
    
    // Return schedules that include this date and day of the week
    const todaySchedules = schedules.filter(schedule => {
      // Parse dates for comparison
      // Format: YYYY-MM-DD
      const startDateParts = schedule.startDate.split('-').map(Number);
      const endDateParts = schedule.endDate.split('-').map(Number);
      
      // JavaScript months are 0-indexed, so we subtract 1 from the month
      const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
      const endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
      
      // Set to start of day and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      // Create a new date object for the check date and reset time to noon
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      
      // Check if the date falls within the schedule's date range
      const isInDateRange = checkDate >= startDate && checkDate <= endDate;
      console.log("DEBUG - Date check:", 
        "checkDate:", checkDate.toISOString(), 
        "startDate:", startDate.toISOString(), 
        "endDate:", endDate.toISOString(), 
        "In range:", isInDateRange
      );
      
      // Check if the day of the week matches one of the selected weekdays
      const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isDaySelected = schedule.selectedWeekdays.includes(dayOfWeek);
      console.log("DEBUG - Day check:", "dayOfWeek:", dayOfWeek, "selectedWeekdays:", schedule.selectedWeekdays, "isDaySelected:", isDaySelected);
      
      const isMatch = schedule.active && isInDateRange && isDaySelected;
      console.log("DEBUG - Final match:", isMatch, "for schedule:", schedule.id);
      
      return isMatch;
    });
    
    console.log("DEBUG - Found today's schedules:", todaySchedules);
    return todaySchedules;
  }, [schedules]);
  
  return {
    schedules,
    getSchedulesForDate
  };
}