import { useState, useEffect } from "react";
import { LocalSet } from "@shared/schema";
import { Slider } from "@/components/ui/slider";
import { getRpeDescription } from "@/lib/workout";

interface SetDetailModalProps {
  isVisible: boolean;
  set: LocalSet;
  onClose: () => void;
  onSave: (set: LocalSet) => void;
  onDelete: (setId: string) => void;
}

export default function SetDetailModal({ 
  isVisible, 
  set, 
  onClose, 
  onSave, 
  onDelete 
}: SetDetailModalProps) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [rpe, setRpe] = useState<number>(set.rpe || 8);
  const [setType, setSetType] = useState(set.setType);
  const [notes, setNotes] = useState(set.notes || '');
  
  // Reset form when set changes
  useEffect(() => {
    if (isVisible) {
      setWeight(set.weight);
      setReps(set.reps);
      setRpe(set.rpe || 8);
      setSetType(set.setType);
      setNotes(set.notes || '');
    }
  }, [isVisible, set]);

  const handleSave = () => {
    const updatedSet = {
      ...set,
      weight,
      reps,
      rpe,
      setType,
      notes: notes || null
    };
    
    console.log("Saving set:", updatedSet);
    onSave(updatedSet);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-20">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-8 slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit Set</h2>
          <button 
            className="p-1" 
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <div className="flex items-center">
              <button 
                className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center"
                onClick={() => setWeight(Math.max(0, weight - 5))}
                aria-label="Decrease weight"
              >
                <span className="material-icons-round">remove</span>
              </button>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value)) {
                    setWeight(value);
                  }
                }}
                className="h-12 mx-3 flex-1 px-4 text-center text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button 
                className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center"
                onClick={() => setWeight(weight + 5)}
                aria-label="Increase weight"
              >
                <span className="material-icons-round">add</span>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
            <div className="flex items-center">
              <button 
                className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center"
                onClick={() => setReps(Math.max(0, reps - 1))}
                aria-label="Decrease reps"
              >
                <span className="material-icons-round">remove</span>
              </button>
              <input 
                type="number" 
                value={reps} 
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value)) {
                    setReps(value);
                  }
                }}
                className="h-12 mx-3 flex-1 px-4 text-center text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button 
                className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center"
                onClick={() => setReps(reps + 1)}
                aria-label="Increase reps"
              >
                <span className="material-icons-round">add</span>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RPE (Rate of Perceived Exertion)
            </label>
            <div className="px-2">
              <Slider
                value={[rpe]}
                min={1}
                max={10}
                step={0.5}
                onValueChange={(value) => setRpe(value[0])}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
              </div>
              <div className="text-center mt-2 font-medium text-primary-600">
                {getRpeDescription(rpe)}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['warmup', 'working', 'dropset'].map((type) => (
                <button 
                  key={type}
                  className={`py-2 rounded-lg text-sm ${
                    setType === type
                      ? 'border-2 border-blue-600 bg-blue-100 text-blue-800 font-medium shadow-sm'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  onClick={() => setSetType(type)}
                >
                  {type === 'warmup' ? 'Warm-up' : 
                   type === 'working' ? 'Working' : 
                   'Drop Set'}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              placeholder="Add any notes about this set..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
            ></textarea>
          </div>
          
          <div className="pt-2 flex gap-3">
            <button 
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200"
              onClick={() => onDelete(set.id)}
            >
              Delete
            </button>
            <button 
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
