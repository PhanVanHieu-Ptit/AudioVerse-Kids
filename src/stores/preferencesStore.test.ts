import { describe, expect, it, vi } from 'vitest';
import {
  createPreferencesStore,
  defaultPreferences,
  parsePreferences,
} from '@/stores/preferencesStore';
import type { PreferencesRepository } from '@/lib/storage/preferencesRepository';
import type { Preferences } from '@/types/preferences';

function repository(): PreferencesRepository {
  return {
    load: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('preferences store', () => {
  it('validates unknown persisted data instead of trusting its shape', () => {
    expect(parsePreferences(null)).toEqual(defaultPreferences);
    expect(
      parsePreferences({
        theme: 'light',
        largeText: 'true',
        highContrast: true,
        reducedMotion: 1,
      }),
    ).toEqual({ ...defaultPreferences, highContrast: true });
  });

  it('hydrates once, including repeated initialization from StrictMode', async () => {
    const storage = repository();
    const store = createPreferencesStore(storage);
    await Promise.all([
      store.getState().initialize(),
      store.getState().initialize(),
    ]);
    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(store.getState().status).toBe('ready');
  });

  it('loads settings and persists an updated snapshot', async () => {
    const storage = repository();
    vi.mocked(storage.load).mockResolvedValue({
      ...defaultPreferences,
      theme: 'light',
      largeText: true,
    });
    const store = createPreferencesStore(storage);
    await store.getState().initialize();
    expect(store.getState().preferences.largeText).toBe(true);
    await store.getState().updatePreference('highContrast', true);
    expect(storage.save).toHaveBeenLastCalledWith({
      ...defaultPreferences,
      theme: 'light',
      largeText: true,
      highContrast: true,
      reducedMotion: false,
    });
    expect(store.getState().saveStatus).toBe('saved');
  });

  it('keeps the app usable when reading or writing storage fails', async () => {
    const storage = repository();
    vi.mocked(storage.load).mockRejectedValue(new Error('Storage unavailable'));
    vi.mocked(storage.save).mockRejectedValue(new Error('Quota exceeded'));
    const store = createPreferencesStore(storage);
    await store.getState().initialize();
    expect(store.getState().status).toBe('memory');
    await store.getState().updatePreference('largeText', true);
    expect(store.getState().preferences.largeText).toBe(true);
    expect(store.getState().saveStatus).toBe('error');
    vi.mocked(storage.save).mockResolvedValue(undefined);
    await store.getState().updatePreference('reducedMotion', true);
    expect(store.getState().status).toBe('ready');
  });

  it('serializes rapid writes and does not show saved before the latest write finishes', async () => {
    const resolvers: Array<() => void> = [];
    const snapshots: Preferences[] = [];
    const storage = repository();
    storage.save = vi.fn((preferences) => {
      snapshots.push(preferences);
      return new Promise<void>((resolve) => {
        resolvers.push(resolve);
      });
    });
    const store = createPreferencesStore(storage);
    await store.getState().initialize();
    const first = store.getState().updatePreference('largeText', true);
    const second = store.getState().updatePreference('highContrast', true);
    await vi.waitFor(() => expect(resolvers).toHaveLength(1));
    resolvers[0]?.();
    await first;
    await vi.waitFor(() => expect(resolvers).toHaveLength(2));
    expect(store.getState().saveStatus).toBe('saving');
    resolvers[1]?.();
    await second;
    expect(snapshots[1]).toEqual({
      ...defaultPreferences,
      theme: 'light',
      largeText: true,
      highContrast: true,
      reducedMotion: false,
    });
    expect(store.getState().saveStatus).toBe('saved');
  });
});

describe('theme preferences and migration', () => {
  it('migrates and validates voice volume and optional TTS', () => {
    expect(
      parsePreferences({ guidanceVolume: 0, guidanceTts: false }),
    ).toMatchObject({ guidanceVolume: 0, guidanceTts: false });
    expect(
      parsePreferences({ guidanceVolume: 1, guidanceTts: true }),
    ).toMatchObject({ guidanceVolume: 1, guidanceTts: true });
    for (const volume of [-1, 2, '0.5', Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(
        parsePreferences({ guidanceVolume: volume, guidanceTts: 'false' }),
      ).toEqual(defaultPreferences);
    }
  });

  it('persists voice volume and TTS alongside existing settings', async () => {
    const storage = repository();
    const store = createPreferencesStore(storage);
    await store.getState().initialize();
    await Promise.all([
      store.getState().updatePreference('guidanceVolume', 0.4),
      store.getState().updatePreference('guidanceTts', false),
    ]);
    expect(storage.save).toHaveBeenLastCalledWith({
      ...defaultPreferences,
      guidanceVolume: 0.4,
      guidanceTts: false,
    });
  });
  it('migrates old accessibility preferences and rejects invalid voice settings', () => {
    expect(parsePreferences({ largeText: true })).toEqual({
      ...defaultPreferences,
      largeText: true,
    });
    expect(
      parsePreferences({ voiceGuidance: 'true', guidanceRate: 9 }),
    ).toEqual(defaultPreferences);
    expect(
      parsePreferences({ voiceGuidance: true, guidanceRate: 0.8 }),
    ).toEqual({
      ...defaultPreferences,
      voiceGuidance: true,
      guidanceRate: 0.8,
    });
  });
  it('migrates old snapshots and rejects invalid themes', () => {
    expect(parsePreferences({ largeText: true }).theme).toBe('light');
    expect(parsePreferences({ theme: 'unknown' }).theme).toBe('light');
    expect(parsePreferences({ theme: 'dark' }).theme).toBe('dark');
  });

  it('persists dark theme alongside a rapid contrast change', async () => {
    const storage = repository();
    const store = createPreferencesStore(storage);
    await store.getState().initialize();
    await Promise.all([
      store.getState().updatePreference('theme', 'dark'),
      store.getState().updatePreference('highContrast', true),
    ]);
    expect(storage.save).toHaveBeenLastCalledWith({
      ...defaultPreferences,
      theme: 'dark',
      highContrast: true,
    });
  });
});
