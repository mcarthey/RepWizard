import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useProgramSchedules } from '@/hooks/useProgramSchedules';
import { useScheduleChecks } from '@/hooks/useScheduleChecks';
import { format, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocalProgramSchedule } from '@/lib/workout';

export default function ScheduleManager() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { 
    schedules, 
    addSchedule, 
    removeSchedule, 
    toggleScheduleActive,
    refreshSchedules 
  } = useProgramSchedules();
  const { 
    getSchedulesForDate, 
    getNextWorkoutDate,
    refreshSchedules: refreshScheduleChecks 
  } = useScheduleChecks();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedulesForDate, setSchedulesForDate] = useState<LocalProgramSchedule[]>([]);
  const [storageKey, setStorageKey] = useState('repwizard_program_schedules');
  const [localStorageData, setLocalStorageData] = useState('');
  const [programId, setProgramId] = useState('1');
  const [nextWorkoutDate, setNextWorkoutDate] = useState<Date | null>(null);

  // Update displayed schedules when selected date changes
  useEffect(() => {
    const schedules = getSchedulesForDate(selectedDate);
    setSchedulesForDate(schedules);
    
    // Also check for next workout date
    const next = getNextWorkoutDate(new Date());
    setNextWorkoutDate(next);
    
    // Get current raw data from localStorage
    try {
      const data = localStorage.getItem(storageKey);
      setLocalStorageData(data || 'No data found');
    } catch (error) {
      setLocalStorageData(`Error reading from localStorage: ${error}`);
    }
  }, [selectedDate, getSchedulesForDate, getNextWorkoutDate, storageKey]);

  // Create a test schedule for today and the following 30 days
  const createTestSchedule = () => {
    const today = new Date();
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, 30), 'yyyy-MM-dd');
    
    // Schedule for Monday, Wednesday, Friday (0 = Sunday, 1 = Monday, etc.)
    const selectedWeekdays = [1, 3, 5];
    
    const newSchedule = {
      id: uuidv4(),
      programId: parseInt(programId),
      startDate,
      endDate,
      selectedWeekdays,
      active: true
    };
    
    addSchedule(newSchedule);
    toast({
      title: 'Test Schedule Created',
      description: `Created a schedule for Program ID ${programId} on Mon/Wed/Fri for the next 30 days`
    });
    
    // Refresh the view
    refreshData();
  };

  // Refresh all data
  const refreshData = () => {
    refreshSchedules();
    refreshScheduleChecks();
    
    const schedules = getSchedulesForDate(selectedDate);
    setSchedulesForDate(schedules);
    
    // Get current raw data from localStorage
    try {
      const data = localStorage.getItem(storageKey);
      setLocalStorageData(data || 'No data found');
    } catch (error) {
      setLocalStorageData(`Error reading from localStorage: ${error}`);
    }
    
    toast({
      title: 'Data Refreshed',
      description: 'Schedule data has been refreshed from localStorage'
    });
  };

  // Reset all schedule data
  const resetAllData = () => {
    if (confirm("WARNING: This will remove ALL schedule data. Are you sure?")) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem('programSchedules'); // Also remove old key for safety
      refreshData();
      toast({
        title: 'All Data Reset',
        description: 'All schedule data has been removed'
      });
    }
  };

  return (
    <>
      <Header 
        title="Schedule Manager" 
        showBackButton 
        onBackClick={() => setLocation('/debug/schedules')} 
      />
      
      <main className="container px-4 py-4 max-w-lg mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Schedule Manager</h1>
          <p className="text-sm text-gray-600 mb-4">
            This tool lets you test program scheduling functionality.
          </p>
          
          <div className="space-y-4">
            {/* Create test schedule */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Create Test Schedule</h2>
              <div className="flex gap-2 mb-2">
                <Input 
                  type="number" 
                  value={programId} 
                  onChange={(e) => setProgramId(e.target.value)}
                  placeholder="Program ID"
                  className="w-24"
                />
                <Button onClick={createTestSchedule}>
                  Create Schedule
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Creates a schedule for Mon/Wed/Fri starting today for 30 days
              </p>
            </div>
            
            {/* Date selection */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Check Date</h2>
              <div className="flex gap-2 mb-2">
                <Input 
                  type="date" 
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
              <p className="text-sm font-medium mt-2">
                Schedules for {format(selectedDate, 'MMMM d, yyyy')}:
              </p>
              {schedulesForDate.length > 0 ? (
                <ul className="list-disc list-inside text-sm mt-1">
                  {schedulesForDate.map(schedule => (
                    <li key={schedule.id} className="flex items-center gap-2">
                      <span>Program ID: {schedule.programId}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleScheduleActive(schedule.id)}
                        className={schedule.active ? "text-green-600" : "text-red-600"}
                      >
                        {schedule.active ? "Active" : "Inactive"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeSchedule(schedule.id)}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-1">No schedules for this date</p>
              )}
              
              {nextWorkoutDate && (
                <div className="mt-2">
                  <p className="text-sm font-medium">
                    Next workout: {format(nextWorkoutDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
            
            {/* Storage management */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Storage Management</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={storageKey}
                    onChange={(e) => setStorageKey(e.target.value)}
                    placeholder="Storage Key"
                  />
                  <Button onClick={refreshData}>
                    Refresh
                  </Button>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={resetAllData}
                  className="w-full"
                >
                  Reset ALL Data
                </Button>
              </div>
            </div>
            
            {/* Raw storage data */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current Storage Data</h2>
              <div className="text-xs overflow-x-auto bg-gray-100 p-2 rounded">
                <pre>{localStorageData}</pre>
              </div>
            </div>
            
            {/* All schedules */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">All Schedules ({schedules.length})</h2>
              {schedules.length > 0 ? (
                <ul className="list-disc list-inside text-sm mt-1">
                  {schedules.map(schedule => (
                    <li key={schedule.id} className="mb-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Program ID: {schedule.programId}</span>
                        <span className={schedule.active ? "text-green-600" : "text-red-600"}>
                          {schedule.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>ID: {schedule.id}</p>
                        <p>Date Range: {schedule.startDate} to {schedule.endDate}</p>
                        <p>Days: {schedule.selectedWeekdays.join(', ')} (0=Sun, 1=Mon, etc.)</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-1">No schedules found</p>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}