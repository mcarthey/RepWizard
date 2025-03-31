import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import CurrentWorkout from "@/pages/workout/CurrentWorkout";
import WorkoutHistory from "@/pages/workout/WorkoutHistory";
import Programs from "@/pages/programs/Programs";
import ProgramDetail from "@/pages/programs/ProgramDetail";
import ProgramSchedule from "@/pages/programs/ProgramSchedule";
import WorkoutTemplateDetail from "@/pages/programs/WorkoutTemplateDetail";
import Exercises from "@/pages/exercises/Exercises";
import Progress from "@/pages/progress/Progress";
import Settings from "@/pages/settings/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CurrentWorkout} />
      <Route path="/history" component={WorkoutHistory} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:id" component={ProgramDetail} />
      <Route path="/programs/:id/schedule" component={ProgramSchedule} />
      <Route path="/programs/:programId/templates/:templateId" component={WorkoutTemplateDetail} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/progress" component={Progress} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-height flex flex-col bg-gray-50 text-gray-800 overflow-hidden">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
