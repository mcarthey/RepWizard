import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ProgramDetail() {
  const [_, params] = useRoute("/programs/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const programId = params?.id ? parseInt(params.id) : null;

  const { data: program, isLoading, error } = useQuery<Program>({
    queryKey: ['/api/programs', programId],
    enabled: !!programId,
    retry: false
  });

  // Handle back navigation
  const handleBack = () => {
    navigate("/programs");
  };

  // If program does not exist, go back
  useEffect(() => {
    if (!isLoading && (error || !program)) {
      toast({
        title: "Error",
        description: "Program not found",
        variant: "destructive"
      });
      navigate("/programs");
    }
  }, [isLoading, error, program, navigate, toast]);

  return (
    <>
      <Header 
        title={program?.name || "Program Details"} 
        showBackButton 
        onBackClick={handleBack} 
      />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : program ? (
            <div className="space-y-6">
              {/* Program Header */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-xl font-semibold mb-2">{program.name}</h2>
                {program.description && (
                  <p className="text-gray-600">{program.description}</p>
                )}
              </div>
              
              {/* Program Workouts */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3">Workouts</h3>
                <div className="space-y-3">
                  {/* Add New Workout Button */}
                  <div 
                    className="flex items-center p-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => toast({
                      title: "Feature Coming Soon",
                      description: "Adding workouts to programs will be available soon.",
                      variant: "default"
                    })}
                  >
                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                      <span className="material-icons-round text-sm">add</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-600">Add Workout Template</div>
                      <div className="text-xs text-gray-500">Create a new workout for this program</div>
                    </div>
                  </div>
                  
                  {/* No workouts message */}
                  <div className="text-center py-6 text-gray-500">
                    <span className="material-icons-round text-gray-400 text-3xl mb-2">fitness_center</span>
                    <p>No workout templates yet</p>
                    <p className="text-sm">Create workout templates to add to this program</p>
                  </div>
                </div>
              </div>
              
              {/* Start Program Button */}
              <button 
                className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-md flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
                onClick={() => {
                  // Create a new workout based on this program
                  toast({
                    title: "Starting Program",
                    description: "This feature will start a new workout based on this program",
                    variant: "default"
                  });
                }}
              >
                <span className="material-icons-round mr-2">play_arrow</span>
                Start Program
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Program not found</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={handleBack}
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}