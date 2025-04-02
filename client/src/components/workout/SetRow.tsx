import React, { useState } from 'react';
import { Minus, Check, CheckCircle2, Edit, Trash2, CircleSlash, BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LocalSet } from '@/lib/workout';

interface SetRowProps {
  set: LocalSet;
  onRemove: () => void;
  onUpdate: (updates: Partial<LocalSet>) => void;
}

// Component for each set row in an exercise
const SetRow = ({ set, onRemove, onUpdate }: SetRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [rpe, setRpe] = useState(set.rpe?.toString() || '');
  
  const toggleComplete = () => {
    onUpdate({ completed: !set.completed });
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    onUpdate({
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe: rpe ? parseFloat(rpe) : null
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setWeight(set.weight.toString());
    setReps(set.reps.toString());
    setRpe(set.rpe?.toString() || '');
    setIsEditing(false);
  };
  
  // Handle Enter key for quick saving
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center p-2 rounded-md gap-2 text-sm",
        set.completed ? "bg-primary/5" : "bg-card",
        set.setType === "warmup" ? "opacity-80" : ""
      )}
    >
      {!isEditing ? (
        // View mode
        <>
          <div className="flex items-center justify-center w-6 font-medium text-xs">
            {set.setNumber}
          </div>
          
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Weight</div>
              <div className="font-medium">{set.weight || '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Reps</div>
              <div className="font-medium">{set.reps || '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">RPE</div>
              <div className="font-medium">{set.rpe || '-'}</div>
            </div>
          </div>
          
          <TooltipProvider>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={toggleComplete}
                  >
                    {set.completed ? (
                      <CheckCircle2 size={16} className="text-primary" />
                    ) : (
                      <CircleSlash size={16} className="text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {set.completed ? 'Mark as incomplete' : 'Mark as complete'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={handleEdit}
                  >
                    <Edit size={16} className="text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit set</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={onRemove}
                  >
                    <Trash2 size={16} className="text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove set</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </>
      ) : (
        // Edit mode
        <>
          <div className="flex items-center justify-center w-6 font-medium text-xs">
            {set.setNumber}
          </div>
          
          <div className="flex-1 grid grid-cols-3 gap-1">
            <div>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
                placeholder="Weight"
                min="0"
                step="2.5"
                autoFocus
              />
            </div>
            <div>
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
                placeholder="Reps"
                min="0"
                step="1"
              />
            </div>
            <div>
              <Input
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
                placeholder="RPE"
                min="0"
                max="10"
                step="0.5"
              />
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleSave}
            >
              <Check size={16} className="text-primary" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleCancel}
            >
              <Minus size={16} className="text-muted-foreground" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SetRow;