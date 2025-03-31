import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrentWorkout from '../pages/workout/CurrentWorkout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useStorage hook
vi.mock('../hooks/useStorage', () => ({
  useCurrentWorkout: () => ({
    workout: {
      id: 'test-id',
      date: new Date().toISOString(),
      name: "Today's Workout",
      notes: null,
      programId: null,
      templateId: null,
      completed: false,
      exercises: []
    },
    createWorkout: vi.fn(),
    addExercise: vi.fn(),
    addSet: vi.fn(),
    updateSet: vi.fn(),
    removeSet: vi.fn(),
    updateExercise: vi.fn(),
    removeExercise: vi.fn(),
    loading: false
  }),
  useWorkoutHistory: () => ({
    workouts: [],
    addWorkout: vi.fn(),
    loading: false
  })
}));

// Mock the wouter router
vi.mock('wouter', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useLocation: () => ['/workout/current', vi.fn()]
}));

// Mock the format function from date-fns
vi.mock('date-fns', () => ({
  format: () => 'March 31, 2025'
}));

describe('CurrentWorkout Component Button Visibility', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock console.log to prevent cluttering the test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should display the "Add Your First Exercise" button when no exercises are present', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CurrentWorkout />
      </QueryClientProvider>
    );

    // Check if the button exists in the document
    const addButton = screen.getByText('Add Your First Exercise');
    expect(addButton).toBeInTheDocument();
    
    // Check that the button is visible
    const buttonStyle = window.getComputedStyle(addButton);
    expect(buttonStyle.display).not.toBe('none');
  });
});