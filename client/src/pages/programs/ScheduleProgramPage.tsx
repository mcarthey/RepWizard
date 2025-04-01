import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program, WorkoutTemplate, ProgramSchedule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useProgramSchedules } from "@/hooks/useProgramSchedules";

export default function ScheduleProgramPage() {
  const [_, params] = useRoute("/programs/:id/schedule");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDayNumbers, setSelectedDayNumbers] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  const programId = params?.id ? parseInt(params.id) : null;

  // Get all programs
  const { data: programsData, isLoading: programLoading, error: programError } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
    enabled: !!programId,
    retry: false
  });
  
  // Find the specific program by ID
  const program = programsData?.find(p => p.id === programId);

  // Get workout templates for this program
  const { data: templates = [], isLoading: templatesLoading } = useQuery<WorkoutTemplate[]>({
    queryKey: ['/api/programs', programId, 'templates'],
    enabled: !!programId,
    retry: false
  });

  // Handle back navigation
  const handleBack = () => {
    navigate(`/programs/${programId}`);
  };

  // Navigate to a different month
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // If program does not exist, go back
  useEffect(() => {
    if (!programLoading && (programError || !program)) {
      toast({
        title: "Error",
        description: "Program not found",
        variant: "destructive"
      });
      navigate("/programs");
    }
  }, [programLoading, programError, program, navigate, toast]);

  // Generate calendar days
  const calendarDays = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Get the month name
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Initialize program once only
  useEffect(() => {
    if (program && !programLoading && selectedWeekdays.length === 0) {
      // Initialize with default days (starting from Monday) only if we haven't selected any days yet
      const requiredDays = program.daysPerWeek || 0;
      const defaultDays: number[] = [];
      
      for (let i = 0; i < requiredDays; i++) {
        defaultDays.push((i + 1) % 7); // Start with Monday (1) and wrap around to Sunday (0)
      }
      
      console.log('Initializing with default days:', defaultDays);
      setSelectedWeekdays(defaultDays);
    }
  }, [program, programLoading, selectedWeekdays.length]);

  // Toggle date picker visibility
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // Handle start date selection
  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setStartDate(newDate);
    setShowDatePicker(false);
  };

  // Handle weekday selection - completely simplified approach
  const handleWeekdaySelect = (dayIndex: number) => {
    const daysPerWeek = program?.daysPerWeek || 0;
    
    // Create a copy of the current selection
    let newSelection = [...selectedWeekdays];
    
    // Check if this day is already selected
    const dayPosition = newSelection.indexOf(dayIndex);
    
    if (dayPosition !== -1) {
      // Day is already selected, so remove it
      newSelection.splice(dayPosition, 1);
      console.log(`Removed day ${dayIndex}, new selection:`, newSelection);
    } else {
      // Day is not selected, try to add it
      if (newSelection.length >= daysPerWeek) {
        // If we're already at max days, show a message
        toast({
          title: "Maximum Days Selected",
          description: `This program requires exactly ${daysPerWeek} ${daysPerWeek === 1 ? 'day' : 'days'} per week. Deselect a day before selecting a new one.`
        });
        return;
      }
      
      // Add the day and sort
      newSelection.push(dayIndex);
      newSelection.sort((a, b) => a - b);
      console.log(`Added day ${dayIndex}, new selection:`, newSelection);
    }
    
    // Update the state with our new selection
    setSelectedWeekdays(newSelection);
  };

  // Generate calendar date for a specific day
  const getCalendarDate = (dayNumber: number) => {
    if (!dayNumber) return null;
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
  };

  // Calculate end date for display
  const calculateEndDate = () => {
    if (!program?.weeks) return null;
    
    const endDate = new Date(startDate);
    // Program length in weeks * 7 days - 1 day (to show the last day of the program)
    endDate.setDate(endDate.getDate() + (program.weeks * 7) - 1);
    return endDate;
  };

  // Get the addProgramSchedule function from our hook
  const { addProgramSchedule } = useProgramSchedules();
  
  // Schedule the program
  const handleScheduleProgram = () => {
    if (selectedWeekdays.length === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select which days of the week you want to train",
        variant: "destructive"
      });
      return;
    }

    if (selectedWeekdays.length < (program?.daysPerWeek || 0)) {
      toast({
        title: "Not Enough Days Selected",
        description: `This program requires ${program?.daysPerWeek} ${program?.daysPerWeek === 1 ? 'day' : 'days'} per week. You've selected ${selectedWeekdays.length}.`,
        variant: "destructive"
      });
      return;
    }

    if (!program) {
      toast({
        title: "Program Error",
        description: "Could not find program details",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate the program schedule
      const endDate = calculateEndDate();
      
      if (!endDate) {
        toast({
          title: "Date Error",
          description: "Could not calculate program end date",
          variant: "destructive"
        });
        return;
      }
      
      // Create the program schedule object
      const programSchedule: ProgramSchedule = {
        id: crypto.randomUUID(), // Generate a unique ID
        programId: program.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        selectedWeekdays: selectedWeekdays,
        active: true
      };
      
      // Add the schedule using our hook function
      addProgramSchedule(programSchedule);
      console.log("Program schedule saved:", programSchedule);
      
      toast({
        title: "Program Scheduled",
        description: `${program.name} has been scheduled from ${formatDate(startDate)} to ${formatDate(endDate)}`,
      });

      // Navigate to the workout tab to show the scheduled workout
      navigate("/");
    } catch (error) {
      console.error("Error scheduling program:", error);
      toast({
        title: "Schedule Error",
        description: "There was an error scheduling the program",
        variant: "destructive"
      });
    }
  };

  const isLoading = programLoading || templatesLoading;
  
  // Debug log to see program data
  useEffect(() => {
    if (programsData) {
      console.log('All programs:', programsData);
      console.log('Selected program:', program);
      console.log('Program ID:', programId);
    }
  }, [programsData, program, programId]);

  return (
    <>
      <Header 
        title={`Schedule ${program?.name || "Program"}`} 
        showBackButton 
        onBackClick={handleBack} 
      />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : program ? (
            <div className="space-y-6">
              {/* Program Header */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-lg font-semibold mb-1">{program.name}</h2>
                {program.description && (
                  <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <span className="material-icons-round text-gray-400 text-sm mr-1">calendar_today</span>
                  <span>{program.weeks || 4}-week program</span>
                </div>
              </div>
              
              {/* Start Date Selection */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-base font-semibold mb-3">Program Start Date</h3>
                <div className="p-3 border border-gray-200 rounded-lg flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="material-icons-round text-gray-500 mr-2">today</span>
                    <span>{formatDate(startDate)}</span>
                  </div>
                </div>
                
                {/* Inline calendar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-full"
                      onClick={() => handleMonthChange('prev')}
                    >
                      <span className="material-icons-round">chevron_left</span>
                    </button>
                    <h3 className="text-sm font-medium">
                      {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                    </h3>
                    <button 
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-full"
                      onClick={() => handleMonthChange('next')}
                    >
                      <span className="material-icons-round">chevron_right</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-xs font-medium text-gray-500">{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays().map((day, i) => {
                      if (day === null) {
                        return <div key={`empty-${i}`} className="h-8"></div>;
                      }
                      
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day as number);
                      const today = new Date();
                      const isToday = today.getDate() === day && 
                                    today.getMonth() === currentMonth.getMonth() && 
                                    today.getFullYear() === currentMonth.getFullYear();
                      
                      const isStartDate = startDate.getDate() === day &&
                                      startDate.getMonth() === currentMonth.getMonth() &&
                                      startDate.getFullYear() === currentMonth.getFullYear();
                      
                      return (
                        <div 
                          key={`day-${day}`}
                          className={`h-8 flex items-center justify-center rounded-full cursor-pointer text-sm ${
                            isStartDate 
                              ? 'bg-blue-600 text-white' 
                              : isToday 
                                ? 'border border-blue-500' 
                                : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleDateSelect(day as number)}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Days of the week selection */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-base font-semibold mb-3">Select Training Days</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This program requires <span className="font-medium">{program.daysPerWeek} {program.daysPerWeek === 1 ? 'day' : 'days'}</span> per week. 
                  Select which days you plan to train:
                </p>
                
                <div className="flex justify-between mb-4">
                  {/* Enforce max days per week based on program configuration */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                    const isSelected = selectedWeekdays.includes(i);
                    // Disable if not selected AND already have max days selected
                    const daysPerWeek = program?.daysPerWeek || 0;
                    const isDisabled = !isSelected && selectedWeekdays.length >= daysPerWeek;
                    
                    return (
                      <div 
                        key={i}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                          isSelected 
                            ? 'bg-blue-600 text-white cursor-pointer' 
                            : isDisabled
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                        }`}
                        onClick={() => {
                          // Always allow clicking if it's already selected (to deselect)
                          // Only check disabled state for days that aren't selected
                          handleWeekdaySelect(i);
                        }}
                      >
                        {day.charAt(0)}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Program Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-base font-semibold mb-2">Program Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(startDate)}</span>
                  </div>
                  {calculateEndDate() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{formatDate(calculateEndDate()!)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Training Days:</span>
                    <span className="font-medium">
                      {selectedWeekdays.length > 0 
                        ? selectedWeekdays.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')
                        : "None selected"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Program Length:</span>
                    <span className="font-medium">{program.weeks}-week program</span>
                  </div>
                </div>
              </div>
              
              {/* Schedule Button */}
              <button 
                className={`w-full py-3 rounded-lg shadow-md flex items-center justify-center font-medium transition-colors ${
                  selectedWeekdays.length < (program?.daysPerWeek || 0)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
                onClick={handleScheduleProgram}
                disabled={selectedWeekdays.length < (program?.daysPerWeek || 0)}
              >
                <span className="material-icons-round mr-2">event_available</span>
                Save Schedule & Start Program
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Program not found</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => navigate("/programs")}
              >
                Go Back to Programs
              </button>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}