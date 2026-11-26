import {
  isMusicStep,
  MAX_MUSIC_STEPS,
  type MusicStep,
} from '@/engines/music/InstrumentLibrary';

export const MUSIC_STORAGE_KEY = 'audioverse.music.v1';
export const MAX_COMPOSITIONS = 30;
export interface Composition {
  id: string;
  name: string;
  tempo: number;
  steps: MusicStep[];
}

function isComposition(value: unknown): value is Composition {
  if (!value || typeof value !== 'object') return false;
  const song = value as Partial<Composition>;
  return (
    typeof song.id === 'string' &&
    song.id.length > 0 &&
    song.id.length <= 80 &&
    typeof song.name === 'string' &&
    song.name.trim().length > 0 &&
    song.name.length <= 80 &&
    typeof song.tempo === 'number' &&
    Number.isFinite(song.tempo) &&
    song.tempo >= 60 &&
    song.tempo <= 160 &&
    Array.isArray(song.steps) &&
    song.steps.length > 0 &&
    song.steps.length <= MAX_MUSIC_STEPS &&
    song.steps.every(isMusicStep)
  );
}

function validSongs(value: unknown): value is Composition[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_COMPOSITIONS &&
    value.every(isComposition) &&
    new Set(value.map((song) => song.id)).size === value.length
  );
}

export function loadCompositions(): Composition[] {
  const raw = localStorage.getItem(MUSIC_STORAGE_KEY);
  if (raw === null) return [];
  if (raw.length > 300_000) throw new Error('Music storage too large');
  const data: unknown = JSON.parse(raw);
  if (
    !data ||
    typeof data !== 'object' ||
    !('version' in data) ||
    data.version !== 1 ||
    !('songs' in data) ||
    !validSongs(data.songs)
  )
    throw new Error('Invalid music storage');
  return data.songs;
}

/** Commit before changing the UI, so quota/security failures never pretend to save. */
export function saveCompositions(songs: Composition[]) {
  if (!validSongs(songs)) throw new Error('Invalid compositions');
  localStorage.setItem(
    MUSIC_STORAGE_KEY,
    JSON.stringify({ version: 1, songs }),
  );
}
