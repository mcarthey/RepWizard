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
  
  // Function to determine if this is the manually selected date with enhanced protection
  const isManuallySelectedDate = (date: Date) => {
    // Check all possible storage mechanisms for manually selected date
    const sessionDate = sessionStorage.getItem('manually_selected_date');
    const localDate = localStorage.getItem('repwizard_last_viewed_workout_date');
    
    // Format the date parameter for comparison
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Debug info to help troubleshoot date selection
    console.log(`[DATE PROTECTION] Checking if ${dateStr} is manually selected. Session: ${sessionDate}, Local: ${localDate}`);
    
    // Check if the date matches either the session storage or local storage value
    return dateStr === sessionDate || dateStr === localDate;
  };
  
  // Handle date selection with proper confirmation
  const handleDateSelection = (date: Date | undefined) => {
    if (!date) return;
    
    // Format the date for display
    const formattedDate = format(date, "MMMM d, yyyy");
    console.log(`[CALENDAR TRACKING] Date selected in calendar: ${formattedDate}`);
    console.log(`[CALENDAR TRACKING] Raw date object timestamp: ${date.getTime()}`);
    
    // Check if there are schedules for this date
    const schedules = getSchedulesForDate(date);
    const hasSchedules = schedules.length > 0;
    
    // Create a fresh copy of the date to avoid reference issues
    // This is critical to prevent issues with date tracking
    const dateCopy = new Date(date.getTime());
    console.log(`[CALENDAR TRACKING] Date copy created with timestamp: ${dateCopy.getTime()}`);
    console.log(`[CALENDAR TRACKING] Date copy formatted: ${format(dateCopy, "yyyy-MM-dd")}`);
    
    // Mark this date as manually selected by the user
    const dateStr = format(dateCopy, 'yyyy-MM-dd');
    console.log(`[DATE PROTECTION] Storing manually selected date in WorkoutCalendarModal: ${dateStr}`);
    sessionStorage.setItem('manually_selected_date', dateStr);
    sessionStorage.setItem('manually_selected_date_timestamp', dateCopy.getTime().toString());
    localStorage.setItem('repwizard_last_viewed_workout_date', dateStr);
    
    // Call the provided onDateSelect with the copied date
    // Importantly, we pass true as the second parameter to indicate this is a manual selection
    // The CurrentWorkout component should read this flag and handle it appropriately
    console.log(`[CALENDAR TRACKING] About to call onDateSelect with date: ${format(dateCopy, "yyyy-MM-dd")}`);
    
    // We need to modify the parent component to accept this second parameter
    // But for now we just set the sessionStorage directly
    onDateSelect(dateCopy);
    
    // Close the modal after selection
    console.log(`[CALENDAR TRACKING] Closing calendar modal after selection`);
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
              manuallySelected: (date) => isManuallySelectedDate(date),
            }}
            modifiersClassNames={{
              booked: "bg-blue-100 font-bold text-blue-600 hover:bg-blue-200",
              manuallySelected: "bg-green-100 font-bold text-green-600 hover:bg-green-200 border-2 border-green-500",
            }}
            today={new Date()}
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Dates with scheduled workouts are highlighted in blue</p>
          <p>Manually selected dates are highlighted in green</p>
          <p className="mt-2 font-medium">Current workout date: {format(currentDate, "MMMM d, yyyy")}</p>
          {isManuallySelectedDate(currentDate) && (
            <p className="text-green-600 text-xs mt-1">This date was manually selected</p>
          )}
        </div>
      </div>
    </div>
  );
}