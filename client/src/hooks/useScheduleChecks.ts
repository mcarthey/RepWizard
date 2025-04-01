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
    // Return schedules that include this date and day of the week
    return schedules.filter(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const checkDate = new Date(date);
      
      // Reset time parts for all dates to compare only the date portion
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      checkDate.setHours(12, 0, 0, 0);
      
      // Check if the date falls within the schedule's date range
      const isInDateRange = checkDate >= startDate && checkDate <= endDate;
      
      // Check if the day of the week matches one of the selected weekdays
      const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isDaySelected = schedule.selectedWeekdays.includes(dayOfWeek);
      
      return schedule.active && isInDateRange && isDaySelected;
    });
  }, [schedules]);
  
  return {
    schedules,
    getSchedulesForDate
  };
}