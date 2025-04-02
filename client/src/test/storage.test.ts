import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

// Import hooks after setting up mocks
import { useStorage } from '../hooks/useStorage';
import { useDebugStorage } from '../hooks/useDebugStorage';

describe('Storage Functionality', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    // Set a fixed date for tests
    vi.setSystemTime(new Date('2025-04-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('useStorage hook', () => {
    it('saves and loads data correctly', () => {
      const { saveToStorage, loadFromStorage } = useStorage();
      
      const testData = { id: 1, name: 'Test Data', items: [1, 2, 3] };
      
      // Save data
      saveToStorage('test-key', testData);
      
      // Load data
      const loaded = loadFromStorage('test-key');
      
      expect(loaded).toEqual(testData);
    });
    
    it('returns null for non-existent data', () => {
      const { loadFromStorage } = useStorage();
      
      const result = loadFromStorage('non-existent-key');
      expect(result).toBeNull();
    });
    
    it('removes data correctly', () => {
      const { saveToStorage, loadFromStorage, removeFromStorage } = useStorage();
      
      // Save test data
      saveToStorage('test-remove-key', { value: 'test' });
      
      // Verify it was saved
      expect(loadFromStorage('test-remove-key')).not.toBeNull();
      
      // Remove it
      removeFromStorage('test-remove-key');
      
      // Verify it was removed
      expect(loadFromStorage('test-remove-key')).toBeNull();
    });
    
    it('handles complex data structures', () => {
      const { saveToStorage, loadFromStorage } = useStorage();
      
      const complexData = {
        id: 'test-complex',
        name: 'Complex Data',
        nested: {
          level1: {
            level2: {
              array: [1, 2, 3],
              boolean: true,
              null: null,
              date: new Date('2025-01-01').toISOString()
            }
          }
        },
        array: [
          { id: 1, value: 'one' },
          { id: 2, value: 'two' }
        ]
      };
      
      // Save complex data
      saveToStorage('complex-data', complexData);
      
      // Load complex data
      const loaded = loadFromStorage('complex-data');
      
      // Verify structures are preserved
      expect(loaded).toEqual(complexData);
      expect(loaded.nested.level1.level2.array).toEqual([1, 2, 3]);
      expect(loaded.array[1].value).toBe('two');
    });
  });
  
  describe('useDebugStorage hook', () => {
    it('lists all storage keys', () => {
      const { saveToStorage } = useStorage();
      const { listAllStorage } = useDebugStorage();
      
      // Save some test data
      saveToStorage('debug-test-1', { value: 'test1' });
      saveToStorage('debug-test-2', { value: 'test2' });
      
      // Get all storage
      const allStorage = listAllStorage();
      
      // Verify correct keys are present
      expect(allStorage).toHaveProperty('debug-test-1');
      expect(allStorage).toHaveProperty('debug-test-2');
      expect(allStorage['debug-test-1']).toEqual({ value: 'test1' });
    });
    
    it('clears workout data', () => {
      const { saveToStorage, loadFromStorage } = useStorage();
      const { clearWorkoutData } = useDebugStorage();
      
      // Create test workout data
      saveToStorage('currentWorkout', { id: 'current', exercises: [] });
      saveToStorage('workoutHistory', [{ id: 'past', exercises: [] }]);
      saveToStorage('other-data', { someValue: 'test' });
      
      // Clear workout data
      clearWorkoutData();
      
      // Verify workout data was cleared
      expect(loadFromStorage('currentWorkout')).toBeNull();
      expect(loadFromStorage('workoutHistory')).toBeNull();
      
      // Verify other data is preserved
      expect(loadFromStorage('other-data')).not.toBeNull();
    });
    
    it('can reload workout data', () => {
      const { saveToStorage } = useStorage();
      const { reloadWorkout } = useDebugStorage();
      
      // Create a test workout
      const testWorkout = {
        id: 'reload-test',
        date: new Date().toISOString(),
        name: 'Reload Test',
        exercises: []
      };
      
      // Save it to storage
      saveToStorage('currentWorkout', testWorkout);
      
      // Call reload function
      const reloaded = reloadWorkout();
      
      // Verify workout was reloaded correctly
      expect(reloaded).toEqual(testWorkout);
    });
  });
  
  describe('Storage performance and edge cases', () => {
    it('handles saving very large objects', () => {
      const { saveToStorage, loadFromStorage } = useStorage();
      
      // Create a large object
      const largeObject = {
        id: 'large-object',
        items: Array(1000).fill(0).map((_, i) => ({
          id: `item-${i}`,
          value: `Value for item ${i}`,
          data: Array(10).fill(0).map((_, j) => ({ sub: `sub-${j}`, val: j }))
        }))
      };
      
      // Save large object
      saveToStorage('large-object', largeObject);
      
      // Load large object
      const loaded = loadFromStorage('large-object');
      
      // Verify it was stored and loaded correctly
      expect(loaded.id).toBe('large-object');
      expect(loaded.items).toHaveLength(1000);
      expect(loaded.items[500].id).toBe('item-500');
    });
    
    it('handles invalid JSON gracefully', () => {
      const { loadFromStorage } = useStorage();
      
      // Manually set invalid JSON
      window.localStorage.setItem('invalid-json', '{not valid json');
      
      // Try to load it
      const result = loadFromStorage('invalid-json');
      
      // Should return null for invalid JSON
      expect(result).toBeNull();
    });
  });
});