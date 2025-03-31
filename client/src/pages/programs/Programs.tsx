import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program, InsertProgram } from "@shared/schema";

export default function Programs() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramDescription, setNewProgramDescription] = useState("");
  
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });
  
  const createProgramMutation = useMutation({
    mutationFn: async (newProgram: InsertProgram) => {
      const response = await fetch('/api/programs', {
        method: 'POST',
        body: JSON.stringify(newProgram),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create program');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the programs query to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      // Reset form and close modal
      setNewProgramName("");
      setNewProgramDescription("");
      setShowCreateModal(false);
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
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg"
                onClick={() => setShowCreateModal(true)}
              >
                <span className="material-icons-round text-sm mr-1">add</span>
                Create Program
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sample program for UI demonstration */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium">Push/Pull/Legs Program</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    3-day split focusing on compound movements
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Push Day</div>
                        <div className="text-xs text-gray-500">Chest, Shoulders, Triceps</div>
                      </div>
                      <button className="text-primary-600">
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Pull Day</div>
                        <div className="text-xs text-gray-500">Back, Biceps</div>
                      </div>
                      <button className="text-primary-600">
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Leg Day</div>
                        <div className="text-xs text-gray-500">Quads, Hamstrings, Calves</div>
                      </div>
                      <button className="text-primary-600">
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">6 week</span> program
                  </div>
                  <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md">
                    Start Workout
                  </button>
                </div>
              </div>
              
              <button 
                className="w-full py-3 mb-6 bg-white text-primary-600 rounded-lg shadow-sm flex items-center justify-center hover:bg-primary-50 transition-colors"
                onClick={() => setShowCreateModal(true)}
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
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600"
                  disabled={!newProgramName.trim()}
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
                  Create Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
