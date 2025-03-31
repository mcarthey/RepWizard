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
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
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

  // Schedule the program
  const handleScheduleProgram = () => {
    if (selectedDays.length === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select at least one day to schedule your program",
        variant: "destructive"
      });
      return;
    }

    // Here we would save the program schedule to the database
    toast({
      title: "Program Scheduled",
      description: `${program?.name} has been scheduled successfully`,
    });

    // Navigate back to the programs page
    navigate("/programs");
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
              
              {/* Workout Templates List */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="text-base font-semibold mb-3">Workout Templates</h3>
                {templates.length > 0 ? (
                  <div className="space-y-2">
                    {templates.map(template => (
                      <div 
                        key={template.id}
                        className="flex items-center p-2 border border-gray-200 rounded-lg"
                      >
                        <div className="h-7 w-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-2">
                          <span className="material-icons-round text-xs">fitness_center</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-gray-500">
                            Day {template.day}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    <p>No workout templates created yet</p>
                    <button 
                      className="mt-2 text-blue-600 hover:underline text-sm"
                      onClick={() => navigate(`/programs/${programId}`)}
                    >
                      Add Workout Templates
                    </button>
                  </div>
                )}
              </div>
              
              {/* Calendar */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                  <button 
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded-full"
                    onClick={() => handleMonthChange('prev')}
                  >
                    <span className="material-icons-round">chevron_left</span>
                  </button>
                  <h3 className="font-medium">
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
                      return <div key={`empty-${i}`} className="h-9"></div>;
                    }
                    
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const today = new Date();
                    const isToday = today.getDate() === day && 
                                  today.getMonth() === currentMonth.getMonth() && 
                                  today.getFullYear() === currentMonth.getFullYear();
                    
                    const isSelected = selectedDays.includes(day);
                    
                    return (
                      <div 
                        key={`day-${day}`}
                        className={`h-9 flex items-center justify-center rounded-full cursor-pointer text-sm
                          ${isToday ? 'border border-primary-500' : ''}
                          ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDays(prev => prev.filter(d => d !== day));
                          } else {
                            setSelectedDays(prev => [...prev, day]);
                          }
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Schedule Button */}
              <button 
                className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-md flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
                onClick={handleScheduleProgram}
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