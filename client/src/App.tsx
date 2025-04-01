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
import Progress from "@/pages/progress/Progress";
import Settings from "@/pages/settings/Settings";
import InspectSchedules from "@/pages/debug/InspectSchedules";

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
      <ProtectedRoute path="/exercises" component={Exercises} />
      <ProtectedRoute path="/progress" component={Progress} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/debug/schedules" component={InspectSchedules} />
      
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
