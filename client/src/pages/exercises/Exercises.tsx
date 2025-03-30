import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Exercise } from "@shared/schema";

export default function Exercises() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get all exercises
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });
  
  // Get unique muscle groups from exercises
  const muscleGroups = [...new Set(
    exercises.flatMap(ex => ex.muscleGroups || [])
  )].sort();
  
  // Filter exercises based on search and category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchTerm === "" || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      exercise.muscleGroups?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Header title="Exercise Library" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
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
          
          <div className="mb-4 overflow-x-auto no-scrollbar">
            <div className="flex space-x-2 py-1">
              <button 
                className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                  !selectedCategory 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {muscleGroups.map(group => (
                <button 
                  key={group}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                    selectedCategory === group 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setSelectedCategory(group)}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8">
              <div className="material-icons-round text-gray-400 text-4xl mb-3">
                search_off
              </div>
              <p className="text-gray-500">
                No exercises found. Try a different search term or category.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExercises.map(exercise => (
                <div 
                  key={exercise.id}
                  className="bg-white p-4 rounded-lg shadow-sm"
                >
                  <h3 className="font-medium">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {exercise.muscleGroups?.map(group => (
                      <span 
                        key={group}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                  {exercise.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {exercise.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 mb-8">
            <button className="w-full py-3 bg-white text-primary-600 rounded-lg shadow-sm flex items-center justify-center hover:bg-primary-50 transition-colors">
              <span className="material-icons-round text-sm mr-1">add</span>
              Add Custom Exercise
            </button>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}
