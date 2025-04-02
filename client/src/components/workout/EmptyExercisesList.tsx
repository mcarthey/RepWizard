import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyExercisesListProps {
  onAddClick: () => void;
}

// Empty state component shown when there are no exercises in the workout
const EmptyExercisesList = ({ onAddClick }: EmptyExercisesListProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Dumbbell size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No exercises added</h3>
      <p className="text-muted-foreground mb-4">
        Start adding exercises to build your workout
      </p>
      <Button onClick={onAddClick}>
        Add Your First Exercise
      </Button>
    </div>
  );
};

export default EmptyExercisesList;