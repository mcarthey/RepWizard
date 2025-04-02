import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import WorkoutProgressChart from "@/components/charts/WorkoutProgressChart";
import { format, parseISO, subMonths } from "date-fns";
import { Exercise } from "@shared/schema";
import { calculateOneRepMax } from "@/lib/workout";

export default function Progress() {
  const { workouts, loading } = useWorkoutHistory();
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y" | "all">("3m");
  
  // Get all exercises for selection
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });

  // Filter workouts based on selected time range
  const getFilteredWorkouts = () => {
    if (timeRange === "all") return workouts;
    
    const cutoffDate = subMonths(
      new Date(), 
      timeRange === "1m" ? 1 : 
      timeRange === "3m" ? 3 : 
      timeRange === "6m" ? 6 : 12
    );
    
    return workouts.filter(workout => {
      const workoutDate = parseISO(workout.date);
      return workoutDate >= cutoffDate;
    });
  };

  // Extract max weight, volume, and one-rep max data for the selected exercise
  const getExerciseData = () => {
    if (!selectedExercise) return null;
    
    const filteredWorkouts = getFilteredWorkouts();
    const exerciseData: {
      date: string;
      maxWeight: number;
      totalVolume: number;
      estimatedOneRM: number;
    }[] = [];
    
    // Process each workout to extract exercise data
    filteredWorkouts.forEach(workout => {
      const exerciseInstance = workout.exercises.find(
        ex => ex.exerciseId === selectedExercise
      );
      
      if (exerciseInstance && exerciseInstance.sets.length > 0) {
        // Find max weight from sets
        let maxWeight = 0;
        let maxWeightReps = 0;
        let totalVolume = 0;
        
        exerciseInstance.sets.forEach(set => {
          // Calculate volume (weight * reps)
          totalVolume += set.weight * set.reps;
          
          // Track max weight
          if (set.weight > maxWeight) {
            maxWeight = set.weight;
            maxWeightReps = set.reps;
          }
        });
        
        // Calculate estimated one-rep max using the Epley formula
        const estimatedOneRM = calculateOneRepMax(maxWeight, maxWeightReps);
        
        exerciseData.push({
          date: workout.date,
          maxWeight,
          totalVolume,
          estimatedOneRM
        });
      }
    });
    
    // Sort by date (ascending)
    return exerciseData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const exerciseData = getExerciseData();
  const selectedExerciseObj = exercises.find(ex => ex.id === selectedExercise);

  return (
    <>
      <Header title="Progress Tracking" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          {/* Exercise Selection */}
          <div className="mb-4">
            <label htmlFor="exercise-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Exercise
            </label>
            <select
              id="exercise-select"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedExercise || ""}
              onChange={(e) => setSelectedExercise(Number(e.target.value) || null)}
            >
              <option value="">-- Select an exercise --</option>
              {exercises.map(exercise => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Time Range Selection */}
          <div className="mb-6">
            <div className="flex justify-between">
              {["1m", "3m", "6m", "1y", "all"].map((range) => (
                <button
                  key={range}
                  className={`px-3 py-1 rounded ${
                    timeRange === range
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => setTimeRange(range as any)}
                >
                  {range === "1m" ? "1 Month" :
                    range === "3m" ? "3 Months" :
                    range === "6m" ? "6 Months" :
                    range === "1y" ? "1 Year" : "All Time"}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !selectedExercise ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="material-icons-round text-gray-400 text-5xl mb-4">
                show_chart
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select an Exercise</h3>
              <p className="text-gray-500">
                Choose an exercise to view your progress over time
              </p>
            </div>
          ) : exerciseData && exerciseData.length > 0 ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedExerciseObj?.name} Progress
                </h2>
                
                {/* Progress Charts */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">MAX WEIGHT (LBS)</h3>
                    <WorkoutProgressChart 
                      data={exerciseData}
                      dataKey="maxWeight"
                      color="#3b82f6"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">ESTIMATED 1RM (LBS)</h3>
                    <WorkoutProgressChart 
                      data={exerciseData}
                      dataKey="estimatedOneRM"
                      color="#10b981"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">TOTAL VOLUME (LBS)</h3>
                    <WorkoutProgressChart 
                      data={exerciseData}
                      dataKey="totalVolume"
                      color="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
              
              {/* Recent Performances */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium mb-3">Recent Performances</h3>
                <div className="space-y-2">
                  {exerciseData.slice(-5).reverse().map((data, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="text-sm text-gray-600">
                        {format(parseISO(data.date), "MMM d, yyyy")}
                      </div>
                      <div className="font-medium">
                        {data.maxWeight} lbs × {Math.round(data.totalVolume / data.maxWeight)} reps
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="material-icons-round text-gray-400 text-5xl mb-4">
                fitness_center
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Data Yet</h3>
              <p className="text-gray-500">
                Complete some workouts with this exercise to track your progress
              </p>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}
