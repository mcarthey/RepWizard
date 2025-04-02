import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateOneRepMax, getRpeDescription } from '../lib/workout';
import { generateWorkoutID, getFormattedDateTime } from '../lib/utils';

describe('Workout Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date for tests
    vi.setSystemTime(new Date('2025-04-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('calculateOneRepMax', () => {
    it('calculates 1RM correctly using Brzycki formula', () => {
      // Test cases with known outcomes
      expect(calculateOneRepMax(225, 5)).toBeCloseTo(253.13);
      expect(calculateOneRepMax(100, 10)).toBeCloseTo(133.33);
      expect(calculateOneRepMax(315, 1)).toBeCloseTo(315);
    });
    
    it('handles edge cases', () => {
      // 0 weight
      expect(calculateOneRepMax(0, 5)).toBe(0);
      
      // 0 reps should return the weight
      expect(calculateOneRepMax(225, 0)).toBe(225);
      
      // Negative values should be treated as their absolute values
      expect(calculateOneRepMax(-225, 5)).toBeCloseTo(253.13);
      expect(calculateOneRepMax(225, -5)).toBeCloseTo(253.13);
    });
  });
  
  describe('getRpeDescription', () => {
    it('returns correct descriptions for each RPE', () => {
      expect(getRpeDescription(10)).toBe("Maximum Effort");
      expect(getRpeDescription(9)).toBe("Very Hard");
      expect(getRpeDescription(8)).toBe("Hard");
      expect(getRpeDescription(7)).toBe("Challenging");
      expect(getRpeDescription(6)).toBe("Moderate");
      expect(getRpeDescription(5)).toBe("Somewhat Easy");
      expect(getRpeDescription(4)).toBe("Easy");
      expect(getRpeDescription(1)).toBe("Very Easy");
    });
    
    it('handles edge cases', () => {
      // Values out of range
      expect(getRpeDescription(11)).toBe("");
      expect(getRpeDescription(0)).toBe("");
      expect(getRpeDescription(-1)).toBe("");
      
      // Non-integer values
      expect(getRpeDescription(7.5)).toBe("");
    });
  });
  
  describe('generateWorkoutID', () => {
    it('generates a unique ID with the correct prefix', () => {
      const id = generateWorkoutID();
      expect(id).toMatch(/^workout-/);
      
      // Should contain a timestamp or random component
      expect(id.length).toBeGreaterThan(15);
    });
    
    it('generates different IDs on each call', () => {
      const id1 = generateWorkoutID();
      const id2 = generateWorkoutID();
      
      expect(id1).not.toBe(id2);
    });
  });
  
  describe('getFormattedDateTime', () => {
    it('formats date correctly', () => {
      // April 1, 2025
      const date = new Date('2025-04-01T12:30:45');
      
      // Different format options
      expect(getFormattedDateTime(date)).toMatch(/Apr 1, 2025/);
      expect(getFormattedDateTime(date, { includeTime: true })).toMatch(/Apr 1, 2025.*12:30/);
      expect(getFormattedDateTime(date, { format: 'yyyy-MM-dd' })).toBe('2025-04-01');
    });
    
    it('handles custom formats', () => {
      const date = new Date('2025-04-01T12:30:45');
      
      expect(getFormattedDateTime(date, { format: 'MMMM do, yyyy' })).toMatch(/April.*1.*2025/);
      expect(getFormattedDateTime(date, { format: 'E, MMM d' })).toMatch(/Tue, Apr 1/);
    });
    
    it('handles null or invalid dates', () => {
      expect(getFormattedDateTime(null)).toBe('');
      expect(getFormattedDateTime(new Date('invalid'))).toBe('Invalid Date');
    });
  });
});