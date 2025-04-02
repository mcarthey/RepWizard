import React, { useState } from 'react';
import { MoreVertical, ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { LocalWorkoutExercise, LocalSet } from '@/lib/workout';
import SetRow from './SetRow';

interface ExerciseRowProps {
  exercise: LocalWorkoutExercise;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<LocalSet>) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onViewDetails: (exercise: LocalWorkoutExercise) => void;
  onAddWarmupSets?: (exerciseId: string, workingWeight: number) => void;
}

// Row component for displaying an exercise with its sets
const ExerciseRow = ({
  exercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemoveExercise,
  onViewDetails,
  onAddWarmupSets
}: ExerciseRowProps) => {
  const [expanded, setExpanded] = useState(true);
  
  // Group sets by type (warmup/working)
  const warmupSets = exercise.sets?.filter(set => set.setType === 'warmup') || [];
  const workingSets = exercise.sets?.filter(set => set.setType === 'working') || [];
  
  // Find heaviest working set weight (for warmup calculation)
  const heaviestWorkingSetWeight = Math.max(
    ...workingSets.map(set => set.weight || 0),
    0
  );
  
  const handleToggle = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className="border rounded-md mb-4 overflow-hidden">
      <div className="p-3 bg-muted/30 flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-medium text-base">{exercise.exercise.name}</h3>
          {exercise.exercise.muscleGroups && exercise.exercise.muscleGroups.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {exercise.exercise.muscleGroups.map(group => 
                group.charAt(0).toUpperCase() + group.slice(1)
              ).join(', ')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onViewDetails(exercise)}
                >
                  <Info size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View exercise details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleToggle}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddSet(exercise.id)}>
                Add Set
              </DropdownMenuItem>
              {onAddWarmupSets && heaviestWorkingSetWeight > 0 && (
                <DropdownMenuItem onClick={() => onAddWarmupSets(exercise.id, heaviestWorkingSetWeight)}>
                  Generate Warmup Sets
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onRemoveExercise(exercise.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={16} className="mr-2" />
                Remove Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {expanded && (
        <div className="p-2">
          {/* Warmup Sets */}
          {warmupSets.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium uppercase text-muted-foreground mb-1 px-2">
                Warmup Sets
              </div>
              {warmupSets.map(set => (
                <SetRow
                  key={set.id}
                  set={set} 
                  onRemove={() => onRemoveSet(set.id)}
                  onUpdate={(updates) => onUpdateSet(set.id, updates)}
                />
              ))}
            </div>
          )}
          
          {/* Working Sets */}
          <div>
            {workingSets.length > 0 && (
              <div className="text-xs font-medium uppercase text-muted-foreground mb-1 px-2">
                Working Sets
              </div>
            )}
            {workingSets.map(set => (
              <SetRow
                key={set.id} 
                set={set}
                onRemove={() => onRemoveSet(set.id)}
                onUpdate={(updates) => onUpdateSet(set.id, updates)}
              />
            ))}
            
            {/* Add Set Button */}
            <Button 
              variant="ghost" 
              className="w-full mt-2 text-muted-foreground"
              onClick={() => onAddSet(exercise.id)}
            >
              + Add Set
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseRow;