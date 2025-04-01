import { describe, it, expect } from 'vitest';
import { 
  getExerciseImageBaseUrl, 
  getExerciseImageUrl, 
  getExerciseInstructions,
  getExerciseImageCount
} from '../lib/exerciseUtils';
import { Exercise } from '@shared/schema';

describe('Exercise Utility Functions', () => {
  describe('getExerciseImageBaseUrl', () => {
    it('should return empty string for undefined exercise', () => {
      expect(getExerciseImageBaseUrl(undefined)).toBe('');
    });

    it('should return empty string for exercise with no images', () => {
      const exercise = { id: 1 } as Exercise;
      expect(getExerciseImageBaseUrl(exercise)).toBe('');
    });

    it('should handle absolute URLs', () => {
      const exercise = {
        id: 1,
        images: ['https://example.com/path/to/image.jpg']
      } as Exercise;
      expect(getExerciseImageBaseUrl(exercise)).toBe('https://example.com/path/to');
    });

    it('should handle /assets/exercises paths', () => {
      const exercise = {
        id: 1,
        images: ['/assets/exercises/3_4_Sit-Up/0.jpg']
      } as Exercise;
      expect(getExerciseImageBaseUrl(exercise)).toBe('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/3_4_Sit-Up');
    });

    it('should fallback to using exercise ID', () => {
      const exercise = {
        id: 93,
        images: ['some-other-format.jpg']
      } as Exercise;
      expect(getExerciseImageBaseUrl(exercise)).toBe('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/93');
    });
  });

  describe('getExerciseImageUrl', () => {
    it('should return placeholder for undefined exercise', () => {
      expect(getExerciseImageUrl(undefined, 0)).toBe('/assets/placeholder-exercise.svg');
    });

    it('should return placeholder for exercise with no images', () => {
      const exercise = { id: 1 } as Exercise;
      expect(getExerciseImageUrl(exercise, 0)).toBe('/assets/placeholder-exercise.svg');
    });

    it('should return placeholder for out of bounds index', () => {
      const exercise = {
        id: 1,
        images: ['/assets/exercises/3_4_Sit-Up/0.jpg']
      } as Exercise;
      expect(getExerciseImageUrl(exercise, 1)).toBe('/assets/placeholder-exercise.svg');
    });

    it('should return the correct image URL for valid index', () => {
      const exercise = {
        id: 1,
        images: ['/assets/exercises/3_4_Sit-Up/0.jpg', '/assets/exercises/3_4_Sit-Up/1.jpg']
      } as Exercise;
      expect(getExerciseImageUrl(exercise, 0)).toBe('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/3_4_Sit-Up/0.jpg');
      expect(getExerciseImageUrl(exercise, 1)).toBe('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/3_4_Sit-Up/1.jpg');
    });
  });

  describe('getExerciseInstructions', () => {
    it('should return empty array for undefined exercise', () => {
      expect(getExerciseInstructions(undefined)).toEqual([]);
    });

    it('should return empty array for exercise with no instructions', () => {
      const exercise = { id: 1 } as Exercise;
      expect(getExerciseInstructions(exercise)).toEqual([]);
    });

    it('should return the array if instructions is already an array', () => {
      const exercise = {
        id: 1,
        instructions: ['Step 1', 'Step 2', 'Step 3']
      } as Exercise;
      expect(getExerciseInstructions(exercise)).toEqual(['Step 1', 'Step 2', 'Step 3']);
    });

    it('should split string instructions by double newlines', () => {
      const exercise = {
        id: 1,
        instructions: 'Step 1\n\nStep 2\n\nStep 3'
      } as Exercise;
      expect(getExerciseInstructions(exercise)).toEqual(['Step 1', 'Step 2', 'Step 3']);
    });

    it('should filter out empty paragraphs', () => {
      const exercise = {
        id: 1,
        instructions: 'Step 1\n\n\n\nStep 2\n\nStep 3'
      } as Exercise;
      expect(getExerciseInstructions(exercise)).toEqual(['Step 1', 'Step 2', 'Step 3']);
    });
  });

  describe('getExerciseImageCount', () => {
    it('should return 0 for undefined exercise', () => {
      expect(getExerciseImageCount(undefined)).toBe(0);
    });

    it('should return 0 for exercise with no images', () => {
      const exercise = { id: 1 } as Exercise;
      expect(getExerciseImageCount(exercise)).toBe(0);
    });

    it('should return the correct count for exercise with images', () => {
      const exercise = {
        id: 1,
        images: ['/assets/exercises/3_4_Sit-Up/0.jpg', '/assets/exercises/3_4_Sit-Up/1.jpg']
      } as Exercise;
      expect(getExerciseImageCount(exercise)).toBe(2);
    });
  });
});