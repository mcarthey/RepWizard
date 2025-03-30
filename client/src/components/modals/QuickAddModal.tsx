import { useState, useEffect } from "react";
import { Exercise } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface QuickAddModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export default function QuickAddModal({ 
  isVisible, 
  onClose, 
  onSelectExercise 
}: QuickAddModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get all exercises
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    enabled: isVisible
  });
  
  // Get unique muscle groups from exercises for categories
  const muscleGroups = [...new Set(
    exercises.flatMap(ex => ex.muscleGroups || [])
  )].sort();
  
  // Filter exercises based on search term and selected category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchTerm === "" || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      exercise.muscleGroups?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Reset search when modal opens
  useEffect(() => {
    if (isVisible) {
      setSearchTerm("");
      setSelectedCategory(null);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-20">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Exercise</h2>
          <button 
            className="p-1" 
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search exercises..." 
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="material-icons-round absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
        </div>
        
        {filteredExercises.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {selectedCategory 
                ? `${selectedCategory.toUpperCase()} EXERCISES` 
                : searchTerm 
                  ? "SEARCH RESULTS" 
                  : "SUGGESTED EXERCISES"}
            </h3>
            <div className="space-y-3">
              {filteredExercises.slice(0, 5).map(exercise => (
                <div 
                  key={exercise.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {exercise.muscleGroups?.join(', ')}
                    </div>
                  </div>
                  <button 
                    className="p-1 text-primary-600"
                    onClick={() => {
                      onSelectExercise(exercise);
                      onClose();
                    }}
                    aria-label={`Add ${exercise.name}`}
                  >
                    <span className="material-icons-round">add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">CATEGORIES</h3>
          <div className="grid grid-cols-2 gap-3">
            {muscleGroups.map(group => (
              <div 
                key={group}
                className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedCategory === group 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 text-gray-700'
                }`}
                onClick={() => {
                  if (selectedCategory === group) {
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory(group);
                  }
                }}
              >
                <span className="material-icons-round mr-2 text-primary-500">fitness_center</span>
                <span>{group}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
