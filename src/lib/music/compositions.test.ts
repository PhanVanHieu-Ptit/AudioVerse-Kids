import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadCompositions,
  MUSIC_STORAGE_KEY,
  saveCompositions,
  type Composition,
} from './compositions';

const song: Composition = {
  id: 'one',
  name: 'Vườn nhỏ',
  tempo: 100,
  steps: [{ note: 'C4', instrument: 'flute', beats: 1 }],
};
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('local music library', () => {
  it('saves, reloads, updates and deletes without network or shared object references', () => {
    expect(loadCompositions()).toEqual([]);
    saveCompositions([song]);
    const loaded = loadCompositions();
    loaded[0]!.name = 'Bản sửa';
    expect(loadCompositions()[0]!.name).toBe('Vườn nhỏ');
    saveCompositions(loaded);
    expect(loadCompositions()[0]!.name).toBe('Bản sửa');
    saveCompositions([]);
    expect(loadCompositions()).toEqual([]);
  });

  it.each([
    '{bad',
    '{"version":2,"songs":[]}',
    JSON.stringify({
      version: 1,
      songs: [{ ...song, steps: [{ note: 'bad' }] }],
    }),
    JSON.stringify({ version: 1, songs: [song, song] }),
    JSON.stringify({ version: 1, songs: [{ ...song, tempo: 900 }] }),
  ])('preserves invalid data for recovery', (raw) => {
    localStorage.setItem(MUSIC_STORAGE_KEY, raw);
    expect(() => loadCompositions()).toThrow();
    expect(localStorage.getItem(MUSIC_STORAGE_KEY)).toBe(raw);
  });

  it('bounds storage and surfaces quota or permission failures', () => {
    expect(() =>
      saveCompositions(
        Array.from({ length: 31 }, (_, i) => ({ ...song, id: String(i) })),
      ),
    ).toThrow();
    expect(() => saveCompositions([{ ...song, name: ' ' }])).toThrow();
    saveCompositions([song]);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    expect(() => saveCompositions([])).toThrow('Full');
    expect(loadCompositions()).toEqual([song]);
  });
});
