import { createStore } from 'zustand/vanilla';
import {
  activityRepository,
  type ActivityRepository,
} from '@/lib/storage/activityRepository';
import {
  activityKey,
  isActivityProgress,
  type ActivityProgress,
} from '@/types/activity';

interface ActivityState {
  records: Record<string, ActivityProgress>;
  status: 'loading' | 'ready' | 'memory';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  activePath: string | null;
  initialize: () => Promise<void>;
  save: (progress: Omit<ActivityProgress, 'updatedAt'>) => Promise<void>;
  activate: (path: string) => void;
  deactivate: () => void;
  flush: () => Promise<void>;
  retry: () => Promise<void>;
}

export function createActivityStore(repository: ActivityRepository) {
  let initialization: Promise<void> | undefined;
  let writes = Promise.resolve();
  let revision = 0;
  // Retry all failed snapshots, including activities from earlier routes.
  const dirty = new Map<string, ActivityProgress>();
  return createStore<ActivityState>((set, get) => ({
    records: {},
    status: 'loading',
    saveStatus: 'idle',
    activePath: null,
    initialize() {
      initialization ??= (async () => {
        try {
          const records: Record<string, ActivityProgress> = {};
          for (const record of await repository.loadAll()) {
            if (isActivityProgress(record))
              records[activityKey(record.kind, record.id)] = record;
          }
          set({ records, status: 'ready' });
        } catch {
          set({ status: 'memory' });
        }
      })();
      return initialization;
    },
    async save(progress) {
      await get().initialize();
      const key = activityKey(progress.kind, progress.id);
      const snapshot = { ...progress, updatedAt: Date.now() };
      dirty.set(key, snapshot);
      const currentRevision = ++revision;
      set({
        records: { ...get().records, [key]: snapshot },
        saveStatus: 'saving',
      });
      writes = writes.then(async () => {
        try {
          await repository.save(snapshot);
          if (dirty.get(key) === snapshot) dirty.delete(key);
          if (revision === currentRevision)
            set({
              saveStatus: dirty.size ? 'error' : 'saved',
              status: dirty.size ? 'memory' : 'ready',
            });
        } catch {
          if (revision === currentRevision)
            set({ saveStatus: 'error', status: 'memory' });
        }
      });
      await writes;
    },
    activate(path) {
      set({ activePath: path });
    },
    deactivate() {
      set({ activePath: null });
    },
    async flush() {
      await writes;
    },
    async retry() {
      await get().flush();
      for (const progress of [...dirty.values()]) await get().save(progress);
    },
  }));
}

export const activityStore = createActivityStore(activityRepository);
