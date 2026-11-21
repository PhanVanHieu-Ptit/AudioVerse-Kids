import { openDatabase } from '@/lib/storage/database';
import type { Preferences } from '@/types/preferences';

export interface PreferencesRepository {
  load: () => Promise<unknown>;
  save: (preferences: Preferences) => Promise<void>;
}

const key = 'display-v1';

export const preferencesRepository: PreferencesRepository = {
  async load() {
    const database = await openDatabase();
    try {
      return await database.get('preferences', key);
    } finally {
      database.close();
    }
  },
  async save(preferences) {
    const database = await openDatabase();
    try {
      await database.put('preferences', preferences, key);
    } finally {
      database.close();
    }
  },
};
