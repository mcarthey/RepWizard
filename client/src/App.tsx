import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
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
      <Route path="/" component={CurrentWorkout} />
      <Route path="/history" component={WorkoutHistory} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:id" component={ProgramDetailRedesign} />
      <Route path="/programs/:id/schedule" component={ScheduleProgramPage} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/progress" component={Progress} />
      <Route path="/settings" component={Settings} />
      <Route path="/debug/schedules" component={InspectSchedules} />
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
