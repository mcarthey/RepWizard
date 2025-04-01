import { Exercise } from "@shared/schema";

/**
 * Get the base URL for an exercise's images
 * @param exercise The exercise object
 * @returns The base URL where exercise images can be found
 */
export function getExerciseImageBaseUrl(exercise: Exercise | undefined): string {
  if (!exercise) return '';

  // GitHub exercise DB base URL 
  const githubBaseUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises";
  
  // If we have no images, return empty string
  if (!exercise.images || exercise.images.length === 0) {
    return '';
  }

  // Get the first image path to determine format
  const firstImage = exercise.images[0];

  // Check if this is a full URL already
  if (firstImage.startsWith('http')) {
    // Return up to the last slash
    return firstImage.substring(0, firstImage.lastIndexOf('/'));
  }

  // If using the local path format like "/assets/exercises/..."
  if (firstImage.startsWith('/assets/exercises/')) {
    // Extract the exercise directory from the path
    const pathParts = firstImage.split('/');
    // The directory should be the 4th part (index 3)
    if (pathParts.length >= 4) {
      const exerciseDir = pathParts[3]; // e.g., "3_4_Sit-Up"
      // Use the extracted directory name with the GitHub URL
      return `${githubBaseUrl}/${exerciseDir}`;
    }
  }

  // Default to using the exercise.id with the GitHub URL
  return `${githubBaseUrl}/${exercise.id}`;
}

/**
 * Get a specific image URL for an exercise
 * @param exercise The exercise object
 * @param index The index of the image to retrieve
 * @returns The full URL to the specific image
 */
export function getExerciseImageUrl(exercise: Exercise | undefined, index: number): string {
  if (!exercise || !exercise.images || exercise.images.length <= index) {
    return '/assets/placeholder-exercise.svg';
  }

  const baseUrl = getExerciseImageBaseUrl(exercise);
  if (!baseUrl) {
    return '/assets/placeholder-exercise.svg';
  }

  return `${baseUrl}/${index}.jpg`;
}

/**
 * Process exercise instructions to return an array of paragraphs
 * @param exercise The exercise object
 * @returns An array of instruction paragraphs
 */
export function getExerciseInstructions(exercise: Exercise | undefined): string[] {
  if (!exercise || !exercise.instructions) return [];

  // If instructions is already an array, return it
  if (Array.isArray(exercise.instructions)) {
    return exercise.instructions;
  }

  // If it's a string, split it by double newlines for paragraphs
  return exercise.instructions.split('\n\n').filter(p => p.trim() !== '');
}

/**
 * Get the total number of images for an exercise
 * @param exercise The exercise object
 * @returns The number of images
 */
export function getExerciseImageCount(exercise: Exercise | undefined): number {
  if (!exercise || !exercise.images) return 0;
  return exercise.images.length;
}