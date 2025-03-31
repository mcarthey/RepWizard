import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { InsertWorkoutTemplate, Program, WorkoutTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCurrentWorkout } from "@/hooks/useStorage";
import { createNewWorkout } from "@/lib/workout";

export default function ProgramDetail() {
  const [_, params] = useRoute("/programs/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { createWorkout } = useCurrentWorkout();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newWorkoutDay, setNewWorkoutDay] = useState(1);
  
  const programId = params?.id ? parseInt(params.id) : null;

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
      setShowAddModal(false);
      setNewWorkoutName("");
      setNewWorkoutDay(1);
      
      toast({
        title: "Workout Added",
        description: "Workout template has been added to the program",
      });
    },
    onError: (error) => {
      console.error("Error creating workout template:", error);
      toast({
        title: "Error",
        description: "Failed to create workout template",
        variant: "destructive"
      });
    }
  });

  // Handle back navigation
  const handleBack = () => {
    navigate("/programs");
  };

  // Handle starting a new workout based on this program
  const handleStartProgram = () => {
    if (!program) return;
    
    // Create a new workout with this program
    const newWorkout = createNewWorkout(program.name);
    newWorkout.programId = program.id;
    
    createWorkout(newWorkout);
    
    toast({
      title: "Program Started",
      description: `Started a new workout with ${program.name}`,
    });
    
    // Navigate to the workout page
    navigate("/");
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

  const isLoading = programLoading || templatesLoading;

  return (
    <>
      <Header 
        title={program?.name || "Program Details"} 
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
                <h2 className="text-xl font-semibold mb-2">{program.name}</h2>
                {program.description && (
                  <p className="text-gray-600">{program.description}</p>
                )}
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="material-icons-round text-gray-400 text-sm mr-1">calendar_today</span>
                  <span>{program.weeks || 4} week program</span>
                </div>
              </div>
              
              {/* Program Workouts */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Workouts</h3>
                <div className="space-y-3">
                  {/* Add New Workout Button */}
                  <div 
                    className="flex items-center p-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => setShowAddModal(true)}
                  >
                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                      <span className="material-icons-round text-sm">add</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-600">Add Workout Template</div>
                      <div className="text-xs text-gray-500">Create a new workout for this program</div>
                    </div>
                  </div>
                  
                  {/* Workout templates */}
                  {templates.length > 0 ? (
                    <div className="space-y-3">
                      {templates.map(template => (
                        <div 
                          key={template.id}
                          className="flex items-center border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                            <span className="material-icons-round text-sm">fitness_center</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-gray-500">
                              Day {template.day}, Week {template.week || 1}
                            </div>
                          </div>
                          <button className="text-primary-600">
                            <span className="material-icons-round">chevron_right</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <span className="material-icons-round text-gray-400 text-3xl mb-2">fitness_center</span>
                      <p>No workout templates yet</p>
                      <p className="text-sm">Create workout templates to add to this program</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Start Program Button */}
              <button 
                className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-md flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
                onClick={handleStartProgram}
              >
                <span className="material-icons-round mr-2">play_arrow</span>
                Start Program
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Program not found</p>
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
      
      {/* Add Workout Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Workout Template</h2>
              <button 
                className="p-1" 
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
                <input 
                  type="text" 
                  value={newWorkoutName} 
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  placeholder="e.g., Push Day, Leg Day, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day in Program</label>
                <select
                  value={newWorkoutDay}
                  onChange={(e) => setNewWorkoutDay(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <option key={day} value={day}>Day {day}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
                  disabled={!newWorkoutName.trim() || createTemplateMutation.isPending}
                  onClick={() => {
                    if (programId && newWorkoutName.trim()) {
                      createTemplateMutation.mutate({
                        name: newWorkoutName.trim(),
                        day: newWorkoutDay,
                        week: 1,
                        programId
                      });
                    }
                  }}
                >
                  {createTemplateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Add Workout"
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