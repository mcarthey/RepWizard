import { useState } from "react";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { useProgramSchedules } from "@/hooks/useProgramSchedules";
import { useToast } from "@/hooks/use-toast";

export default function InspectSchedules() {
  const { schedules, removeSchedule } = useProgramSchedules();
  const [selectedDate] = useState(new Date());
  const { toast } = useToast();

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format day of week - return day name for a number
  const formatDay = (day: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
  };

  // Handle deleting a schedule
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      removeSchedule(id);
      toast({
        title: "Schedule Deleted",
        description: "The program schedule has been removed",
      });
    }
  };

  // Handle clearing all schedules
  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete ALL schedules? This cannot be undone.")) {
      // Clear all schedules by removing each one
      schedules.forEach(schedule => removeSchedule(schedule.id));
      toast({
        title: "All Schedules Cleared",
        description: "All program schedules have been removed",
      });
    }
  };

  return (
    <>
      <Header title="Debug Schedules" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Program Schedules</h2>
            
            {schedules.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">No schedules found</p>
            ) : (
              <>
                <div className="mb-3 text-sm text-gray-600">
                  Found {schedules.length} schedule(s) in localStorage
                </div>
                
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">Program ID: {schedule.programId}</div>
                          <div className="text-sm">Schedule ID: {schedule.id}</div>
                        </div>
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(schedule.id)}
                          aria-label="Delete schedule"
                        >
                          <span className="material-icons-round text-lg">delete</span>
                        </button>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600 inline-block w-24">Date Range:</span>
                          <span>{formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 inline-block w-24">Days:</span>
                          <span>
                            {schedule.selectedWeekdays.length > 0 
                              ? schedule.selectedWeekdays.map(day => formatDay(day).substring(0, 3)).join(', ')
                              : "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 inline-block w-24">Status:</span>
                          <span className={schedule.active ? "text-green-600" : "text-red-600"}>
                            {schedule.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <button 
                    className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    onClick={handleClearAll}
                  >
                    Clear All Schedules
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Schedules Data (From State)</h2>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(schedules, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Raw LocalStorage Data</h2>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {localStorage.getItem('repwizard_program_schedules') || 'No data found'}
            </pre>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h2 className="text-lg font-semibold mb-2">Data Cleanup</h2>
            <div className="space-y-3">
              <p className="text-sm">These actions help clean up POC data. The exercises data will remain intact.</p>
              <button 
                className="w-full py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                onClick={() => {
                  if (confirm("Are you sure you want to clean old data? This will remove obsolete storage keys.")) {
                    localStorage.removeItem('programSchedules');
                    localStorage.removeItem('workouts');
                    localStorage.removeItem('currentWorkout');
                    toast({
                      title: "Old Data Cleaned",
                      description: "Obsolete data has been removed from localStorage",
                    });
                  }
                }}
              >
                Clean Old Data
              </button>
              <button 
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => {
                  if (confirm("Refresh the data from storage?")) {
                    window.location.reload();
                  }
                }}
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}