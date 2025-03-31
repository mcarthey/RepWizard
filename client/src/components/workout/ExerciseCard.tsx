import { useState } from "react";
import { LocalExercise, LocalSet } from "@shared/schema";
import SetRow from "./SetRow";
import { v4 as uuidv4 } from "uuid";
import ExerciseInfoModal from "../modals/ExerciseInfoModal";
import SetDetailModal from "../modals/SetDetailModal";

interface ExerciseCardProps {
  exercise: LocalExercise;
  onAddSet: (exerciseId: string, set: LocalSet) => void;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<LocalSet>) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
}

export default function ExerciseCard({ 
  exercise, 
  onAddSet, 
  onUpdateSet, 
  onRemoveSet 
}: ExerciseCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [showSetDetail, setShowSetDetail] = useState(false);
  const [selectedSet, setSelectedSet] = useState<LocalSet | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleAddSet = () => {
    const newSetNumber = exercise.sets.length > 0 
      ? Math.max(...exercise.sets.map(s => s.setNumber)) + 1 
      : 1;
    
    const newSet: LocalSet = {
      id: uuidv4(),
      workoutExerciseId: exercise.id,
      setNumber: newSetNumber,
      weight: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].weight : 0,
      reps: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].reps : 0,
      rpe: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].rpe : 8,
      setType: 'working',
      completed: false,
      notes: null
    };
    
    onAddSet(exercise.id, newSet);
  };

  const handleSetClick = (set: LocalSet) => {
    setSelectedSet(set);
    setShowSetDetail(true);
  };

  const handleSaveSet = (updatedSet: LocalSet) => {
    if (selectedSet) {
      console.log("ExerciseCard: Updating set with:", updatedSet);
      onUpdateSet(exercise.id, selectedSet.id, updatedSet);
    }
    setShowSetDetail(false);
    setSelectedSet(null);
  };

  const handleDeleteSet = (setId: string) => {
    onRemoveSet(exercise.id, setId);
    setShowSetDetail(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="font-medium">{exercise.exercise.name}</h3>
            <div className="text-xs text-gray-500 mt-0.5">
              {exercise.exercise.muscleGroups.join(', ')}
            </div>
          </div>
          <div className="flex items-center">
            <button 
              className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
              onClick={() => setShowExerciseInfo(true)}
              aria-label="Exercise information"
            >
              <span className="material-icons-round text-base">info</span>
            </button>
            <button 
              className="p-1 ml-1 text-gray-400 hover:text-primary-500 transition-colors"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              <span className="material-icons-round text-base">
                {isCollapsed ? "expand_more" : "expand_less"}
              </span>
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="px-2 py-1">
            {/* Set Header */}
            <div className="flex text-xs text-gray-500 px-2 py-1">
              <div className="w-10">Set</div>
              <div className="w-24 text-center">Weight</div>
              <div className="w-16 text-center">Reps</div>
              <div className="w-16 text-center">RPE</div>
              <div className="flex-1 text-center">Type</div>
              <div className="w-8"></div>
            </div>
            
            {exercise.sets.length === 0 ? (
              <div className="px-2 py-6 text-center text-gray-400 text-sm">
                No sets logged yet
              </div>
            ) : (
              exercise.sets
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((set) => (
                  <SetRow 
                    key={set.id} 
                    set={set}
                    onSetClick={() => handleSetClick(set)}
                    onUpdateSet={(updates) => onUpdateSet(exercise.id, set.id, updates)}
                  />
                ))
            )}
            
            {/* Add Set Button */}
            <div className="px-2 py-2 border-t border-gray-100">
              <button 
                className="w-full py-2 text-sm text-primary-600 flex items-center justify-center hover:bg-primary-50 rounded transition-colors"
                onClick={handleAddSet}
              >
                <span className="material-icons-round text-sm mr-1">add</span>
                Add Set
              </button>
            </div>
          </div>
        )}
      </div>
      
      {showExerciseInfo && (
        <ExerciseInfoModal 
          isVisible={showExerciseInfo}
          exercise={exercise}
          onClose={() => setShowExerciseInfo(false)}
        />
      )}
      
      {showSetDetail && selectedSet && (
        <SetDetailModal 
          isVisible={showSetDetail}
          set={selectedSet}
          onClose={() => setShowSetDetail(false)}
          onSave={handleSaveSet}
          onDelete={handleDeleteSet}
        />
      )}
    </>
  );
}
