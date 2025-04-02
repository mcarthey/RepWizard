import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Exercise } from '@shared/schema';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuickAddExerciseModalProps {
  isVisible: boolean;
  onClose: () => void;
  onExerciseSelect: (exercise: Exercise) => void;
}

// Modal for quickly adding exercises to a workout
const QuickAddExerciseModal = ({ 
  isVisible, 
  onClose, 
  onExerciseSelect 
}: QuickAddExerciseModalProps) => {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  
  // Reset search when modal is opened
  useEffect(() => {
    if (isVisible) {
      setSearchQuery('');
      setSelectedMuscleGroup('all');
    }
  }, [isVisible]);
  
  // Fetch all exercises
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get all unique muscle groups
  const allMuscleGroups = exercises.reduce((groups, exercise) => {
    exercise.muscleGroups?.forEach(group => {
      if (!groups.includes(group)) {
        groups.push(group);
      }
    });
    return groups;
  }, [] as string[]).sort();
  
  // Filter exercises based on search query and selected muscle group
  const filteredExercises = exercises.filter(exercise => {
    const matchesQuery = searchQuery === '' || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMuscleGroup = selectedMuscleGroup === 'all' || 
      exercise.muscleGroups?.includes(selectedMuscleGroup);
    
    return matchesQuery && matchesMuscleGroup;
  });
  
  return (
    <Sheet open={isVisible} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] overflow-hidden">
        <SheetHeader className="space-y-2 pb-4">
          <SheetTitle>Add Exercise</SheetTitle>
          <SheetDescription>
            Search for exercises to add to your workout
          </SheetDescription>
          
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <Select
              value={selectedMuscleGroup}
              onValueChange={setSelectedMuscleGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by muscle group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Muscle Groups</SelectItem>
                {allMuscleGroups.map(group => (
                  <SelectItem key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100%-8rem)]">
            <ul className="space-y-1 py-2">
              {filteredExercises.length === 0 ? (
                <li className="text-center py-8 text-muted-foreground">
                  No exercises match your search
                </li>
              ) : (
                filteredExercises.map(exercise => (
                  <li key={exercise.id}>
                    <button
                      className="w-full text-left px-3 py-2.5 hover:bg-accent rounded-md flex justify-between items-center"
                      onClick={() => onExerciseSelect(exercise)}
                    >
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {exercise.muscleGroups.map(group => 
                              group.charAt(0).toUpperCase() + group.slice(1)
                            ).join(', ')}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
        
        <SheetFooter className="pt-4">
          <SheetClose className="w-full"></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default QuickAddExerciseModal;