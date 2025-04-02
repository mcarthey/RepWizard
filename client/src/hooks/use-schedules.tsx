import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { isWithinInterval, isSameDay, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Schedule type
export interface ProgramSchedule {
  id: number;
  createdAt: Date;
  userId: number | null;
  programId: number | null;
  startDate: Date;
  endDate: Date;
  selectedWeekdays: number[] | null;
  active: boolean | null;
}

// Context interface
interface SchedulesContextType {
  // Data
  schedules: ProgramSchedule[];
  loading: boolean;
  error: Error | null;
  
  // Actions
  getSchedulesForDate: (date: Date) => ProgramSchedule[];
  addSchedule: (schedule: Omit<ProgramSchedule, 'id' | 'createdAt'>) => Promise<ProgramSchedule>;
  updateSchedule: (id: number, updates: Partial<ProgramSchedule>) => Promise<ProgramSchedule>;
  deleteSchedule: (id: number) => Promise<void>;
  clearSchedules: () => boolean;
}

// Create the context
const SchedulesContext = createContext<SchedulesContextType | null>(null);

// Provider component
export const SchedulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Query for loading schedules
  const { 
    data: schedules = [], 
    isLoading: loading, 
    error
  } = useQuery<ProgramSchedule[], Error>({
    queryKey: ['/api/program-schedules'],
    enabled: !!user,
    retry: false
  });
  
  // Get schedules active for a specific date
  const getSchedulesForDate = (date: Date): ProgramSchedule[] => {
    if (!schedules || schedules.length === 0) return [];
    
    // Use date-fns to check if the date is within the schedule range
    // and if the day of week matches the selectedWeekdays (if defined)
    return schedules.filter(schedule => {
      // Check if schedule is active
      if (!schedule.active) return false;
      
      // Parse dates if they're strings
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      
      // Check if date is within the schedule range
      const withinRange = isWithinInterval(date, { start, end }) || 
                          isSameDay(date, start) || 
                          isSameDay(date, end);
      
      if (!withinRange) return false;
      
      // If selectedWeekdays is defined, check if the day matches
      if (schedule.selectedWeekdays && schedule.selectedWeekdays.length > 0) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        return schedule.selectedWeekdays.includes(dayOfWeek);
      }
      
      return true;
    });
  };
  
  // Add schedule mutation
  const addScheduleMutation = useMutation({
    mutationFn: async (newSchedule: Omit<ProgramSchedule, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/program-schedules', newSchedule);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/program-schedules'] });
      toast({
        title: 'Schedule added',
        description: 'Program schedule has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add schedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<ProgramSchedule> }) => {
      const res = await apiRequest('PATCH', `/api/program-schedules/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/program-schedules'] });
      toast({
        title: 'Schedule updated',
        description: 'Program schedule has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update schedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/program-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/program-schedules'] });
      toast({
        title: 'Schedule deleted',
        description: 'Program schedule has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete schedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Add a new schedule
  const addSchedule = async (schedule: Omit<ProgramSchedule, 'id' | 'createdAt'>): Promise<ProgramSchedule> => {
    return await addScheduleMutation.mutateAsync(schedule);
  };
  
  // Update an existing schedule
  const updateSchedule = async (id: number, updates: Partial<ProgramSchedule>): Promise<ProgramSchedule> => {
    return await updateScheduleMutation.mutateAsync({ id, updates });
  };
  
  // Delete a schedule
  const deleteSchedule = async (id: number): Promise<void> => {
    await deleteScheduleMutation.mutateAsync(id);
  };
  
  // Clear all schedules (for development/testing)
  const clearSchedules = (): boolean => {
    try {
      // This is just a client-side action for now
      // In production, you'd want a server endpoint
      localStorage.removeItem('program_schedules');
      queryClient.invalidateQueries({ queryKey: ['/api/program-schedules'] });
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Create the context value
  const value: SchedulesContextType = {
    schedules,
    loading,
    error,
    getSchedulesForDate,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    clearSchedules
  };
  
  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
};

// Hook for consuming the context
export const useSchedules = () => {
  const context = useContext(SchedulesContext);
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
};