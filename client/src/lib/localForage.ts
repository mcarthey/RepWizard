import localforage from 'localforage';

export const STORAGE_KEYS = {
  CURRENT_WORKOUT: 'repwizard_current_workout',
  WORKOUT_HISTORY: 'repwizard_workout_history',
  EXERCISES: 'repwizard_exercises',
  PROGRAMS: 'repwizard_programs',
  USER_SETTINGS: 'repwizard_user_settings',
};

let localForageInstance: LocalForage | null = null;

export async function getLocalForage(): Promise<LocalForage> {
  if (localForageInstance) {
    return localForageInstance;
  }

  // Create and configure localForage
  localForageInstance = localforage.createInstance({
    name: 'RepWizard',
    storeName: 'repwizard_data',
    description: 'RepWizard workout tracking data'
  });

  return localForageInstance;
}

export async function clearAllData(): Promise<void> {
  const localForage = await getLocalForage();
  await localForage.clear();
}

export async function exportData(): Promise<string> {
  const localForage = await getLocalForage();
  const data: Record<string, any> = {};

  // Export all keys
  for (const key of Object.values(STORAGE_KEYS)) {
    data[key] = await localForage.getItem(key);
  }

  return JSON.stringify(data);
}

export async function importData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    const localForage = await getLocalForage();

    // Import all valid keys
    for (const key of Object.values(STORAGE_KEYS)) {
      if (data[key] !== undefined) {
        await localForage.setItem(key, data[key]);
      }
    }
  } catch (error) {
    throw new Error('Invalid data format for import');
  }
}
