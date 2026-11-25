import { describe, expect, it } from 'vitest';
import { stories } from '../src/content/stories';
import { planStoryAssets } from '../src/lib/stories/production';
import { storyRecordingDefinitions } from '../src/lib/stories/recordings';
import {
  planStoryPerformance,
  type StoryCast,
} from '../src/lib/stories/performance';
import profile from '../scripts/local-tts/library-profile.json';

describe('story narration and character casting', () => {
  it.each(stories)(
    'preserves every recording and cue, in order, for $id',
    (story) => {
      const plan = planStoryPerformance(story, profile.cast);
      expect(plan).toMatchObject(storyRecordingDefinitions(story));
      expect(new Set(plan.flatMap((item) => item.cueIds))).toEqual(
        new Set(
          planStoryAssets(story)
            .filter((cue) => cue.kind === 'speech')
            .map((cue) => cue.id),
        ),
      );
      const characterVoices = new Map<string, Set<string>>();
      for (const item of plan) {
        expect(item.turns.map((turn) => turn.cueId)).toEqual(item.cueIds);
        expect(item.turns.map((turn) => turn.text).join('\n\n')).toBe(
          item.transcript,
        );
        for (const turn of item.turns) {
          if (turn.speakerId === 'narrator') {
            expect(turn.voice).toBe('Thanh Bình');
          } else {
            const voices = characterVoices.get(turn.speakerId) ?? new Set();
            voices.add(turn.voice);
            characterVoices.set(turn.speakerId, voices);
            const name = story.characters.find(
              (character) => character.id === turn.speakerId,
            )!.name;
            expect(turn.text.startsWith(`${name}: `)).toBe(true);
          }
        }
      }
      for (const voices of characterVoices.values())
        expect(voices.size).toBe(1);
    },
  );

  it('allows a direction change without changing story content or navigating a branch', () => {
    const story = stories.find((item) => item.id === 'rua-va-tho')!;
    const before = structuredClone(story);
    const plan = planStoryPerformance(story, profile.cast);
    const alternate = planStoryPerformance(story, {
      ...profile.cast,
      narrator: { voice: 'Anh Khôi', tempo: 1, pauseMs: 500 },
    });
    expect(story).toEqual(before);
    expect(alternate.map((item) => item.transcript)).toEqual(
      plan.map((item) => item.transcript),
    );
    const voices = plan.flatMap((item) => item.turns);
    expect(voices.find((turn) => turn.speakerId === 'tho')?.voice).toBe(
      'Xuân Vĩnh',
    );
    expect(voices.find((turn) => turn.speakerId === 'rua')?.tempo).toBe(0.98);
    expect(plan[0]!.turns.some((turn) => turn.cueId.includes('xin-loi'))).toBe(
      false,
    );
  });

  it('rejects missing voices, unreasonable timing and nonexistent character overrides', () => {
    const story = stories[0]!;
    const invalid: StoryCast[] = [
      { ...profile.cast, characters: [] },
      { ...profile.cast, scenePauseMs: Number.NaN },
      { ...profile.cast, narrator: { voice: '', tempo: 1, pauseMs: 500 } },
      {
        ...profile.cast,
        narrator: { voice: 'Thanh Bình', tempo: 0.5, pauseMs: 500 },
      },
      {
        ...profile.cast,
        narrator: { voice: 'Thanh Bình', tempo: 1, pauseMs: -1 },
      },
      {
        ...profile.cast,
        overrides: { [story.id]: { missing: profile.cast.narrator } },
      },
    ];
    for (const cast of invalid)
      expect(() => planStoryPerformance(story, cast)).toThrow();
  });
});
