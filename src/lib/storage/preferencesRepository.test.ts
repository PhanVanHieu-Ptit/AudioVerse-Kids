import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '@/lib/storage/database';
import { preferencesRepository } from '@/lib/storage/preferencesRepository';

describe('IndexedDB preferences repository', () => {
  beforeEach(async () => {
    const database = await openDatabase();
    await database.clear('preferences');
    database.close();
  });

  it('returns undefined for a new device', async () => {
    expect(await preferencesRepository.load()).toBeUndefined();
  });

  it('round-trips and replaces preferences through IndexedDB', async () => {
    await preferencesRepository.save({
      largeText: true,
      highContrast: false,
      reducedMotion: false,
    });
    await preferencesRepository.save({
      largeText: false,
      highContrast: true,
      reducedMotion: true,
    });
    expect(await preferencesRepository.load()).toEqual({
      largeText: false,
      highContrast: true,
      reducedMotion: true,
    });
  });
});
