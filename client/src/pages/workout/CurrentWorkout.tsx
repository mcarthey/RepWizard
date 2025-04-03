import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useQuery } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { useCurrentWorkout } from "@/hooks/useCurrentWorkout";
import { useScheduleChecks } from "@/hooks/useScheduleChecks";
import { Program, LocalSet, Exercise } from "@shared/schema";
import { createNewWorkout, createWorkoutExercise } from "@/lib/workout";

import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import ExerciseCard from "@/components/workout/ExerciseCard";
import QuickAddModal from "@/components/modals/QuickAddModal";
import WorkoutCalendarModal from "@/components/modals/WorkoutCalendarModal";

export default function CurrentWorkout() {
  const { 
    workout, 
    loading, 
    createWorkout, 
    addExercise, 
    addSet, 
    updateSet, 
    removeSet,
    updateWorkout 
  } = useCurrentWorkout();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [todaysScheduledProgram, setTodaysScheduledProgram] = useState<Program | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get program data
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });
  
  // Define the reload function
  const reloadProgramExercises = async (programId: number) => {
    // Basic validation
    if (!workout || workout.programId !== programId) {
      console.log("Cannot reload exercises: workout is missing or program ID mismatch");
      return;
    }
    
    // If already loading, skip this call
    if (programExerciseLoadingRef.current) {
      console.log("Exercise reload already in progress, skipping");
      return;
    }
    
    // Set loading flag
    programExerciseLoadingRef.current = true;
    const operationId = `reload-${Date.now()}`;
    console.log(`Starting program exercise reload operation: ${operationId}`);
    
    try {
      // 1. Get templates for the program
      console.log(`Fetching templates for program ${programId}`);
      const response = await fetch(`/api/programs/${programId}/templates`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
      }
      
      const templates = await response.json();
      if (!templates || templates.length === 0) {
        throw new Error("No templates found for program");
      }
      
      // 2. Get the template ID (either existing one or first available)
      const templateId = workout.templateId && 
        templates.find((t: any) => t.id === workout.templateId) ? 
        workout.templateId : templates[0].id;
      
      console.log(`Using template ID ${templateId}`);
      
      // 3. Get exercises for the template
      const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
      if (!exercisesResponse.ok) {
        throw new Error(`Failed to fetch template exercises: ${exercisesResponse.status} ${exercisesResponse.statusText}`);
      }
      
      const templateExercises = await exercisesResponse.json();
      if (!templateExercises || templateExercises.length === 0) {
        throw new Error("No exercises found in template");
      }
      
      console.log(`Found ${templateExercises.length} exercises in template`);
      
      // 4. Clear existing exercises by updating the workout
      const updatedWorkout = {
        ...workout,
        exercises: [], // Clear all exercises
        templateId    // Make sure template ID is set
      };
      
      // Update the workout in storage
      updateWorkout(updatedWorkout);
      console.log("Cleared existing exercises from workout");
      
      // 5. Create new exercise list to be added all at once
      const exercisesWithSets = [];
      
      // Fetch full exercise details and prepare exercise and set data
      for (const templateExercise of templateExercises) {
        try {
          // Get full exercise details
          const exerciseId = templateExercise.exerciseId;
          console.log(`Fetching details for exercise ${exerciseId}`);
          
          const exerciseResponse = await fetch(`/api/exercises/${exerciseId}`);
          if (!exerciseResponse.ok) {
            console.warn(`Could not fetch exercise ${exerciseId}, skipping`);
            continue;
          }
          
          const exercise = await exerciseResponse.json();
          
          // Create workout exercise
          const newExercise = createWorkoutExercise(
            workout.id,
            exercise,
            templateExercise.order
          );
          
          // Create sets for this exercise
          const sets = [];
          for (let i = 0; i < templateExercise.sets; i++) {
            const setType = i === 0 ? "warmup" : "working";
            sets.push({
              id: uuidv4(),
              workoutExerciseId: newExercise.id,
              setNumber: i + 1,
              weight: 0,
              reps: 0,
              rpe: null,
              setType,
              completed: false,
              notes: null
            });
          }
          
          // Save exercise and its sets
          exercisesWithSets.push({
            exercise: newExercise,
            sets: sets
          });
          
        } catch (err) {
          console.error(`Error processing exercise ${templateExercise.exerciseId}:`, err);
          // Continue with other exercises
        }
      }
      
      // 6. Add all exercises one by one
      console.log(`Adding ${exercisesWithSets.length} exercises to workout`);
      for (const { exercise, sets } of exercisesWithSets) {
        // Add exercise
        addExercise(exercise);
        
        // Add all sets for this exercise
        for (const set of sets) {
          addSet(exercise.id, set);
        }
      }
      
      // Show success toast if this isn't the initial render
      if (!isInitialRenderRef.current) {
        toast({
          title: "Workout Updated",
          description: "Workout exercises have been loaded successfully",
        });
      }
      
      console.log(`[${operationId}] Successfully loaded ${exercisesWithSets.length} exercises with sets`);
      
    } catch (error) {
      console.error(`[${operationId}] Error loading program exercises:`, error);
      toast({
        title: "Could Not Load Exercises",
        description: "There was a problem loading the exercises for this workout. Try again or check the console for details.",
        variant: "destructive"
      });
    } finally {
      // Always reset flags
      programExerciseLoadingRef.current = false;
      isInitialRenderRef.current = false;
    }
  };
  
  // References for tracking program updates to prevent infinite loops and unnecessary updates
  const lastProgramUpdateRef = useRef<string>("");
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const isInitialRenderRef = useRef<boolean>(true);
  const programExerciseLoadingRef = useRef<boolean>(false);
  
  // Function to check if there are actual template changes that require a reload
  const checkForTemplateChanges = async (programId: number): Promise<boolean> => {
    try {
      // Get the current template structure
      const response = await fetch(`/api/programs/${programId}/templates`);
      if (!response.ok) return false;
      
      const templates = await response.json();
      if (!templates || templates.length === 0) return false;
      
      // Find relevant template
      const templateId = workout?.templateId || templates[0].id;
      
      // Get current template exercises
      const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
      if (!exercisesResponse.ok) return false;
      
      const templateExercises = await exercisesResponse.json();
      
      // If we have no exercises on the template, no updates needed
      if (!templateExercises || templateExercises.length === 0) return false;
      
      // Compare with current workout exercises
      if (!workout || !workout.exercises) return true; // If no workout or exercises, reload needed
      
      // If exercise counts don't match, we need to update
      if (workout.exercises.length !== templateExercises.length) return true;
      
      // Define template exercise interface to avoid TypeScript errors
      interface TemplateExercise {
        id: number;
        exerciseId: number;
        sets: number;
        order: number;
      }
      
      // Check if all template exercises exist in current workout
      const templateExerciseIds = new Set((templateExercises as TemplateExercise[]).map(te => te.exerciseId));
      const workoutExerciseIds = new Set(workout.exercises.map(we => we.exerciseId));
      
      // If sets don't match or exercise IDs don't match, update needed
      for (const te of templateExercises as TemplateExercise[]) {
        if (!workoutExerciseIds.has(te.exerciseId)) return true;
        
        // Find matching workout exercise
        const workoutExercise = workout.exercises.find(we => we.exerciseId === te.exerciseId);
        if (!workoutExercise) return true;
        
        // If set counts differ, update needed
        if (!workoutExercise.sets || workoutExercise.sets.length !== te.sets) return true;
      }
      
      // No significant changes detected
      console.log("No template changes detected, skipping reload");
      return false;
      
    } catch (error) {
      console.error("Error checking for template changes:", error);
      return false; // On error, don't trigger an update
    }
  };
  
  // Single point for updating workouts (to prevent duplications)
  const executeProgramUpdate = async (programId: number) => {
    // Only allow one update at a time
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    
    // Check if we recently updated (within last 30 seconds)
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 30000 && !isInitialRenderRef.current) {
      console.log("Skipping update - too soon after previous update");
      return;
    }
    
    // First check if there are actual changes that require a reload
    const hasChanges = await checkForTemplateChanges(programId);
    if (!hasChanges && !isInitialRenderRef.current) {
      console.log("No template changes detected, skipping update");
      return;
    }
    
    // Perform the update after a delay
    updateTimerRef.current = setTimeout(() => {
      reloadProgramExercises(programId);
      updateTimerRef.current = null;
      lastUpdateTimeRef.current = Date.now();
      isInitialRenderRef.current = false;
    }, 1000);
  };
  
  // Track the actual program data to only update when content changes,
  // not just when references change during app navigation
  const programDataCacheRef = useRef<Map<number, string>>(new Map());
  
  // Add listener to automatically update workout when programs are modified - with smarter update tracking
  useEffect(() => {
    // Skip if no workout or no program assigned or no programs loaded
    if (!workout?.programId || programs.length === 0) return;
    
    // Find the current program
    const currentProgram = programs.find(p => p.id === workout.programId);
    if (!currentProgram) return;
    
    // Create a meaningful signature that captures the program content
    // This should include:
    // 1. Program name + ID
    // 2. Program templates count
    // 3. Program description
    const fullProgramSignature = JSON.stringify({
      id: currentProgram.id,
      name: currentProgram.name,
      description: currentProgram.description || '',
      weeks: currentProgram.weeks,
      daysPerWeek: currentProgram.daysPerWeek,
      type: currentProgram.type,
      difficulty: currentProgram.difficulty
    });
    
    // Get the cached signature for this program ID
    const cachedSignature = programDataCacheRef.current.get(currentProgram.id);
    
    // Only reload if the program content has actually changed
    if (fullProgramSignature !== cachedSignature) {
      console.log(`Program ${currentProgram.id} has changed. Updating workout.`);
      
      // Store this program state 
      programDataCacheRef.current.set(currentProgram.id, fullProgramSignature);
      
      // Only check for template changes if the program itself has changed
      // This prevents unnecessary API calls
      checkForTemplateChanges(currentProgram.id).then(hasChanges => {
        if (hasChanges) {
          console.log(`Template changes detected for program ${currentProgram.id}. Reloading exercises.`);
          executeProgramUpdate(currentProgram.id);
        } else {
          console.log(`No template changes detected for program ${currentProgram.id}. Skipping reload.`);
        }
      });
    } else {
      // If program data hasn't changed, we don't need to do anything
      console.log(`Program ${currentProgram.id} unchanged, skipping update`);
    }
    
    // Clean up on unmount
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [programs, workout?.programId]);
  
  // Get schedules for today's date 
  const { getSchedulesForDate } = useScheduleChecks();
  
  // Create a stable date selection handler with useCallback
  const handleDateSelect = useCallback(async (selectedDate: Date) => {
    if (!workout) return;
    
    console.log(`Calendar date changed to: ${format(selectedDate, "yyyy-MM-dd")}`);
    
    // Check if there's a scheduled program for the selected date
    const schedulesForDate = getSchedulesForDate(selectedDate);
    console.log(`Schedules for selected date:`, schedulesForDate);
    
    // If we have schedules for this date, prompt to create a workout with the program
    if (schedulesForDate.length > 0) {
      const programId = schedulesForDate[0].programId;
      const scheduledProgram = programs.find(p => p.id === programId);
      
      if (scheduledProgram) {
        console.log(`Found scheduled program for selected date: ${scheduledProgram.name}`);
        setTodaysScheduledProgram(scheduledProgram);
        
        // Ask if user wants to load the program for this date
        const shouldLoadProgram = window.confirm(
          `Program "${scheduledProgram.name}" is scheduled for this date. Would you like to load it?`
        );
        
        if (shouldLoadProgram) {
          try {
            // First update the date on the existing workout
            const updatedWorkout = {
              ...workout,
              date: selectedDate.toISOString(),
              programId: scheduledProgram.id,
              name: scheduledProgram.name,
              exercises: [] // Clear exercises to load from program
            };
            
            // Update with the new date
            updateWorkout(updatedWorkout);
            
            // Show toast to confirm the update
            toast({
              title: "Loading Program",
              description: `Loading "${scheduledProgram.name}" for ${format(selectedDate, "MMMM d, yyyy")}`,
            });
            
            // Get the template for this program to load exercises
            const response = await fetch(`/api/programs/${scheduledProgram.id}/templates`);
            if (!response.ok) throw new Error('Failed to fetch workout templates');
            
            const templates = await response.json();
            
            if (templates && templates.length > 0) {
              // Get the first template for now
              const templateId = templates[0].id;
              
              // Update the workout with template ID
              const workoutWithTemplate = {
                ...updatedWorkout,
                templateId
              };
              
              updateWorkout(workoutWithTemplate);
              
              // Get the exercises for this template
              const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
              if (exercisesResponse.ok) {
                const templateExercises = await exercisesResponse.json();
                
                // Add exercises from the template
                if (templateExercises && templateExercises.length > 0) {
                  for (const templateExercise of templateExercises) {
                    const exerciseResponse = await fetch(`/api/exercises/${templateExercise.exerciseId}`);
                    if (exerciseResponse.ok) {
                      const exercise = await exerciseResponse.json();
                      
                      const newExercise = createWorkoutExercise(
                        workoutWithTemplate.id,
                        exercise,
                        templateExercise.order
                      );
                      addExercise(newExercise);
                      
                      // Add default sets for the exercise
                      for (let i = 0; i < templateExercise.sets; i++) {
                        const setType = i === 0 ? "warmup" : "working";
                        const newSet: LocalSet = {
                          id: uuidv4(),
                          workoutExerciseId: newExercise.id,
                          setNumber: i + 1,
                          weight: 0,
                          reps: 0,
                          rpe: null,
                          setType,
                          completed: false,
                          notes: null
                        };
                        
                        // Add the set
                        addSet(newExercise.id, newSet);
                      }
                    }
                  }
                }
              }
            }
            
            toast({
              title: "Program Loaded",
              description: `"${scheduledProgram.name}" has been loaded for ${format(selectedDate, "MMMM d, yyyy")}`,
            });
          } catch (error) {
            console.error("Error loading program for selected date:", error);
            toast({
              title: "Error",
              description: "Failed to load program for the selected date",
              variant: "destructive"
            });
          }
          return;
        }
      }
    }
    
    // If we're here, either there's no scheduled program or user didn't want to load it
    // Update just the date, preserving all other workout data
    const updatedWorkout = {
      ...workout,
      date: selectedDate.toISOString()
    };
    
    updateWorkout(updatedWorkout);
    
    toast({
      title: "Date Updated",
      description: `Workout date set to ${format(selectedDate, "MMMM d, yyyy")}`,
    });
  }, [workout, getSchedulesForDate, programs, updateWorkout, addExercise, addSet, toast]);

  // Store functions and data in refs to maintain stable dependencies
  const workoutFunctionsRef = useRef({
    createWorkout,
    updateWorkout,
    addExercise,
    addSet,
    getSchedulesForDate,
    programs,
    handleDateSelect
  });
  
  // Update refs when functions or data change
  useEffect(() => {
    workoutFunctionsRef.current = {
      ...workoutFunctionsRef.current,
      createWorkout,
      updateWorkout,
      addExercise,
      addSet,
      handleDateSelect
    };
  }, [createWorkout, updateWorkout, addExercise, addSet, handleDateSelect]);
  
  useEffect(() => {
    workoutFunctionsRef.current.getSchedulesForDate = getSchedulesForDate;
  }, [getSchedulesForDate]);
  
  useEffect(() => {
    workoutFunctionsRef.current.programs = programs;
  }, [programs]);
  
  // Keep track of the last checked date for program schedules
  const lastScheduleCheckRef = useRef<string>("");
  const todayDateString = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Check if there's a program scheduled for today and create a workout if needed
  useEffect(() => {
    // Skip processing if we're still loading
    if (loading) {
      console.log("Still loading current workout, skipping schedule check");
      return;
    }
    
    // Skip if we've already checked schedules for today to prevent infinite loops
    if (lastScheduleCheckRef.current === todayDateString) {
      console.log(`Already checked schedules for ${todayDateString}, skipping`);
      return;
    }
    
    // Track that we've checked schedules for today
    lastScheduleCheckRef.current = todayDateString;
    
    // Check if there's a scheduled program for today
    const today = new Date();
    const todaysSchedules = getSchedulesForDate(today);
    console.log("Today's schedules for notification:", todaysSchedules);
    
    // If we find schedules for today and user doesn't already have a workout with a program
    if (todaysSchedules.length > 0) {
      const programId = todaysSchedules[0].programId;
      const scheduledProgram = programs.find(p => p.id === programId);
      
      if (scheduledProgram) {
        console.log("Scheduled program for notification:", scheduledProgram);
        setTodaysScheduledProgram(scheduledProgram);
        
        // If we don't have a workout yet, create one with the program
        if (!workout) {
          console.log("Creating new workout with scheduled program");
          createWorkoutWithProgramAndExercises(programId, scheduledProgram.name);
          return;
        }
        
        // If we already have a workout but it doesn't have a program assigned, ask user
        if (workout && !workout.programId) {
          // Only ask once per session to avoid annoying the user
          const hasAskedAboutProgram = sessionStorage.getItem('hasAskedAboutProgram');
          if (!hasAskedAboutProgram) {
            sessionStorage.setItem('hasAskedAboutProgram', 'true');
            
            // Show notification
            toast({
              title: "Program Scheduled",
              description: `You have "${scheduledProgram.name}" scheduled for today. Use the program menu to load it.`,
            });
          }
        }
      }
    } else if (!workout) {
      // If no schedules for today, create a default empty workout
      console.log("No schedules for today, creating default workout");
      const newWorkout = createNewWorkout("Today's Workout");
      createWorkout(newWorkout);
    }
  });
  
  // Define this function before the useEffect that uses it
  const createWorkoutWithProgramAndExercises = useCallback(async (programId: number, programName: string) => {
      try {
        console.log(`Creating workout with scheduled program: ${programName}`);
        const newWorkout = createNewWorkout(programName);
        newWorkout.programId = programId;
        
        // Create the workout first so we have an ID to work with
        workoutFunctionsRef.current.createWorkout(newWorkout);
        
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
          workoutFunctionsRef.current.updateWorkout({
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
            // Process exercises in batches to improve performance
            const processBatch = async (startIndex: number, batchSize: number) => {
              const endIndex = Math.min(startIndex + batchSize, templateExercises.length);
              
              for (let i = startIndex; i < endIndex; i++) {
                const templateExercise = templateExercises[i];
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
                  workoutFunctionsRef.current.addExercise(newExercise);
                  
                  // Add some default sets based on the template
                  for (let j = 0; j < templateExercise.sets; j++) {
                    const setType = j === 0 ? "warmup" : "working";
                    const newSet: LocalSet = {
                      id: uuidv4(),
                      workoutExerciseId: newExercise.id,
                      setNumber: j + 1,
                      weight: 0, // User will fill in
                      reps: 0,  // User will fill in
                      rpe: null,
                      setType,
                      completed: false,
                      notes: null
                    };
                    
                    workoutFunctionsRef.current.addSet(newExercise.id, newSet);
                  }
                }
              }
              
              // Process next batch if needed
              if (endIndex < templateExercises.length) {
                setTimeout(() => processBatch(endIndex, batchSize), 100); // Small delay between batches
              }
            };
            
            // Start processing in batches of 3 exercises
            processBatch(0, 3);
          }
        }
      } catch (error) {
        console.error("Error creating workout with program exercises:", error);
      }
    }, [workoutFunctionsRef]);
    
    // Check for scheduled programs on component mount
    useEffect(() => {
      // Skip if we're still loading or already have a workout
      if (loading || workout) {
        return;
      }
      
      // Default to creating a regular workout
      let shouldCreateDefaultWorkout = true;
      
      // Only check for scheduled programs if we have program data loaded
      const currentPrograms = workoutFunctionsRef.current.programs;
      if (currentPrograms && currentPrograms.length > 0) {
        // Check for today's scheduled program
        const today = new Date();
        const todaysSchedules = workoutFunctionsRef.current.getSchedulesForDate(today);
        console.log("Today's schedules:", todaysSchedules);
        
        if (todaysSchedules.length > 0) {
          // Find the corresponding program
          const programId = todaysSchedules[0].programId;
          const scheduledProgram = currentPrograms.find(program => program.id === programId);
          
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
        workoutFunctionsRef.current.createWorkout(createNewWorkout());
      }
    }, [loading, workout, createWorkoutWithProgramAndExercises]);
  
  // Update the UI when a workout exists but program isn't set - handles existing workouts
  useEffect(() => {
    if (workout && !workout.programId && programs.length > 0) {
      // First, check for today's scheduled program
      const today = new Date();
      const todaysSchedules = workoutFunctionsRef.current.getSchedulesForDate(today);
      console.log("Today's schedules for notification:", todaysSchedules);
      
      // Also check for schedules based on the workout's date
      // This is important if the workout was created on a different day
      const workoutDate = new Date(workout.date);
      const workoutDateSchedules = workoutDate.toDateString() !== today.toDateString() 
        ? workoutFunctionsRef.current.getSchedulesForDate(workoutDate)
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
      
      // Make sure to load exercises for the program
      // This handles the case where workout has programId but no exercises
      if (workout.exercises.length === 0 && !programExerciseLoadingRef.current) {
        console.log("Workout has program but no exercises, loading exercises...");
        
        // Add a small delay to avoid race conditions
        setTimeout(() => {
          if (workout.programId && !programExerciseLoadingRef.current) {
            // Use executeProgramUpdate instead of direct call to reloadProgramExercises
            // This ensures proper debouncing and checking for actual changes
            executeProgramUpdate(workout.programId);
          }
        }, 500);
      }
    }
  }, [programs, workout]); // Removed getSchedulesForDate dependency
  
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
            <div 
              className="text-sm text-gray-500 flex items-center cursor-pointer hover:text-primary-600"
              onClick={(e) => {
                e.stopPropagation(); // Prevent collapsing when clicking this
                setShowCalendarModal(true);
              }}
            >
              <span className="material-icons-round text-xs mr-1">calendar_today</span>
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
      
      {/* Calendar Date Selection Modal */}
      <WorkoutCalendarModal
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        currentDate={new Date(workout.date)}
        onDateSelect={(selectedDate) => {
          setShowCalendarModal(false);
          // Use the stable date select handler from the ref to ensure consistent behavior
          workoutFunctionsRef.current.handleDateSelect(selectedDate);
        }}
      />
    </>
  );
}