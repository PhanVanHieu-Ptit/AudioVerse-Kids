import { createStore } from 'zustand/vanilla';
import {
  preferencesRepository,
  type PreferencesRepository,
} from '@/lib/storage/preferencesRepository';
import type { Preferences, PreferenceKey } from '@/types/preferences';

export const defaultPreferences: Preferences = {
  theme: 'light',
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  voiceGuidance: false,
  guidanceRate: 1,
};

export function parsePreferences(value: unknown): Preferences {
  if (typeof value !== 'object' || value === null)
    return { ...defaultPreferences };
  return {
    theme: 'theme' in value && value.theme === 'dark' ? 'dark' : 'light',
    largeText: 'largeText' in value && value.largeText === true,
    highContrast: 'highContrast' in value && value.highContrast === true,
    reducedMotion: 'reducedMotion' in value && value.reducedMotion === true,
    voiceGuidance: 'voiceGuidance' in value && value.voiceGuidance === true,
    guidanceRate:
      'guidanceRate' in value &&
      (value.guidanceRate === 0.8 || value.guidanceRate === 1.2)
        ? value.guidanceRate
        : 1,
  };
}

interface PreferencesState {
  preferences: Preferences;
  status: 'loading' | 'ready' | 'memory';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  initialize: () => Promise<void>;
  updatePreference: <K extends PreferenceKey>(
    key: K,
    value: Preferences[K],
  ) => Promise<void>;
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
