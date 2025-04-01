import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { 
  Exercise, 
  ExerciseTemplate, 
  InsertExerciseTemplate, 
  InsertWorkoutTemplate, 
  Program, 
  WorkoutTemplate 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import type { QueryKey } from "@tanstack/react-query";

export default function ProgramDetailRedesign() {
  const [_, params] = useRoute("/programs/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for selected day and week
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sourceDay, setSourceDay] = useState<{week: number, day: number} | null>(null);
  const [targetWeek, setTargetWeek] = useState(1);
  
  // State for exercise configuration
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseDetailModal, setShowExerciseDetailModal] = useState(false);
  const [exerciseOrder, setExerciseOrder] = useState(0);
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [repRange, setRepRange] = useState("8-12");
  const [restTime, setRestTime] = useState(90);
  const [targetRpe, setTargetRpe] = useState<number | null>(8);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  
  const programId = params?.id ? parseInt(params.id) : null;

  // Query for program info
  const { data: program, isLoading: programLoading } = useQuery<Program>({
    queryKey: ['/api/programs', programId],
    enabled: !!programId,
    retry: false
  });
  
  // Effect to update selected week/day when program data loads
  useEffect(() => {
    if (program) {
      // Ensure selected week doesn't exceed program weeks
      if (program.weeks && selectedWeek > program.weeks) {
        setSelectedWeek(1);
      }
      
      // Ensure selected day doesn't exceed program days per week
      if (program.daysPerWeek && selectedDay > program.daysPerWeek) {
        setSelectedDay(1);
      }
    }
  }, [program, selectedWeek, selectedDay]);

  // Get workout templates for this program
  const { data: templates = [], isLoading: templatesLoading } = useQuery<WorkoutTemplate[]>({
    queryKey: ['/api/programs', programId, 'templates'],
    enabled: !!programId,
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}/templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout templates');
      }
      return response.json();
    }
  });

  // Query for all available exercises
  const { data: allExercises = [], isLoading: allExercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });

  // Current template for selected day/week
  const currentTemplate = templates.find(t => t.day === selectedDay && t.week === selectedWeek);
  
  // Query for exercises in the current template
  const { data: templateExercises = [], isLoading: exercisesLoading, refetch: refetchExercises } = useQuery<ExerciseTemplate[]>({
    queryKey: ['/api/workout-templates', currentTemplate?.id, 'exercises'],
    enabled: !!currentTemplate?.id,
    queryFn: async () => {
      if (!currentTemplate?.id) return [];
      const response = await fetch(`/api/workout-templates/${currentTemplate.id}/exercises`);
      if (!response.ok) {
        throw new Error('Failed to fetch template exercises');
      }
      return response.json();
    }
  });

  // Enhanced exercises with details
  const enhancedExercises = templateExercises.map(templateExercise => {
    const exercise = allExercises.find(ex => ex.id === templateExercise.exerciseId);
    return {
      ...templateExercise,
      exercise
    };
  }).sort((a, b) => a.order - b.order);

  // Filtered exercises for search
  const filteredExercises = searchTerm 
    ? allExercises.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ex.muscleGroups?.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : allExercises;

  // Mutation for creating a workout template
  const createTemplateMutation = useMutation({
    mutationFn: async (template: InsertWorkoutTemplate) => {
      const response = await fetch('/api/workout-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        throw new Error('Failed to create workout template');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch workout templates
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId, 'templates'] });
    }
  });

  // Mutation for adding an exercise to the template
  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseTemplate: InsertExerciseTemplate) => {
      const response = await fetch('/api/exercise-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseTemplate),
      });
      if (!response.ok) {
        throw new Error('Failed to add exercise to template');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch exercise templates
      if (currentTemplate?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/workout-templates', currentTemplate.id, 'exercises'] });
      }
      setShowExerciseDetailModal(false);
      setSelectedExercise(null);
      
      toast({
        title: "Exercise Added",
        description: "Exercise has been added to the workout",
      });
    },
    onError: (error) => {
      console.error("Error adding exercise:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive"
      });
    }
  });

  // Handle back navigation
  const handleBack = () => {
    navigate("/programs");
  };

  // Function to add exercise to current template
  const handleAddExercise = () => {
    if (!selectedExercise || !currentTemplate?.id) {
      // If no template exists yet for this day/week, create one first
      if (!currentTemplate && programId) {
        createTemplateMutation.mutate({
          name: `${program?.name || "Workout"} - Week ${selectedWeek}, Day ${selectedDay}`,
          day: selectedDay,
          week: selectedWeek,
          programId
        }, {
          onSuccess: (newTemplate) => {
            // Now add the exercise to the newly created template
            if (selectedExercise) {
              addExerciseMutation.mutate({
                exerciseId: selectedExercise.id,
                workoutTemplateId: newTemplate.id,
                order: exerciseOrder,
                sets: numberOfSets,
                reps: repRange,
                restTime: restTime,
                targetRpe: targetRpe
              });
            }
          }
        });
        return;
      }
      return;
    }
    
    // If template exists, add exercise directly
    addExerciseMutation.mutate({
      exerciseId: selectedExercise.id,
      workoutTemplateId: currentTemplate.id,
      order: exerciseOrder,
      sets: numberOfSets,
      reps: repRange,
      restTime: restTime,
      targetRpe: targetRpe
    });
  };

  // Function to handle exercise selection
  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseDetailModal(true);
    setShowExerciseModal(false);
  };

  // Function to handle day selection
  const handleDaySelect = (week: number, day: number) => {
    setSelectedWeek(week);
    setSelectedDay(day);
    setShowDayDetail(true);
  };

  // Function to handle copying a day's workout
  const handleCopyDay = () => {
    if (!sourceDay || !programId) return;
    
    // Find template for source day
    const sourceTemplate = templates.find(
      t => t.day === sourceDay.day && t.week === sourceDay.week
    );
    
    if (!sourceTemplate) {
      toast({
        title: "Nothing to Copy",
        description: "The source day has no exercises to copy",
        variant: "destructive"
      });
      return;
    }
    
    // Find all exercises for source template
    const sourceExercises = templateExercises.filter(
      ex => ex.workoutTemplateId === sourceTemplate.id
    );
    
    if (sourceExercises.length === 0) {
      toast({
        title: "Nothing to Copy",
        description: "The source day has no exercises to copy",
        variant: "destructive"
      });
      return;
    }
    
    // Create target templates for each day of the target week if they don't exist
    daysInWeek.forEach(day => {
      const existingTemplate = templates.find(
        t => t.day === day && t.week === targetWeek
      );
      
      if (!existingTemplate) {
        createTemplateMutation.mutate({
          name: `${program?.name || "Workout"} - Week ${targetWeek}, Day ${day}`,
          day,
          week: targetWeek,
          programId
        }, {
          onSuccess: (newTemplate) => {
            // Copy exercises from source template to the new template
            sourceExercises.forEach(srcEx => {
              addExerciseMutation.mutate({
                exerciseId: srcEx.exerciseId || 0,
                workoutTemplateId: newTemplate.id,
                order: srcEx.order,
                sets: srcEx.sets,
                reps: srcEx.reps,
                restTime: srcEx.restTime,
                targetRpe: srcEx.targetRpe
              });
            });
          }
        });
      } else {
        // Copy exercises to existing template
        sourceExercises.forEach(srcEx => {
          addExerciseMutation.mutate({
            exerciseId: srcEx.exerciseId || 0,
            workoutTemplateId: existingTemplate.id,
            order: srcEx.order,
            sets: srcEx.sets,
            reps: srcEx.reps,
            restTime: srcEx.restTime,
            targetRpe: srcEx.targetRpe
          });
        });
      }
    });
    
    setShowCopyModal(false);
    toast({
      title: "Workout Copied",
      description: `Copied workout from Week ${sourceDay.week}, Day ${sourceDay.day} to Week ${targetWeek}`,
    });
  };

  // Create array of weeks based on program length - strictly use program.weeks if available
  const weeks = program?.weeks 
    ? Array.from({ length: program.weeks }, (_, i) => i + 1)
    : Array.from({ length: 4 }, (_, i) => i + 1);
  
  // Create array of days based on program's daysPerWeek - strictly use program.daysPerWeek if available
  const daysInWeek = program?.daysPerWeek 
    ? Array.from({ length: program.daysPerWeek }, (_, i) => i + 1)
    : Array.from({ length: 7 }, (_, i) => i + 1);

  // Loading state
  const isLoading = programLoading || templatesLoading || allExercisesLoading;

  return (
    <>
      <Header 
        title={program?.name || "Program Details"} 
        showBackButton 
        onBackClick={handleBack} 
      />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="p-4">
            {!showDayDetail ? (
              <>
                {/* Program overview */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <h2 className="text-xl font-semibold mb-2">{program?.name}</h2>
                  {program?.description && <p className="text-gray-600 mb-2">{program.description}</p>}
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="material-icons-round text-gray-400 text-sm mr-1">calendar_today</span>
                    <span>{program?.weeks || 4} week program</span>
                  </div>
                </div>

                {/* Copy workout button */}
                <button
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg shadow-sm mb-4 flex items-center justify-center hover:bg-blue-700 active:bg-blue-800"
                  onClick={() => setShowCopyModal(true)}
                >
                  <span className="material-icons-round mr-2">content_copy</span>
                  Copy Workout Between Weeks
                </button>
                
                {/* Week tabs */}
                <div className="mb-4 border-b border-gray-200">
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex space-x-2 py-2">
                      {weeks.map(week => (
                        <button
                          key={week}
                          className={`px-4 py-2 rounded-t-lg font-medium ${
                            selectedWeek === week 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedWeek(week)}
                        >
                          Week {week}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {daysInWeek.map(day => {
                    const dayTemplate = templates.find(t => t.day === day && t.week === selectedWeek);
                    const hasExercises = !!dayTemplate;
                    
                    return (
                      <div 
                        key={day}
                        className={`border rounded-lg p-4 ${
                          hasExercises ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                        } hover:border-blue-400 transition-colors cursor-pointer`}
                        onClick={() => handleDaySelect(selectedWeek, day)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Day {day}</h3>
                            <p className="text-sm text-gray-500">
                              {hasExercises ? 'Workout configured' : 'No exercises added'}
                            </p>
                          </div>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            hasExercises ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <span className="material-icons-round text-sm">
                              {hasExercises ? 'fitness_center' : 'add'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              // Day detail view
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Week {selectedWeek}, Day {selectedDay}
                  </h2>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100"
                    onClick={() => setShowDayDetail(false)}
                  >
                    <span className="material-icons-round">close</span>
                  </button>
                </div>

                {/* Add Exercise Button */}
                <div 
                  className="flex items-center p-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer mb-4"
                  onClick={() => setShowExerciseModal(true)}
                >
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="material-icons-round text-sm">add</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-blue-600">Add Exercise</div>
                    <div className="text-xs text-gray-500">Add an exercise to this workout</div>
                  </div>
                </div>
                
                {/* Exercises List */}
                {exercisesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : enhancedExercises.length > 0 ? (
                  <div className="space-y-3">
                    {enhancedExercises.map((templateExercise, index) => (
                      <div 
                        key={templateExercise.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center p-3 bg-white">
                          <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                            <span className="material-icons-round text-sm">fitness_center</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{templateExercise.exercise?.name || `Exercise ${index + 1}`}</div>
                            <div className="text-xs text-gray-500">
                              {templateExercise.exercise?.muscleGroups?.join(", ")}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <span className="material-icons-round">drag_indicator</span>
                          </div>
                        </div>
                        
                        <div className="px-4 py-3 bg-gray-50 flex flex-wrap gap-2">
                          <div className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                            <span className="font-medium">{templateExercise.sets}</span> sets
                          </div>
                          <div className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                            <span className="font-medium">{templateExercise.reps}</span> reps
                          </div>
                          {templateExercise.restTime && (
                            <div className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                              <span className="font-medium">{templateExercise.restTime}s</span> rest
                            </div>
                          )}
                          {templateExercise.targetRpe && (
                            <div className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                              RPE <span className="font-medium">{templateExercise.targetRpe}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <span className="material-icons-round text-gray-400 text-3xl mb-2">fitness_center</span>
                    <p>No exercises added yet</p>
                    <p className="text-sm">Add exercises to build your workout</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Exercise List Modal */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowExerciseModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select Exercise</h2>
              <button 
                className="p-1" 
                onClick={() => setShowExerciseModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercises..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {filteredExercises.map(exercise => (
                <div 
                  key={exercise.id}
                  className="flex items-center border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleExerciseSelect(exercise)}
                >
                  <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                    <span className="material-icons-round text-sm">fitness_center</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-xs text-gray-500">
                      {exercise.muscleGroups?.join(", ")}
                    </div>
                  </div>
                  <button className="text-primary-600">
                    <span className="material-icons-round">chevron_right</span>
                  </button>
                </div>
              ))}
              
              {filteredExercises.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No exercises found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Exercise Detail Modal */}
      {showExerciseDetailModal && selectedExercise && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowExerciseDetailModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Configure Exercise</h2>
              <button 
                className="p-1" 
                onClick={() => setShowExerciseDetailModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons-round">fitness_center</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{selectedExercise.name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedExercise.muscleGroups?.join(", ")}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sets</label>
                <div className="flex items-center">
                  <button 
                    className="h-10 w-10 bg-gray-100 rounded-l-lg flex items-center justify-center"
                    onClick={() => setNumberOfSets(prev => Math.max(1, prev - 1))}
                  >
                    <span className="material-icons-round">remove</span>
                  </button>
                  <input 
                    type="number" 
                    value={numberOfSets}
                    onChange={(e) => setNumberOfSets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-10 w-16 border-y border-gray-300 text-center"
                  />
                  <button 
                    className="h-10 w-10 bg-gray-100 rounded-r-lg flex items-center justify-center"
                    onClick={() => setNumberOfSets(prev => prev + 1)}
                  >
                    <span className="material-icons-round">add</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rep Range</label>
                <input 
                  type="text" 
                  value={repRange} 
                  onChange={(e) => setRepRange(e.target.value)}
                  placeholder="e.g., 8-12, 5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rest Time (seconds)</label>
                <input 
                  type="number" 
                  value={restTime} 
                  onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target RPE (1-10)</label>
                <div className="flex items-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5"
                    value={targetRpe || 0} 
                    onChange={(e) => setTargetRpe(parseFloat(e.target.value))}
                    className="flex-1 mr-3"
                  />
                  <div className="w-12 text-center font-medium">
                    {targetRpe || 0}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Order</label>
                <input 
                  type="number" 
                  value={exerciseOrder} 
                  onChange={(e) => setExerciseOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Order in which this exercise appears in the workout</p>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200"
                  onClick={() => setShowExerciseDetailModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
                  onClick={handleAddExercise}
                  disabled={addExerciseMutation.isPending}
                >
                  {addExerciseMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    "Add Exercise"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Copy Workout Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCopyModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Copy Workout</h2>
              <button 
                className="p-1" 
                onClick={() => setShowCopyModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copy From</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Week</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={sourceDay?.week || 1}
                      onChange={(e) => setSourceDay(prev => ({ ...prev || {day: 1, week: 1}, week: parseInt(e.target.value) }))}
                    >
                      {weeks.map(week => (
                        <option key={week} value={week}>Week {week}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Day</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={sourceDay?.day || 1}
                      onChange={(e) => setSourceDay(prev => ({ ...prev || {day: 1, week: 1}, day: parseInt(e.target.value) }))}
                    >
                      {daysInWeek.map(day => (
                        <option key={day} value={day}>Day {day}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copy To</label>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Week</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={targetWeek}
                    onChange={(e) => setTargetWeek(parseInt(e.target.value))}
                  >
                    {weeks.map(week => (
                      <option key={week} value={week}>Week {week}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">This will copy the workout to all days in the target week</p>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200"
                  onClick={() => setShowCopyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600"
                  onClick={handleCopyDay}
                  disabled={!sourceDay || sourceDay.week === targetWeek}
                >
                  Copy Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </>
  );
}