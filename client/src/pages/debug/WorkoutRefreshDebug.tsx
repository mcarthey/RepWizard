import { useEffect, useState, useRef } from "react";
import { useCurrentWorkout } from "@/hooks/useStorage";
import { useScheduleChecks } from "@/hooks/useScheduleChecks";
import { format } from "date-fns";

// Component to debug workout refresh issues
export default function WorkoutRefreshDebug() {
  const {
    workout,
    loading,
    createWorkout,
    updateWorkout,
  } = useCurrentWorkout();
  
  const { getSchedulesForDate } = useScheduleChecks();
  
  // Render counter to track component renders
  const renderCount = useRef(0);
  
  // State to track mount/unmount cycles
  const [mountCount, setMountCount] = useState(0);
  
  // State to track dependency changes
  const [dependencyChanges, setDependencyChanges] = useState<Record<string, number>>({
    workout: 0,
    loading: 0,
    createWorkout: 0,
    updateWorkout: 0,
    getSchedulesForDate: 0
  });
  
  // Track renders
  useEffect(() => {
    renderCount.current += 1;
    console.log(`[WorkoutRefreshDebug] Render count: ${renderCount.current}`);
  });
  
  // Track mount/unmount
  useEffect(() => {
    setMountCount(prev => prev + 1);
    console.log(`[WorkoutRefreshDebug] Mount count: ${mountCount + 1}`);
    
    // Log storage state on mount
    const logStorageState = async () => {
      try {
        const localForage = (await import('@/lib/localForage')).getLocalForage();
        const storageKeys = (await import('@/lib/localForage')).STORAGE_KEYS;
        const currentWorkout = await (await localForage).getItem(storageKeys.CURRENT_WORKOUT);
        console.log('[WorkoutRefreshDebug] Current workout in storage:', currentWorkout);
      } catch (error) {
        console.error('[WorkoutRefreshDebug] Error reading from storage:', error);
      }
    };
    
    logStorageState();
    
    return () => {
      console.log('[WorkoutRefreshDebug] Component unmounted');
    };
  }, []);
  
  // Track dependency changes
  useEffect(() => {
    setDependencyChanges(prev => ({...prev, workout: prev.workout + 1}));
    console.log('[WorkoutRefreshDebug] workout dependency changed');
  }, [workout]);
  
  useEffect(() => {
    setDependencyChanges(prev => ({...prev, loading: prev.loading + 1}));
    console.log('[WorkoutRefreshDebug] loading dependency changed');
  }, [loading]);
  
  useEffect(() => {
    setDependencyChanges(prev => ({...prev, createWorkout: prev.createWorkout + 1}));
    console.log('[WorkoutRefreshDebug] createWorkout dependency changed, ref:', createWorkout.toString());
  }, [createWorkout]);
  
  useEffect(() => {
    setDependencyChanges(prev => ({...prev, updateWorkout: prev.updateWorkout + 1}));
    console.log('[WorkoutRefreshDebug] updateWorkout dependency changed, ref:', updateWorkout.toString());
  }, [updateWorkout]);
  
  useEffect(() => {
    setDependencyChanges(prev => ({...prev, getSchedulesForDate: prev.getSchedulesForDate + 1}));
    console.log('[WorkoutRefreshDebug] getSchedulesForDate dependency changed, ref:', getSchedulesForDate.toString());
  }, [getSchedulesForDate]);
  
  // Test calendar date change
  const testDateChange = () => {
    if (!workout) return;
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`[WorkoutRefreshDebug] Testing date change to: ${format(tomorrow, 'yyyy-MM-dd')}`);
    console.log(`[WorkoutRefreshDebug] Current workout date: ${format(new Date(workout.date), 'yyyy-MM-dd')}`);
    
    // Check schedules for tomorrow
    const tomorrowSchedules = getSchedulesForDate(tomorrow);
    console.log(`[WorkoutRefreshDebug] Schedules for tomorrow:`, tomorrowSchedules);
    
    // Update workout date
    const updatedWorkout = {
      ...workout,
      date: tomorrow.toISOString()
    };
    
    updateWorkout(updatedWorkout);
    console.log(`[WorkoutRefreshDebug] Updated workout with new date`);
  };
  
  // Test workout creation
  const testWorkoutCreation = () => {
    const newWorkout = {
      id: `test-${Date.now()}`,
      date: new Date().toISOString(),
      name: "Test Workout",
      notes: null,
      programId: null,
      templateId: null,
      completed: false,
      exercises: []
    };
    
    createWorkout(newWorkout);
    console.log(`[WorkoutRefreshDebug] Created new test workout`);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Workout Refresh Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Component Stats</h2>
        <p>Total renders: {renderCount.current}</p>
        <p>Mount count: {mountCount}</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Dependency Changes</h2>
        <ul>
          {Object.entries(dependencyChanges).map(([key, count]) => (
            <li key={key}>{key}: {count}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Current Workout</h2>
        {loading ? (
          <p>Loading...</p>
        ) : workout ? (
          <div>
            <p>ID: {workout.id}</p>
            <p>Date: {format(new Date(workout.date), "yyyy-MM-dd")}</p>
            <p>Name: {workout.name}</p>
            <p>Program ID: {workout.programId || "None"}</p>
            <p>Exercise count: {workout.exercises.length}</p>
          </div>
        ) : (
          <p>No workout found</p>
        )}
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={testDateChange}
        >
          Test Date Change
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={testWorkoutCreation}
        >
          Test New Workout
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Debug Info</h2>
        <p>Open console to view detailed debug information.</p>
      </div>
    </div>
  );
}