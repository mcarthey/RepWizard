import React, { useState, useEffect, memo } from 'react';
import { format } from 'date-fns';
import { Settings, Plus, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import WorkoutCalendarModal from "@/components/modals/WorkoutCalendarModal";
import QuickAddExerciseModal from "@/components/modals/QuickAddExerciseModal";
import SaveProgramModal from "@/components/modals/SaveProgramModal";
import ExerciseRow from "@/components/workout/ExerciseRow";
import AddExerciseButton from "@/components/workout/AddExerciseButton";
import EmptyExercisesList from "@/components/workout/EmptyExercisesList";
import BottomNav from "@/components/navigation/BottomNav";
import { useWorkout } from '@/contexts/WorkoutContext';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Exercise } from '@shared/schema';
import { LocalSet } from '@/lib/workout';

// Memoized Program Header Component
const ProgramHeader = memo(({ 
  name, 
  date, 
  isCollapsed, 
  isProgramHeader,
  onToggleCollapse, 
  onDateClick,
  onSettingsClick
}: { 
  name: string; 
  date: Date; 
  isCollapsed: boolean; 
  isProgramHeader: boolean;
  onToggleCollapse: () => void; 
  onDateClick: () => void;
  onSettingsClick: () => void;
}) => (
  <CardHeader className="pb-2 flex flex-row justify-between items-center">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleCollapse} 
          className="p-1 hover:bg-accent rounded"
          aria-label={isCollapsed ? "Expand workout" : "Collapse workout"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </button>
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
      </div>
      
      <CardDescription className="flex items-center mt-1">
        <button 
          onClick={onDateClick}
          className="flex items-center gap-1 hover:underline"
        >
          <Calendar size={14} />
          <span>{format(date, "MMMM d, yyyy")}</span>
        </button>
      </CardDescription>
    </div>
    
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onSettingsClick}
      aria-label="Workout settings"
    >
      <Settings size={18} />
    </Button>
  </CardHeader>
));

