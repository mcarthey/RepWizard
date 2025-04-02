import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocalStorage } from './use-local-storage';
import { useAuth } from './use-auth';

// Types for schedule data
export interface ProgramSchedule {
  id: string;
  userId: number;
  programId: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

// Custom hook for managing program schedules
export function useSchedules() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useLocalStorage<ProgramSchedule[]>('repwizard_schedules', []);
  
  // Get user's schedules
  const userSchedules = schedules.filter(s => user && s.userId === user.id);
  
  // Get active schedules (where active = true)
  const activeSchedules = userSchedules.filter(s => s.active);
  
  // Function to add a new schedule
  const addSchedule = (programId: number, startDate: Date, endDate?: Date) => {
    if (!user) return null;
    
    const newSchedule: ProgramSchedule = {
      id: uuidv4(),
      userId: user.id,
      programId,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      active: true
    };
    
    // Add to schedules
    setSchedules([...schedules, newSchedule]);
    
    return newSchedule;
  };
  
  // Function to remove a schedule
  const removeSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter(s => s.id !== scheduleId));
  };
  
  // Function to update a schedule
  const updateSchedule = (scheduleId: string, updates: Partial<ProgramSchedule>) => {
    setSchedules(
      schedules.map(s => 
        s.id === scheduleId ? { ...s, ...updates } : s
      )
    );
  };
  
  // Function to get scheduled program for a specific date
  const getScheduledProgramForDate = (date: Date) => {
    // ISO date string for comparison
    const dateStr = date.toISOString().split('T')[0];
    
    // Find an active schedule that includes this date
    const schedule = activeSchedules.find(s => {
      const scheduleStart = new Date(s.startDate).toISOString().split('T')[0];
      const scheduleEnd = s.endDate 
        ? new Date(s.endDate).toISOString().split('T')[0] 
        : null;
      
      return (
        scheduleStart <= dateStr && 
        (!scheduleEnd || scheduleEnd >= dateStr)
      );
    });
    
    return schedule ? schedule.programId : null;
  };
  
  return {
    schedules: userSchedules,
    activeSchedules,
    addSchedule,
    removeSchedule,
    updateSchedule,
    getScheduledProgramForDate
  };
}