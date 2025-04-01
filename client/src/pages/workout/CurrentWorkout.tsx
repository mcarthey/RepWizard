import { useState, useEffect } from "react";
import { useCurrentWorkout } from "@/hooks/useStorage";
import { useScheduleChecks } from "@/hooks/useScheduleChecks";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import ExerciseCard from "@/components/workout/ExerciseCard";
import QuickAddModal from "@/components/modals/QuickAddModal";
import { createNewWorkout, createWorkoutExercise, createSet } from "@/lib/workout";
import { Exercise, LocalExercise, LocalSet, Program } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function CurrentWorkout() {
  const { 
    workout, 
    loading, 
    createWorkout, 
    addExercise, 
    updateExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    updateWorkout 
  } = useCurrentWorkout();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [todaysScheduledProgram, setTodaysScheduledProgram] = useState<Program | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get program data
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });
  
  // Get schedules for today's date 
  const { getSchedulesForDate } = useScheduleChecks();
  
  // Check if there's a program scheduled for today and create a workout if needed
  useEffect(() => {
    if (!loading && !workout) {
      console.log("Creating new workout because none exists");
      
      // Default to creating a regular workout
      let shouldCreateDefaultWorkout = true;
      
      // Only check for scheduled programs if we have program data loaded
      if (programs.length > 0) {
        // Check for today's scheduled program
        const today = new Date();
        const todaysSchedules = getSchedulesForDate(today);
        console.log("Today's schedules:", todaysSchedules);
        
        if (todaysSchedules.length > 0) {
          // Find the corresponding program
          const programId = todaysSchedules[0].programId;
          const scheduledProgram = programs.find(program => program.id === programId);
          
          if (scheduledProgram) {
            console.log("Creating workout with scheduled program:", scheduledProgram.name);
            shouldCreateDefaultWorkout = false;
            
            // Create workout with the program already selected
            const newWorkout = createNewWorkout(scheduledProgram.name);
            newWorkout.programId = scheduledProgram.id;
            createWorkout(newWorkout);
            
            // Also set for the UI
            setTodaysScheduledProgram(scheduledProgram);
          }
        }
      }
      
      // Create default workout if needed
      if (shouldCreateDefaultWorkout) {
        console.log("Creating default workout");
        createWorkout(createNewWorkout());
      }
    } else {
      console.log("Current workout state:", { loading, workout });
    }
  }, [loading, workout, createWorkout, programs, getSchedulesForDate]);
  
  // Update the UI when a workout exists but program isn't set - handles existing workouts
  useEffect(() => {
    if (workout && !workout.programId && programs.length > 0) {
      // Check for today's scheduled program
      const today = new Date();
      const todaysSchedules = getSchedulesForDate(today);
      console.log("Today's schedules for notification:", todaysSchedules);
      
      if (todaysSchedules.length > 0) {
        // Find the corresponding program
        const scheduledProgram = programs.find(program => 
          program.id === todaysSchedules[0].programId
        );
        
        if (scheduledProgram) {
          console.log("Today's scheduled program (for notification):", scheduledProgram);
          setTodaysScheduledProgram(scheduledProgram);
        }
      }
    } else if (workout && workout.programId) {
      // If the workout already has a program associated, clear the notification
      setTodaysScheduledProgram(null);
    }
  }, [programs, workout, getSchedulesForDate]);
  
  // Get the associated program if there is one
  const selectedProgram = workout?.programId 
    ? programs.find(p => p.id === workout.programId) 
    : todaysScheduledProgram;
  
  const handleAddExercise = (exercise: Exercise) => {
    console.log("handleAddExercise called with exercise:", exercise);
    
    if (!workout) {
      console.error("Cannot add exercise: No active workout");
      return;
    }
    
    const newExercise = createWorkoutExercise(
      workout.id,
      exercise,
      workout.exercises.length
    );
    
    console.log("Adding new exercise to workout:", newExercise);
    addExercise(newExercise);
  };
  
  const handleAddSet = (exerciseId: string, set: LocalSet) => {
    addSet(exerciseId, set);
  };
  
  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<LocalSet>) => {
    console.log("CurrentWorkout: Updating set", { exerciseId, setId, updates });
    updateSet(exerciseId, setId, updates);
  };
  
  const handleRemoveSet = (exerciseId: string, setId: string) => {
    removeSet(exerciseId, setId);
  };
  
  // Handle program selection
  const handleProgramSelect = (programId: number) => {
    if (!workout) return;
    
    // Update the workout with the selected program
    updateWorkout({
      ...workout,
      programId,
      name: programs.find(p => p.id === programId)?.name || workout.name
    });
    
    toast({
      title: "Program Selected",
      description: `Workout is now associated with ${programs.find(p => p.id === programId)?.name}`,
    });
    
    setShowProgramModal(false);
  };
  
  // Loading state
  if (loading || !workout) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading workout...</p>
      </div>
    );
  }

  console.log("Rendering CurrentWorkout with workout:", workout);
  console.log("Exercise count:", workout.exercises.length);
  console.log("ShowAddModal state:", showAddModal);

  return (
    <>
      <Header title="Today's Workout" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Today's Scheduled Workout Notification */}
        {todaysScheduledProgram && !workout.programId && (
          <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
            <div className="flex items-center">
              <span className="material-icons-round text-blue-600 mr-2">event_available</span>
              <div className="flex-1">
                <div className="font-medium text-blue-900">Scheduled Workout Today</div>
                <div className="text-sm text-blue-800">{todaysScheduledProgram.name}</div>
              </div>
              <button 
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => handleProgramSelect(todaysScheduledProgram.id)}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* Workout Header */}
        <div className="px-4 py-4 bg-primary-50">
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium text-primary-700">
              {selectedProgram 
                ? selectedProgram.name 
                : workout.name || "Today's Workout"}
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(workout.date), "MMMM d, yyyy")}
            </div>
          </div>
          
          {/* Program selection button */}
          <div 
            className="flex items-center mt-1 cursor-pointer"
            onClick={() => setShowProgramModal(true)}
          >
            <span className="text-sm bg-primary-100 text-primary-600 px-2 py-0.5 rounded flex items-center">
              <span className="material-icons-round text-xs mr-1">
                {selectedProgram ? "fitness_center" : "add"}
              </span>
              {selectedProgram ? "Program Active" : "Select Program"}
            </span>
          </div>
        </div>
        
        {/* Workout Content */}
        <div className="px-4 pt-4">
          {workout.exercises.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 mb-6 text-lg">No exercises added yet</p>
              <button
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg shadow-md flex items-center justify-center mx-auto transition-colors"
                onClick={() => {
                  console.log("Add First Exercise button clicked");
                  setShowAddModal(true);
                }}
                id="add-first-exercise-btn"
              >
                <span className="material-icons-round text-xl mr-2">add_circle</span>
                Add Your First Exercise
              </button>
            </div>
          ) : (
            <>
              {workout.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onAddSet={handleAddSet}
                  onUpdateSet={handleUpdateSet}
                  onRemoveSet={handleRemoveSet}
                />
              ))}
            
              {/* Add Exercise Button */}
              <button 
                className="w-full py-3 mb-6 bg-white text-primary-600 rounded-lg shadow-sm flex items-center justify-center hover:bg-primary-50 transition-colors"
                onClick={() => setShowAddModal(true)}
                id="add-exercise-btn"
              >
                <span className="material-icons-round text-sm mr-1">add</span>
                Add Exercise
              </button>
            </>
          )}
        </div>
      </main>
      
      <BottomNav />
      
      {/* Program Selection Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowProgramModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select Program</h2>
              <button 
                className="p-1" 
                onClick={() => setShowProgramModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {programs.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No programs available</p>
                  <button 
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={() => {
                      setShowProgramModal(false);
                      navigate('/programs');
                    }}
                  >
                    Create Program
                  </button>
                </div>
              ) : (
                <>
                  {programs.map(program => (
                    <div 
                      key={program.id} 
                      className={`p-4 border rounded-lg flex items-center cursor-pointer
                        ${program.id === workout?.programId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                      onClick={() => handleProgramSelect(program.id)}
                    >
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{program.name}</div>
                        {program.description && (
                          <div className="text-xs text-gray-500">{program.description}</div>
                        )}
                      </div>
                      {program.id === workout?.programId && (
                        <span className="material-icons-round text-blue-600">check_circle</span>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                    onClick={() => {
                      // Remove program association
                      if (workout) {
                        updateWorkout({
                          ...workout,
                          programId: null
                        });
                        toast({
                          title: "Program Removed",
                          description: "Workout is no longer associated with any program",
                        });
                      }
                      setShowProgramModal(false);
                    }}
                  >
                    <span className="material-icons-round text-sm mr-1">clear</span>
                    Use No Program
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <QuickAddModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectExercise={(exercise) => {
          console.log("Exercise selected from modal:", exercise);
          handleAddExercise(exercise);
        }}
      />
    </>
  );
}
