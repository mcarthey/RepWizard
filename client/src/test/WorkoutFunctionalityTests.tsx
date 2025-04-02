import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDebugStorage } from '@/hooks/useDebugStorage';
import { useWorkout } from '@/hooks/useWorkout';
import { useScheduleChecks } from '@/hooks/useScheduleChecks';
import { useProgramsQuery } from '@/hooks/useProgramsQuery';
import { Program } from '@shared/schema';
import { parse } from 'date-fns';

/**
 * Test component for validating workout functionality.
 * This component isolates the key functions and behaviors of the workout tab
 * to help identify and fix issues without the complexity of the full UI.
 */
export default function WorkoutFunctionalityTests() {
  const { toast } = useToast();
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [testTab, setTestTab] = useState('date-selection');
  
  // Load workout from storage
  const { 
    workout, 
    loading,
    createWorkout,
    updateWorkout,
    addExercise,
    addSet,
    updateSet,
    removeSet,
    removeExercise,
    createWorkoutExercise,
  } = useWorkout();
  
  // Get program data
  const { data: programs = [] } = useProgramsQuery();
  
  // Get program schedules
  const { getSchedulesForDate, schedules } = useScheduleChecks();
  
  // Track state for date selection test
  const [testDate, setTestDate] = useState<Date | null>(
    workout ? new Date(workout.date) : new Date()
  );
  
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    message: string;
    details?: any;
  } | null>(null);
  
  // Log helper function
  const log = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [message, ...prev]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setDebugLogs([]);
  };
  
  // Test 1: Date Selection
  const testDateSelection = async () => {
    if (!workout || !testDate) {
      toast({
        title: "Test Failed",
        description: "No workout or test date available",
        variant: "destructive"
      });
      setTestResults({
        passed: false,
        message: "No workout or test date available"
      });
      return;
    }
    
    log(`TEST - Date Selection - Starting test`);
    log(`Current workout date: ${format(new Date(workout.date), 'yyyy-MM-dd')}`);
    log(`Selected test date: ${format(testDate, 'yyyy-MM-dd')}`);
    log(`Workout ID before date change: ${workout.id}`);
    
    try {
      // Record workout ID before change
      const originalWorkoutId = workout.id;
      
      // Check if selected date has scheduled programs
      const schedulesForDate = getSchedulesForDate(testDate);
      log(`Schedules for selected date: ${JSON.stringify(schedulesForDate)}`);
      
      // Update the workout date
      const updatedWorkout = {
        ...workout,
        date: testDate.toISOString()
      };
      
      // Update the workout with new date
      updateWorkout(updatedWorkout);
      
      // Wait for state update
      setTimeout(() => {
        // Check if the update was successful
        if (workout && workout.date && format(new Date(workout.date), 'yyyy-MM-dd') === format(testDate, 'yyyy-MM-dd')) {
          log(`SUCCESS - Date update was successful`);
          log(`New workout date: ${format(new Date(workout.date), 'yyyy-MM-dd')}`);
          log(`Workout ID after date change: ${workout.id}`);
          
          // Verify workout ID remains the same
          if (workout.id === originalWorkoutId) {
            log(`SUCCESS - Workout ID remained consistent through date change`);
            setTestResults({
              passed: true,
              message: "Date selection test passed",
              details: {
                originalDate: format(new Date(updatedWorkout.date), 'yyyy-MM-dd'),
                newDate: format(testDate, 'yyyy-MM-dd'),
                workoutId: workout.id
              }
            });
          } else {
            log(`FAIL - Workout ID changed from ${originalWorkoutId} to ${workout.id}`);
            setTestResults({
              passed: false,
              message: "Workout ID changed during date update",
              details: {
                originalId: originalWorkoutId,
                newId: workout.id
              }
            });
          }
        } else {
          log(`FAIL - Date update failed or wasn't applied`);
          setTestResults({
            passed: false,
            message: "Date update failed or wasn't applied",
            details: {
              originalDate: format(new Date(updatedWorkout.date), 'yyyy-MM-dd'),
              expectedNewDate: format(testDate, 'yyyy-MM-dd'),
              actualDate: workout ? format(new Date(workout.date), 'yyyy-MM-dd') : 'N/A'
            }
          });
        }
      }, 1000);
    } catch (error) {
      log(`ERROR - Exception during test: ${error}`);
      setTestResults({
        passed: false,
        message: `Test threw an exception: ${error}`,
      });
    }
  };
  
  // Test 2: Program Loading
  const testProgramLoading = async () => {
    if (!workout || programs.length === 0) {
      toast({
        title: "Test Failed",
        description: "No workout or programs available",
        variant: "destructive"
      });
      setTestResults({
        passed: false,
        message: "No workout or programs available"
      });
      return;
    }
    
    log(`TEST - Program Loading - Starting test`);
    log(`Current workout: ${JSON.stringify(workout)}`);
    log(`Available programs: ${JSON.stringify(programs.map(p => ({ id: p.id, name: p.name })))}`);
    
    try {
      // Select the first program for testing
      const testProgram = programs[0];
      log(`Using test program: ${testProgram.name} (ID: ${testProgram.id})`);
      
      // Record original exercise count
      const originalExerciseCount = workout.exercises.length;
      log(`Original exercise count: ${originalExerciseCount}`);
      
      // Update the workout with the program
      const updatedWorkout = {
        ...workout,
        programId: testProgram.id,
        name: testProgram.name,
        exercises: [] // Clear exercises for testing
      };
      
      log(`Updating workout with program: ${JSON.stringify({
        id: updatedWorkout.id,
        name: updatedWorkout.name,
        programId: updatedWorkout.programId
      })}`);
      
      // Update the workout
      updateWorkout(updatedWorkout);
      
      // Wait for state update
      setTimeout(async () => {
        // Check if the update was successful
        if (workout && workout.programId === testProgram.id) {
          log(`SUCCESS - Program update was successful`);
          log(`Workout now has programId: ${workout.programId}`);
          
          // Try to load a template from the API
          try {
            log(`Fetching templates for program ${testProgram.id}`);
            const response = await fetch(`/api/programs/${testProgram.id}/templates`);
            
            if (!response.ok) {
              throw new Error('Failed to fetch workout templates');
            }
            
            const templates = await response.json();
            log(`Retrieved templates: ${JSON.stringify(templates)}`);
            
            if (templates && templates.length > 0) {
              const templateId = templates[0].id;
              log(`Selected template ID: ${templateId}`);
              
              // Try to load exercises for the template
              const exercisesResponse = await fetch(`/api/workout-templates/${templateId}/exercises`);
              
              if (!exercisesResponse.ok) {
                throw new Error('Failed to fetch template exercises');
              }
              
              const templateExercises = await exercisesResponse.json();
              log(`Retrieved template exercises: ${JSON.stringify(templateExercises)}`);
              
              // Record the number of template exercises for validation
              log(`Template has ${templateExercises.length} exercises`);
              
              // Success
              setTestResults({
                passed: true,
                message: "Program loading test passed",
                details: {
                  programId: testProgram.id,
                  templateId: templateId,
                  exerciseCount: templateExercises.length
                }
              });
            } else {
              log(`FAIL - No templates found for program`);
              setTestResults({
                passed: false,
                message: "No templates found for program",
              });
            }
          } catch (error) {
            log(`ERROR - Failed to load templates or exercises: ${error}`);
            setTestResults({
              passed: false,
              message: `Failed to load templates or exercises: ${error}`,
            });
          }
        } else {
          log(`FAIL - Program update failed`);
          log(`Workout programId: ${workout?.programId}, expected: ${testProgram.id}`);
          setTestResults({
            passed: false,
            message: "Program update failed",
            details: {
              expectedProgramId: testProgram.id,
              actualProgramId: workout?.programId
            }
          });
        }
      }, 1000);
    } catch (error) {
      log(`ERROR - Exception during test: ${error}`);
      setTestResults({
        passed: false,
        message: `Test threw an exception: ${error}`,
      });
    }
  };
  
  // Test 3: State Persistence
  const testStatePersistence = async () => {
    if (!workout) {
      toast({
        title: "Test Failed",
        description: "No workout available",
        variant: "destructive"
      });
      setTestResults({
        passed: false,
        message: "No workout available"
      });
      return;
    }
    
    log(`TEST - State Persistence - Starting test`);
    
    try {
      // Record the current state
      const workoutId = workout.id;
      const workoutDate = workout.date;
      const exerciseCount = workout.exercises.length;
      
      log(`Current workout state: ID=${workoutId}, Date=${workoutDate}, ExerciseCount=${exerciseCount}`);
      
      // Use the debug storage hook to reload data
      const { reloadWorkout } = useDebugStorage();
      
      // Add a test note to verify changes persist
      const testNote = `Test note at ${new Date().toISOString()}`;
      
      // Update the workout with a test note
      const updatedWorkout = {
        ...workout,
        notes: testNote
      };
      
      log(`Adding test note to workout: "${testNote}"`);
      updateWorkout(updatedWorkout);
      
      // Wait for update
      setTimeout(async () => {
        log(`Reloading workout from storage`);
        await reloadWorkout();
        
        // Wait for reload
        setTimeout(() => {
          if (workout && workout.notes === testNote) {
            log(`SUCCESS - Workout changes persisted and reloaded correctly`);
            log(`Reloaded workout has correct test note: "${workout.notes}"`);
            
            // Verify other properties remained consistent
            if (workout.id === workoutId && workout.date === workoutDate) {
              log(`SUCCESS - Workout ID and date remained consistent through reload`);
              setTestResults({
                passed: true,
                message: "State persistence test passed",
                details: {
                  workoutId,
                  testNote
                }
              });
            } else {
              log(`FAIL - Workout ID or date changed during reload`);
              log(`Original ID: ${workoutId}, New ID: ${workout.id}`);
              log(`Original Date: ${workoutDate}, New Date: ${workout.date}`);
              setTestResults({
                passed: false,
                message: "Workout ID or date changed during reload",
                details: {
                  originalId: workoutId,
                  newId: workout.id,
                  originalDate: workoutDate,
                  newDate: workout.date
                }
              });
            }
          } else {
            log(`FAIL - Workout changes did not persist through reload`);
            log(`Expected notes: "${testNote}", Actual notes: "${workout?.notes}"`);
            setTestResults({
              passed: false,
              message: "Workout changes did not persist through reload",
              details: {
                expectedNotes: testNote,
                actualNotes: workout?.notes
              }
            });
          }
        }, 1000);
      }, 1000);
    } catch (error) {
      log(`ERROR - Exception during test: ${error}`);
      setTestResults({
        passed: false,
        message: `Test threw an exception: ${error}`,
      });
    }
  };
  
  // Test 4: Add & Remove Exercises
  const testExerciseCRUD = async () => {
    if (!workout) {
      toast({
        title: "Test Failed",
        description: "No workout available",
        variant: "destructive"
      });
      setTestResults({
        passed: false,
        message: "No workout available"
      });
      return;
    }
    
    log(`TEST - Exercise CRUD - Starting test`);
    log(`Initial exercise count: ${workout.exercises.length}`);
    
    try {
      // First, fetch an exercise to add
      const response = await fetch('/api/exercises?limit=1');
      if (!response.ok) {
        throw new Error('Failed to fetch test exercise');
      }
      
      const exercises = await response.json();
      if (!exercises || exercises.length === 0) {
        throw new Error('No exercises available for testing');
      }
      
      const testExercise = exercises[0];
      log(`Using test exercise: ${testExercise.name} (ID: ${testExercise.id})`);
      
      // Create a workout exercise
      const newExercise = createWorkoutExercise(
        workout.id,
        testExercise,
        workout.exercises.length
      );
      
      log(`Adding new exercise to workout: ${JSON.stringify({
        id: newExercise.id,
        exerciseId: newExercise.exerciseId,
        name: newExercise.name
      })}`);
      
      // Add the exercise
      addExercise(newExercise);
      
      // Wait for state update
      setTimeout(() => {
        // Check if the exercise was added
        const exerciseAdded = workout.exercises.some(e => e.id === newExercise.id);
        log(`Exercise added: ${exerciseAdded}`);
        log(`New exercise count: ${workout.exercises.length}`);
        
        if (exerciseAdded) {
          // Now try to add a set
          const newSet = {
            id: 'test-set-' + Date.now(),
            workoutExerciseId: newExercise.id,
            setNumber: 1,
            weight: 100,
            reps: 10,
            rpe: 8,
            setType: 'working' as const,
            completed: false,
            notes: 'Test set'
          };
          
          log(`Adding test set to exercise: ${JSON.stringify({
            id: newSet.id,
            weight: newSet.weight,
            reps: newSet.reps
          })}`);
          
          // Add the set
          addSet(newExercise.id, newSet);
          
          // Wait for state update
          setTimeout(() => {
            // Find the exercise to check if set was added
            const exerciseWithSet = workout.exercises.find(e => e.id === newExercise.id);
            
            if (exerciseWithSet && exerciseWithSet.sets && exerciseWithSet.sets.some(s => s.id === newSet.id)) {
              log(`SUCCESS - Set was added to exercise`);
              
              // Now remove the exercise to clean up
              log(`Removing test exercise: ${newExercise.id}`);
              removeExercise(newExercise.id);
              
              // Wait for state update
              setTimeout(() => {
                // Check if the exercise was removed
                const exerciseRemoved = !workout.exercises.some(e => e.id === newExercise.id);
                log(`Exercise removed: ${exerciseRemoved}`);
                
                if (exerciseRemoved) {
                  log(`SUCCESS - Exercise CRUD operations all passed`);
                  setTestResults({
                    passed: true,
                    message: "Exercise CRUD test passed",
                    details: {
                      exerciseId: newExercise.id,
                      setId: newSet.id
                    }
                  });
                } else {
                  log(`FAIL - Failed to remove exercise`);
                  setTestResults({
                    passed: false,
                    message: "Failed to remove exercise",
                  });
                }
              }, 1000);
            } else {
              log(`FAIL - Set was not added to exercise`);
              log(`Exercise sets: ${JSON.stringify(exerciseWithSet?.sets)}`);
              setTestResults({
                passed: false,
                message: "Failed to add set to exercise",
              });
            }
          }, 1000);
        } else {
          log(`FAIL - Failed to add exercise to workout`);
          setTestResults({
            passed: false,
            message: "Failed to add exercise to workout",
          });
        }
      }, 1000);
    } catch (error) {
      log(`ERROR - Exception during test: ${error}`);
      setTestResults({
        passed: false,
        message: `Test threw an exception: ${error}`,
      });
    }
  };
  
  // Create a test debugging hook
  const useDebugStorage = () => {
    const reloadWorkout = async () => {
      log('Debug: Manually reloading workout from storage');
      const storedWorkout = localStorage.getItem('current-workout');
      
      if (storedWorkout) {
        log(`Debug: Found stored workout data: ${storedWorkout.substring(0, 50)}...`);
        // This is just for debugging, we don't actually reload
        // because that would require implementing the full
        // useWorkout hook functionality
        return JSON.parse(storedWorkout);
      }
      
      log('Debug: No stored workout found');
      return null;
    };
    
    return { reloadWorkout };
  };
  
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workout Functionality Test Suite</CardTitle>
          <CardDescription>
            Run isolated tests to verify workout tab functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={testTab} onValueChange={setTestTab} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="date-selection">Date Selection</TabsTrigger>
              <TabsTrigger value="program-loading">Program Loading</TabsTrigger>
              <TabsTrigger value="state-persistence">State Persistence</TabsTrigger>
              <TabsTrigger value="exercise-crud">Exercise CRUD</TabsTrigger>
            </TabsList>
            
            <TabsContent value="date-selection">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Test Date Selection</h3>
                <p>Tests the ability to update a workout's date without losing workout data.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2">Current Workout Date:</p>
                    <div className="p-2 bg-muted rounded">
                      {workout ? format(new Date(workout.date), 'MMMM d, yyyy') : 'No workout loaded'}
                    </div>
                  </div>
                  
                  <div>
                    <p className="mb-2">Select Test Date:</p>
                    <input 
                      type="date" 
                      className="p-2 border rounded w-full"
                      value={testDate ? format(testDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setTestDate(parse(e.target.value, 'yyyy-MM-dd', new Date()));
                        }
                      }}
                    />
                  </div>
                </div>
                
                <Button onClick={testDateSelection} className="w-full mt-4">
                  Run Date Selection Test
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="program-loading">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Test Program Loading</h3>
                <p>Tests the ability to load a program and its exercises into a workout.</p>
                
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Available Programs:</p>
                  <ul className="list-disc list-inside">
                    {programs.map(program => (
                      <li key={program.id}>{program.name} (ID: {program.id})</li>
                    ))}
                  </ul>
                </div>
                
                <Button onClick={testProgramLoading} className="w-full mt-4">
                  Run Program Loading Test
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="state-persistence">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Test State Persistence</h3>
                <p>Tests if workout changes are correctly saved and reloaded.</p>
                
                <Button onClick={testStatePersistence} className="w-full mt-4">
                  Run State Persistence Test
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="exercise-crud">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Test Exercise CRUD Operations</h3>
                <p>Tests adding/removing exercises and sets from a workout.</p>
                
                <Button onClick={testExerciseCRUD} className="w-full mt-4">
                  Run Exercise CRUD Test
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {testResults && (
            <div className={`p-4 mb-4 rounded border ${testResults.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`font-bold ${testResults.passed ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.passed ? 'Test Passed' : 'Test Failed'}
              </h3>
              <p className="mt-1">{testResults.message}</p>
              
              {testResults.details && (
                <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-auto">
                  {JSON.stringify(testResults.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Test Logs</span>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {debugLogs.map((log, index) => (
                <React.Fragment key={index}>
                  <div className="text-sm font-mono p-1">
                    {log}
                  </div>
                  {index < debugLogs.length - 1 && <Separator />}
                </React.Fragment>
              ))}
              {debugLogs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No logs yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}