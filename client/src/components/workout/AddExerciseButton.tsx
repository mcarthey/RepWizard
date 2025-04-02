import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddExerciseButtonProps {
  onClick: () => void;
}

// Button to add a new exercise to the workout
const AddExerciseButton = ({ onClick }: AddExerciseButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full flex items-center justify-center gap-2 py-6 border-dashed border-2"
    >
      <Plus size={16} />
      <span>Add Exercise</span>
    </Button>
  );
};

export default AddExerciseButton;