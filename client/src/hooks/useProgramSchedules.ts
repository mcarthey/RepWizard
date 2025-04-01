import { useState, useEffect, useCallback } from 'react';
import { ProgramSchedule } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { PROGRAM_SCHEDULES_STORAGE_KEY } from './useScheduleChecks';
import { useToast } from './use-toast';

/**
 * Hook for managing program schedules
 * This hook provides CRUD operations for program schedules stored in localStorage
 */
export function useProgramSchedules() {
  const [schedules, setSchedules] = useState<ProgramSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load schedules from localStorage
  useEffect(() => {
    try {
      const storedSchedules = localStorage.getItem(PROGRAM_SCHEDULES_STORAGE_KEY);
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (error) {
      console.error('Error loading program schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load program schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save schedules to localStorage
  const saveSchedules = useCallback((updatedSchedules: ProgramSchedule[]) => {
    try {
      localStorage.setItem(PROGRAM_SCHEDULES_STORAGE_KEY, JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);
      return true;
    } catch (error) {
      console.error('Error saving program schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to save program schedule',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Add a new schedule
  const addSchedule = useCallback((schedule: Omit<ProgramSchedule, 'id'>) => {
    try {
      const newSchedule: ProgramSchedule = {
        ...schedule, 
        id: uuidv4() // Generate unique ID
      };
      
      const updatedSchedules = [...schedules, newSchedule];
      const success = saveSchedules(updatedSchedules);
      
      if (success) {
        console.log('Program schedule added successfully:', newSchedule);
        toast({
          title: 'Schedule Added',
          description: 'Program has been scheduled successfully',
        });
        return newSchedule;
      }
      return null;
    } catch (error) {
      console.error('Error adding program schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add program schedule',
        variant: 'destructive',
      });
      return null;
    }
  }, [schedules, saveSchedules, toast]);

  // Update an existing schedule
  const updateSchedule = useCallback((id: string, updates: Partial<ProgramSchedule>) => {
    try {
      const scheduleIndex = schedules.findIndex((s) => s.id === id);
      if (scheduleIndex === -1) {
        console.error('Schedule not found:', id);
        return false;
      }

      const updatedSchedules = [...schedules];
      updatedSchedules[scheduleIndex] = {
        ...updatedSchedules[scheduleIndex],
        ...updates,
      };

      return saveSchedules(updatedSchedules);
    } catch (error) {
      console.error('Error updating program schedule:', error);
      return false;
    }
  }, [schedules, saveSchedules]);

  // Delete a schedule
  const deleteSchedule = useCallback((id: string) => {
    try {
      const updatedSchedules = schedules.filter((s) => s.id !== id);
      return saveSchedules(updatedSchedules);
    } catch (error) {
      console.error('Error deleting program schedule:', error);
      return false;
    }
  }, [schedules, saveSchedules]);

  // Get a specific schedule by ID
  const getSchedule = useCallback((id: string) => {
    return schedules.find((s) => s.id === id) || null;
  }, [schedules]);

  // Clear all schedules
  const clearSchedules = useCallback(() => {
    try {
      localStorage.removeItem(PROGRAM_SCHEDULES_STORAGE_KEY);
      setSchedules([]);
      return true;
    } catch (error) {
      console.error('Error clearing program schedules:', error);
      return false;
    }
  }, []);

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedule,
    clearSchedules,
  };
}