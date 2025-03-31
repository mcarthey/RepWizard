import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program, InsertProgram } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Programs() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramDescription, setNewProgramDescription] = useState("");
  const { toast } = useToast();
  
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });
  
  const createProgramMutation = useMutation({
    mutationFn: async (newProgram: InsertProgram) => {
      console.log("Creating program:", newProgram);
      const response = await fetch('/api/programs', {
        method: 'POST',
        body: JSON.stringify(newProgram),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating program:", errorText);
        throw new Error('Failed to create program');
      }
      
      const result = await response.json();
      console.log("Program created successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      // Invalidate and refetch the programs query to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      // Reset form and close modal
      setNewProgramName("");
      setNewProgramDescription("");
      setShowCreateModal(false);
      
      // Show success toast
      toast({
        title: "Program Created",
        description: `${data.name} has been created successfully.`,
        variant: "default"
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create program. Please try again.",
        variant: "destructive"
      });
    }
  });

  return (
    <>
      <Header title="Training Programs" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <div className="material-icons-round text-gray-400 text-5xl mb-4">
                calendar_today
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Programs Yet</h3>
              <p className="text-gray-500 mb-4">
                Create structured training programs to follow over time
              </p>
              <button 
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow-md"
                onClick={() => setShowCreateModal(true)}
                id="create-first-program-btn"
              >
                <span className="material-icons-round text-sm mr-1">add</span>
                Create Program
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Display actual programs from API */}
              {programs.map((program) => (
                <div 
                  key={program.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-medium">{program.name}</h3>
                    {program.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {program.description}
                      </p>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* This is sample data since we don't have real workout templates yet */}
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                          <span className="material-icons-round text-sm">fitness_center</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Workout A</div>
                          <div className="text-xs text-gray-500">Main muscle groups</div>
                        </div>
                        <button className="text-primary-600">
                          <span className="material-icons-round">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Program</span>
                    </div>
                    <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md">
                      Start Workout
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                className="w-full py-3 mb-6 bg-blue-600 text-white rounded-lg shadow-md flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
                onClick={() => setShowCreateModal(true)}
                id="create-new-program-btn"
              >
                <span className="material-icons-round text-sm mr-1">add</span>
                Create New Program
              </button>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
      
      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCreateModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create New Program</h2>
              <button 
                className="p-1" 
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                <input 
                  type="text" 
                  value={newProgramName} 
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="e.g., Push/Pull/Legs Program"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  placeholder="Describe your program..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                ></textarea>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
                  disabled={!newProgramName.trim() || createProgramMutation.isPending}
                  onClick={() => {
                    if (newProgramName.trim()) {
                      createProgramMutation.mutate({
                        name: newProgramName.trim(),
                        description: newProgramDescription.trim() || null,
                        userId: null
                      });
                    }
                  }}
                >
                  {createProgramMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Program"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
