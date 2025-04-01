import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { exercises, insertExerciseSchema } from '@shared/schema';

interface GitHubExercise {
  id: string;
  name: string;
  force: string;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

const GITHUB_EXERCISES_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/images/';
const LOCAL_IMAGE_DIR = path.join(process.cwd(), 'client/public/assets/exercises');

async function downloadImage(imageUrl: string, localPath: string): Promise<boolean> {
  try {
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      validateStatus: (status) => status < 500 // Allow 404 errors without throwing
    });
    
    if (response.status === 404) {
      console.warn(`Image not found: ${imageUrl}`);
      // Create a placeholder image or leave empty
      return false;
    }
    
    fs.writeFileSync(localPath, Buffer.from(response.data, 'binary'));
    console.log(`Downloaded image: ${path.basename(localPath)}`);
    return true;
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    return false;
  }
}

async function importExercises() {
  try {
    // Create the directory if it doesn't exist
    if (!fs.existsSync(LOCAL_IMAGE_DIR)) {
      fs.mkdirSync(LOCAL_IMAGE_DIR, { recursive: true });
    }

    // Fetch exercises data from GitHub
    console.log('Fetching exercise data from GitHub...');
    const response = await axios.get<GitHubExercise[]>(GITHUB_EXERCISES_URL);
    const githubExercises = response.data;
    
    console.log(`Found ${githubExercises.length} exercises to import`);
    
    let importedCount = 0;
    let errorCount = 0;

    // Load a subset of exercises for testing
    const exercisesToImport = githubExercises.slice(0, 100); // Import first 100 exercises for now
    // const exercisesToImport = githubExercises; // Uncomment to import all exercises

    for (const githubExercise of exercisesToImport) {
      try {
        // Create exercise folder if it doesn't exist
        const exerciseDir = path.join(LOCAL_IMAGE_DIR, githubExercise.id);
        if (!fs.existsSync(exerciseDir)) {
          fs.mkdirSync(exerciseDir, { recursive: true });
        }

        // Download images
        const localImages: string[] = [];
        for (const imagePath of githubExercise.images) {
          const imageUrl = `${GITHUB_IMAGE_BASE_URL}${imagePath}`;
          const fileName = path.basename(imagePath);
          const localImagePath = path.join(exerciseDir, fileName);
          
          // Download the image and only add to localImages if successful
          const success = await downloadImage(imageUrl, localImagePath);
          if (success) {
            // Store the relative path for the database
            localImages.push(`/assets/exercises/${githubExercise.id}/${fileName}`);
          }
        }
        
        // If no images were successfully downloaded, add a placeholder
        if (localImages.length === 0) {
          // We can optionally add a default/placeholder image path
          // For now we'll just leave it as an empty array
          console.log(`No images found for ${githubExercise.name}`);
        }

        // Combine the muscleGroups for backward compatibility
        const muscleGroups = [...githubExercise.primaryMuscles, ...githubExercise.secondaryMuscles];
        
        // Create a description from the GitHub data
        const description = `${githubExercise.name} - ${githubExercise.level} ${githubExercise.category} exercise` +
          (githubExercise.equipment ? ` using ${githubExercise.equipment}` : '') +
          (githubExercise.mechanic ? ` (${githubExercise.mechanic})` : '') +
          `. Primary muscles: ${githubExercise.primaryMuscles.join(', ')}` +
          (githubExercise.secondaryMuscles.length > 0 
            ? `. Secondary muscles: ${githubExercise.secondaryMuscles.join(', ')}.` 
            : '.');

        // Join the instructions array into a single string
        const instructions = githubExercise.instructions.join('\n\n');

        // Insert the exercise into our database
        const exerciseData = insertExerciseSchema.parse({
          name: githubExercise.name,
          description,
          instructions,
          muscleGroups,
          videoUrl: null, // No video URLs in the GitHub data
          // New fields from the GitHub database
          force: githubExercise.force,
          level: githubExercise.level,
          mechanic: githubExercise.mechanic,
          equipment: githubExercise.equipment,
          category: githubExercise.category,
          primaryMuscles: githubExercise.primaryMuscles,
          secondaryMuscles: githubExercise.secondaryMuscles,
          images: localImages,
          // No userId (system exercises)
        });

        // Insert into the database
        await db.insert(exercises).values(exerciseData);
        importedCount++;
        console.log(`Imported exercise: ${githubExercise.name}`);
      } catch (error) {
        console.error(`Error importing exercise ${githubExercise.name}:`, error);
        errorCount++;
      }
    }

    console.log(`Import completed:`);
    console.log(`- Total exercises found: ${githubExercises.length}`);
    console.log(`- Successfully imported: ${importedCount}`);
    console.log(`- Failed to import: ${errorCount}`);

  } catch (error) {
    console.error('Error importing exercises:', error);
  }
}

// Run the import
importExercises().then(() => {
  console.log('Exercise import script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});