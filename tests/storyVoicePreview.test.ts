import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stories } from '../src/content/stories';
import { speakerName } from '../src/lib/stories/production';
import config from '../scripts/local-tts/voices.json';
import plan from '../artifacts/voice-previews/nam-ke-chuyen/plan.json';
import manifest from '../artifacts/voice-previews/nam-ke-chuyen/manifest.json';

const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');
const story = stories.find((item) => item.id === config.storyId)!;
const scenes = config.sceneIds.map((id) =>
  story.scenes.find((item) => item.id === id)!,
);

describe('warm male narration audition', () => {
  it('follows a real branch and preserves the canonical narration and dialogue', () => {
    expect(plan.contentRevision).toBe(hash(JSON.stringify(stories)));
    expect(manifest.contentRevision).toBe(plan.contentRevision);
    expect(manifest.status).toBe('generated-awaiting-listening-review');
    expect(manifest.kind).toBe('pre-generated-synthetic-speech');
    expect(plan.sourceAttribution).toBe(story.source?.attribution);
    scenes.slice(0, -1).forEach((scene, index) => {
      expect(
        scene.interaction?.choices.map((item) => item.nextSceneId),
      ).toContain(scenes[index + 1]!.id);
    });
    const expected = scenes.flatMap((scene) => [
      {
        cueId: `${story.id}.scene.${scene.id}.title`,
        text: scene.title,
      },
      ...scene.segments.map((segment) => ({
        cueId: `${story.id}.scene.${scene.id}.segment.${segment.id}`,
        text:
          segment.speakerId === 'narrator'
            ? segment.text
            : `${speakerName(story, segment.speakerId)} nói: ${segment.text}`,
      })),
    ]);
    expect(plan.candidates).toHaveLength(config.candidates.length);
    for (const candidate of plan.candidates) {
      expect(
        candidate.turns.map(({ cueId, text }) => ({ cueId, text })),
      ).toEqual(expected);
      expect(candidate.turns.some((turn) => turn.voice === 'Xuân Vĩnh')).toBe(
        true,
      );
    }
  });

  it.each(manifest.candidates)(
    'has a real complete MP3 and exact transcript for $narrator',
    (candidate) => {
      const folder = resolve('artifacts/voice-previews/nam-ke-chuyen');
      const file = readFileSync(resolve(folder, candidate.file));
      expect(hash(file)).toBe(candidate.audioSha256);
      expect(file.length).toBe(candidate.bytes);
      expect(candidate.durationSeconds).toBeGreaterThan(20);
      expect(candidate.rms).toBeGreaterThan(0.001);
      expect(candidate.peak).toBeLessThan(0.95);
      const definition = plan.candidates.find(
        (item) => item.id === candidate.id,
      )!;
      expect(candidate.turns).toHaveLength(definition.turns.length);
      let end = 0;
      candidate.turns.forEach((turn, index) => {
        expect(turn).toMatchObject(definition.turns[index]!);
        expect(turn.startSeconds).toBeCloseTo(end, 3);
        expect(turn.durationSeconds).toBeGreaterThan(0.5);
        end = turn.startSeconds + turn.durationSeconds + turn.pauseMs / 1000;
      });
      expect(end).toBeCloseTo(candidate.durationSeconds, 1);
      const transcript = candidate.turns
        .map((turn) => `${turn.speaker}: ${turn.text}`)
        .join('\n\n');
      expect(readFileSync(resolve(folder, `${candidate.id}.txt`), 'utf8')).toBe(
        transcript + '\n',
      );
    },
  );
});
