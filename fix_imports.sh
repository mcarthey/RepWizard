#!/bin/bash

# Update useCurrentWorkout imports
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { useCurrentWorkout } from "@\/hooks\/useStorage";/import { useCurrentWorkout } from "@\/hooks\/useCurrentWorkout";/g'

# Update WorkoutHistory imports if needed
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { useWorkoutHistory } from "@\/hooks\/useStorage";/import { useWorkoutHistory } from "@\/hooks\/useWorkoutHistory";/g'

# Create stub for useWorkoutHistory if it doesn't exist yet
if [ ! -f "client/src/hooks/useWorkoutHistory.ts" ]; then
  cat > client/src/hooks/useWorkoutHistory.ts << 'EOL'
import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { LocalWorkout } from '@/lib/workout';

/**
 * Hook for accessing the workout history
 */
export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadFromStorage } = useStorage();
  
  // Load workout history on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = loadFromStorage<LocalWorkout[]>('workoutHistory') || [];
        setWorkouts(history);
      } catch (error) {
        console.error('Error loading workout history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [loadFromStorage]);
  
  return {
    workouts,
    loading
  };
}
EOL
fi

echo "Import paths updated successfully!"