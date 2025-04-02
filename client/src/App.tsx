import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import CurrentWorkout from "@/pages/workout/CurrentWorkout";
import WorkoutHistory from "@/pages/workout/WorkoutHistory";
import Programs from "@/pages/programs/Programs";
import ProgramDetailRedesign from "@/pages/programs/ProgramDetailRedesign";
import ScheduleProgramPage from "@/pages/programs/ScheduleProgramPage";
import Exercises from "@/pages/exercises/Exercises";
import ExercisesPage from "@/pages/exercises/ExercisesPage";
import ExerciseDetailPage from "@/pages/exercises/ExerciseDetailPage";
import Progress from "@/pages/progress/Progress";
import Settings from "@/pages/settings/Settings";
import InspectSchedules from "@/pages/debug/InspectSchedules";
import LocalStorageDebug from "@/pages/debug/LocalStorageDebug";
import LocalStorageTest from "@/pages/debug/LocalStorageTest";
import IsolatedStorageTest from "@/pages/debug/IsolatedStorageTest";
import WorkoutDebug from "@/pages/debug/WorkoutDebug";
import WorkoutRefreshDebug from "@/pages/debug/WorkoutRefreshDebug";
import TestRunner from "@/pages/debug/TestRunner";
import WorkoutFunctionalityTests from "@/test/WorkoutFunctionalityTests";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes - Require Authentication */}
      <ProtectedRoute path="/" component={CurrentWorkout} />
      <ProtectedRoute path="/history" component={WorkoutHistory} />
      <ProtectedRoute path="/programs" component={Programs} />
      <ProtectedRoute path="/programs/:id" component={ProgramDetailRedesign} />
      <ProtectedRoute path="/programs/:id/schedule" component={ScheduleProgramPage} />
      <ProtectedRoute path="/exercises" component={ExercisesPage} />
      <ProtectedRoute path="/exercises/:id" component={ExerciseDetailPage} />
      <ProtectedRoute path="/exercises-old" component={Exercises} />
      <ProtectedRoute path="/progress" component={Progress} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/debug/schedules" component={InspectSchedules} />
      <ProtectedRoute path="/debug/local-storage" component={LocalStorageDebug} />
      <ProtectedRoute path="/debug/local-storage-test" component={LocalStorageTest} />
      <ProtectedRoute path="/debug/isolated-storage-test" component={IsolatedStorageTest} />
      <ProtectedRoute path="/debug/workout" component={WorkoutDebug} />
      <ProtectedRoute path="/debug/refresh" component={WorkoutRefreshDebug} />
      <ProtectedRoute path="/debug/test-runner" component={TestRunner} />
      <ProtectedRoute path="/debug/functional-tests" component={WorkoutFunctionalityTests} />
      
      {/* Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app-height flex flex-col bg-gray-50 text-gray-800 overflow-hidden">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
