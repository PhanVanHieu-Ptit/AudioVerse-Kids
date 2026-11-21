import { createStore } from 'zustand/vanilla';
import {
  preferencesRepository,
  type PreferencesRepository,
} from '@/lib/storage/preferencesRepository';
import type { Preferences, PreferenceKey } from '@/types/preferences';

export const defaultPreferences: Preferences = {
  largeText: false,
  highContrast: false,
  reducedMotion: false,
};

export function parsePreferences(value: unknown): Preferences {
  if (typeof value !== 'object' || value === null)
    return { ...defaultPreferences };
  return {
    largeText: 'largeText' in value && value.largeText === true,
    highContrast: 'highContrast' in value && value.highContrast === true,
    reducedMotion: 'reducedMotion' in value && value.reducedMotion === true,
  };
}

interface PreferencesState {
  preferences: Preferences;
  status: 'loading' | 'ready' | 'memory';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  initialize: () => Promise<void>;
  updatePreference: (key: PreferenceKey, value: boolean) => Promise<void>;
}

export function createPreferencesStore(repository: PreferencesRepository) {
  let initialization: Promise<void> | undefined;
  let writes = Promise.resolve();
  let revision = 0;

  return createStore<PreferencesState>((set, get) => ({
    preferences: { ...defaultPreferences },
    status: 'loading',
    saveStatus: 'idle',
    initialize() {
      initialization ??= (async () => {
        try {
          const preferences = parsePreferences(await repository.load());
          set({ preferences, status: 'ready' });
        } catch {
          set({ status: 'memory' });
        }
      })();
      return initialization;
    },
    async updatePreference(key, value) {
      await get().initialize();
      const preferences = { ...get().preferences, [key]: value };
      const currentRevision = ++revision;
      set({ preferences, saveStatus: 'saving' });
      // Serialize writes so rapid changes cannot persist an older snapshot last.
      writes = writes.then(async () => {
        try {
          await repository.save(preferences);
          if (currentRevision === revision)
            set({ saveStatus: 'saved', status: 'ready' });
        } catch {
          if (currentRevision === revision)
            set({ saveStatus: 'error', status: 'memory' });
        }
      });
      await writes;
    },
  }));
}

export const preferencesStore = createPreferencesStore(preferencesRepository);
