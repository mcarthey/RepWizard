import { useState, useEffect, useCallback } from 'react';
import { ProgramSchedule } from '@shared/schema';

// Simple localStorage-based hook to manage program schedules
export function useProgramSchedules() {
  const [schedules, setSchedules] = useState<ProgramSchedule[]>([]);
  
  // Load schedules from localStorage on first render
  useEffect(() => {
    try {
      const storedSchedules = localStorage.getItem('repwizard_program_schedules');
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (error) {
      console.error('Error loading schedules from localStorage:', error);
    }
  }, []);
  
  // Save schedules to localStorage whenever they change
  useEffect(() => {
    if (schedules.length > 0) {
      try {
        localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
      } catch (error) {
        console.error('Error saving schedules to localStorage:', error);
      }
    }
  }, [schedules]);
  
  // Add a new program schedule
  const addProgramSchedule = useCallback((schedule: ProgramSchedule) => {
    setSchedules(prev => [...prev, schedule]);
  }, []);
  
  // Update an existing schedule
  const updateProgramSchedule = useCallback((id: string, updates: Partial<ProgramSchedule>) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id ? { ...schedule, ...updates } : schedule
      )
    );
  }, []);
  
  // Delete a schedule
  const deleteProgramSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  }, []);
  
  // Get all active schedules for a specific date
  const getSchedulesForDate = useCallback((date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0); // Normalize time to noon for comparison
    
    return schedules.filter(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      
      // Reset time parts for all dates to compare only the date portion
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
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
    addProgramSchedule,
    updateProgramSchedule,
    deleteProgramSchedule,
    getSchedulesForDate
  };
}