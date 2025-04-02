import { Exercise } from "@shared/schema";

/**
 * Get the base URL for an exercise's images
 * @param exercise The exercise object
 * @returns The base URL where exercise images can be found
 */
export function getExerciseImageBaseUrl(exercise: Exercise | undefined): string {
  if (!exercise) return '';

  // If we have no images, return empty string
  if (!exercise.images || exercise.images.length === 0) {
    return '';
  }

  // Get the first image path to determine format
  let firstImage = '';
  
  // Handle case where the image is stored as a string array
  if (Array.isArray(exercise.images)) {
    firstImage = exercise.images[0] || '';
  } else {
    // Handle case where it might be a string that's not an array
    firstImage = String(exercise.images);
  }

  // Check if this is a full URL already
  if (firstImage.startsWith('http')) {
    // Return up to the last slash
    return firstImage.substring(0, firstImage.lastIndexOf('/'));
  }

  // If using the local path format like "/assets/exercises/..."
  if (firstImage.includes('/assets/exercises/')) {
    // Return the path up to the filename
    const pathMatch = firstImage.match(/(\/assets\/exercises\/[^/]+)\/./);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
  }

  // Default to a standard format based on exercise id
  return `/assets/exercises/${exercise.id}`;
}

/**
 * Get a specific image URL for an exercise
 * @param exercise The exercise object
 * @param index The index of the image to retrieve
 * @returns The full URL to the specific image
 */
export function getExerciseImageUrl(exercise: Exercise | undefined, index: number): string {
  if (!exercise || !exercise.images) {
    return '/assets/placeholder-exercise.svg';
  }

  // Direct debug output to help diagnose issues
  console.log("Image data for exercise:", {
    id: exercise.id,
    name: exercise.name,
    imagesType: typeof exercise.images,
    isArray: Array.isArray(exercise.images),
    rawValue: exercise.images
  });

  // If images is an array and index is valid
  if (Array.isArray(exercise.images) && index < exercise.images.length) {
    const imagePath = exercise.images[index];
    if (imagePath) {
      console.log("Using array path:", imagePath);
      return imagePath; // Just return the path directly
    }
  }
  
  // Handle case where images is a string format like {/path/to/img1.jpg,/path/to/img2.jpg}
  if (!Array.isArray(exercise.images)) {
    const imagesStr = String(exercise.images);
    console.log("Non-array image string:", imagesStr);
    
    // Try to extract paths from curly brace format
    if (imagesStr.startsWith('{') && imagesStr.endsWith('}')) {
      const paths = imagesStr.substring(1, imagesStr.length - 1).split(',');
      console.log("Parsed paths from braces:", paths);
      if (paths.length > index) {
        return paths[index].trim();
      }
    }
    
    // Handle comma-separated list without braces
    if (imagesStr.includes(',')) {
      const paths = imagesStr.split(',');
      console.log("Parsed paths from comma-list:", paths);
      if (paths.length > index) {
        return paths[index].trim();
      }
    }
    
    // Single string path
    if (imagesStr.includes('/assets/')) {
      console.log("Using single path:", imagesStr);
      return imagesStr;
    }
  }
  
  // Fallback: Construct a path based on the exercise name (formatted for URL)
  const formattedName = exercise.name.replace(/\s+/g, '_').replace(/\//g, '_');
  const fallbackPath = `/assets/exercises/${formattedName}/${index}.jpg`;
  console.log("Using fallback path:", fallbackPath);
  return fallbackPath;
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
  
  // If images is an array, return its length
  if (Array.isArray(exercise.images)) {
    return exercise.images.length;
  }
  
  // Stringify and check if it contains multiple paths
  const imagesAsString = JSON.stringify(exercise.images);
  if (imagesAsString.includes(',')) {
    // Count commas and add 1 for the number of items
    return (imagesAsString.match(/,/g) || []).length + 1;
  }
  
  // Default to 1 if there's any image data at all
  return imagesAsString ? 1 : 0;
}

/**
 * Get the description for an exercise
 * @param exercise The exercise object
 * @returns The formatted description
 */
export function getExerciseDescription(exercise: Exercise | undefined): string {
  if (!exercise || !exercise.description) return '';
  
  return exercise.description;
}