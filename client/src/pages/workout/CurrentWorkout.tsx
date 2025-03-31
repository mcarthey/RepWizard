import { useState, useEffect } from "react";
import { useCurrentWorkout } from "@/hooks/useStorage";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import ExerciseCard from "@/components/workout/ExerciseCard";
import QuickAddModal from "@/components/modals/QuickAddModal";
import { createNewWorkout, createWorkoutExercise, createSet } from "@/lib/workout";
import { Exercise, LocalExercise, LocalSet } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

export default function CurrentWorkout() {
  const { 
    workout, 
    loading, 
    createWorkout, 
    addExercise, 
    updateExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet 
  } = useCurrentWorkout();
  
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Create a default workout if none exists
  useEffect(() => {
    if (!loading && !workout) {
      console.log("Creating new workout because none exists");
      createWorkout(createNewWorkout());
    } else {
      console.log("Current workout state:", { loading, workout });
    }
  }, [loading, workout, createWorkout]);
  
  // Get sample program data for header
  interface ProgramData {
    id: number;
    name: string;
    description: string | null;
    userId: number | null;
  }
  
  const { data: programs = [] } = useQuery<ProgramData[]>({
    queryKey: ['/api/programs'],
  });
  
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
  
  // Loading state
  if (loading || !workout) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading workout...</p>
      </div>
    );
  }

  console.log("Rendering CurrentWorkout with workout:", workout);
  console.log("Exercise count:", workout.exercises.length);
  console.log("ShowAddModal state:", showAddModal);

  return (
    <>
      <Header title="Today's Workout" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Workout Header */}
        <div className="px-4 py-4 bg-primary-50">
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium text-primary-700">
              {programs && programs.length > 0 
                ? programs[0].name 
                : "Push/Pull/Legs Program"}
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(workout.date), "MMMM d, yyyy")}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
              Push Day - Week 2
            </span>
          </div>
        </div>
        
        {/* Workout Content */}
        <div className="px-4 pt-4">
          {workout.exercises.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 mb-6 text-lg">No exercises added yet</p>
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
          )}
        </div>
      </main>
      
      <BottomNav />
      
      <QuickAddModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectExercise={(exercise) => {
          console.log("Exercise selected from modal:", exercise);
          handleAddExercise(exercise);
        }}
      />
    </>
  );
}
