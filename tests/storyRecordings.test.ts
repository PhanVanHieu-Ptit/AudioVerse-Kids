import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stories } from '../src/content/stories';
import {
  storyRecordings,
  sceneRecording,
  questionRecording,
} from '../src/content/storyAudio';
import { planStoryAssets } from '../src/lib/stories/production';
import manifest from '../public/audio/stories/manifest.json';
import availability from '../src/content/stories/audio-availability.json';
import profile from '../scripts/local-tts/library-profile.json';
import { planStoryPerformance } from '../src/lib/stories/performance';

const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');

describe('real Vietnamese story recordings', () => {
  it('covers every speech cue and every scene without inventing effects or deferred titles', () => {
    expect(manifest.assets).toHaveLength(301);
    expect(manifest.contentRevision).toBe(hash(JSON.stringify(stories)));
    expect(manifest.profile).toEqual(profile);
    expect(manifest.profile.voice).toBe('Thanh Bình');
    expect(availability.contentRevision).toBe(manifest.contentRevision);
    expect(availability.stories).toHaveLength(stories.length);
    for (const story of stories) {
      const summary = availability.stories.find(
        (item) => item.id === story.id,
      )!;
      const files = manifest.assets.filter((item) => item.storyId === story.id);
      expect(summary.scenes).toBe(story.scenes.length);
      expect(summary.files).toBe(files.length);
      expect(summary.bytes).toBe(
        files.reduce((sum, item) => sum + item.bytes, 0),
      );
    }
    const covered = new Set(manifest.assets.flatMap((asset) => asset.cueIds));
    const speech = stories
      .flatMap(planStoryAssets)
      .filter((cue) => cue.kind === 'speech');
    expect(covered).toEqual(new Set(speech.map((cue) => cue.id)));
    expect(
      manifest.assets.filter((asset) => asset.kind === 'scene'),
    ).toHaveLength(133);
    expect(
      manifest.assets.filter((asset) => asset.kind === 'question'),
    ).toHaveLength(56);
    expect(
      manifest.assets.filter((asset) => asset.kind === 'feedback'),
    ).toHaveLength(112);
    expect(storyRecordings('hoang-tu-be')).toEqual([]);
  });

  it.each(stories)(
    'ships matching non-silent files, transcripts and all branches for $id',
    (story) => {
      const recordings = storyRecordings(story.id);
      const performance = planStoryPerformance(story, profile.cast);
      expect(recordings.length).toBeGreaterThanOrEqual(story.scenes.length);
      for (const { definition, resource } of recordings) {
        const asset = manifest.assets.find((item) => item.id === resource.id)!;
        const plan = performance.find((item) => item.id === asset.id)!;
        const transcriptSha256 = hash(plan.transcript);
        const performanceSha256 = hash(JSON.stringify(plan.turns));
        const profileHash = hash(
          JSON.stringify({ profile, transcriptSha256, performanceSha256 }),
        );
        expect(asset).toMatchObject({
          performanceSha256,
          profileHash,
          voices: [...new Set(plan.turns.map((turn) => turn.voice))],
        });
        const file = readFileSync(resolve('public/audio/stories', asset.file));
        expect(asset.status).toBe('ready');
        expect(asset.file).toMatch(/^[a-z0-9-]+\/[a-z0-9.-]+\.mp3$/);
        expect(asset.file).toBe(
          `${story.id}/${asset.id}.${profileHash.slice(0, 16)}.v2.mp3`,
        );
        expect(file.length).toBe(asset.bytes);
        expect(file.length).toBeGreaterThan(1000);
        expect(hash(file)).toBe(asset.audioSha256);
        expect(hash(definition.transcript)).toBe(asset.transcriptSha256);
        expect(asset.durationSeconds).toBeGreaterThan(0.5);
        expect(asset.rms).toBeGreaterThan(0.001);
        expect(asset.peak).toBeLessThan(0.95);
        expect(resource.src).toBe(`/audio/stories/${asset.file}`);
        expect(resource.sha256).toBe(hash(file));
      }
      for (const scene of story.scenes) {
        const recorded = sceneRecording(story.id, scene.id)!;
        for (const line of scene.segments)
          expect(recorded.resource.transcript).toContain(line.text);
        for (const choice of scene.interaction?.choices ?? [])
          expect(recorded.resource.transcript).toContain(choice.label);
        if (scene.ending) {
          expect(recorded.resource.transcript).toContain(scene.ending.message);
          expect(recorded.resource.transcript).toContain(story.positiveMessage);
        }
        if (scene.id === story.entrySceneId && story.source)
          expect(recorded.resource.transcript).toContain(
            story.source.attribution,
          );
        for (const question of scene.questions) {
          expect(
            questionRecording(story.id, scene.id, question.id)?.resource
              .transcript,
          ).toContain(question.prompt);
          for (const option of question.options)
            expect(
              questionRecording(story.id, scene.id, question.id, option.id)
                ?.resource.transcript,
            ).toBe(option.feedback);
        }
      }
    },
  );

  it('does not include another branch or ending in the opening recording', () => {
    const recording = sceneRecording('ba-chu-heo-con', 'ba-ngoi-nha')!;
    expect(recording.resource.transcript).not.toContain(
      'Hôm sau, ba anh em bắt đầu sửa lại nhà.',
    );
    expect(recording.resource.transcript).toContain(
      'Nghe ba heo nhờ Sói rời đi.',
    );
    expect(sceneRecording('missing', 'missing')).toBeUndefined();
    expect(
      questionRecording('ba-chu-heo-con', 'ba-ngoi-nha', 'missing'),
    ).toBeUndefined();
  });
});
