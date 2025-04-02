import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  CheckCircle2, 
  Settings, 
  MoreVertical, 
  PlusCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import { 
  useQuery,
  useQueryClient 
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWorkout } from '@/contexts/WorkoutContext';
import { Exercise } from '@shared/schema';

// Components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

// Mock components (to be implemented)
// These components would typically be imported from their respective locations
// For now, we're just using placeholder components to demonstrate structure
const QuickAddExerciseModal = ({ isVisible, onClose, onExerciseSelect }: any) => {
  if (!isVisible) return null;
  return (
    <div className="p-4 border rounded">
      <h3>Quick Add Exercise (Mock)</h3>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const SaveProgramModal = ({ isVisible, onClose, onSave }: any) => {
  if (!isVisible) return null;
  return (
    <div className="p-4 border rounded">
      <h3>Save Program (Mock)</h3>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSave('New Program', 'Description')}>Save</button>
    </div>
  );
};

const WorkoutCalendarModal = ({ isVisible, onClose, onDateChange, currentDate }: any) => {
  if (!isVisible) return null;
  return (
    <div className="p-4 border rounded">
      <h3>Calendar (Mock)</h3>
      <div>Current date: {currentDate.toDateString()}</div>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onDateChange(new Date())}>Today</button>
    </div>
  );
};

const ExerciseRow = ({ exercise, onAddSet, onRemoveSet, onUpdateSet, onRemoveExercise, onViewDetails, onAddWarmupSets }: any) => {
  return (
    <div className="p-2 border rounded mb-2">
      <div className="flex justify-between">
        <div>{exercise.exercise.name}</div>
        <div>
          <button onClick={() => onAddSet(exercise.id)} className="text-xs">+ Set</button>
          <button onClick={() => onRemoveExercise(exercise.id)} className="text-xs ml-2">Remove</button>
        </div>
      </div>
      <div className="text-xs mt-1">
        {exercise.sets.length} sets
      </div>
    </div>
  );
};

const AddExerciseButton = ({ onClick }: any) => {
  return (
    <button 
      onClick={onClick}
      className="w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center"
    >
      Add Exercise
    </button>
  );
};

const EmptyExercisesList = ({ onAddClick }: any) => {
  return (
    <div className="py-8 text-center">
      <p className="mb-4 text-muted-foreground">No exercises in this workout yet.</p>
      <button onClick={onAddClick}>Add First Exercise</button>
    </div>
  );
};

