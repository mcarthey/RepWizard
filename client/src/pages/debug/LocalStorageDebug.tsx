import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getLocalForage, STORAGE_KEYS, clearAllData, fixWorkoutStorage } from '@/lib/localForage';
import { format } from 'date-fns';

export default function LocalStorageDebug() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentWorkout, setCurrentWorkout] = useState<any>(null);
  const [programSchedules, setProgramSchedules] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const localForage = await getLocalForage();
        
        // Load current workout
        const workout = await localForage.getItem(STORAGE_KEYS.CURRENT_WORKOUT);
        setCurrentWorkout(workout);
        
        // Load program schedules
        const schedules = await localForage.getItem(STORAGE_KEYS.PROGRAM_SCHEDULES);
        setProgramSchedules(Array.isArray(schedules) ? schedules : []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load local storage data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [refreshKey, toast]);
  
  // Clear current workout
  const handleClearWorkout = async () => {
    try {
      const localForage = await getLocalForage();
      await localForage.removeItem(STORAGE_KEYS.CURRENT_WORKOUT);
      
      toast({
        title: 'Cleared',
        description: 'Current workout has been cleared from local storage'
      });
      
      // Refresh the data
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error clearing workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear workout',
        variant: 'destructive'
      });
    }
  };
  
  // Fix workout storage issues
  const handleFixWorkoutStorage = async () => {
    try {
      setLoading(true);
      const result = await fixWorkoutStorage();
      
      toast({
        title: result.fixed ? 'Fixed' : 'No Fix Needed',
        description: result.message
      });
      
      // Refresh the data
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fixing workout storage:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix workout storage',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Clear all localStorage data
  const handleClearAll = async () => {
    try {
      await clearAllData();
      
      toast({
        title: 'Cleared',
        description: 'All local storage data has been cleared'
      });
      
      // Refresh the data
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error clearing all data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear all data',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <>
      <Header title="LocalStorage Debug" />
      
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <h1 className="text-2xl font-bold mb-4">LocalStorage Debugging</h1>
        <p className="text-gray-600 mb-6">
          Use this page to inspect and clear data stored in the browser's localStorage.
        </p>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Current Workout */}
          <Card>
            <CardHeader>
              <CardTitle>Current Workout</CardTitle>
              <CardDescription>
                The workout that is currently loaded in the app
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading...</p>
                </div>
              ) : currentWorkout ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">Name:</span> {currentWorkout.name}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {format(new Date(currentWorkout.date), 'yyyy-MM-dd HH:mm')}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">ID:</span> {currentWorkout.id}
                  </div>
                  
                  <div>
                    <span className="font-medium">Program ID:</span> {currentWorkout.programId || 'None'}
                  </div>
                  
                  <div>
                    <span className="font-medium">Template ID:</span> {currentWorkout.templateId || 'None'}
                  </div>
                  
                  <div>
                    <span className="font-medium">Exercises:</span> {currentWorkout.exercises?.length || 0}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={handleFixWorkoutStorage} variant="outline">
                      Auto-Fix Workout Issues
                    </Button>
                    <Button onClick={handleClearWorkout} variant="destructive">
                      Clear Current Workout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  <p className="mb-4">No current workout in localStorage</p>
                  <Button onClick={handleFixWorkoutStorage} variant="outline">
                    Run Storage Fix Checks
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Program Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Program Schedules</CardTitle>
              <CardDescription>
                Scheduled programs and their date ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading...</p>
                </div>
              ) : programSchedules.length > 0 ? (
                <div className="space-y-4">
                  {programSchedules.map((schedule, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">Program ID:</span> {schedule.programId}
                        </div>
                        <div>
                          <span className="font-medium">Active:</span> {schedule.active ? 'Yes' : 'No'}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="font-medium">Date Range:</span>{' '}
                        {schedule.startDate} to {schedule.endDate}
                      </div>
                      
                      <div className="mt-1">
                        <span className="font-medium">Weekdays:</span>{' '}
                        {schedule.selectedWeekdays.map((day: number) => {
                          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          return dayNames[day];
                        }).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No program schedules in localStorage
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Clear All Data */}
          <Card>
            <CardHeader>
              <CardTitle>All LocalStorage Data</CardTitle>
              <CardDescription>
                Clear all app data from the browser's localStorage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-amber-600 mb-4">
                  Warning: This will reset all local app data including workout history and program schedules.
                </p>
                <Button onClick={handleClearAll} variant="destructive">
                  Clear All LocalStorage Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}