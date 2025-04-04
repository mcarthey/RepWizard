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
  console.log("CurrentWorkout component rendering");
  
  const { 
    workout, 
    loading,
    activeDate,
    changeActiveDate, 
    createWorkout, 
    addExercise, 
    addSet, 
    updateSet, 
    removeSet,
    updateWorkout 
  } = useCurrentWorkout();
  
  // Debug workout state
  console.log("DEBUG WORKOUT STATE:", {
    hasWorkout: !!workout,
    workoutDate: workout?.date ? new Date(workout.date).toISOString() : 'none',
    exerciseCount: workout?.exercises?.length || 0,
    workoutName: workout?.name || 'none',
    loading
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [todaysScheduledProgram, setTodaysScheduledProgram] = useState<Program | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  
  // Debug information state
  const [debugInfo, setDebugInfo] = useState<{
    weekNumber: number | null;
    dayNumber: number | null;
    templates: string[];
    selectedTemplate: string | null;
    selectedTemplateId: number | null;
    startDate: string | null;
    workoutDate: string | null;
    daysSinceStart: number | null;
    schedulesFound: number;
  }>({
    weekNumber: null,
    dayNumber: null,
    templates: [],
    selectedTemplate: null,
    selectedTemplateId: null,
    startDate: null,
    workoutDate: null,
    daysSinceStart: null,
    schedulesFound: 0
  });
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [, navigate] = useLocation();
  
  // Get program data
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });
  
  // Define the reload function
  const reloadProgramExercises = async (programId: number) => {
    if (!workout) {
      console.error("Cannot reload exercises: no workout exists");
      return;
    }
    
    // Loading has started
    toast({
      title: "Loading Exercises",
      description: "Fetching exercises for this program...",
    });
    
    try {
      // STEP 1: Get the templates for this program
      const templatesResponse = await fetch(`/api/programs/${programId}/templates`);
      if (!templatesResponse.ok) {
        throw new Error("Failed to fetch workout templates");
      }
      
      const templates = await templatesResponse.json();
      if (!templates || templates.length === 0) {
        throw new Error("No templates found for this program");
      }
      
      // STEP 1b: Find the right template for the current date's week and day
      // Get the current program
      const currentProgram = programs.find(p => p.id === programId);
      if (!currentProgram) {
        throw new Error("Program not found");
      }
      
      // Calculate which week and day we're on based on the workout date
      const workoutDate = new Date(workout.date);
      console.log(`DEBUG - Finding template for date: ${workoutDate.toISOString()}`);
      console.log(`DEBUG - Current program:`, currentProgram);
      
      // Find the scheduled program that includes this date
      const schedulesForDate = getSchedulesForDate(workoutDate);
      console.log(`DEBUG - Schedules matching this date:`, schedulesForDate);
      
      let weekNumber = 1;
      let dayNumber = 1;
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        schedulesFound: schedulesForDate.length,
        workoutDate: workoutDate.toISOString()
      }));
        
      if (schedulesForDate.length > 0) {
        const schedule = schedulesForDate[0];
        const startDate = new Date(schedule.startDate);
        
        console.log(`DEBUG - Program start date: ${startDate.toISOString()}`);
        console.log(`DEBUG - Workout date: ${workoutDate.toISOString()}`);
        
        // Calculate difference in days from start date
        const dayDiff = Math.floor((workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`DEBUG - Days since program start: ${dayDiff}`);
        
        // Calculate the week (1-indexed)
        weekNumber = Math.floor(dayDiff / 7) + 1;
        console.log(`DEBUG - Calculated week number: ${weekNumber}`);
        
        // Calculate the day of the week (1-indexed through 7 for Monday to Sunday)
        const dayOfWeek = workoutDate.getDay() === 0 ? 7 : workoutDate.getDay();
        console.log(`DEBUG - Day of week: ${dayOfWeek}`);
        
        // Make sure we don't exceed the total weeks
        const originalWeekNumber = weekNumber;
        weekNumber = Math.min(weekNumber, currentProgram.weeks || 1);
        if (originalWeekNumber !== weekNumber) {
          console.log(`DEBUG - Week number capped from ${originalWeekNumber} to ${weekNumber} based on program weeks`);
        }
        
        // Find the matching template
        console.log(`DEBUG - Looking for template for Week ${weekNumber}, Day ${dayOfWeek}`);
        dayNumber = dayOfWeek;
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          weekNumber,
          dayNumber: dayOfWeek,
          startDate: startDate.toISOString(),
          daysSinceStart: dayDiff
        }));
      }
      
      // Log all available templates for debugging
      console.log(`DEBUG - All available templates:`, templates.map((t: any) => t.name));
      
      // Update debug info with template names
      setDebugInfo(prev => ({
        ...prev,
        templates: templates.map((t: any) => t.name || 'Unnamed Template')
      }));
      
      // Find the template for this week/day combination
      // Template naming convention is usually "Program Name - Week X Day Y"
      console.log(`DEBUG - Starting template search for Week ${weekNumber}, Day ${dayNumber}`);
      
      const targetTemplate = templates.find((t: any) => {
        if (!t.name) return false;
        
        const nameLower = t.name.toLowerCase();
        
        // Define various patterns to check for
        // Standard format: "Week X Day Y"
        const weekString = `week ${weekNumber}`;
        const dayString = `day ${dayNumber}`;
        
        // Short formats
        const shortWeekDay = `w${weekNumber}d${dayNumber}`;
        const shortWeekDayDash = `w${weekNumber}-d${dayNumber}`;
        
        // Alternative formats
        const weekDayNoSpace = `week${weekNumber}day${dayNumber}`;
        const weekDaySlash = `week${weekNumber}/day${dayNumber}`;
        const daySlashWeek = `day${dayNumber}/week${weekNumber}`;
        
        // Numeric format only - e.g., "3-1" for Week 3 Day 1
        const numericFormat = `${weekNumber}-${dayNumber}`;
        
        console.log(`DEBUG - Checking template "${t.name}" for various match patterns`);
        
        // Check each condition separately for better logging
        const hasWeekAndDay = nameLower.includes(weekString) && nameLower.includes(dayString);
        const hasShortFormat = nameLower.includes(shortWeekDay);
        const hasShortDashFormat = nameLower.includes(shortWeekDayDash);
        const hasNoSpaceFormat = nameLower.includes(weekDayNoSpace);
        const hasSlashFormat = nameLower.includes(weekDaySlash) || nameLower.includes(daySlashWeek);
        const hasNumericFormat = nameLower.includes(numericFormat);
        
        // Match if any of the patterns are found
        const isMatch = hasWeekAndDay || hasShortFormat || hasShortDashFormat || 
                        hasNoSpaceFormat || hasSlashFormat || hasNumericFormat;
        
        if (isMatch) {
          console.log(`DEBUG - MATCH FOUND: "${t.name}" matches Week ${weekNumber}, Day ${dayNumber}!`);
          // Log which pattern matched
          console.log(`DEBUG - Matched patterns: ${
            [
              hasWeekAndDay ? `"week ${weekNumber}" AND "day ${dayNumber}"` : '',
              hasShortFormat ? `"w${weekNumber}d${dayNumber}"` : '',
              hasShortDashFormat ? `"w${weekNumber}-d${dayNumber}"` : '',
              hasNoSpaceFormat ? `"week${weekNumber}day${dayNumber}"` : '',
              hasSlashFormat ? 'slash format' : '',
              hasNumericFormat ? `"${weekNumber}-${dayNumber}"` : ''
            ].filter(Boolean).join(', ')
          }`);
        }
        
        return isMatch;
      });
      
      // If we found a specific template, use it, otherwise fall back to the first template
      const templateId = targetTemplate ? targetTemplate.id : templates[0].id;
      
      // Update debug info with selected template
      setDebugInfo(prev => ({
        ...prev,
        selectedTemplate: targetTemplate ? targetTemplate.name : templates[0].name,
        selectedTemplateId: templateId
      }));
      
      if (targetTemplate) {
        console.log(`DEBUG - Selected template: ID ${templateId} - "${targetTemplate.name}" (matched week/day)`);
      } else {
        console.log(`DEBUG - No matching template found. Falling back to the first template: ID ${templateId} - "${templates[0].name}"`);
        console.log(`DEBUG - This might indicate a program data issue - the template for Week ${weekNumber}, Day ${dayNumber} doesn't exist`);
      }
      
      
      // STEP 2: Get all exercises for this template
      const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
      if (!exercisesResponse.ok) {
        throw new Error("Failed to fetch template exercises");
      }
      
      const templateExercises = await exercisesResponse.json();
      if (!templateExercises || templateExercises.length === 0) {
        throw new Error("No exercises found in this template");
      }
      
      console.log(`Found ${templateExercises.length} exercises in template`);
      
      // STEP 3: Create a completely new workout with the same ID and basic info
      const freshWorkout = {
        ...workout,
        programId,
        templateId,
        exercises: [] // Start with no exercises
      };
      
      // STEP 4: Save this basic workout first (no exercises yet)
      updateWorkout(freshWorkout);
      
      // STEP 5: Collect all exercise data
      const exercisePromises = templateExercises.map(async (templateExercise: any) => {
        try {
          const exerciseResponse = await fetch(`/api/exercises/${templateExercise.exerciseId}`);
          if (!exerciseResponse.ok) return null;
          
          const exercise = await exerciseResponse.json();
          return {
            templateExercise,
            exercise
          };
        } catch (error) {
          console.error(`Error fetching exercise ${templateExercise.exerciseId}:`, error);
          return null;
        }
      });
      
      // Wait for all exercise data to be fetched
      const exerciseResults = await Promise.all(exercisePromises);
      const validExercises = exerciseResults.filter(result => result !== null);
      
      // STEP 6: Create the final workout with all exercises and sets
      const workoutWithExercises = {
        ...freshWorkout,
        exercises: [] // We'll build this up
      };
      
      // Create all exercises and their sets
      for (const { templateExercise, exercise } of validExercises) {
        const newExercise = createWorkoutExercise(
          workout.id,
          exercise,
          templateExercise.order
        );
        
        // Add sets to this exercise
        const sets = [];
        for (let i = 0; i < templateExercise.sets; i++) {
          sets.push({
            id: uuidv4(),
            workoutExerciseId: newExercise.id,
            setNumber: i + 1,
            weight: 0,
            reps: 0,
            rpe: null,
            setType: i === 0 ? "warmup" : "working",
            completed: false,
            notes: null
          });
        }
        
        // Add this exercise with its sets to the workout
        workoutWithExercises.exercises.push({
          ...newExercise,
          sets
        });
      }
      
      // STEP 7: Update with the COMPLETE workout all at once
      console.log(`Saving workout with ${workoutWithExercises.exercises.length} exercises`);
      updateWorkout(workoutWithExercises);
      
      // Success message
      toast({
        title: "Exercises Loaded",
        description: `Successfully loaded ${workoutWithExercises.exercises.length} exercises`,
      });
      
    } catch (error) {
      console.error("Error loading exercises:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load exercises",
        variant: "destructive"
      });
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
  
  // Debug function to manually check schedules for a date
  const debugCheckSchedules = async (date: Date) => {
    // Clear previous templates first
    setDebugInfo(prev => ({
      ...prev,
      templates: [],
      selectedTemplate: null,
      selectedTemplateId: null
    }));
    
    const schedulesForDate = getSchedulesForDate(date);
    console.log(`DEBUG - Manual check for date ${format(date, "yyyy-MM-dd")}:`, schedulesForDate);
    
    // Update debug info with schedule info
    setDebugInfo(prev => ({
      ...prev,
      schedulesFound: schedulesForDate.length,
      workoutDate: date.toISOString(),
      startDate: schedulesForDate.length > 0 ? schedulesForDate[0].startDate : null
    }));
    
    if (schedulesForDate.length > 0) {
      const schedule = schedulesForDate[0];
      const startDate = new Date(schedule.startDate);
      const programId = schedule.programId;
      
      // Calculate difference in days from start date
      const dayDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`DEBUG MANUAL - Days since program start: ${dayDiff}`);
      
      // Calculate the week (1-indexed)
      const weekNumber = Math.floor(dayDiff / 7) + 1;
      console.log(`DEBUG MANUAL - Calculated week number: ${weekNumber}`);
      
      // Calculate the day of the week (1-indexed through 7 for Monday to Sunday)
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      console.log(`DEBUG MANUAL - Day of week: ${dayOfWeek}`);
      
      // Update debug info with the calculated values
      setDebugInfo(prev => ({
        ...prev,
        weekNumber,
        dayNumber: dayOfWeek,
        daysSinceStart: dayDiff
      }));
      
      // Now fetch the templates for this program to see what we should be selecting
      try {
        console.log(`DEBUG - Fetching templates for program ID: ${programId}`);
        const templatesResponse = await fetch(`/api/programs/${programId}/templates`);
        
        if (!templatesResponse.ok) {
          console.error("Failed to fetch templates for debug info");
          return;
        }
        
        const templates = await templatesResponse.json();
        console.log(`DEBUG - Retrieved ${templates.length} templates:`, templates);
        
        // Update debug info with template names
        setDebugInfo(prev => ({
          ...prev,
          templates: templates.map((t: any) => t.name || 'Unnamed Template')
        }));
        
        // Now try to find the matching template for this week/day
        console.log(`DEBUG - Looking for templates matching Week ${weekNumber}, Day ${dayOfWeek}`);
        
        const targetTemplate = templates.find((t: any) => {
          if (!t.name) return false;
          
          const nameLower = t.name.toLowerCase();
          
          // Define various patterns to check for
          // Standard format: "Week X Day Y"
          const weekString = `week ${weekNumber}`;
          const dayString = `day ${dayOfWeek}`;
          
          // Short formats
          const shortWeekDay = `w${weekNumber}d${dayOfWeek}`;
          const shortWeekDayDash = `w${weekNumber}-d${dayOfWeek}`;
          
          // Alternative formats
          const weekDayNoSpace = `week${weekNumber}day${dayOfWeek}`;
          const weekDaySlash = `week${weekNumber}/day${dayOfWeek}`;
          const daySlashWeek = `day${dayOfWeek}/week${weekNumber}`;
          
          // Numeric format only - e.g., "3-1" for Week 3 Day 1
          const numericFormat = `${weekNumber}-${dayOfWeek}`;
          
          // Check each condition separately for better logging
          const hasWeekAndDay = nameLower.includes(weekString) && nameLower.includes(dayString);
          const hasShortFormat = nameLower.includes(shortWeekDay);
          const hasShortDashFormat = nameLower.includes(shortWeekDayDash);
          const hasNoSpaceFormat = nameLower.includes(weekDayNoSpace);
          const hasSlashFormat = nameLower.includes(weekDaySlash) || nameLower.includes(daySlashWeek);
          const hasNumericFormat = nameLower.includes(numericFormat);
          
          // Match if any of the patterns are found
          const isMatch = hasWeekAndDay || hasShortFormat || hasShortDashFormat || 
                          hasNoSpaceFormat || hasSlashFormat || hasNumericFormat;
          
          if (isMatch) {
            console.log(`DEBUG - MATCH FOUND: "${t.name}" matches Week ${weekNumber}, Day ${dayOfWeek}!`);
            // Log which pattern matched
            console.log(`DEBUG - Matched patterns: ${
              [
                hasWeekAndDay ? `"week ${weekNumber}" AND "day ${dayOfWeek}"` : '',
                hasShortFormat ? `"w${weekNumber}d${dayOfWeek}"` : '',
                hasShortDashFormat ? `"w${weekNumber}-d${dayOfWeek}"` : '',
                hasNoSpaceFormat ? `"week${weekNumber}day${dayOfWeek}"` : '',
                hasSlashFormat ? 'slash format' : '',
                hasNumericFormat ? `"${weekNumber}-${dayOfWeek}"` : ''
              ].filter(Boolean).join(', ')
            }`);
          }
          
          return isMatch;
        });
        
        if (targetTemplate) {
          console.log(`DEBUG - Selected template for Week ${weekNumber}, Day ${dayOfWeek}: ${targetTemplate.name}`);
          setDebugInfo(prev => ({
            ...prev,
            selectedTemplate: targetTemplate.name,
            selectedTemplateId: targetTemplate.id
          }));
          
          // Ask if user wants to create a workout using this template
          const shouldCreateWorkout = window.confirm(
            `Do you want to create a workout for ${format(date, "MMMM d, yyyy")} using the "${targetTemplate.name}" template?`
          );
          
          if (shouldCreateWorkout) {
            try {
              // Create a new workout for the selected date with the program
              const newWorkoutId = uuidv4();
              const newWorkout = {
                id: newWorkoutId,
                date: date.toISOString(),
                programId: programId,
                templateId: targetTemplate.id,
                name: `Workout for ${format(date, "MMM d, yyyy")}`,
                notes: null,
                completed: false,
                exercises: []
              };
              
              // Create the workout first
              createWorkout(newWorkout);
              
              // Then load the exercises
              setTimeout(async () => {
                // First change to this date
                changeActiveDate(date);
                
                // Then load the workout with exercises
                await reloadProgramExercises(programId);
                
                toast({
                  title: "Workout Created",
                  description: `Created workout for ${format(date, "MMMM d, yyyy")} with "${targetTemplate.name}" template`,
                });
              }, 500);
            } catch (error) {
              console.error("Error creating workout from debug template:", error);
              toast({
                title: "Error",
                description: "Failed to create workout from template",
                variant: "destructive"
              });
            }
          }
        } else {
          console.log(`DEBUG - No matching template found for Week ${weekNumber}, Day ${dayOfWeek}`);
        }
        
      } catch (error) {
        console.error("Error in debug template check:", error);
      }
    }
  }
  
  // Create a stable date selection handler with useCallback
  const handleDateSelect = useCallback(async (selectedDate: Date) => {
    console.log(`[TRACKING] Calendar date selection started: ${format(selectedDate, "yyyy-MM-dd")}`);
    
    if (workout) {
      console.log(`[TRACKING] Before date change - Current workout date is: ${format(new Date(workout.date), "yyyy-MM-dd")}`);
    }
    
    // Check if there's a scheduled program for the selected date
    const schedulesForDate = getSchedulesForDate(selectedDate);
    console.log(`[TRACKING] Schedules for selected date:`, schedulesForDate);
    
    console.log(`[TRACKING] About to call changeActiveDate for: ${format(selectedDate, "yyyy-MM-dd")}`)
    
    // Store the timestamp to detect date changes
    const beforeTimestamp = Date.now();
    
    // CRITICAL FIX: Pass isManualSelection=true to indicate this is a user-selected date
    // This will prevent it from being overridden by default date logic
    // Also set this in sessionStorage for double protection
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    sessionStorage.setItem('manually_selected_date', dateStr);
    sessionStorage.setItem('manually_selected_date_timestamp', selectedDate.getTime().toString());
    localStorage.setItem('repwizard_last_viewed_workout_date', dateStr);
    
    console.log(`[DATE PROTECTION] Reinforcing manual date selection in handleDateSelect: ${dateStr}`);
    
    // Call the changeActiveDate function with the manual selection flag
    changeActiveDate(selectedDate, true);
    
    console.log(`[TRACKING] changeActiveDate called for: ${format(selectedDate, "yyyy-MM-dd")}, time taken: ${Date.now() - beforeTimestamp}ms`);
    
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
            // Create a unique ID for the new date's workout
            const newWorkoutId = uuidv4();
            console.log(`Creating NEW workout for: ${scheduledProgram.name} on ${selectedDate.toISOString()} with ID: ${newWorkoutId}`);
            
            // Create a completely NEW workout for this date with a new ID
            const newWorkout = {
              id: newWorkoutId,
              date: selectedDate.toISOString(),
              programId: scheduledProgram.id,
              name: scheduledProgram.name,
              notes: null,
              completed: false,
              exercises: [],
              templateId: null
            };
            
            // Use the createWorkout function to handle proper storage
            createWorkout(newWorkout);
            
            // Now use the reloadProgramExercises function to load exercises
            setTimeout(async () => {
              console.log(`DEBUG - Loading exercises for new workout on ${format(selectedDate, "yyyy-MM-dd")} for program: ${scheduledProgram.name}`);
              console.log(`DEBUG - This workout is Schedule Week ${Math.floor(Math.abs((+selectedDate - +new Date(schedulesForDate[0].startDate)) / (1000 * 60 * 60 * 24 * 7)) + 1)}, Day ${selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()}`);
              await reloadProgramExercises(scheduledProgram.id);
              
              toast({
                title: "Program Loaded",
                description: `"${scheduledProgram.name}" has been loaded for ${format(selectedDate, "MMMM d, yyyy")}`,
              });
            }, 500); // Short delay to ensure workout is created first
            
            return;
          } catch (error) {
            console.error("Error loading program for selected date:", error);
            toast({
              title: "Error",
              description: "Failed to load program for the selected date",
              variant: "destructive"
            });
          }
        }
      }
    }
    
  }, [
    workout,
    getSchedulesForDate,
    programs,
    changeActiveDate,
    createWorkout,
    reloadProgramExercises,
    toast
  ]);

  // We'll still need the workoutFunctionsRef for now to avoid breaking too much code
  // This will help us transition to a cleaner approach
  const workoutFunctionsRef = useRef({
    createWorkout,
    updateWorkout,
    addExercise,
    addSet,
    getSchedulesForDate,
    programs,
    handleDateSelect
  });
  
  useEffect(() => {
    workoutFunctionsRef.current.getSchedulesForDate = getSchedulesForDate;
  }, [getSchedulesForDate]);
  
  useEffect(() => {
    workoutFunctionsRef.current.programs = programs;
  }, [programs]);
  
  // Keep track of the last checked date for program schedules
  const lastScheduleCheckRef = useRef<string>("");
  
  // CRITICAL FIX: Store a reference to the last manually selected date 
  // to prevent auto-creation logic from overriding it
  const lastManuallySelectedDateRef = useRef<string | null>(null);
  
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
  }, [loading, workout, programs, getSchedulesForDate, createWorkout, createNewWorkout, setTodaysScheduledProgram, toast]);
  
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
      
      // CRITICAL FIX: Check if user has manually selected a date from sessionStorage
      // This persists even if the component remounts after first selection
      const manuallySelectedDate = sessionStorage.getItem('manually_selected_date');
      if (manuallySelectedDate) {
        console.log(`[DATE PROTECTION] Skipping auto-creation since user manually selected date: ${manuallySelectedDate}`);
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
    }, [loading, workout]);
  
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

  console.log("DEBUG RENDER - CurrentWorkout with workout:", JSON.stringify(workout));
  console.log("DEBUG RENDER - Exercise count:", workout.exercises.length);
  console.log("DEBUG RENDER - ShowAddModal state:", showAddModal);
  console.log("DEBUG RENDER - EXERCISES DETAILS:", workout.exercises);

  return (
    <>
      <Header title="Today's Workout">
        <button
          onClick={() => setShowAddModal(true)} 
          className="text-sm px-3 py-1 rounded-lg bg-primary text-white flex items-center"
        >
          <span className="material-icons-round mr-1 text-sm">add</span>
          Add
        </button>
        <button
          onClick={() => setShowDebugInfo(prev => !prev)}
          className="text-xs px-2 py-1 bg-gray-700 text-white rounded-md ml-2"
        >
          <span className="material-icons-round text-xs mr-1">
            {showDebugInfo ? 'bug_off' : 'bug_report'}
          </span>
          {showDebugInfo ? 'Hide' : 'Debug'}
        </button>
        {showDebugInfo && (
          <button
            onClick={() => {
              sessionStorage.removeItem('manually_selected_date');
              console.log('[DATE PROTECTION] Cleared manually selected date from sessionStorage');
              toast({
                title: "Debug Action",
                description: "Cleared manually selected date from sessionStorage"
              });
            }}
            className="text-xs px-2 py-1 bg-red-700 text-white rounded-md ml-2"
          >
            <span className="material-icons-round text-xs mr-1">restart_alt</span>
            Reset Date
          </button>
        )}
      </Header>
      
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
          {console.log("RENDER INFO - Workout Exercises section", {
            hasWorkout: !!workout,
            exerciseCount: workout?.exercises?.length || 0,
            exerciseDetails: workout?.exercises || [],
            selectedProgram,
            isCollapsed: selectedProgram ? collapsedSections[`program-${selectedProgram.id}`] : false
          })}
          
          {(!selectedProgram || !collapsedSections[`program-${selectedProgram.id}`]) && (
            !workout || workout.exercises.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 mb-6 text-lg">No exercises added yet</p>
                <p className="text-gray-500 mb-6 text-sm">
                  {!workout ? "Workout is not loaded" : `Workout loaded with 0 exercises: ${workout.name}`}
                </p>
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
                <div className="bg-blue-50 p-2 mb-4 rounded-md">
                  <p>Loaded workout: {workout.name}</p>
                  <p>Exercise count: {workout.exercises.length}</p>
                </div>
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
        currentDate={activeDate}
        onDateSelect={(selectedDate) => {
          setShowCalendarModal(false);
          
          // The WorkoutCalendarModal already stored the manual selection in sessionStorage
          // Just ensure we also tag this as a manual selection when we pass it to changeActiveDate
          console.log(`[DATE PROTECTION] Calendar selected date: ${format(selectedDate, "yyyy-MM-dd")}`);
          
          // Use the full handleDateSelect function with proper template loading
          // This will call changeActiveDate internally with isManualSelection=true
          handleDateSelect(selectedDate);
        }}
      />

      {/* Debug Panel */}
      {showDebugInfo && (
        <div className="fixed bottom-16 left-0 right-0 bg-black/80 text-white text-xs p-2 z-50 rounded-t-md max-h-[50vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Template Selection Debug</h3>
            <button 
              onClick={() => setShowDebugInfo(false)}
              className="bg-red-600 text-white px-2 py-1 rounded-sm"
            >
              Close
            </button>
          </div>
          
          {/* Debug Actions */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button 
              onClick={() => debugCheckSchedules(new Date())}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Check Today
            </button>
            <button 
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() + 7);
                debugCheckSchedules(date);
              }}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Check +7 Days
            </button>
            <button 
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() + 14);
                debugCheckSchedules(date);
              }}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Check +14 Days
            </button>
            <button 
              onClick={() => {
                // Check April 21 specifically
                const date = new Date(2025, 3, 21); // Month is 0-indexed (3 = April)
                debugCheckSchedules(date);
              }}
              className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
            >
              Check Apr 21
            </button>
            
            {/* DATE PROTECTION DEBUG */}
            <button 
              onClick={() => {
                // Clear all date protection flags for testing
                sessionStorage.removeItem('manually_selected_date');
                sessionStorage.removeItem('manually_selected_date_timestamp');
                localStorage.removeItem('repwizard_last_viewed_workout_date');
                console.log('[DATE PROTECTION] Reset all date protection flags');
                toast({
                  title: "Date Protection Reset",
                  description: "All manual date selection flags have been cleared",
                });
              }}
              className="px-2 py-1 bg-red-600 text-white rounded text-xs ml-auto"
            >
              Reset Date Protection
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="flex flex-col">
              <span className="font-semibold">Week/Day Calculation:</span>
              <div className="pl-2">
                <div>Week: {debugInfo.weekNumber ?? 'Not calculated'}</div>
                <div>Day: {debugInfo.dayNumber ?? 'Not calculated'}</div>
                <div>Start Date: {debugInfo.startDate ? new Date(debugInfo.startDate).toLocaleDateString() : 'None'}</div>
                <div>Workout Date: {debugInfo.workoutDate ? new Date(debugInfo.workoutDate).toLocaleDateString() : 'None'}</div>
                <div>Days Since Start: {debugInfo.daysSinceStart ?? 'Unknown'}</div>
                <div>Schedules Found: {debugInfo.schedulesFound}</div>
              </div>
            </div>
            
            <div className="flex flex-col mt-2">
              <span className="font-semibold">Templates:</span>
              <div className="pl-2 mt-1">
                {debugInfo.templates.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {debugInfo.templates.map((template, idx) => (
                      <li key={idx} className={template === debugInfo.selectedTemplate ? 'text-green-400 font-bold' : ''}>
                        {template} {template === debugInfo.selectedTemplate && '(Selected)'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No templates loaded</div>
                )}
              </div>
            </div>

            <div className="mt-2">
              <span className="font-semibold">Selected Template:</span>
              <div className="pl-2">
                {debugInfo.selectedTemplate ? (
                  <div>
                    <div>Name: {debugInfo.selectedTemplate}</div>
                    <div>ID: {debugInfo.selectedTemplateId}</div>
                  </div>
                ) : (
                  <div>No template selected</div>
                )}
              </div>
            </div>
            
            {/* DATE PROTECTION DEBUG SECTION */}
            <div className="mt-3 border-t border-gray-700 pt-2">
              <span className="font-semibold text-green-400">Date Protection Status:</span>
              <div className="pl-2 mt-1">
                <div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">Session Storage:</span>
                    <div>
                      <div>manually_selected_date: {sessionStorage.getItem('manually_selected_date') || 'not set'}</div>
                      <div>manually_selected_date_timestamp: {sessionStorage.getItem('manually_selected_date_timestamp') || 'not set'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start mt-1">
                    <span className="font-medium mr-2">Local Storage:</span>
                    <div>
                      <div>repwizard_last_viewed_workout_date: {localStorage.getItem('repwizard_last_viewed_workout_date') || 'not set'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start mt-1">
                    <span className="font-medium mr-2">Active Date:</span>
                    <div>
                      {activeDate ? format(activeDate, 'yyyy-MM-dd') : 'not set'}
                    </div>
                  </div>
                  
                  <div className="flex items-start mt-1">
                    <span className="font-medium mr-2">Workout Date:</span>
                    <div>
                      {workout?.date ? format(new Date(workout.date), 'yyyy-MM-dd') : 'not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}