// Workout Tab Component
const WorkoutTab: React.FC = () => {
  // Get workout context
  const { 
    state, 
    actions 
  } = useWorkout();
  
  // Local state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['workout']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch exercises and programs
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: state.showAddModal
  });
  
  // Program data for the current workout
  const { data: program = null, status: programStatus } = useQuery({
    queryKey: ['/api/programs', state.workout?.programId],
    enabled: !!state.workout?.programId,
  });
  
  // Check if we should show an empty state
  const showEmptyState = !state.loading && (!state.workout || state.workout.exercises.length === 0);
  
  // Format current date for display
  const formattedDate = state.selectedDate 
    ? format(state.selectedDate, 'EEEE, MMMM d, yyyy')
    : 'Today';
  
  // Handle workout refresh
  const handleRefresh = async () => {
    // Re-fetch any necessary data
    await queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
    actions.changeDate(state.selectedDate);
    toast({
      title: 'Workout Refreshed',
      description: 'Your workout has been refreshed with the latest data.',
    });
  };
  
  // Handle creating a new ad-hoc workout
  const handleCreateAdHocWorkout = () => {
    actions.createWorkoutForDate(state.selectedDate);
    toast({
      title: 'Ad Hoc Workout Created',
      description: 'A new workout has been created for today.',
    });
  };
  
  // Calendar functions
  const handleOpenCalendar = () => {
    setShowCalendarModal(true);
  };
  
  const handleCloseCalendar = () => {
    setShowCalendarModal(false);
  };
  
  const handleDateChange = (date: Date) => {
    actions.changeDate(date);
  };
  
  // Exercise functions
  const handleAddExerciseClick = () => {
    actions.showAddExerciseModal();
  };
  
  const handleExerciseSelect = (exercise: Exercise) => {
    actions.addExerciseToWorkout(exercise);
  };
  
  // Save program functions
  const handleSaveProgramClick = () => {
    actions.showSaveProgramModal();
  };
  
  const handleSaveProgram = async (name: string, description: string) => {
    const success = await actions.saveWorkoutAsProgram(name, description);
    if (success) {
      toast({
        title: 'Program Saved',
        description: `Your workout has been saved as "${name}".`,
      });
    }
  };
  
  // Determine if we should show the header actions
  const showHeaderActions = !!state.workout;
  
  // Render the header section
  const renderHeader = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold tracking-tight">Workout</h1>
          
          {showHeaderActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCreateAdHocWorkout}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Ad Hoc Workout
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Workout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 mb-4" 
          onClick={handleOpenCalendar}
        >
          <CalendarDays className="h-4 w-4" />
          <span>{formattedDate}</span>
        </Button>
      </div>
    );
  };
  
  // Render workout collapsible section
  const renderWorkoutSection = () => {
    if (state.loading) {
      return (
        <div className="space-y-4 mt-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      );
    }
    
    if (!state.workout) {
      return (
        <div className="py-10 text-center">
          <p className="text-muted-foreground mb-6">
            No workout scheduled for today.
          </p>
          <Button onClick={handleCreateAdHocWorkout}>
            Create Ad Hoc Workout
          </Button>
        </div>
      );
    }
    
    // Determine workout type and title
    const isAdHoc = !state.workout.programId;
    const workoutTitle = isAdHoc ? 'Ad Hoc Workout' : state.workout.name;
    const programInfo = program && !isAdHoc ? `From Program: ${program.name}` : '';
    
    return (
      <Accordion
        type="multiple"
        value={expandedItems}
        onValueChange={setExpandedItems}
        className="mt-4"
      >
        <AccordionItem value="workout" className="border rounded-lg overflow-hidden pb-0">
          <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
            <div className="flex-1">
              <AccordionTrigger className="py-0 hover:no-underline">
                <div className="text-left">
                  <div className="font-semibold">{workoutTitle}</div>
                  {programInfo && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {programInfo}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              {state.workout.completed && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveProgramClick}>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Program
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => actions.toggleWorkoutComplete()}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {state.workout.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <AccordionContent className="px-4 pt-4 pb-4">
            {state.workout.exercises.length === 0 ? (
              <EmptyExercisesList onAddClick={handleAddExerciseClick} />
            ) : (
              <div className="space-y-4">
                {state.workout.exercises.map(exercise => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    onAddSet={(exerciseId) => actions.addSetToExercise(exerciseId)}
                    onRemoveSet={(setId) => actions.removeSetFromExercise(setId)}
                    onUpdateSet={(setId, updates) => actions.updateSet(setId, updates)}
                    onRemoveExercise={(exerciseId) => actions.removeExerciseFromWorkout(exerciseId)}
                    onViewDetails={() => {}} // We'll implement this later if needed
                    onAddWarmupSets={(exerciseId, weight) => actions.addWarmupSetsToExercise(exerciseId, weight)}
                  />
                ))}
                <AddExerciseButton onClick={handleAddExerciseClick} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };
  
  // Render modals
  const renderModals = () => {
    return (
      <>
        <QuickAddExerciseModal
          isVisible={state.showAddModal}
          onClose={() => actions.hideAddExerciseModal()}
          onExerciseSelect={handleExerciseSelect}
        />
        
        <SaveProgramModal
          isVisible={state.showSaveModal}
          onClose={() => actions.hideSaveProgramModal()}
          onSave={handleSaveProgram}
        />
        
        <WorkoutCalendarModal
          isVisible={showCalendarModal}
          onClose={handleCloseCalendar}
          onDateChange={handleDateChange}
          currentDate={state.selectedDate}
        />
      </>
    );
  };
  
  return (
    <div className="container py-6">
      {renderHeader()}
      {renderWorkoutSection()}
      {renderModals()}
    </div>
  );
};

export default WorkoutTab;