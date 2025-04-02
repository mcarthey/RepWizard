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
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
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
    const createWorkoutWithProgramAndExercises = async (programId: number, programName: string) => {
      try {
        console.log(`Creating workout with scheduled program: ${programName}`);
        const newWorkout = createNewWorkout(programName);
        newWorkout.programId = programId;
        
        // Create the workout first so we have an ID to work with
        createWorkout(newWorkout);
        
        // Now load the exercises for this program
        // First, get the workout templates for this program
        const response = await fetch(`/api/programs/${programId}/templates`);
        if (!response.ok) {
          throw new Error('Failed to fetch workout templates');
        }
        
        const templates = await response.json();
        console.log("Retrieved templates for program:", templates);
        
        if (templates && templates.length > 0) {
          // Get the first template (we can make this smarter later)
          const templateId = templates[0].id;
          
          // Update the new workout with template ID
          updateWorkout({
            ...newWorkout,
            templateId
          });
          
          // Get the exercises for this template
          const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
          if (!exercisesResponse.ok) {
            throw new Error('Failed to fetch template exercises');
          }
          
          const templateExercises = await exercisesResponse.json();
          console.log("Retrieved template exercises:", templateExercises);
          
          // Add exercises from the template
          if (templateExercises && templateExercises.length > 0) {
            // Fetch full exercise details for each template exercise
            for (const templateExercise of templateExercises) {
              const exerciseResponse = await fetch(`/api/exercises/${templateExercise.exerciseId}`);
              if (exerciseResponse.ok) {
                const exercise = await exerciseResponse.json();
                
                // Create a new workout exercise
                const newExercise = createWorkoutExercise(
                  newWorkout.id,
                  exercise,
                  templateExercise.order
                );
                
                // Add it to the workout
                addExercise(newExercise);
                
                // Add some default sets based on the template
                for (let i = 0; i < templateExercise.sets; i++) {
                  const setType = i === 0 ? "warmup" : "working";
                  const newSet: LocalSet = {
                    id: uuidv4(),
                    workoutExerciseId: newExercise.id,
                    setNumber: i + 1,
                    weight: 0, // User will fill in
                    reps: 0,  // User will fill in
                    rpe: null,
                    setType,
                    completed: false,
                    notes: null
                  };
                  
                  addSet(newExercise.id, newSet);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error creating workout with program exercises:", error);
      }
    };
    
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
            shouldCreateDefaultWorkout = false;
            // Create workout with program and exercises all loaded at once
            createWorkoutWithProgramAndExercises(scheduledProgram.id, scheduledProgram.name);
            // Set for the UI
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
  }, [loading, workout, createWorkout, updateWorkout, addExercise, addSet, programs, getSchedulesForDate]);
  
  // Update the UI when a workout exists but program isn't set - handles existing workouts
  useEffect(() => {
    if (workout && !workout.programId && programs.length > 0) {
      // First, check for today's scheduled program
      const today = new Date();
      const todaysSchedules = getSchedulesForDate(today);
      console.log("Today's schedules for notification:", todaysSchedules);
      
      // Also check for schedules based on the workout's date
      // This is important if the workout was created on a different day
      const workoutDate = new Date(workout.date);
      const workoutDateSchedules = workoutDate.toDateString() !== today.toDateString() 
        ? getSchedulesForDate(workoutDate)
        : [];
      console.log("Workout date schedules for notification:", workoutDateSchedules);
      
      // Combine both schedule lists, with today's schedules taking priority
      const allSchedules = [...todaysSchedules, ...workoutDateSchedules];
      
      if (allSchedules.length > 0) {
        // Find the corresponding program (priority to today's schedules)
        const scheduledProgram = programs.find(program => 
          program.id === allSchedules[0].programId
        );
        
        if (scheduledProgram) {
          console.log("Scheduled program for notification:", scheduledProgram);
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
    
  // Handle collapsing/expanding program sections
  const toggleProgramCollapse = (programId: number) => {
    setCollapsedSections(prev => ({
      ...prev,
      [`program-${programId}`]: !prev[`program-${programId}`]
    }));
  };
  
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
  
  // Function to create a new workout for a scheduled program
  const handleScheduledProgramSelect = async (programId: number) => {
    try {
      // Create a brand new workout with today's date
      const programName = programs.find(p => p.id === programId)?.name || "Today's Workout";
      console.log(`Creating new workout for scheduled program: ${programName}`);
      
      // Create the new workout
      const newWorkout = createNewWorkout(programName);
      
      // First, get the workout templates for this program
      const response = await fetch(`/api/programs/${programId}/templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout templates');
      }
      
      const templates = await response.json();
      console.log("Retrieved templates for program:", templates);
      
      if (templates && templates.length > 0) {
        // Get the first template (we can make this smarter later)
        const templateId = templates[0].id;
        
        // Update the new workout with program and template IDs
        const updatedWorkout = {
          ...newWorkout,
          programId,
          templateId,
          name: programName,
        };
        
        // Update it in storage
        updateWorkout(updatedWorkout);
        
        // Get the exercises for this template
        const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
        if (!exercisesResponse.ok) {
          throw new Error('Failed to fetch template exercises');
        }
        
        const templateExercises = await exercisesResponse.json();
        console.log("Retrieved template exercises:", templateExercises);
        
        // Add exercises from the template
        if (templateExercises && templateExercises.length > 0) {
          // Fetch full exercise details for each template exercise
          for (const templateExercise of templateExercises) {
            const exerciseResponse = await fetch(`/api/exercises/${templateExercise.exerciseId}`);
            if (exerciseResponse.ok) {
              const exercise = await exerciseResponse.json();
              
              // Create a new workout exercise
              const newExercise = createWorkoutExercise(
                updatedWorkout.id,
                exercise,
                templateExercise.order
              );
              
              // Add it to the workout
              addExercise(newExercise);
              
              // Add some default sets based on the template
              for (let i = 0; i < templateExercise.sets; i++) {
                const setType = i === 0 ? "warmup" : "working";
                const newSet: LocalSet = {
                  id: uuidv4(),
                  workoutExerciseId: newExercise.id,
                  setNumber: i + 1,
                  weight: 0, // User will fill in
                  reps: 0,  // User will fill in
                  rpe: null,
                  setType,
                  completed: false,
                  notes: null
                };
                
                addSet(newExercise.id, newSet);
              }
            }
          }
        }
        
        toast({
          title: "Workout loaded",
          description: `Loaded template for ${programName}`,
        });
      } else {
        // No templates found, just update the program ID
        updateWorkout({
          ...newWorkout,
          programId,
          name: programName
        });
        
        toast({
          title: "Program Selected",
          description: `Created new workout for ${programName}`,
        });
      }
    } catch (error) {
      console.error("Error creating workout from scheduled program:", error);
      toast({
        title: "Error",
        description: "Failed to create workout. See console for details.",
        variant: "destructive"
      });
    }
  };
  
  // Handle program selection from the program modal
  const handleProgramSelect = async (programId: number) => {
    if (!workout) return;
    
    try {
      // First, get the workout templates for this program
      const response = await fetch(`/api/programs/${programId}/templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout templates');
      }
      
      const templates = await response.json();
      console.log("Retrieved templates for program:", templates);
      
      if (templates && templates.length > 0) {
        // Get the first template (we can make this smarter later)
        const templateId = templates[0].id;
        
        // Update the current workout with program and template IDs
        const updatedWorkout = {
          ...workout,
          programId,
          templateId,
          name: programs.find(p => p.id === programId)?.name || workout.name,
          exercises: [] // Clear existing exercises
        };
        
        // Update it in storage
        updateWorkout(updatedWorkout);
        
        // Get the exercises for this template
        const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
        if (!exercisesResponse.ok) {
          throw new Error('Failed to fetch template exercises');
        }
        
        const templateExercises = await exercisesResponse.json();
        console.log("Retrieved template exercises:", templateExercises);
        
        // Add exercises from the template
        if (templateExercises && templateExercises.length > 0) {
          // Fetch full exercise details for each template exercise
          for (const templateExercise of templateExercises) {
            const exerciseResponse = await fetch(`/api/exercises/${templateExercise.exerciseId}`);
            if (exerciseResponse.ok) {
              const exercise = await exerciseResponse.json();
              
              // Create a new workout exercise
              const newExercise = createWorkoutExercise(
                workout.id,
                exercise,
                templateExercise.order
              );
              
              // Add it to the workout
              addExercise(newExercise);
              
              // Add some default sets based on the template
              for (let i = 0; i < templateExercise.sets; i++) {
                const setType = i === 0 ? "warmup" : "working";
                const newSet: LocalSet = {
                  id: uuidv4(),
                  workoutExerciseId: newExercise.id,
                  setNumber: i + 1,
                  weight: 0, // User will fill in
                  reps: 0,  // User will fill in
                  rpe: null,
                  setType,
                  completed: false,
                  notes: null
                };
                
                addSet(newExercise.id, newSet);
              }
            }
          }
        }
        
        toast({
          title: "Workout loaded",
          description: `Loaded template for ${programs.find(p => p.id === programId)?.name}`,
        });
      } else {
        // No templates found, just update the program ID
        updateWorkout({
          ...workout,
          programId,
          name: programs.find(p => p.id === programId)?.name || workout.name
        });
        
        toast({
          title: "Program Selected",
          description: `Workout is now associated with ${programs.find(p => p.id === programId)?.name}`,
        });
      }
    } catch (error) {
      console.error("Error loading program template:", error);
      toast({
        title: "Error",
        description: "Failed to load program template. See console for details.",
        variant: "destructive"
      });
    }
    
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

        {/* Program Header - Make it collapsible */}
        <div 
          className="px-4 py-4 bg-primary-50 border-b border-gray-200"
          onClick={() => selectedProgram && toggleProgramCollapse(selectedProgram.id)}
        >
          <div className="flex justify-between items-center">
            <div className="font-medium text-primary-700 flex items-center">
              {selectedProgram && (
                <span className="material-icons-round mr-1 text-primary-500">
                  {collapsedSections[`program-${selectedProgram.id}`] ? 'expand_more' : 'expand_less'}
                </span>
              )}
              <span>
                {selectedProgram 
                  ? selectedProgram.name 
                  : workout.name || "Today's Workout"}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(workout.date), "MMMM d, yyyy")}
            </div>
          </div>
          
          {/* Program selection area - only show if no program is selected */}
          {!selectedProgram && (
            <div className="flex items-center mt-1 justify-between">
              {/* Program indicator/selector */}
              <div className="flex items-center">
                {/* If no program is selected but a scheduled one exists, show notice */}
                {todaysScheduledProgram && !workout.programId ? (
                  <div className="flex items-center text-sm text-blue-600"
                       onClick={(e) => {
                         e.stopPropagation(); // Prevent collapsing when clicking this
                         handleScheduledProgramSelect(todaysScheduledProgram.id);
                       }}>
                    <span className="material-icons-round text-xs mr-1">event_available</span>
                    <span>Scheduled today: <strong>{todaysScheduledProgram.name}</strong></span>
                  </div>
                ) : (
                  /* Select program button */
                  <span 
                    className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent collapsing when clicking this
                      setShowProgramModal(true);
                    }}
                  >
                    <span className="material-icons-round text-xs mr-1">add</span>
                    Select Program
                  </span>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center">
                {/* Show "Start" button if no program is selected but there's a scheduled one */}
                {todaysScheduledProgram && !workout.programId && (
                  <button 
                    className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent collapsing when clicking this
                      handleScheduledProgramSelect(todaysScheduledProgram.id);
                    }}
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Workout Exercises Content - Hide if collapsed */}
        <div className="px-4 pt-4">
          {(!selectedProgram || !collapsedSections[`program-${selectedProgram.id}`]) && (
            workout.exercises.length === 0 ? (
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
            )
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
                  
                  {/* If a program is already selected, show info message that programs can only be added, not removed */}
                  {workout.programId && (
                    <div className="w-full text-center py-2">
                      <p className="text-xs text-gray-500">
                        Select a different program to change
                      </p>
                    </div>
                  )}
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
