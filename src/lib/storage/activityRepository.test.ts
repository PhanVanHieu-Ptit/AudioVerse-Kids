import { deleteDB, openDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import { activityRepository } from '@/lib/storage/activityRepository';
import { openDatabase } from '@/lib/storage/database';

describe('IndexedDB activity progress', () => {
  beforeEach(async () => {
    await deleteDB('audioverse-kids');
  });

  it('round-trips progress and replaces only the matching activity', async () => {
    const record = {
      kind: 'game',
      id: 'am-cao-am-tram',
      position: 1,
      completed: false,
      updatedAt: 1,
    } as const;
    await activityRepository.save(record);
    await activityRepository.save({ ...record, position: 2 });
    await activityRepository.save({ ...record, kind: 'story' });
    const restored = await activityRepository.loadAll();
    expect(restored).toHaveLength(2);
    expect(restored).toContainEqual({ ...record, position: 2 });
    expect(restored).toContainEqual({ ...record, kind: 'story' });
  });

  it('migrates the existing v1 database without deleting display preferences', async () => {
    const old = await openDB('audioverse-kids', 1, {
      upgrade(database) {
        database.createObjectStore('preferences');
      },
    });
    await old.put(
      'preferences',
      { theme: 'dark', largeText: true },
      'display-v1',
    );
    old.close();
    expect(await activityRepository.loadAll()).toEqual([]);
    const current = await openDatabase();
    expect(await current.get('preferences', 'display-v1')).toEqual({
      theme: 'dark',
      largeText: true,
    });
    current.close();
  });
});
