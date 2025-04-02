import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { useQuery } from '@tanstack/react-query';
import { useCurrentWorkout } from '@/hooks/useCurrentWorkout';
import { useScheduleChecks } from '@/hooks/useScheduleChecks';
import { Program, LocalProgramSchedule, WorkoutTemplate } from '@shared/schema';
import { Button } from '@/components/ui/button';

export default function WorkoutDebug() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [renderTimestamp, setRenderTimestamp] = useState(Date.now());
  const [schedulesForDate, setSchedulesForDate] = useState<LocalProgramSchedule[]>([]);
  const [storageData, setStorageData] = useState<any>({});
  const [localStorageData, setLocalStorageData] = useState<any>({});
  
  // Get current data
  const { getSchedulesForDate } = useScheduleChecks();
  const { workout, loading: workoutLoading } = useCurrentWorkout();
  
  // Fetch available programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });
  
  // Fetch workout templates for the current program
  const { data: templates = [] } = useQuery<WorkoutTemplate[]>({
    queryKey: ['/api/programs', workout?.programId, 'templates'],
    enabled: !!workout?.programId,
  });

  // Refresh component data
  const refreshData = () => {
    setRefreshCount(prev => prev + 1);
    setRenderTimestamp(Date.now());
    const schedules = getSchedulesForDate(selectedDate);
    setSchedulesForDate(schedules);
    
    // Get localStorage data for debugging
    const programSchedules = localStorage.getItem('repwizard_program_schedules');
    const currentWorkout = localStorage.getItem('currentWorkout');
    const workoutHistory = localStorage.getItem('workoutHistory');
    
    setLocalStorageData({
      programSchedules: programSchedules ? JSON.parse(programSchedules) : null,
      currentWorkout: currentWorkout ? JSON.parse(currentWorkout) : null,
      workoutHistory: workoutHistory ? JSON.parse(workoutHistory) : null
    });
  };

  // Initial data load
  useEffect(() => {
    refreshData();
    
    // Debug mounting/unmounting behavior
    console.log('[WorkoutDebug] Component mounted');
    
    return () => {
      console.log('[WorkoutDebug] Component unmounted');
    };
  }, []);
  
  // Update on date change
  useEffect(() => {
    const schedules = getSchedulesForDate(selectedDate);
    setSchedulesForDate(schedules);
  }, [selectedDate, getSchedulesForDate]);
  
  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };
  
  return (
    <>
      <Header title="Workout Debug" />
      <div className="container pb-20 mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Debug Info</h2>
          <p className="text-sm text-gray-600 mb-1">Refresh Count: {refreshCount}</p>
          <p className="text-sm text-gray-600 mb-1">Rendered at: {new Date(renderTimestamp).toLocaleTimeString()}</p>
          <p className="text-sm text-gray-600 mb-3">Component ID: {Math.random().toString(36).substring(7)}</p>
          
          <div className="flex gap-2 mb-4">
            <Button onClick={refreshData} className="text-sm">
              Refresh Data
            </Button>
            <Button onClick={() => localStorage.clear()} variant="destructive" className="text-sm">
              Clear localStorage
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Date Selection</h2>
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="w-full border rounded p-2 mb-2"
          />
          <p className="text-sm font-semibold mt-2">Selected Date: {format(selectedDate, 'MMMM d, yyyy')}</p>
          <p className="text-sm text-gray-600">Day of Week: {format(selectedDate, 'EEEE')}</p>
          <p className="text-sm text-gray-600">ISO Day of Week: {selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Scheduled Programs for Selected Date</h2>
          {schedulesForDate.length === 0 ? (
            <p className="text-sm text-gray-500">No schedules found for this date</p>
          ) : (
            <div className="space-y-2">
              {schedulesForDate.map((schedule, idx) => {
                const program = programs.find(p => p.id === schedule.programId);
                return (
                  <div key={idx} className="border-l-4 border-blue-500 pl-2 py-1">
                    <p className="font-medium">{program?.name || 'Unknown Program'}</p>
                    <p className="text-xs text-gray-600">
                      ID: {schedule.id}, Program ID: {schedule.programId}
                    </p>
                    <p className="text-xs text-gray-600">
                      Range: {String(schedule.startDate)} to {String(schedule.endDate)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Days: {schedule.selectedWeekdays?.map(d => 
                        d === 1 ? 'Mon' : 
                        d === 2 ? 'Tue' : 
                        d === 3 ? 'Wed' : 
                        d === 4 ? 'Thu' : 
                        d === 5 ? 'Fri' : 
                        d === 6 ? 'Sat' : 'Sun'
                      ).join(', ') || 'None'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Current Workout</h2>
          {workoutLoading ? (
            <p className="text-sm text-gray-500">Loading workout data...</p>
          ) : !workout ? (
            <p className="text-sm text-gray-500">No workout data found</p>
          ) : (
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">ID:</span> {workout.id}</p>
              <p><span className="font-semibold">Name:</span> {workout.name}</p>
              <p><span className="font-semibold">Date:</span> {format(new Date(workout.date), 'yyyy-MM-dd')}</p>
              <p><span className="font-semibold">Program ID:</span> {workout.programId || 'None'}</p>
              <p><span className="font-semibold">Template ID:</span> {workout.templateId || 'None'}</p>
              <p><span className="font-semibold">Exercise Count:</span> {workout.exercises?.length || 0}</p>
              <p><span className="font-semibold">Completed:</span> {workout.completed ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">localStorage Data</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Program Schedules</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(localStorageData.programSchedules, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Current Workout</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(localStorageData.currentWorkout, null, 2)}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">API Data</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Available Programs ({programs.length})</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(programs, null, 2)}
              </pre>
            </div>
            {workout?.programId && (
              <div>
                <h3 className="font-semibold mb-1">Templates for Program {workout.programId} ({templates.length})</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(templates, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}