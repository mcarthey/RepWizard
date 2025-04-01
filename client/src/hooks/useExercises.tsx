import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Exercise } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Get all exercises
export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });
}

// Get exercise by ID
export function useExercise(id: number | undefined) {
  return useQuery<Exercise>({
    queryKey: ["/api/exercises", id],
    enabled: !!id, // Only run the query if id is provided
  });
}

// Get exercises by muscle group
export function useExercisesByMuscle(muscleGroup: string | undefined) {
  return useQuery<Exercise[]>({
    queryKey: ["/api/exercises/muscle", muscleGroup],
    queryFn: muscleGroup ? 
      () => fetch(`/api/exercises/muscle/${muscleGroup}`).then(res => res.json()) : 
      undefined,
    enabled: !!muscleGroup, // Only run the query if muscleGroup is provided
  });
}

// Create a new exercise
export function useCreateExercise() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exercise: Omit<Exercise, "id">) => {
      const response = await apiRequest("POST", "/api/exercises", exercise);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({
        title: "Exercise created",
        description: "Your exercise has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update an existing exercise
export function useUpdateExercise() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exercise: Exercise) => {
      const response = await apiRequest(
        "PATCH",
        `/api/exercises/${exercise.id}`,
        exercise
      );
      return response.json();
    },
    onSuccess: (exercise: Exercise) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/exercises", exercise.id] 
      });
      toast({
        title: "Exercise updated",
        description: "Your exercise has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete an exercise
export function useDeleteExercise() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({
        title: "Exercise deleted",
        description: "The exercise has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}