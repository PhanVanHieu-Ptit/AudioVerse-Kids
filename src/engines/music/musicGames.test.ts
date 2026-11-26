import { describe, expect, it } from 'vitest';
import { isMusicStep } from './InstrumentLibrary';
import {
  createMelody,
  matchesMelody,
  melodySteps,
  rhythmPatterns,
  rhythmSteps,
} from './musicGames';

describe('music game rules', () => {
  it('creates short original melodies and compares every note in order', () => {
    const values = [0, 0.3, 0.99];
    const melody = createMelody(() => values.shift()!);
    expect(melody).toEqual(['C4', 'D4', 'G4']);
    expect(matchesMelody(melody, melody)).toBe(true);
    expect(matchesMelody(melody, ['G4', 'D4', 'C4'])).toBe(false);
    expect(matchesMelody(melody, ['C4', 'D4'])).toBe(false);
    expect(matchesMelody([], [])).toBe(false);
    expect(melodySteps(melody).every(isMusicStep)).toBe(true);
  });

  it('offers distinct rhythms with identical hit timbre, count and total duration', () => {
    const patterns = rhythmPatterns.map((_, index) => rhythmSteps(index));
    for (const steps of patterns) {
      expect(steps.every(isMusicStep)).toBe(true);
      expect(steps.filter((s) => s.note !== null)).toHaveLength(3);
      expect(steps.reduce((total, s) => total + s.beats, 0)).toBe(3);
    }
    expect(new Set(patterns.map((steps) => JSON.stringify(steps))).size).toBe(
      3,
    );
    expect(() => rhythmSteps(999)).toThrow();
  });
});