// Memoized Empty State Component
const EmptyWorkoutState = memo(({ onCreateWorkout }: { onCreateWorkout: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-4 text-center">
    <h2 className="text-xl font-semibold mb-2">No Workouts Scheduled</h2>
    <p className="text-muted-foreground mb-6">
      You don't have any workouts scheduled for today. You can create an ad hoc workout or schedule a program.
    </p>
    <div className="flex gap-4">
      <Button onClick={onCreateWorkout}>
        <Plus size={16} className="mr-2" />
        Create Workout
      </Button>
      <Button variant="outline" asChild>
        <Link href="/programs">
          Schedule Program
        </Link>
      </Button>
    </div>
  </div>
));

// Main Workout Tab Component
export default function WorkoutTab() {
  // Get all workout context data and functions
  const { 
    workout, 
    loading, 
    programs, 
    scheduledProgram,
    addExercise,
    addSet,
    updateSet,
    removeSet,
    selectDate,
    createAdHocWorkout,
    saveAsProgram
  } = useWorkout();
  
  const { toast } = useToast();
  
  // Local state for UI
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveProgramModal, setShowSaveProgramModal] = useState(false);
  
  // Handle section collapse toggle
  const toggleProgramCollapse = () => {
    if (!workout) return;
    const programKey = workout.programId ? `program-${workout.programId}` : 'ad-hoc';
    setCollapsedSections(prev => ({
      ...prev,
      [programKey]: !prev[programKey]
    }));
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (selectedDate: Date) => {
    setShowCalendarModal(false);
    selectDate(selectedDate);
  };
  
  // Get whether the current section is collapsed
  const isSectionCollapsed = () => {
    if (!workout) return false;
    const programKey = workout.programId ? `program-${workout.programId}` : 'ad-hoc';
    return !!collapsedSections[programKey];
  };
  
  // Handle add exercise
  const handleAddExercise = (exercise: Exercise) => {
    if (!workout) return;
    
    // Close the modal
    setShowAddModal(false);
    
    // Create a new workout exercise
    const newExerciseData = {
      id: uuidv4(),
      workoutId: workout.id,
      exerciseId: exercise.id,
      exercise,
      order: workout.exercises.length,
      sets: []
    };
    
    // Add to workout
    addExercise(newExerciseData);
    
    // Add default set
    const newSet: LocalSet = {
      id: uuidv4(),
      workoutExerciseId: newExerciseData.id,
      setNumber: 1,
      weight: 0,
      reps: 0,
      rpe: null,
      setType: "working",
      completed: false,
      notes: null
    };
    
    addSet(newExerciseData.id, newSet);
    
    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to your workout`
    });
  };
  
  // Handle saving as program
  const handleSaveAsProgram = (name: string, description: string) => {
    setShowSaveProgramModal(false);
    saveAsProgram(name, description);
  };
  
  // Handle settings menu
  const handleSettingsClick = () => {
    // Show the dropdown menu
  };
  
  // Return loading state
  if (loading) {
    return (
      <div className="container py-4 max-w-md mx-auto">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
        <BottomNav />
      </div>
    );
  }
  
  // Return empty state if no workout
  if (!workout) {
    return (
      <>
        <EmptyWorkoutState onCreateWorkout={createAdHocWorkout} />
        <BottomNav />
      </>
    );
  }
  
  // If we have a workout, render it
  return (
    <>
      <div className="container py-4 max-w-md mx-auto">
        <Card>
          {/* Program Header */}
          <ProgramHeader 
            name={workout.name} 
            date={new Date(workout.date)} 
            isCollapsed={isSectionCollapsed()}
            isProgramHeader={!!workout.programId}
            onToggleCollapse={toggleProgramCollapse}
            onDateClick={() => setShowCalendarModal(true)}
            onSettingsClick={handleSettingsClick}
          />
          
          {/* Workout Content */}
          {!isSectionCollapsed() && (
            <CardContent className="pt-2">
              {/* Show notification for scheduled program */}
              {scheduledProgram && !workout.programId && (
                <div className="bg-primary/10 p-3 rounded-md mb-4">
                  <p className="text-sm">
                    <strong>{scheduledProgram.name}</strong> is scheduled for today. 
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm ml-1"
                      onClick={() => selectDate(new Date(workout.date))}
                    >
                      Load Program
                    </Button>
                  </p>
                </div>
              )}
              
              {/* Exercises List */}
              <div className="space-y-4">
                {workout.exercises.length === 0 ? (
                  <EmptyExercisesList onAddClick={() => setShowAddModal(true)} />
                ) : (
                  workout.exercises.map(exercise => (
                    <ExerciseRow 
                      key={exercise.id}
                      exercise={exercise}
                      onAddSet={(set) => addSet(exercise.id, set)}
                      onUpdateSet={(setId, updates) => updateSet(exercise.id, setId, updates)}
                      onRemoveSet={(setId) => removeSet(exercise.id, setId)}
                    />
                  ))
                )}
              </div>
              
              {/* Add Exercise Button */}
              {workout.exercises.length > 0 && (
                <AddExerciseButton onClick={() => setShowAddModal(true)} />
              )}
            </CardContent>
          )}
          
          {/* Footer with settings */}
          <CardFooter className="pt-0 pb-3 flex justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings size={16} className="mr-2" /> 
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowCalendarModal(true)}>
                  <Calendar size={16} className="mr-2" /> 
                  Change Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSaveProgramModal(true)}>
                  <Plus size={16} className="mr-2" /> 
                  Save as Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={createAdHocWorkout}>
                  <Plus size={16} className="mr-2" /> 
                  New Ad Hoc Workout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      </div>
      
      {/* Calendar Modal */}
      <WorkoutCalendarModal
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        currentDate={new Date(workout.date)}
        onDateSelect={handleDateSelect}
      />
      
      {/* Quick Add Exercise Modal */}
      <QuickAddExerciseModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onExerciseSelect={handleAddExercise}
      />
      
      {/* Save Program Modal */}
      <SaveProgramModal
        isVisible={showSaveProgramModal}
        onClose={() => setShowSaveProgramModal(false)}
        onSave={handleSaveAsProgram}
      />
      
      <BottomNav />
    </>
  );
}

// Utility function for generating UUIDs
function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}