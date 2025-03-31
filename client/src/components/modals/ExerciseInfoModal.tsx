import { Exercise, LocalExercise } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface ExerciseInfoModalProps {
  isVisible: boolean;
  exercise: LocalExercise;
  onClose: () => void;
}

// Define a custom type instead of extending Exercise
interface ExerciseDetails {
  id: number;
  name: string;
  description: string | null;
  muscleGroups: string[] | null;
  videoUrl: string | null;
  instructions: string | null;
  userId: number | null;
}

export default function ExerciseInfoModal({ 
  isVisible, 
  exercise, 
  onClose 
}: ExerciseInfoModalProps) {
  // Get full exercise details
  const { data: exerciseDetails, isLoading } = useQuery<ExerciseDetails>({
    queryKey: [`/api/exercises/${exercise.exerciseId}`],
    enabled: isVisible,
  });

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-20">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Exercise Details</h2>
          <button 
            className="p-1" 
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-xl">{exercise.exercise.name}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {exercise.exercise.muscleGroups.map((group) => (
                <span key={group} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {group}
                </span>
              ))}
            </div>
            
            {exerciseDetails?.videoUrl ? (
              <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center mb-4">
                <iframe 
                  src={exerciseDetails.videoUrl} 
                  className="w-full h-full rounded-lg"
                  title={`${exercise.exercise.name} demonstration`}
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center mb-4">
                <span className="material-icons-round text-gray-400 text-4xl">videocam</span>
              </div>
            )}
            
            {exerciseDetails?.instructions && (
              <div>
                <h4 className="font-medium mb-2">Instructions</h4>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal pl-5">
                  {exerciseDetails.instructions.split('\n').map((instruction: string, i: number) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {/* This would be populated with actual data in a fully implemented app */}
            <div className="pt-2">
              <h4 className="font-medium mb-2">Recent Performance</h4>
              <div className="bg-gray-50 rounded-lg">
                {exercise.sets.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="p-3">
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Set {set.setNumber}</span>
                          <span className="font-medium">
                            {`${set.weight} lbs × ${set.reps} reps`}
                            {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                          </span>
                        </div>
                        {set.notes && (
                          <div className="text-xs text-gray-500 mt-1">{set.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    No sets recorded yet
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="font-medium mb-2">History</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden h-40 flex items-center justify-center text-gray-400">
                <span className="material-icons-round mr-2">show_chart</span>
                <span>Performance data will appear here</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
