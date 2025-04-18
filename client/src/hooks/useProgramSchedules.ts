import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { LocalProgramSchedule } from '@/lib/workout';

/**
 * Storage key for program schedules
 */
const STORAGE_KEY = 'repwizard_program_schedules';

/**
 * Hook for managing program schedules
 */
export function useProgramSchedules() {
  const [schedules, setSchedules] = useState<LocalProgramSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  /**
   * Helper function to save schedules to localStorage
   */
  const saveSchedulesToStorage = useCallback((schedulesToSave: LocalProgramSchedule[]) => {
    try {
      const serializedData = JSON.stringify(schedulesToSave);
      localStorage.setItem(STORAGE_KEY, serializedData);
      console.log('Saved schedules to localStorage:', schedulesToSave);
      return true;
    } catch (error) {
      console.error('Error saving schedules to localStorage:', error);
      return false;
    }
  }, []);
  
  /**
   * Helper function to load schedules from localStorage
   */
  const loadSchedulesFromStorage = useCallback((): LocalProgramSchedule[] => {
    try {
      const serializedData = localStorage.getItem(STORAGE_KEY);
      console.log('Raw programSchedules from localStorage:', serializedData);
      
      if (!serializedData) {
        return [];
      }
      
      const parsedData = JSON.parse(serializedData);
      
      if (Array.isArray(parsedData)) {
        console.log('Successfully parsed schedules from localStorage:', parsedData);
        return parsedData;
      } else {
        console.error('Invalid schedules data format in localStorage');
        return [];
      }
    } catch (error) {
      console.error('Error loading schedules from localStorage:', error);
      return [];
    }
  }, []);
  
  // Load schedules on mount and handle potential migration from old key
  useEffect(() => {
    // Check if we need to migrate data from old storage key
    const OLD_STORAGE_KEY = 'programSchedules';
    try {
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldData) {
        console.log('Found data in old storage key, attempting migration...');
        const parsedOldData = JSON.parse(oldData);
        if (Array.isArray(parsedOldData) && parsedOldData.length > 0) {
          // Save the old data to the new key
          console.log('Migrating schedules from old key to new key', parsedOldData);
          localStorage.setItem(STORAGE_KEY, oldData);
          // Clear the old data to avoid future migrations
          localStorage.removeItem(OLD_STORAGE_KEY);
          console.log('Migration completed successfully');
          toast({
            title: 'Data Migration',
            description: 'Program schedules have been migrated to the new storage format',
          });
        }
      }
    } catch (error) {
      console.error('Error during storage migration:', error);
    }
    
    // Now load from the correct storage key
    const loadedSchedules = loadSchedulesFromStorage();
    setSchedules(loadedSchedules);
    setLoading(false);
  }, [loadSchedulesFromStorage, toast]);
  
  // Save schedules whenever they change
  useEffect(() => {
    if (!loading) {
      saveSchedulesToStorage(schedules);
    }
  }, [schedules, loading, saveSchedulesToStorage]);
  
  /**
   * Add a new program schedule
   */
  const addSchedule = useCallback((schedule: Omit<LocalProgramSchedule, 'id'>) => {
    const newSchedule: LocalProgramSchedule = {
      ...schedule,
      id: uuidv4()
    };
    
    console.log('Adding new schedule:', newSchedule);
    
    try {
      // First try to load current state directly from localStorage
      // This helps avoid race conditions or stale state
      const currentSchedules = loadSchedulesFromStorage();
      
      // Add new schedule to the current schedules
      const updatedSchedules = [...currentSchedules, newSchedule];
      
      // Immediately save to localStorage
      const saved = saveSchedulesToStorage(updatedSchedules);
      
      if (saved) {
        console.log('Successfully added and saved new schedule to localStorage:', newSchedule);
        
        // Update local state to match what's in localStorage
        setSchedules(updatedSchedules);
        
        toast({
          title: 'Schedule created',
          description: 'Program has been scheduled successfully'
        });
        
        return newSchedule;
      } else {
        console.error('Failed to save new schedule to localStorage');
        toast({
          title: 'Error',
          description: 'Failed to save schedule. Please try again.',
          variant: 'destructive'
        });
        return null;
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast, saveSchedulesToStorage, loadSchedulesFromStorage]);
  
  /**
   * Update an existing program schedule
   */
  const updateSchedule = useCallback((id: string, updatedSchedule: Partial<LocalProgramSchedule>) => {
    try {
      // First try to load current state directly from localStorage
      const currentSchedules = loadSchedulesFromStorage();
      
      const updated = currentSchedules.map(schedule => 
        schedule.id === id
          ? { ...schedule, ...updatedSchedule }
          : schedule
      );
      
      // Immediately save to localStorage
      const saved = saveSchedulesToStorage(updated);
      
      if (saved) {
        // Update local state to match what's in localStorage
        setSchedules(updated);
        
        toast({
          title: 'Schedule updated',
          description: 'Program schedule has been updated'
        });
      } else {
        console.error('Failed to update schedule in localStorage');
        toast({
          title: 'Error',
          description: 'Failed to update schedule. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while updating the schedule.',
        variant: 'destructive'
      });
    }
  }, [toast, saveSchedulesToStorage, loadSchedulesFromStorage]);
  
  /**
   * Remove a program schedule
   */
  const removeSchedule = useCallback((id: string) => {
    try {
      // First try to load current state directly from localStorage
      const currentSchedules = loadSchedulesFromStorage();
      
      const updated = currentSchedules.filter(schedule => schedule.id !== id);
      
      // Immediately save to localStorage
      const saved = saveSchedulesToStorage(updated);
      
      if (saved) {
        // Update local state to match what's in localStorage
        setSchedules(updated);
        
        toast({
          title: 'Schedule removed',
          description: 'Program schedule has been removed'
        });
      } else {
        console.error('Failed to remove schedule from localStorage');
        toast({
          title: 'Error',
          description: 'Failed to remove schedule. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error removing schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while removing the schedule.',
        variant: 'destructive'
      });
    }
  }, [toast, saveSchedulesToStorage, loadSchedulesFromStorage]);
  
  /**
   * Toggle the active state of a schedule
   */
  const toggleScheduleActive = useCallback((id: string) => {
    try {
      // First try to load current state directly from localStorage
      const currentSchedules = loadSchedulesFromStorage();
      
      const updated = currentSchedules.map(schedule => 
        schedule.id === id
          ? { ...schedule, active: !schedule.active }
          : schedule
      );
      
      // Immediately save to localStorage
      const saved = saveSchedulesToStorage(updated);
      
      if (saved) {
        // Update local state to match what's in localStorage
        setSchedules(updated);
        
        toast({
          title: 'Schedule toggled',
          description: `Schedule has been ${updated.find(s => s.id === id)?.active ? 'activated' : 'deactivated'}`
        });
      } else {
        console.error('Failed to toggle schedule in localStorage');
        toast({
          title: 'Error',
          description: 'Failed to toggle schedule status. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while toggling the schedule.',
        variant: 'destructive'
      });
    }
  }, [toast, saveSchedulesToStorage, loadSchedulesFromStorage]);
  
  /**
   * Create a default schedule for a program
   */
  const createDefaultSchedule = useCallback((programId: number, programName: string) => {
    const today = new Date();
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addWeeks(today, 8), 'yyyy-MM-dd');
    
    // Default to Mon, Wed, Fri
    const selectedWeekdays = [1, 3, 5]; 
    
    const newSchedule = {
      programId,
      startDate,
      endDate,
      selectedWeekdays,
      active: true
    };
    
    return addSchedule(newSchedule);
  }, [addSchedule]);
  
  /**
   * Force refresh schedules from localStorage
   */
  const refreshSchedules = useCallback(() => {
    try {
      const refreshedSchedules = loadSchedulesFromStorage();
      setSchedules(refreshedSchedules);
      console.log('Manually refreshed schedules from localStorage:', refreshedSchedules);
      return true;
    } catch (error) {
      console.error('Error refreshing schedules:', error);
      return false;
    }
  }, [loadSchedulesFromStorage]);

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleScheduleActive,
    createDefaultSchedule,
    refreshSchedules
  };
}