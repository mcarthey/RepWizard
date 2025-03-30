import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Program } from "@shared/schema";

export default function Programs() {
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  return (
    <>
      <Header title="Training Programs" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <div className="material-icons-round text-gray-400 text-5xl mb-4">
                calendar_today
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Programs Yet</h3>
              <p className="text-gray-500 mb-4">
                Create structured training programs to follow over time
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg">
                <span className="material-icons-round text-sm mr-1">add</span>
                Create Program
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sample program for UI demonstration */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium">Push/Pull/Legs Program</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    3-day split focusing on compound movements
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Push Day</div>
                        <div className="text-xs text-gray-500">Chest, Shoulders, Triceps</div>
                      </div>
                      <button className="text-primary-600">
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Pull Day</div>
                        <div className="text-xs text-gray-500">Back, Biceps</div>
                      </div>
                      <button className="text-primary-600">
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="material-icons-round text-sm">fitness_center</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Leg Day</div>
                        <div className="text-xs text-gray-500">Quads, Hamstrings, Calves</div>
                      </div>
                      <button className="text-primary-600">
                        <span className="material-icons-round">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">6 week</span> program
                  </div>
                  <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md">
                    Start Workout
                  </button>
                </div>
              </div>
              
              <button className="w-full py-3 mb-6 bg-white text-primary-600 rounded-lg shadow-sm flex items-center justify-center hover:bg-primary-50 transition-colors">
                <span className="material-icons-round text-sm mr-1">add</span>
                Create New Program
              </button>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}
