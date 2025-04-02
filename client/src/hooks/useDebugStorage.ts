import { useState, useCallback } from "react";
import { LocalWorkout } from "@/lib/workout";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for debugging storage operations
 * Provides utility functions for inspecting and manipulating local storage data
 */
export function useDebugStorage() {
  const { toast } = useToast();
  const [storageEntries, setStorageEntries] = useState<[string, string][]>([]);
  
  /**
   * Manually reload the workout from local storage
   * Used for testing persistence
   */
  const reloadWorkout = useCallback(async () => {
    try {
      const serializedWorkout = localStorage.getItem("currentWorkout");
      if (!serializedWorkout) {
        toast({
          title: "Workout not found",
          description: "No current workout data in local storage",
          variant: "destructive"
        });
        return null;
      }
      
      // Parse and validate the workout
      const workout = JSON.parse(serializedWorkout) as LocalWorkout;
      toast({
        title: "Workout reloaded",
        description: `Successfully reloaded workout: ${workout.name}`,
      });
      
      return workout;
    } catch (error) {
      console.error("Error reloading workout:", error);
      toast({
        title: "Error",
        description: "Failed to reload workout data",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);
  
  /**
   * List all local storage keys and values
   */
  const listStorage = useCallback(() => {
    try {
      const entries: [string, string][] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          entries.push([key, value]);
        }
      }
      setStorageEntries(entries);
      return entries;
    } catch (error) {
      console.error("Error listing storage:", error);
      toast({
        title: "Error",
        description: "Failed to list storage entries",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);
  
  /**
   * Clear all workout related data from local storage
   */
  const clearWorkoutData = useCallback(() => {
    try {
      localStorage.removeItem("currentWorkout");
      localStorage.removeItem("workoutHistory");
      toast({
        title: "Storage cleared",
        description: "All workout data has been cleared from local storage",
      });
    } catch (error) {
      console.error("Error clearing workout data:", error);
      toast({
        title: "Error",
        description: "Failed to clear workout data",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  return {
    reloadWorkout,
    listStorage,
    clearWorkoutData,
    storageEntries
  };
}