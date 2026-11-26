import { musicNotes, type MusicStep, type NoteId } from './InstrumentLibrary';

export function createMelody(random = Math.random): NoteId[] {
  return Array.from(
    { length: 3 },
    () => musicNotes[Math.min(4, Math.max(0, Math.floor(random() * 5)))]!.id,
  );
}

export function melodySteps(notes: readonly NoteId[]): MusicStep[] {
  return notes.map((note) => ({ note, instrument: 'piano', beats: 1 }));
}

export function matchesMelody(
  expected: readonly NoteId[],
  answer: readonly NoteId[],
) {
  return (
    expected.length > 0 &&
    expected.length === answer.length &&
    expected.every((note, index) => note === answer[index])
  );
}

export const rhythmPatterns = [
  {
    id: 'even',
    description: 'Ba tiếng đều nhau: một, hai, ba.',
    beats: [1, 1, 1],
  },
  {
    id: 'quick-start',
    description:
      'Hai tiếng sát nhau, nghỉ lâu hơn rồi tiếng cuối: một-hai… ba.',
    beats: [0.5, 1.5, 1],
  },
  {
    id: 'quick-end',
    description: 'Tiếng đầu, nghỉ lâu hơn rồi hai tiếng sát nhau: một… hai-ba.',
    beats: [1.5, 0.5, 1],
  },
] as const;

export function rhythmSteps(index: number): MusicStep[] {
  const pattern = rhythmPatterns[index];
  if (!pattern) throw new Error('Unknown rhythm');
  // Half-beat hits followed by rests keep timbre identical across choices.
  return pattern.beats.flatMap((beats): MusicStep[] => [
    { note: 'C4', instrument: 'drum', beats: 0.5 },
    ...(beats > 0.5
      ? ([
          { note: null, instrument: 'drum', beats: (beats - 0.5) as 0.5 | 1 },
        ] satisfies MusicStep[])
      : []),
  ]);
}
