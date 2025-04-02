import React, { useState } from 'react';
import { Switch, Route, Link, useLocation } from 'wouter';
import { BellRing, Dumbbell, Home, Settings, Zap } from 'lucide-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './hooks/use-auth';
import CurrentWorkout from './pages/workout/CurrentWorkout';
import Programs from './pages/programs/Programs';
import ProgramDetailRedesign from './pages/programs/ProgramDetailRedesign';
import ExercisesPage from './pages/exercises/ExercisesPage';
import ExerciseDetailPage from './pages/exercises/ExerciseDetailPage';

// Protected route wrapper
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  // In a real app, check if user is authenticated
  // For now, we'll just render the component
  return <Component {...rest} />;
};

// Navigation item component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, isActive, onClick }) => {
  return (
    <button 
      className={`flex flex-col items-center justify-center h-full w-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
      onClick={onClick}
    >
      <div className="text-xl">{icon}</div>
      <div className="text-xs mt-1">{label}</div>
    </button>
  );
};

// Main app component
const App: React.FC = () => {
  const [location, navigate] = useLocation();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          {/* Main content */}
          <main className="flex-1 pb-16">
            <Switch>
              <Route path="/" component={() => <div>Home Page</div>} />
              <ProtectedRoute path="/workout" component={CurrentWorkout} />
              <Route path="/programs" component={Programs} />
              <Route path="/programs/:id" component={ProgramDetailRedesign} />
              <Route path="/exercises" component={ExercisesPage} />
              <Route path="/exercises/:id" component={ExerciseDetailPage} />
              <Route path="/profile" component={() => <div>Profile Page</div>} />
              <Route>
                <div className="container py-8 text-center">
                  <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                  <p className="mb-6">The page you are looking for doesn't exist.</p>
                  <Link href="/">
                    <a className="text-primary hover:underline">Go to Home</a>
                  </Link>
                </div>
              </Route>
            </Switch>
          </main>
          
          {/* Bottom navigation for mobile */}
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-10">
            <div className="grid grid-cols-5 h-full">
              <NavItem 
                icon={<Home />} 
                label="Home" 
                href="/" 
                isActive={location === '/'} 
                onClick={() => navigate('/')}
              />
              <NavItem 
                icon={<Dumbbell />} 
                label="Workout" 
                href="/workout" 
                isActive={location === '/workout'} 
                onClick={() => navigate('/workout')}
              />
              <NavItem 
                icon={<Zap />} 
                label="Programs" 
                href="/programs" 
                isActive={location === '/programs'} 
                onClick={() => navigate('/programs')}
              />
              <NavItem 
                icon={<BellRing />} 
                label="Updates" 
                href="/updates" 
                isActive={location === '/updates'} 
                onClick={() => navigate('/updates')}
              />
              <NavItem 
                icon={<Settings />} 
                label="Settings" 
                href="/profile" 
                isActive={location === '/profile'} 
                onClick={() => navigate('/profile')}
              />
            </div>
          </nav>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;