import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

export default function WorkoutHistory() {
  const { workouts, loading } = useWorkoutHistory();

  // Group workouts by month
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const date = parseISO(workout.date);
    const monthYear = format(date, "MMMM yyyy");
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(workout);
    return acc;
  }, {} as Record<string, typeof workouts>);

  // Sort months chronologically (newest first)
  const sortedMonths = Object.keys(groupedWorkouts).sort((a, b) => {
    return parseISO(groupedWorkouts[b][0].date).getTime() - 
           parseISO(groupedWorkouts[a][0].date).getTime();
  });

  return (
    <>
      <Header 
        title="Workout History" 
        showBackButton={true}
      />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-2">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="material-icons-round text-gray-400 text-5xl mb-4">
                fitness_center
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No workouts yet</h3>
              <p className="text-gray-500 mb-4">
                Start tracking your workouts to see your history here
              </p>
              <Link href="/">
                <a className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg">
                  <span className="material-icons-round text-sm mr-1">add</span>
                  New Workout
                </a>
              </Link>
            </div>
          ) : (
            sortedMonths.map(month => (
              <div key={month} className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{month}</h2>
                <div className="space-y-3">
                  {groupedWorkouts[month]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(workout => (
                      <div key={workout.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{workout.name || "Workout"}</h3>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(workout.date), "EEEE, MMMM d")}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="text-sm mr-3">
                              <span className="font-medium">{workout.exercises.length}</span>
                              <span className="text-gray-500 ml-1">exercises</span>
                            </div>
                            <Link href={`/history/${workout.id}`}>
                              <a className="text-primary-600">
                                <span className="material-icons-round">chevron_right</span>
                              </a>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}
