import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program, WorkoutTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ProgramSchedule() {
  const [_, params] = useRoute("/programs/:id/schedule");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDayNumbers, setSelectedDayNumbers] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  const programId = params?.id ? parseInt(params.id) : null;

  // Get program details
  const { data: program, isLoading: programLoading, error: programError } = useQuery<Program>({
    queryKey: ['/api/programs', programId],
    enabled: !!programId,
    retry: false
  });

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
  
  // Initialize program
  useEffect(() => {
    if (program && !programLoading) {
      // Make sure we have the right number of days selected
      const requiredDays = program.daysPerWeek || 0;
      
      if (selectedWeekdays.length < requiredDays) {
        // Initialize with default days (starting from Monday)
        const defaultDays: number[] = [];
        for (let i = 0; i < requiredDays; i++) {
          defaultDays.push((i + 1) % 7); // Start with Monday (1) and wrap around to Sunday (0)
        }
        setSelectedWeekdays(defaultDays);
      }
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

  // Handle weekday selection
  const handleWeekdaySelect = (dayIndex: number) => {
    // If this day is already selected and we're at the minimum required days, prevent deselection
    if (selectedWeekdays.includes(dayIndex) && selectedWeekdays.length <= (program?.daysPerWeek || 0)) {
      toast({
        title: "Cannot Remove Day",
        description: `This program requires ${program?.daysPerWeek} training days per week`,
        variant: "destructive"
      });
      return;
    }
    
    // Toggle selection
    if (selectedWeekdays.includes(dayIndex)) {
      setSelectedWeekdays(prev => prev.filter(d => d !== dayIndex));
    } else {
      // Check if we're already at the maximum days for this program
      if (program?.daysPerWeek && selectedWeekdays.length >= program.daysPerWeek) {
        toast({
          title: "Maximum Days Selected",
          description: `This program is designed for ${program.daysPerWeek} days per week`,
          variant: "destructive"
        });
        return;
      }
      setSelectedWeekdays(prev => [...prev, dayIndex]);
    }
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
        description: `This program requires ${program?.daysPerWeek} days per week. You've selected ${selectedWeekdays.length}.`,
        variant: "destructive"
      });
      return;
    }

    // Generate the program schedule
    const endDate = calculateEndDate();

    // Here we would save the program schedule to the database
    toast({
      title: "Program Scheduled",
      description: `${program?.name} has been scheduled from ${formatDate(startDate)} to ${endDate ? formatDate(endDate) : ''}`,
    });

    // Navigate back to the programs page
    navigate("/");
  };

  const isLoading = programLoading || templatesLoading;

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
                  <span>{program.weeks || 4} week program</span>
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
                          className={`h-8 flex items-center justify-center rounded-full cursor-pointer text-sm
                            ${isToday ? 'border border-primary-500' : ''}
                            ${isStartDate ? 'bg-primary-500 text-white' : 'hover:bg-gray-100'}
                          `}
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
                  This program requires <span className="font-medium">{program.daysPerWeek}</span> days per week. 
                  Select which days you plan to train:
                </p>
                
                <div className="flex justify-between mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div 
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-sm
                        ${selectedWeekdays.includes(i) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                      onClick={() => handleWeekdaySelect(i)}
                    >
                      {day.charAt(0)}
                    </div>
                  ))}
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
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{program.weeks} weeks</span>
                  </div>
                </div>
              </div>
              
              {/* Schedule Button */}
              <button 
                className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-md flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
                onClick={handleScheduleProgram}
                disabled={selectedWeekdays.length < (program?.daysPerWeek || 0)}
              >
                <span className="material-icons-round mr-2">event_available</span>
                Schedule Program
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