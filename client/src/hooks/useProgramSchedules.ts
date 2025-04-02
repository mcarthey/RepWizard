import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/useStorage';
import { LocalProgramSchedule } from '@/lib/workout';

/**
 * Hook for managing program schedules
 */
export function useProgramSchedules() {
  const [schedules, setSchedules] = useState<LocalProgramSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { saveToStorage, loadFromStorage } = useStorage();
  
  // Load schedules on mount
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const savedSchedules = await loadFromStorage<LocalProgramSchedule[]>('programSchedules');
        if (savedSchedules) {
          setSchedules(savedSchedules);
        }
      } catch (error) {
        console.error('Error loading schedules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load program schedules',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSchedules();
  }, []);
  
  // Save schedules whenever they change
  useEffect(() => {
    if (!loading) {
      saveToStorage('programSchedules', schedules);
    }
  }, [schedules, loading, saveToStorage]);
  
  /**
   * Add a new program schedule
   */
  const addSchedule = useCallback((schedule: Omit<LocalProgramSchedule, 'id'>) => {
    const newSchedule: LocalProgramSchedule = {
      ...schedule,
      id: uuidv4()
    };
    
    setSchedules(prev => [...prev, newSchedule]);
    toast({
      title: 'Schedule created',
      description: 'Program has been scheduled successfully'
    });
    
    return newSchedule;
  }, [toast]);
  
  /**
   * Update an existing program schedule
   */
  const updateSchedule = useCallback((id: string, updatedSchedule: Partial<LocalProgramSchedule>) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id
          ? { ...schedule, ...updatedSchedule }
          : schedule
      )
    );
    
    toast({
      title: 'Schedule updated',
      description: 'Program schedule has been updated'
    });
  }, [toast]);
  
  /**
   * Remove a program schedule
   */
  const removeSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    
    toast({
      title: 'Schedule removed',
      description: 'Program schedule has been removed'
    });
  }, [toast]);
  
  /**
   * Toggle the active state of a schedule
   */
  const toggleScheduleActive = useCallback((id: string) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id
          ? { ...schedule, active: !schedule.active }
          : schedule
      )
    );
  }, []);
  
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
  
  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleScheduleActive,
    createDefaultSchedule
  };
}