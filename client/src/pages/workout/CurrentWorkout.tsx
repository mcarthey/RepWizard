import React from 'react';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import WorkoutTab from './WorkoutTab';

// This component wraps the WorkoutTab with the WorkoutProvider
// to provide the workout context to all child components
const CurrentWorkout = () => {
  console.log('Rendering CurrentWorkout');
  
  return (
    <WorkoutProvider>
      <WorkoutTab />
    </WorkoutProvider>
  );
};

export default CurrentWorkout;