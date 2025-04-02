import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    clear: (): void => {
      store = {};
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    getAll: (): Record<string, string> => store,
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the hooks
vi.mock('@/hooks/useCurrentWorkout', () => ({
  useCurrentWorkout: () => ({
    workout: {
      id: 'test-workout',
      date: new Date('2025-04-01').toISOString(),
      name: 'Test Workout',
      notes: null,
      programId: 1,
      templateId: 1,
      completed: false,
      exercises: [
        {
          id: 'ex1',
          name: 'Squat',
          exerciseId: 1,
          notes: '',
          sets: [
            { id: 'set1', weight: 225, reps: 5, rpe: 8, completed: false, notes: '' }
          ]
        }
      ]
    },
    loading: false,
    createWorkout: vi.fn(),
    addExercise: vi.fn(),
    addSet: vi.fn(),
    updateSet: vi.fn(),
    removeSet: vi.fn(),
    updateExercise: vi.fn(),
    removeExercise: vi.fn(),
    completeWorkout: vi.fn()
  })
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === '/api/exercises') {
      return {
        data: [
          {
            id: 1,
            name: 'Bench Press',
            description: 'Chest exercise',
            primaryMuscles: ['chest', 'triceps'],
            secondaryMuscles: ['shoulders'],
            instructions: ['Lie on bench', 'Press weight up'],
            category: 'strength',
            equipment: 'barbell',
            level: 'intermediate',
            force: 'push',
            mechanic: 'compound',
            imageUrl: null,
            imageUrls: null,
            userId: null
          },
          {
            id: 2,
            name: 'Squat',
            description: 'Leg exercise',
            primaryMuscles: ['quadriceps', 'glutes'],
            secondaryMuscles: ['hamstrings', 'calves'],
            instructions: ['Stand with feet shoulder width', 'Squat down'],
            category: 'strength',
            equipment: 'barbell',
            level: 'intermediate',
            force: 'push',
            mechanic: 'compound',
            imageUrl: null,
            imageUrls: null,
            userId: null
          },
        ],
        isLoading: false,
        error: null,
      };
    }
    
    return {
      data: [],
      isLoading: false,
      error: null,
    };
  },
  QueryClient: function() {
    return {
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
      prefetchQuery: vi.fn(),
    };
  },
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('wouter', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useLocation: () => ['/test-path', vi.fn()]
}));

// Import components for testing
import { Button } from '@/components/ui/button';
import ExerciseCard from '@/components/workout/ExerciseCard';
import BottomNav from '@/components/navigation/BottomNav';
import Header from '@/components/navigation/Header';

describe('UI Component Tests', () => {
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
    
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-04-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Button Component', () => {
    it('renders with default variant', () => {
      render(<Button>Test Button</Button>);
      
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });
    
    it('renders with different variants', () => {
      render(
        <>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </>
      );
      
      const destructiveButton = screen.getByRole('button', { name: /destructive/i });
      const outlineButton = screen.getByRole('button', { name: /outline/i });
      const ghostButton = screen.getByRole('button', { name: /ghost/i });
      
      expect(destructiveButton).toHaveClass('bg-destructive');
      expect(outlineButton).toHaveClass('border');
      expect(ghostButton).toHaveClass('hover:bg-accent');
    });
    
    it('handles click events', () => {
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Clickable</Button>);
      
      const button = screen.getByRole('button', { name: /clickable/i });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('can be disabled', () => {
      const handleClick = vi.fn();
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
  
  describe('Header Component', () => {
    it('renders with title', () => {
      render(<Header title="Test Header" />);
      
      const header = screen.getByText('Test Header');
      expect(header).toBeInTheDocument();
    });
    
    it('renders with optional props', () => {
      const onBackMock = vi.fn();
      
      render(
        <Header 
          title="Header with Back" 
          showBack={true} 
          onBack={onBackMock}
        />
      );
      
      // Look for back button
      const backButton = screen.getByLabelText(/back/i);
      expect(backButton).toBeInTheDocument();
      
      // Test click
      fireEvent.click(backButton);
      expect(onBackMock).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('BottomNav Component', () => {
    it('renders all navigation items', () => {
      render(<BottomNav />);
      
      // Check for the main nav items
      expect(screen.getByText(/workout/i)).toBeInTheDocument();
      expect(screen.getByText(/programs/i)).toBeInTheDocument();
      expect(screen.getByText(/exercises/i)).toBeInTheDocument();
      expect(screen.getByText(/progress/i)).toBeInTheDocument();
    });
    
    it('highlights the active tab', () => {
      vi.mock('wouter', () => ({
        Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
        useLocation: () => ['/workout', vi.fn()]
      }));
      
      render(<BottomNav />);
      
      // The Workout tab should be highlighted
      const workoutTab = screen.getByText(/workout/i).closest('a');
      expect(workoutTab).toHaveClass('text-primary');
    });
  });
  
  describe('ExerciseCard Component', () => {
    it('renders exercise information', () => {
      const exercise = {
        id: 'test-ex',
        name: 'Test Exercise',
        exerciseId: 1,
        notes: 'Test notes',
        sets: [
          { id: 'set1', weight: 100, reps: 10, rpe: 7, completed: true, notes: '' }
        ]
      };
      
      render(
        <ExerciseCard 
          exercise={exercise}
          onAddSet={vi.fn()}
          onRemoveSet={vi.fn()}
          onUpdateSet={vi.fn()}
          onRemoveExercise={vi.fn()}
        />
      );
      
      // Check exercise name displayed
      expect(screen.getByText('Test Exercise')).toBeInTheDocument();
      
      // Check if set information is displayed
      expect(screen.getByText(/100/)).toBeInTheDocument(); // Weight
      expect(screen.getByText(/10/)).toBeInTheDocument(); // Reps
    });
    
    it('handles adding a set', () => {
      const onAddSetMock = vi.fn();
      
      const exercise = {
        id: 'test-ex',
        name: 'Test Exercise',
        exerciseId: 1,
        notes: '',
        sets: []
      };
      
      render(
        <ExerciseCard 
          exercise={exercise}
          onAddSet={onAddSetMock}
          onRemoveSet={vi.fn()}
          onUpdateSet={vi.fn()}
          onRemoveExercise={vi.fn()}
        />
      );
      
      // Find and click the "Add Set" button
      const addButton = screen.getByText(/add set/i);
      fireEvent.click(addButton);
      
      // Check if handler was called
      expect(onAddSetMock).toHaveBeenCalledTimes(1);
      expect(onAddSetMock).toHaveBeenCalledWith('test-ex');
    });
    
    it('handles removing an exercise', () => {
      const onRemoveExerciseMock = vi.fn();
      
      const exercise = {
        id: 'test-ex',
        name: 'Test Exercise',
        exerciseId: 1,
        notes: '',
        sets: []
      };
      
      render(
        <ExerciseCard 
          exercise={exercise}
          onAddSet={vi.fn()}
          onRemoveSet={vi.fn()}
          onUpdateSet={vi.fn()}
          onRemoveExercise={onRemoveExerciseMock}
        />
      );
      
      // Find and click the menu button
      const menuButton = screen.getByLabelText(/options/i);
      fireEvent.click(menuButton);
      
      // Find and click the remove option
      const removeButton = screen.getByText(/remove/i);
      fireEvent.click(removeButton);
      
      // Check if handler was called
      expect(onRemoveExerciseMock).toHaveBeenCalledTimes(1);
      expect(onRemoveExerciseMock).toHaveBeenCalledWith('test-ex');
    });
  });
});