import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { 
  WorkoutTemplate, 
  ExerciseTemplate, 
  Exercise, 
  InsertExerciseTemplate,
  Program
} from "@shared/schema";

export default function WorkoutTemplateDetail() {
  const [_, params] = useRoute("/programs/:programId/templates/:templateId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showExerciseDetailModal, setShowExerciseDetailModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseOrder, setExerciseOrder] = useState(0);
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [repRange, setRepRange] = useState("8-12");
  const [restTime, setRestTime] = useState(90);
  const [targetRpe, setTargetRpe] = useState<number | null>(8);
  
  const programId = params?.programId ? parseInt(params.programId) : null;
  const templateId = params?.templateId ? parseInt(params.templateId) : null;

  // Query for program info
  const { data: program } = useQuery<Program>({
    queryKey: ['/api/programs', programId],
    enabled: !!programId,
  });
  
  // Query for workout template
  const { data: template, isLoading: templateLoading } = useQuery<WorkoutTemplate>({
    queryKey: ['/api/workout-templates', templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const response = await fetch(`/api/workout-templates/${templateId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout template');
      }
      return response.json();
    }
  });
  
  // Query for exercises in this template
  const { data: templateExercises = [], isLoading: exercisesLoading } = useQuery<ExerciseTemplate[]>({
    queryKey: ['/api/workout-templates', templateId, 'exercises'],
    enabled: !!templateId,
  });
  
  // Query for all available exercises
  const { data: allExercises = [], isLoading: allExercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });
  
  // Enhanced template exercises with exercise details
  const [enhancedExercises, setEnhancedExercises] = useState<(ExerciseTemplate & { exercise?: Exercise })[]>([]);
  
  // Load exercise details for each template exercise
  useEffect(() => {
    if (templateExercises.length > 0 && allExercises.length > 0) {
      const enhanced = templateExercises.map(templateExercise => {
        const exercise = allExercises.find(ex => ex.id === templateExercise.exerciseId);
        return {
          ...templateExercise,
          exercise
        };
      });
      setEnhancedExercises(enhanced);
    }
  }, [templateExercises, allExercises]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/workout-templates', templateId, 'exercises'] });
      setShowAddExerciseModal(false);
      setSelectedExercise(null);
      
      toast({
        title: "Exercise Added",
        description: "Exercise has been added to the workout template",
      });
    },
    onError: (error) => {
      console.error("Error adding exercise:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise to template",
        variant: "destructive"
      });
    }
  });

  // Function to handle exercise selection
  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseDetailModal(true);
  };

  // Function to add exercise to template
  const handleAddExercise = () => {
    if (!selectedExercise || !templateId) return;
    
    addExerciseMutation.mutate({
      exerciseId: selectedExercise.id,
      workoutTemplateId: templateId,
      order: exerciseOrder,
      sets: numberOfSets,
      reps: repRange,
      restTime: restTime,
      targetRpe: targetRpe
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/programs/${programId}`);
  };

  const isLoading = templateLoading || exercisesLoading || allExercisesLoading;

  return (
    <>
      <Header 
        title={template?.name || "Workout Template"} 
        showBackButton 
        onBackClick={handleBack} 
      />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : template ? (
            <div className="space-y-6">
              {/* Template Info */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-xl font-semibold mb-2">{template.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center">
                    <span className="material-icons-round text-gray-500 text-xs mr-1">event</span>
                    {program?.name || "Program"} - Week {template.week}
                  </div>
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center">
                    <span className="material-icons-round text-gray-500 text-xs mr-1">calendar_today</span>
                    Day {template.day}
                  </div>
                </div>
              </div>
              
              {/* Exercises List */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Exercises</h3>
                
                {/* Add Exercise Button */}
                <div 
                  className="flex items-center p-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer mb-4"
                  onClick={() => setShowAddExerciseModal(true)}
                >
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="material-icons-round text-sm">add</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-blue-600">Add Exercise</div>
                    <div className="text-xs text-gray-500">Add an exercise to this workout</div>
                  </div>
                </div>
                
                {/* Exercise Templates List */}
                {templateExercises.length > 0 ? (
                  <div className="space-y-3">
                    {templateExercises.map((templateExercise, index) => {
                      const exercise = allExercises.find(ex => ex.id === templateExercise.exerciseId);
                      
                      return (
                        <div 
                          key={templateExercise.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center p-3 bg-white">
                            <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                              <span className="material-icons-round text-sm">fitness_center</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{exercise?.name || `Exercise ${index + 1}`}</div>
                              <div className="text-xs text-gray-500">
                                {exercise?.muscleGroups?.join(", ")}
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <span className="material-icons-round text-gray-400 text-3xl mb-2">fitness_center</span>
                    <p>No exercises added yet</p>
                    <p className="text-sm">Add exercises to build your workout template</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Workout template not found</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={handleBack}
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddExerciseModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Exercise</h2>
              <button 
                className="p-1" 
                onClick={() => setShowAddExerciseModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search exercises..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {allExercises.map(exercise => (
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
      
      <BottomNav />
    </>
  );
}