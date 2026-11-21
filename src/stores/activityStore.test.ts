import { describe, expect, it, vi } from 'vitest';
import { createActivityStore } from '@/stores/activityStore';
import type { ActivityRepository } from '@/lib/storage/activityRepository';
import type { ActivityProgress } from '@/types/activity';

const progress = {
  kind: 'game',
  id: 'am-cao-am-tram',
  position: 1,
  completed: false,
  updatedAt: 1,
} as const;

function repository(): ActivityRepository {
  return {
    loadAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('activity progress', () => {
  it('hydrates once, validates stored records and ignores malformed data', async () => {
    const source = repository();
    source.loadAll = vi
      .fn()
      .mockResolvedValue([
        progress,
        null,
        { ...progress, id: '__proto__' },
        { ...progress, position: -1 },
        { ...progress, position: 0.5 },
        { ...progress, updatedAt: Infinity },
      ]);
    const store = createActivityStore(source);
    await Promise.all([
      store.getState().initialize(),
      store.getState().initialize(),
    ]);
    expect(source.loadAll).toHaveBeenCalledTimes(1);
    expect(store.getState().records).toEqual({
      'game:am-cao-am-tram': progress,
    });
  });

  it('waits for hydration before accepting a new snapshot', async () => {
    let finishLoad: ((records: unknown[]) => void) | undefined;
    const source = repository();
    source.loadAll = () =>
      new Promise((resolve) => {
        finishLoad = resolve;
      });
    const store = createActivityStore(source);
    const save = store.getState().save({ ...progress, position: 2 });
    finishLoad?.([progress]);
    await save;
    expect(store.getState().records['game:am-cao-am-tram']?.position).toBe(2);
  });

  it('serializes writes and flush waits for the latest snapshot', async () => {
    const snapshots: number[] = [];
    let finishWrite: (() => void) | undefined;
    const source = repository();
    source.save = vi.fn(async (record) => {
      snapshots.push(record.position);
      if (record.position === 1)
        await new Promise<void>((resolve) => {
          finishWrite = resolve;
        });
    });
    const store = createActivityStore(source);
    const first = store.getState().save(progress);
    const second = store.getState().save({ ...progress, position: 2 });
    await vi.waitFor(() => expect(finishWrite).toBeDefined());
    expect(store.getState().records['game:am-cao-am-tram']?.position).toBe(2);
    expect(snapshots).toEqual([1]);
    finishWrite?.();
    await Promise.all([first, second, store.getState().flush()]);
    expect(snapshots).toEqual([1, 2]);
    expect(store.getState().saveStatus).toBe('saved');
  });

  it('preserves in-memory progress and retries failed activities after storage recovers', async () => {
    const source = repository();
    source.loadAll = vi.fn().mockRejectedValue(new Error('Storage denied'));
    source.save = vi.fn().mockRejectedValue(new Error('Quota exceeded'));
    const store = createActivityStore(source);
    await store.getState().save(progress);
    await store.getState().save({ ...progress, id: 'another-game' });
    expect(store.getState().status).toBe('memory');
    expect(store.getState().records['game:am-cao-am-tram']?.position).toBe(1);
    const persisted: ActivityProgress[] = [];
    source.save = vi.fn(async (record) => {
      persisted.push(record);
    });
    await store.getState().retry();
    expect(persisted.map((record) => record.id)).toEqual([
      'am-cao-am-tram',
      'another-game',
    ]);
    expect(store.getState().saveStatus).toBe('saved');
  });
});
