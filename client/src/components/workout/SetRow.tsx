import { LocalSet } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface SetRowProps {
  set: LocalSet;
  onSetClick: () => void;
  onUpdateSet: (updates: Partial<LocalSet>) => void;
}

export default function SetRow({ set, onSetClick, onUpdateSet }: SetRowProps) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);

  const handleWeightChange = (delta: number) => {
    const newWeight = Math.max(0, weight + delta);
    setWeight(newWeight);
    onUpdateSet({ weight: newWeight });
  };

  const handleRepsChange = (delta: number) => {
    const newReps = Math.max(0, reps + delta);
    setReps(newReps);
    onUpdateSet({ reps: newReps });
  };

  const handleToggleComplete = () => {
    onUpdateSet({ completed: !set.completed });
  };

  const getSetTypeBadge = (type: string) => {
    switch (type) {
      case 'warmup':
        return <Badge variant="warmup">Warm-up</Badge>;
      case 'working':
        return <Badge variant="working">Working</Badge>;
      case 'dropset':
        return <Badge variant="dropset">Drop Set</Badge>;
      case 'failure':
        return <Badge variant="failure">Failure</Badge>;
      case 'backoff':
        return <Badge variant="backoff">Back-off</Badge>;
      default:
        return <Badge variant="working">Working</Badge>;
    }
  };

  return (
    <div className={`flex items-center text-sm px-2 py-2 border-t border-gray-100 first:border-0 ${set.completed ? 'bg-gray-50' : ''}`}>
      <div className="w-10 font-medium">{set.setNumber}</div>
      
      <div className="w-24 text-center">
        <div className="inline-flex items-center">
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => handleWeightChange(-5)}
            aria-label="Decrease weight"
          >
            <span className="material-icons-round text-sm">remove</span>
          </button>
          <input 
            type="number" 
            value={weight} 
            className="w-12 mx-1 text-center bg-transparent"
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (!isNaN(newValue)) {
                setWeight(newValue);
                onUpdateSet({ weight: newValue });
              }
            }}
            title={`Previous weight: ${set.weight} lbs`}
          />
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => handleWeightChange(5)}
            aria-label="Increase weight"
          >
            <span className="material-icons-round text-sm">add</span>
          </button>
        </div>
      </div>
      
      <div className="w-16 text-center">
        <div className="inline-flex items-center">
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => handleRepsChange(-1)}
            aria-label="Decrease reps"
          >
            <span className="material-icons-round text-sm">remove</span>
          </button>
          <input 
            type="number" 
            value={reps} 
            className="w-8 text-center bg-transparent"
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (!isNaN(newValue)) {
                setReps(newValue);
                onUpdateSet({ reps: newValue });
              }
            }}
            title={`Previous reps: ${set.reps}`}
          />
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => handleRepsChange(1)}
            aria-label="Increase reps"
          >
            <span className="material-icons-round text-sm">add</span>
          </button>
        </div>
      </div>
      
      <div className="w-16 text-center text-primary-500">
        {set.rpe || '-'}
      </div>
      
      <div className="flex-1 text-center">
        {getSetTypeBadge(set.setType)}
      </div>
      
      <div className="w-8 text-center">
        {set.completed ? (
          <button 
            className="text-green-500 hover:text-gray-600"
            onClick={handleToggleComplete}
            aria-label="Mark as incomplete"
          >
            <span className="material-icons-round text-base">check</span>
          </button>
        ) : (
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={onSetClick}
            aria-label="Edit set"
          >
            <span className="material-icons-round text-base">more_horiz</span>
          </button>
        )}
      </div>
    </div>
  );
}
