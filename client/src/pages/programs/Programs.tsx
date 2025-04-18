import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program, InsertProgram } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Programs() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramDescription, setNewProgramDescription] = useState("");
  const [newProgramWeeks, setNewProgramWeeks] = useState<number>(4);
  const [newProgramDaysPerWeek, setNewProgramDaysPerWeek] = useState<number>(3);
  const [newProgramType, setNewProgramType] = useState<string>("strength");
  const [newProgramDifficulty, setNewProgramDifficulty] = useState<string>("intermediate");
  const [expandedPrograms, setExpandedPrograms] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [lengthFilter, setLengthFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
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
      setNewProgramWeeks(4);
      setNewProgramDaysPerWeek(3);
      setNewProgramType("strength");
      setNewProgramDifficulty("intermediate");
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
  
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Program> }) => {
      console.log("Updating program:", id, data);
      const response = await fetch(`/api/programs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error updating program:", errorText);
        throw new Error('Failed to update program');
      }
      
      const result = await response.json();
      console.log("Program updated successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      // Invalidate and refetch the programs query to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      // Reset form and close modal
      setSelectedProgram(null);
      setNewProgramName("");
      setNewProgramDescription("");
      setNewProgramWeeks(4);
      setNewProgramDaysPerWeek(3);
      setNewProgramType("strength");
      setNewProgramDifficulty("intermediate");
      setShowEditModal(false);
      
      // Show success toast
      toast({
        title: "Program Updated",
        description: `${data.name} has been updated successfully.`,
        variant: "default"
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update program. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Function to handle edit program action
  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setNewProgramName(program.name);
    setNewProgramDescription(program.description || "");
    setNewProgramWeeks(program.weeks || 4);
    setNewProgramDaysPerWeek(program.daysPerWeek || 3);
    setNewProgramType(program.type || "strength");
    setNewProgramDifficulty(program.difficulty || "intermediate");
    setShowEditModal(true);
  };
  
  // Function to handle program details view
  const handleProgramDetails = (programId: number) => {
    console.log(`Navigating to program details: /programs/${programId}`);
    navigate(`/programs/${programId}`);
  };
  
  // Filtering logic
  const filteredPrograms = programs.filter(program => {
    // Text search
    const nameMatch = program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = program.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const textMatch = nameMatch || descMatch;
    
    // Type filter
    const typeMatch = !typeFilter || program.type === typeFilter;
    
    // Difficulty filter
    const difficultyMatch = !difficultyFilter || program.difficulty === difficultyFilter;
    
    // Length filter
    let lengthMatch = true;
    if (lengthFilter) {
      const weeks = program.weeks || 4;
      if (lengthFilter === "1-4") {
        lengthMatch = weeks >= 1 && weeks <= 4;
      } else if (lengthFilter === "5-8") {
        lengthMatch = weeks >= 5 && weeks <= 8;
      } else if (lengthFilter === "9+") {
        lengthMatch = weeks >= 9;
      }
    }
    
    return textMatch && typeMatch && difficultyMatch && lengthMatch;
  });

  return (
    <>
      <Header title="Training Programs" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {/* Search and filter section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="material-icons-round absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  search
                </span>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2 p-2 text-gray-500 hover:text-blue-600 transition-colors border border-gray-300 rounded-lg flex items-center"
              >
                <span className="material-icons-round">filter_list</span>
              </button>
            </div>
            
            {showFilters && (
              <div className="bg-white p-3 rounded-lg shadow-sm mb-3 border border-gray-200">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Types</option>
                      <option value="strength">Strength</option>
                      <option value="hypertrophy">Hypertrophy</option>
                      <option value="endurance">Endurance</option>
                      <option value="power">Power</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Difficulties</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Length</label>
                    <select
                      value={lengthFilter}
                      onChange={(e) => setLengthFilter(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Any Length</option>
                      <option value="1-4">1-4 Weeks</option>
                      <option value="5-8">5-8 Weeks</option>
                      <option value="9+">9+ Weeks</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setTypeFilter("");
                      setDifficultyFilter("");
                      setLengthFilter("");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
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
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md font-medium"
                onClick={() => setShowCreateModal(true)}
                id="create-first-program-btn"
              >
                <span className="material-icons-round text-sm mr-2">add</span>
                Create Program
              </button>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-8">
              <div className="material-icons-round text-gray-400 text-4xl mb-3">
                filter_alt_off
              </div>
              <h3 className="text-md font-medium text-gray-800 mb-1">No matching programs</h3>
              <p className="text-sm text-gray-500 mb-3">
                Try adjusting your search or filters
              </p>
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                  setDifficultyFilter("");
                  setLengthFilter("");
                }}
                className="px-4 py-2 bg-gray-100 text-blue-600 rounded-lg text-sm flex items-center justify-center mx-auto hover:bg-gray-200"
              >
                <span className="material-icons-round text-sm mr-1">restart_alt</span>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Display filtered programs */}
              {filteredPrograms.map((program) => {
                const isExpanded = expandedPrograms[program.id] ?? false;
                
                return (
                  <div 
                    key={program.id} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div 
                      className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer"
                      onClick={() => {
                        setExpandedPrograms(prev => ({
                          ...prev,
                          [program.id]: !prev[program.id]
                        }));
                      }}
                    >
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium">{program.name}</h3>
                          <span className={`material-icons-round ml-2 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </div>
                        {!isExpanded && program.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {program.description}
                          </p>
                        )}
                      </div>
                      <button 
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProgram(program);
                        }}
                        aria-label="Edit program"
                      >
                        <span className="material-icons-round text-xl">edit</span>
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <>
                        {program.description && (
                          <div className="px-4 pt-3">
                            <p className="text-sm text-gray-600">
                              {program.description}
                            </p>
                          </div>
                        )}
                        
                        {/* Program stats section */}
                        
                        <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-gray-100">
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center">
                            <span className="material-icons-round text-gray-500 text-xs mr-1">calendar_today</span>
                            {program.weeks || 4} weeks
                          </div>
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center">
                            <span className="material-icons-round text-gray-500 text-xs mr-1">date_range</span>
                            {program.daysPerWeek || 3} days/week
                          </div>
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center">
                            <span className="material-icons-round text-gray-500 text-xs mr-1">fitness_center</span>
                            {program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'Strength'}
                          </div>
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center">
                            <span className="material-icons-round text-gray-500 text-xs mr-1">signal_cellular_alt</span>
                            {program.difficulty ? program.difficulty.charAt(0).toUpperCase() + program.difficulty.slice(1) : 'Intermediate'}
                          </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 space-y-3">
                          <button 
                            className="w-full py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
                            onClick={() => handleProgramDetails(program.id)}
                          >
                            <span className="material-icons-round text-sm mr-1">settings</span>
                            Setup Program
                          </button>
                          
                          <button 
                            className="w-full py-2 bg-gray-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                            onClick={() => {
                              navigate(`/programs/${program.id}/schedule`);
                            }}
                          >
                            <span className="material-icons-round text-sm mr-1">event</span>
                            Schedule Program
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Length (weeks)</label>
                  <select
                    value={newProgramWeeks}
                    onChange={(e) => setNewProgramWeeks(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 6, 8, 10, 12, 16].map(weeks => (
                      <option key={weeks} value={weeks}>{weeks} weeks</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Per Week</label>
                  <select
                    value={newProgramDaysPerWeek}
                    onChange={(e) => setNewProgramDaysPerWeek(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(days => (
                      <option key={days} value={days}>{days} days</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                  <select
                    value={newProgramType}
                    onChange={(e) => setNewProgramType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="strength">Strength</option>
                    <option value="hypertrophy">Hypertrophy</option>
                    <option value="endurance">Endurance</option>
                    <option value="power">Power</option>
                    <option value="general">General Fitness</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={newProgramDifficulty}
                    onChange={(e) => setNewProgramDifficulty(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
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
                        weeks: newProgramWeeks,
                        daysPerWeek: newProgramDaysPerWeek,
                        type: newProgramType,
                        difficulty: newProgramDifficulty,
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
      
      {/* Edit Program Modal */}
      {showEditModal && selectedProgram && (
        <div className="fixed inset-0 z-20">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowEditModal(false)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Program</h2>
              <button 
                className="p-1" 
                onClick={() => setShowEditModal(false)}
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
                  placeholder="Program name"
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Length (weeks)</label>
                  <select
                    value={newProgramWeeks}
                    onChange={(e) => setNewProgramWeeks(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 6, 8, 10, 12, 16].map(weeks => (
                      <option key={weeks} value={weeks}>{weeks} weeks</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Per Week</label>
                  <select
                    value={newProgramDaysPerWeek}
                    onChange={(e) => setNewProgramDaysPerWeek(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(days => (
                      <option key={days} value={days}>{days} days</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                  <select
                    value={newProgramType}
                    onChange={(e) => setNewProgramType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="strength">Strength</option>
                    <option value="hypertrophy">Hypertrophy</option>
                    <option value="endurance">Endurance</option>
                    <option value="power">Power</option>
                    <option value="general">General Fitness</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={newProgramDifficulty}
                    onChange={(e) => setNewProgramDifficulty(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
                  disabled={!newProgramName.trim() || updateProgramMutation.isPending}
                  onClick={() => {
                    if (newProgramName.trim() && selectedProgram) {
                      updateProgramMutation.mutate({
                        id: selectedProgram.id,
                        data: {
                          name: newProgramName.trim(),
                          description: newProgramDescription.trim() || null,
                          weeks: newProgramWeeks,
                          daysPerWeek: newProgramDaysPerWeek,
                          type: newProgramType,
                          difficulty: newProgramDifficulty,
                        }
                      });
                    }
                  }}
                >
                  {updateProgramMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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
