import { useCallback } from 'react';

/**
 * Hook for accessing and manipulating local storage
 * Note: Previously used debouncing but it was removed to fix date selection issues
 */
export function useStorage() {
  /**
   * Save data to local storage immediately to prevent race conditions
   * Previously this was debounced, but that caused issues with date selection
   */
  // Use immediate save instead of debounced to prevent race conditions with date changes
  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      console.log(`Saved data to ${key}`);
    } catch (error) {
      console.error(`Error saving data to ${key}:`, error);
    }
  }, []);

  /**
   * Load data from local storage
   */
  const loadFromStorage = useCallback(<T>(key: string): T | null => {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData) as T;
    } catch (error) {
      console.error(`Error loading data from ${key}:`, error);
      return null;
    }
  }, []);

  /**
   * Remove data from local storage
   */
  const removeFromStorage = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
      console.log(`Removed data from ${key}`);
    } catch (error) {
      console.error(`Error removing data from ${key}:`, error);
    }
  }, []);

  /**
   * Clear all data from local storage
   */
  const clearStorage = useCallback(() => {
    try {
      localStorage.clear();
      console.log('Cleared all data from local storage');
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }, []);

  return {
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    clearStorage
  };
}