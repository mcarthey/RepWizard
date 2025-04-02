import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useScheduleChecks } from "@/hooks/useScheduleChecks";

interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate: Date;
}

export default function WorkoutCalendarModal({
  isVisible,
  onClose,
  onDateSelect,
  currentDate
}: CalendarModalProps) {
  const { getSchedulesForDate } = useScheduleChecks();
  
  // Function to determine if there are workouts scheduled for a given date
  const hasScheduledWorkout = (date: Date) => {
    const schedules = getSchedulesForDate(date);
    return schedules.length > 0;
  };
  
  // Handle date selection with proper confirmation
  const handleDateSelection = (date: Date | undefined) => {
    if (!date) return;
    
    // Format the date for display
    const formattedDate = format(date, "MMMM d, yyyy");
    
    // Check if there are schedules for this date
    const schedules = getSchedulesForDate(date);
    const hasSchedules = schedules.length > 0;
    
    // Call the provided onDateSelect with the selected date
    onDateSelect(date);
    
    // Close the modal after selection
    onClose();
  };
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-20">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Select Date</h2>
          <button 
            className="p-1" 
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleDateSelection}
            className="rounded-md border"
            modifiers={{
              booked: (date) => hasScheduledWorkout(date),
            }}
            modifiersClassNames={{
              booked: "bg-blue-100 font-bold text-blue-600 hover:bg-blue-200",
            }}
            today={new Date()}
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Dates with scheduled workouts are highlighted in blue</p>
          <p className="mt-2">Current workout date: {format(currentDate, "MMMM d, yyyy")}</p>
        </div>
      </div>
    </div>
  );
}