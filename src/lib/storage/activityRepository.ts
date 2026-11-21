import { openDatabase } from '@/lib/storage/database';
import { activityKey, type ActivityProgress } from '@/types/activity';

export interface ActivityRepository {
  loadAll: () => Promise<unknown[]>;
  save: (progress: ActivityProgress) => Promise<void>;
}

export const activityRepository: ActivityRepository = {
  async loadAll() {
    const database = await openDatabase();
    try {
      return await database.getAll('activityProgress');
    } finally {
      database.close();
    }
  },
  async save(progress) {
    const database = await openDatabase();
    try {
      await database.put(
        'activityProgress',
        progress,
        activityKey(progress.kind, progress.id),
      );
    } finally {
      database.close();
    }
  },
};
