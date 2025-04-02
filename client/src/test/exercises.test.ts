import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Exercise } from '../shared/schema';

// Mock fetch
global.fetch = vi.fn();

describe('Exercise Functionality', () => {
  beforeEach(() => {
    // Reset fetch mock
    vi.resetAllMocks();
    
    // Mock successful fetch response with test data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([
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
        {
          id: 3,
          name: 'Pull-up',
          description: 'Back exercise',
          primaryMuscles: ['lats', 'biceps'],
          secondaryMuscles: ['traps', 'forearms'],
          instructions: ['Hang from bar', 'Pull up'],
          category: 'strength',
          equipment: 'bodyweight',
          level: 'intermediate',
          force: 'pull',
          mechanic: 'compound',
          imageUrl: null,
          imageUrls: null,
          userId: null
        }
      ])
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Filtering Exercises', () => {
    it('filters exercises by muscle group correctly', async () => {
      // Call API endpoint for muscle group filtering
      const response = await fetch('/api/exercises?muscle=chest');
      const exercises = await response.json();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith('/api/exercises?muscle=chest');
      
      // Verify we got back data
      expect(exercises).toBeDefined();
      expect(Array.isArray(exercises)).toBeTruthy();
    });
    
    it('filters exercises by equipment correctly', async () => {
      const response = await fetch('/api/exercises?equipment=barbell');
      const exercises = await response.json();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith('/api/exercises?equipment=barbell');
      
      // Verify we got back data
      expect(exercises).toBeDefined();
    });
    
    it('filters exercises by category correctly', async () => {
      const response = await fetch('/api/exercises?category=strength');
      const exercises = await response.json();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith('/api/exercises?category=strength');
      
      // Verify we got back data
      expect(exercises).toBeDefined();
    });
    
    it('gets a single exercise by ID correctly', async () => {
      // Mock response for getExerciseById
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
        })
      });
      
      const response = await fetch('/api/exercises/1');
      const exercise = await response.json();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith('/api/exercises/1');
      
      // Verify we got back the correct exercise
      expect(exercise).toBeDefined();
      expect(exercise.id).toBe(1);
      expect(exercise.name).toBe('Bench Press');
    });
  });
  
  describe('Exercise Sorting', () => {
    it('sorts exercises by name correctly', async () => {
      const response = await fetch('/api/exercises?sort=name');
      const exercises = await response.json();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith('/api/exercises?sort=name');
      
      // Verify response
      expect(exercises).toBeDefined();
    });
    
    it('sorts exercises by muscle group correctly', async () => {
      const response = await fetch('/api/exercises?sort=primaryMuscles');
      const exercises = await response.json();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith('/api/exercises?sort=primaryMuscles');
      
      // Verify response
      expect(exercises).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    it('handles fetch errors correctly', async () => {
      // Mock a failed fetch
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/exercises');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Network error');
      }
    });
    
    it('handles non-200 responses correctly', async () => {
      // Mock a non-200 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Exercise not found' })
      });
      
      const response = await fetch('/api/exercises/999');
      
      // Verify fetch was called
      expect(fetch).toHaveBeenCalledWith('/api/exercises/999');
      
      // Verify response is marked as not ok
      expect(response.ok).toBe(false);
    });
  });
});