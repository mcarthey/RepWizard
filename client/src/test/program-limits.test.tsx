import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgramDetailRedesign from '../pages/programs/ProgramDetailRedesign';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Program } from '@shared/schema';

// Mock wouter
vi.mock('wouter', () => ({
  useRoute: () => [true, { id: '4' }],
  useLocation: () => ['/programs/4', vi.fn()]
}));

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn()
  };
});

// Mock components
vi.mock('@/components/navigation/Header', () => ({
  default: ({ title }: { title: string }) => <div data-testid="header">{title}</div>
}));

vi.mock('@/components/navigation/BottomNav', () => ({
  default: () => <div data-testid="bottom-nav"></div>
}));

describe('ProgramDetailRedesign Component', () => {
  let queryClient: QueryClient;
  const mockUseQuery = vi.mocked(useQuery);
  
  beforeEach(() => {
    queryClient = new QueryClient();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock implementation for useQuery
    mockUseQuery.mockImplementation((options) => {
      const queryKey = Array.isArray(options.queryKey) ? options.queryKey[0] : '';
      
      if (queryKey === '/api/programs') {
        return {
          data: {
            id: 4,
            name: 'Test Program',
            description: 'Test Description',
            weeks: 2,
            daysPerWeek: 2,
            type: 'general',
            difficulty: 'beginner'
          } as Program,
          isLoading: false
        };
      }
      
      if (queryKey === '/api/programs/4/templates') {
        return { data: [], isLoading: false };
      }
      
      if (queryKey === '/api/exercises') {
        return { data: [], isLoading: false };
      }
      
      return { data: undefined, isLoading: false };
    });
  });

  it('should render weeks and days according to program settings', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetailRedesign />
      </QueryClientProvider>
    );
    
    // Wait for rendering to complete
    await vi.waitFor(() => {
      // Check for week tabs - should only be 2 weeks
      const weekTabs = screen.getAllByText(/Week \d/);
      expect(weekTabs).toHaveLength(2);
      expect(weekTabs[0].textContent).toBe('Week 1');
      expect(weekTabs[1].textContent).toBe('Week 2');
      
      // Check for day cards - should only be 2 days
      const dayCards = screen.getAllByText(/Day \d/);
      expect(dayCards).toHaveLength(2);
      expect(dayCards[0].textContent).toBe('Day 1');
      expect(dayCards[1].textContent).toBe('Day 2');
    });
  });
});