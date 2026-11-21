import { deleteDB, openDB } from 'idb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audioRepository, offlineAudioSource } from './audioRepository';
import { openDatabase } from './database';
import { audioResource } from '@/test/audioTestUtils';

beforeEach(async () => {
  await deleteDB('audioverse-kids');
  vi.restoreAllMocks();
});

describe('offline audio repository', () => {
  it('migrates v2 without removing settings or activity progress', async () => {
    const old = await openDB('audioverse-kids', 2, {
      upgrade(db) {
        db.createObjectStore('preferences');
        db.createObjectStore('activityProgress');
      },
    });
    await old.put('preferences', { largeText: true }, 'display-v1');
    await old.put('activityProgress', { position: 2 }, 'game');
    old.close();
    const current = await openDatabase();
    expect(current.version).toBe(3);
    expect(await current.get('preferences', 'display-v1')).toEqual({
      largeText: true,
    });
    expect(await current.get('activityProgress', 'game')).toEqual({
      position: 2,
    });
    expect(current.objectStoreNames.contains('audioAssets')).toBe(true);
    current.close();
  });

  it('downloads explicitly, plays offline without fetch, and supports removal', async () => {
    const item = audioResource('a');
    const blob = new Blob(['real test bytes'], { type: 'audio/wav' });
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, blob: async () => blob } as Response);
    await audioRepository.download(item);
    fetcher.mockRejectedValue(new Error('Offline'));
    // fake-indexeddb/jsdom does not preserve Blob prototypes in structuredClone.
    // Check persistence independently and inject the read boundary for resolution.
    const database = await openDatabase();
    expect((await database.get('audioAssets', item.id))?.src).toBe(item.src);
    database.close();
    vi.spyOn(audioRepository, 'read').mockResolvedValue(blob);
    expect(
      await offlineAudioSource.resolve(item, new AbortController().signal),
    ).toBe(blob);
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.mocked(audioRepository.read).mockRestore();
    await audioRepository.remove(item.id);
    expect(await audioRepository.read(item)).toBeUndefined();
  });

  it('does not use an old download after a resource URL changes', async () => {
    const item = audioResource('a');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['data']),
    } as Response);
    await audioRepository.download(item);
    expect(
      await audioRepository.read({ ...item, src: '/new.wav' }),
    ).toBeUndefined();
  });

  it('propagates download failures and rejects empty files', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false } as Response);
    await expect(
      audioRepository.download(audioResource('a')),
    ).rejects.toThrow();
    fetcher.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(),
    } as Response);
    await expect(audioRepository.download(audioResource('a'))).rejects.toThrow(
      'Empty',
    );
    expect(await audioRepository.read(audioResource('a'))).toBeUndefined();
  });

  it('falls back to the source if storage is unavailable and respects cancellation', async () => {
    const item = audioResource('a');
    vi.spyOn(audioRepository, 'read').mockRejectedValue(
      new Error('Storage denied'),
    );
    const controller = new AbortController();
    expect(await offlineAudioSource.resolve(item, controller.signal)).toBe(
      item.src,
    );
    controller.abort();
    await expect(
      offlineAudioSource.resolve(item, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
